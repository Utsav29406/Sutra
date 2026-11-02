import { createHmac, randomInt, randomUUID, timingSafeEqual } from "crypto";
import { mutate, query } from "@/lib/db";

/*
 * Password-reset codes.
 *
 * The earlier design put a signed payload in the browser and kept no server
 * record. That was safe against tampering and replay across accounts, but it
 * could not count anything: a six-digit code is one of a million, and nothing
 * stopped an attacker submitting guesses until one landed. A token held only by
 * the client cannot know how many times it has already been guessed wrongly.
 *
 * So the challenge is now a row. The browser holds an opaque id; every check
 * goes through the database, where attempts are counted and cooldowns enforced.
 *
 * Three limits, in increasing severity:
 *   5 wrong guesses          - that code dies
 *   3 dead codes in a row    - password reset pauses for this address
 *   pause length             - 30 minutes the first time, then 4 hours
 *
 * The pause applies to password RESET only. The account is never locked: if a
 * wrong guess locked the account, anyone could disable any customer by
 * requesting a reset for their address and failing the code deliberately.
 */

const CHALLENGE_TTL_SECONDS = 120;
const MAX_ATTEMPTS = 5;
const DEAD_STREAK_LIMIT = 3;
const FIRST_PAUSE_SECONDS = 30 * 60;
const LATER_PAUSE_SECONDS = 4 * 60 * 60;
const MAX_CODES_PER_HOUR = 3;

/*
 * Six digits, deliberately. Fewer digits is a smaller haystack: four digits is
 * ten thousand codes against a million, which is a hundred times easier to
 * guess for two fewer keystrokes.
 */
const CODE_MAX_EXCLUSIVE = 1_000_000;
const CODE_LENGTH = 6;

/**
 * The fallback is for local development only. Signing production challenges
 * with a value committed to the repository would let anyone who reads the
 * source forge a challenge for any address and reset it without a code at all,
 * so production refuses to start the flow rather than quietly doing that.
 */
function secret(): string {
  const configured = process.env.OTP_SECRET?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("OTP_SECRET is not set - refusing to sign reset challenges with a public fallback.");
  }
  return "sutra-dev-otp-secret";
}

