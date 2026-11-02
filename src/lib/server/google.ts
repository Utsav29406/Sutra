import "server-only";
import { createPublicKey, createVerify, type JsonWebKey } from "crypto";

/*
 * "Continue with Google" and One Tap hand the browser a signed ID token (a JWT)
 * describing the Google account. The browser passes it here, and nothing in it
 * is trusted until its signature checks out against Google's published keys
 * and it was issued for this site's Client ID. Anyone can mint a JWT that
 * *says* it is someone's Gmail; only Google can sign one.
 *
 * The Client ID is public (it is in every page that shows the button), so it
 * doubles as the switch: unset, Google sign-in is off everywhere.
 */

export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

const CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
// Google's clock and ours can differ a little.
const CLOCK_SKEW_SECONDS = 60;

export interface GoogleAccount {
  email: string;
  name: string;
}

interface Jwk extends JsonWebKey {
  kid?: string;
}

let cachedKeys: { keys: Jwk[]; until: number } | null = null;

async function googleKeys(refresh = false): Promise<Jwk[]> {
  if (!refresh && cachedKeys && cachedKeys.until > Date.now()) return cachedKeys.keys;
  const res = await fetch(CERTS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Google keys: HTTP ${res.status}`);
  const { keys } = (await res.json()) as { keys: Jwk[] };
  // Google rotates the keys and says how long to keep each set.
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get("cache-control") ?? "")?.[1] ?? 3600);
  cachedKeys = { keys, until: Date.now() + maxAge * 1000 };
  return keys;
}

function decodePart<T>(part: string): T | null {
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/** The Google account an ID token vouches for, or null when it doesn't hold up. */
export async function verifyGoogleIdToken(token: unknown): Promise<GoogleAccount | null> {
  if (!googleClientId || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;

  const header = decodePart<{ alg?: string; kid?: string }>(headerPart);
  if (header?.alg !== "RS256" || !header.kid) return null;

  // A key id we haven't seen may mean Google has rotated; look once more.
  let key = (await googleKeys()).find((k) => k.kid === header.kid);
  if (!key) key = (await googleKeys(true)).find((k) => k.kid === header.kid);
  if (!key) return null;

  const signedOk = createVerify("RSA-SHA256")
    .update(`${headerPart}.${payloadPart}`)
    .verify(createPublicKey({ key, format: "jwk" }), Buffer.from(signaturePart, "base64url"));
  if (!signedOk) return null;

  const claims = decodePart<{
    iss?: string;
    aud?: string;
    exp?: number;
    iat?: number;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
    given_name?: string;
  }>(payloadPart);
  if (!claims) return null;

  const now = Math.floor(Date.now() / 1000);
  if (!claims.iss || !ISSUERS.has(claims.iss)) return null;
  if (claims.aud !== googleClientId) return null; // issued for some other site
  if (typeof claims.exp !== "number" || claims.exp + CLOCK_SKEW_SECONDS < now) return null;
  if (typeof claims.iat === "number" && claims.iat - CLOCK_SKEW_SECONDS > now) return null;
  // Only an address Google has confirmed belongs to this person may open the
  // Sutra account that uses it.
  if (claims.email_verified !== true && claims.email_verified !== "true") return null;
  if (!claims.email) return null;

  const name = (claims.name || claims.given_name || claims.email.split("@")[0]).trim().slice(0, 120);
  return { email: claims.email, name };
}
