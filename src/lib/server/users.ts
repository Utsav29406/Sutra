import "server-only";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { query, mutate, isUniqueViolation, normalizeEmail, normalizePhone } from "@/lib/db";

const SALT_ROUNDS = 10;

export interface PublicUser {
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  role: "USER" | "ADMIN";
}

function toPublic(row: UserRow): PublicUser {
  return { name: row.name, email: row.email, role: row.role };
}

/**
 * A successful sign-in. `passwordHash` never leaves the server: routes hand it
 * to setSessionCookie (which fingerprints it) and send only `user` back.
 */
export type SignedIn = { ok: true; user: PublicUser; passwordHash: string };

/*
 * Wrong-password limit, per email: after LOGIN_LIMIT misses inside the window,
 * that email can't sign in with a password for LOGIN_PAUSE_MINUTES. Kept in
 * otp_locks under a "login:" key, so no new table is needed.
 */
const LOGIN_LIMIT = 8;
const LOGIN_PAUSE_MINUTES = 15;

function loginKey(email: string): string {
  return ("login:" + normalizeEmail(email)).slice(0, 190);
}

interface PauseRow {
  pause_left: number | string | null;
}

async function loginPauseLeft(email: string): Promise<number> {
  const rows = await query<PauseRow[]>(
    `SELECT GREATEST(CEIL(EXTRACT(EPOCH FROM paused_until - now())), 0)::int AS pause_left
       FROM otp_locks WHERE identifier = $1`,
    [loginKey(email)]
  );
  return Number(rows[0]?.pause_left ?? 0);
}

/** One statement, so parallel misses can't race past the count. Inside ON
 * CONFLICT DO UPDATE, `otp_locks.` columns are the row before this miss. */
async function recordLoginMiss(email: string): Promise<void> {
  await mutate(
    `INSERT INTO otp_locks (identifier, dead_streak, strikes, paused_until, updated_at)
     VALUES ($1, 1, 0, NULL, now())
     ON CONFLICT (identifier) DO UPDATE SET
       paused_until = CASE WHEN otp_locks.updated_at > now() - make_interval(mins => $2::int)
                                AND otp_locks.dead_streak + 1 >= $3::int
                           THEN now() + make_interval(mins => $2::int) ELSE otp_locks.paused_until END,
       dead_streak  = CASE WHEN otp_locks.updated_at > now() - make_interval(mins => $2::int)
                           THEN otp_locks.dead_streak + 1 ELSE 1 END,
       updated_at   = now()`,
    [loginKey(email), LOGIN_PAUSE_MINUTES, LOGIN_LIMIT]
  );
}

export async function findByEmail(email: string): Promise<UserRow | null> {
  const rows = await query<UserRow[]>("SELECT * FROM users WHERE email = $1 LIMIT 1", [
    normalizeEmail(email),
  ]);
  return rows[0] ?? null;
}

export async function signIn(
  email: string,
  password: string
): Promise<SignedIn | { ok: false; error: string }> {
  if (email.length > 190 || password.length > 200) return { ok: false, error: "Invalid email or password." };

  const pauseLeft = await loginPauseLeft(email);
  if (pauseLeft > 0) {
    const minutes = Math.ceil(pauseLeft / 60);
    return {
      ok: false,
      error: `Too many wrong passwords. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}, or reset your password.`,
    };
  }

  const row = await findByEmail(email);
  // Compare against a dummy hash when the account is missing so a bad email and
  // a bad password take the same amount of time to answer.
  if (!row) {
    await bcrypt.compare(password, "$2b$10$" + "x".repeat(53));
    await recordLoginMiss(email);
    return { ok: false, error: "Invalid email or password." };
  }
  // A hash that was hand-edited into the table (plaintext, say) is not a valid
  // bcrypt digest — treat that as a failed login rather than letting it throw.
  let matches = false;
  try {
    matches = await bcrypt.compare(password, row.password_hash);
  } catch {
    matches = false;
  }
  if (!matches) {
    await recordLoginMiss(email);
    return { ok: false, error: "Invalid email or password." };
  }
  await mutate("DELETE FROM otp_locks WHERE identifier = $1", [loginKey(email)]);
  return { ok: true, user: toPublic(row), passwordHash: row.password_hash };
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  phone?: string
): Promise<SignedIn | { ok: false; error: string }> {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);
  if (!trimmedName) return { ok: false, error: "Enter your name." };
  if (trimmedName.length > 120) return { ok: false, error: "That name is too long." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return { ok: false, error: "Enter a valid email address." };
  if (normalizedEmail.length > 190) return { ok: false, error: "That email address is too long." };
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
  if (password.length > 200) return { ok: false, error: "That password is too long." };

  let storedPhone: string | null = null;
  const trimmedPhone = phone?.trim();
  if (trimmedPhone) {
    const digits = normalizePhone(trimmedPhone);
    if (digits.length !== 10) return { ok: false, error: "Enter a valid 10-digit mobile number." };
    storedPhone = digits;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    await mutate(
      "INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, 'USER')",
      [trimmedName, normalizedEmail, passwordHash, storedPhone]
    );
  } catch (error) {
    // Let the unique keys, not a read-then-write race, decide uniqueness.
    if (isUniqueViolation(error)) {
      return isUniqueViolation(error, "uq_users_phone")
        ? { ok: false, error: "An account with that mobile number already exists." }
        : { ok: false, error: "An account with that email already exists." };
    }
    throw error;
  }

  return { ok: true, user: { name: trimmedName, email: normalizedEmail, role: "USER" }, passwordHash };
}