function hmac(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

/** Binds the hash to the address, so a code cannot be replayed against another. */
function hashCode(identifier: string, code: string): string {
  return hmac(`${identifier}:${code}`);
}

/** Length-safe, constant-time string comparison. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/*
 * The id is signed on its way out so a forged or mangled value is rejected
 * before it ever reaches the database.
 */
function sign(id: string): string {
  return `${id}.${hmac(id)}`;
}

function unsign(challenge: string): string | null {
  const [id, signature] = challenge.split(".");
  if (!id || !signature) return null;
  return safeEqual(signature, hmac(id)) ? id : null;
}

export type CreateChallengeResult =
  | { ok: true; challenge: string; code: string }
  | { ok: false; error: string; retryAfterSeconds: number };

export type VerifyResult = { ok: true; identifier: string } | { ok: false; error: string };

interface PauseRow {
  pause_left: number;
}

interface WindowRow {
  issued: number;
  wait: number | null;
}

interface ChallengeRow {
  identifier: string;
  code_hash: string;
  attempts: number;
  used: boolean;
  dead: boolean;
  alive: boolean;
}

function humanDuration(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.ceil(seconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export async function createChallenge(identifier: string): Promise<CreateChallengeResult> {
  // Opportunistic cleanup: nothing older than a day can matter to any limit
  // here, and this saves needing a scheduled job.
  await mutate("DELETE FROM otp_challenges WHERE created_at < now() - interval '1 day'").catch(
    () => undefined
  );

  const paused = await query<PauseRow[]>(
    `SELECT GREATEST(CEIL(EXTRACT(EPOCH FROM paused_until - now())), 0)::int AS pause_left
       FROM otp_locks WHERE identifier = $1`,
    [identifier]
  );
  const pauseLeft = Number(paused[0]?.pause_left ?? 0);
  if (pauseLeft > 0) {
    return {
      ok: false,
      retryAfterSeconds: pauseLeft,
      error: `Too many incorrect codes. Try again in ${humanDuration(pauseLeft)}.`,
    };
  }

  // Cap how many codes one address can pull in an hour, so an attacker cannot
  // simply request a fresh code every time the previous one dies.
  const windowRows = await query<WindowRow[]>(
    `SELECT COUNT(*)::int AS issued,
            GREATEST(CEIL(EXTRACT(EPOCH FROM MIN(created_at) + interval '1 hour' - now())), 0)::int AS wait
       FROM otp_challenges
      WHERE identifier = $1 AND created_at > now() - interval '1 hour'`,
    [identifier]
  );
  if (Number(windowRows[0]?.issued ?? 0) >= MAX_CODES_PER_HOUR) {
    const wait = Number(windowRows[0]?.wait ?? 3600) || 60;
    return {
      ok: false,
      retryAfterSeconds: wait,
      error: `Too many codes requested. Try again in ${humanDuration(wait)}.`,
    };
  }

  // Retire any code still outstanding for this address. Marked used rather than
  // dead, because being superseded is not a failed attempt and must not count
  // towards the streak.
  await mutate("UPDATE otp_challenges SET used = true WHERE identifier = $1 AND NOT used AND NOT dead", [
    identifier,
  ]);

  const code = String(randomInt(0, CODE_MAX_EXCLUSIVE)).padStart(CODE_LENGTH, "0");
  const id = randomUUID();

  await mutate(
    `INSERT INTO otp_challenges (id, identifier, code_hash, expires_at, created_at)
     VALUES ($1, $2, $3, now() + make_interval(secs => $4::int), now())`,
    [id, identifier, hashCode(identifier, code), CHALLENGE_TTL_SECONDS]
  );

  // The code is returned so it can be emailed, and is never stored.
  return { ok: true, challenge: sign(id), code };
}

/**
 * Records that a code died after too many wrong guesses, and starts a cooldown
 * once enough have died in a row.
 *
 * Written as one statement so parallel guesses cannot race past the counter.
 * Inside ON CONFLICT DO UPDATE every `otp_locks.` column is the row as it was
 * before this statement, so the three assignments all work from the old values
 * whatever order they are written in.
 */
async function registerDeadCode(identifier: string): Promise<void> {
  await mutate(
    `INSERT INTO otp_locks (identifier, dead_streak, strikes, paused_until, updated_at)
     VALUES ($1, 1, 0, NULL, now())
     ON CONFLICT (identifier) DO UPDATE SET
       paused_until = CASE WHEN otp_locks.dead_streak + 1 >= $2::int
                           THEN now() + make_interval(secs => CASE WHEN otp_locks.strikes = 0 THEN $3::int ELSE $4::int END)
                           ELSE otp_locks.paused_until END,
       strikes      = CASE WHEN otp_locks.dead_streak + 1 >= $2 THEN LEAST(otp_locks.strikes + 1, 10) ELSE otp_locks.strikes END,
       dead_streak  = CASE WHEN otp_locks.dead_streak + 1 >= $2 THEN 0 ELSE otp_locks.dead_streak + 1 END,
       updated_at   = now()`,
    [identifier, DEAD_STREAK_LIMIT, FIRST_PAUSE_SECONDS, LATER_PAUSE_SECONDS]
  );
}

/**
 * Checks a code against its challenge.
 *
 * `consume` marks the challenge spent. The reset flow verifies twice - once to
 * move the form to the password step, once when the new password is submitted -
 * so only the second call consumes, or the reset would reject its own code.
 */
export async function verifyChallenge(
  challenge: string,
  code: string,
  options: { consume?: boolean } = {}
): Promise<VerifyResult> {
  const id = unsign(challenge);
  if (!id) return { ok: false, error: "Invalid or expired code." };

  /*
   * Claim the attempt before looking at the code, in one statement. Reading
   * `attempts` and writing it back afterwards let a burst of parallel guesses
   * all read the same count and all be checked, so the five-guess limit only
   * held for one guess at a time. Now a guess is only compared once it has
   * won a slot, and the sixth slot does not exist.
   */
  const claimed = await mutate(
    `UPDATE otp_challenges SET attempts = attempts + 1
      WHERE id = $1 AND NOT used AND NOT dead AND attempts < $2 AND expires_at > now()`,
    [id, MAX_ATTEMPTS]
  );

  const rows = await query<ChallengeRow[]>(
    `SELECT identifier, code_hash, attempts, used, dead, (expires_at > now()) AS alive
       FROM otp_challenges WHERE id = $1`,
    [id]
  );
  const row = rows[0];
  if (!row) return { ok: false, error: "Invalid or expired code." };

  if (claimed.affectedRows === 0) {
    if (row.used) return { ok: false, error: "That code has already been used. Request a new one." };
    if (row.dead || row.attempts >= MAX_ATTEMPTS) {
      return { ok: false, error: "Too many incorrect attempts. Request a new code." };
    }
    return { ok: false, error: "That code has expired. Request a new one." };
  }

  if (!safeEqual(row.code_hash, hashCode(row.identifier, code))) {
    if (row.attempts >= MAX_ATTEMPTS) {
      // Only the request that kills the code counts it towards the cooldown.
      const killed = await mutate("UPDATE otp_challenges SET dead = true WHERE id = $1 AND NOT dead", [id]);
      if (killed.affectedRows > 0) await registerDeadCode(row.identifier);
      return { ok: false, error: "Too many incorrect attempts. Request a new code." };
    }

    const left = MAX_ATTEMPTS - row.attempts;
    return {
      ok: false,
      error: `That code doesn't match. ${left} attempt${left === 1 ? "" : "s"} left.`,
    };
  }

  if (options.consume) {
    // Conditional, so two requests holding the same right code cannot both use it.
    const spent = await mutate("UPDATE otp_challenges SET used = true WHERE id = $1 AND NOT used", [id]);
    if (spent.affectedRows === 0) {
      return { ok: false, error: "That code has already been used. Request a new one." };
    }
    // A correct code clears the slate, so earlier fumbling does not follow the
    // user into their next reset.
    await mutate("DELETE FROM otp_locks WHERE identifier = $1", [row.identifier]);
  } else {
    // The reset form checks the right code twice (to move on, then to save the
    // password). Give back the slot this check took, so someone who needed
    // four tries is not locked out of saving their new password.
    await mutate("UPDATE otp_challenges SET attempts = GREATEST(attempts - 1, 0) WHERE id = $1", [id]);
  }

  return { ok: true, identifier: row.identifier };
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(2, local.length - 1))}@${domain}`;
}
