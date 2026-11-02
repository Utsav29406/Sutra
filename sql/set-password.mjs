/**
 * Sets a new password for one account in the PostgreSQL database in
 * POSTGRES_URL (.env.local). The password is typed in, hidden, and never shown or
 * saved anywhere but as a bcrypt hash. Changing it also signs that account out
 * everywhere, because sessions carry a fingerprint of the password.
 *
 *   node sql/set-password.mjs                  the admin account, admin@sutra.in
 *   node sql/set-password.mjs someone@mail.com any other account
 */
import pg from "pg";
import bcrypt from "bcryptjs";
import { connectionConfig } from "./db-config.mjs";

const email = (process.argv[2] ?? "admin@sutra.in").trim().toLowerCase();

if (!process.stdin.isTTY) {
  console.error("Run this in a terminal: it asks for the password with your typing hidden.");
  process.exit(1);
}

/** Reads a line without echoing it. Backspace works; Ctrl+C cancels. */
function askHidden(prompt) {
  process.stdout.write(prompt);
  const stdin = process.stdin;
  stdin.setRawMode(true);
  stdin.setEncoding("utf8");
  stdin.resume();
  let value = "";
  return new Promise((resolve) => {
    const onData = (chunk) => {
      for (const c of chunk) {
        if (c === "\r" || c === "\n") {
          stdin.off("data", onData);
          stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (c === "\u0003") {
          process.stdout.write("\ncancelled\n");
          process.exit(130);
        }
        if (c === "\u007f" || c === "\b") value = value.slice(0, -1);
        else value += c;
      }
    };
    stdin.on("data", onData);
  });
}

console.log(`New password for ${email}`);
const first = await askHidden("  type it:   ");
if (first.length < 10) {
  console.error("Use at least 10 characters. Nothing was changed.");
  process.exit(1);
}
const second = await askHidden("  once more: ");
if (first !== second) {
  console.error("The two did not match. Nothing was changed.");
  process.exit(1);
}

const config = connectionConfig();
const client = new pg.Client(config);
await client.connect();
const result = await client.query("UPDATE users SET password_hash = $1 WHERE LOWER(email) = $2", [
  await bcrypt.hash(first, 10),
  email,
]);
await client.end();

if (result.rowCount === 0) {
  console.error(`No account with the email ${email} in ${config.host}. Nothing was changed.`);
  process.exit(1);
}
console.log(`Done: ${email} has its new password, and its old sessions are signed out.`);