/*
 * Accounts made through Google have no password. The column can't be empty, so
 * it holds a marker that is not a bcrypt digest: signIn's compare rejects it,
 * and no password typed on the login form can ever match. The customer can
 * still set one later through "Forgot password", which proves the same email.
 */
const NO_PASSWORD_PREFIX = "google-only:";

/**
 * Signs in the Sutra account for a Google-verified email, creating it on first
 * use. An existing account with that email is the same person (Google has just
 * proved they own the address), so it opens with its orders and reviews intact.
 */
export async function signInWithGoogle(email: string, name: string): Promise<SignedIn> {
  const normalizedEmail = normalizeEmail(email);
  const existing = await findByEmail(normalizedEmail);
  if (existing) {
    if (existing.password_hash.startsWith(NO_PASSWORD_PREFIX)) {
      return { ok: true, user: toPublic(existing), passwordHash: existing.password_hash };
    }
    /*
     * Sign-up never proves the email belongs to whoever typed it, so a
     * password account may have been opened in this person's name by someone
     * else, waiting for them to arrive. Google has just proved who owns the
     * address, so the password set by whoever made the account stops working
     * here, along with every session made with it. The owner keeps their
     * orders and can set a password again through "Forgot password".
     */
    const marker = NO_PASSWORD_PREFIX + randomBytes(16).toString("hex");
    await mutate("UPDATE users SET password_hash = $1 WHERE id = $2", [marker, existing.id]);
    return { ok: true, user: toPublic(existing), passwordHash: marker };
  }

  const marker = NO_PASSWORD_PREFIX + randomBytes(16).toString("hex");
  const trimmedName = name.trim().slice(0, 120) || normalizedEmail.split("@")[0];
  try {
    await mutate(
      "INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1, $2, $3, NULL, 'USER')",
      [trimmedName, normalizedEmail, marker]
    );
  } catch (error) {
    // Two sign-ins racing for a brand-new email: the other one made it.
    if (!isUniqueViolation(error)) throw error;
    const row = await findByEmail(normalizedEmail);
    if (row) return { ok: true, user: toPublic(row), passwordHash: row.password_hash };
    throw error;
  }
  return { ok: true, user: { name: trimmedName, email: normalizedEmail, role: "USER" }, passwordHash: marker };
}

/** Looks an account up by either email or 10-digit mobile, for password recovery. */
export async function findAccount(
  lookup: string
): Promise<{ name: string; email: string; phone?: string } | null> {
  const trimmed = lookup.trim();
  if (!trimmed) return null;

  const isPhone = !trimmed.includes("@") && normalizePhone(trimmed).length === 10;
  const rows = isPhone
    ? await query<UserRow[]>("SELECT * FROM users WHERE phone = $1 LIMIT 1", [
        normalizePhone(trimmed),
      ])
    : await query<UserRow[]>("SELECT * FROM users WHERE email = $1 LIMIT 1", [
        normalizeEmail(trimmed),
      ]);

  const row = rows[0];
  if (!row) return null;
  return { name: row.name, email: row.email, ...(row.phone ? { phone: row.phone } : {}) };
}

export async function resetPassword(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await mutate("UPDATE users SET password_hash = $1 WHERE email = $2", [
    passwordHash,
    normalizeEmail(email),
  ]);
  return result.affectedRows > 0
    ? { ok: true }
    : { ok: false, error: "No account found for that email." };
}
