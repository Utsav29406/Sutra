/**
 * Seeds the admin account and repairs any password_hash that was hand-edited
 * into the table as plaintext (which makes that account unable to log in).
 * Safe to re-run: an existing admin keeps its password.
 *
 *   ADMIN_SEED_PASSWORD='a long password' node sql/seed.mjs
 *
 * The password comes from the environment so it is never written into the
 * code. To change it later, use `node sql/set-password.mjs`.
 */
import pg from "pg";
import bcrypt from "bcryptjs";
import { connectionConfig, loadEnv } from "./db-config.mjs";

loadEnv();
const password = process.env.ADMIN_SEED_PASSWORD ?? "";
if (password.length < 10) {
  console.error("Set ADMIN_SEED_PASSWORD (10 characters or more) to seed the admin account.");
  process.exit(1);
}

const ACCOUNTS = [
  { name: "Sutra Admin", email: "admin@sutra.in", password, phone: "9876543210", role: "ADMIN" },
];

const client = new pg.Client(connectionConfig());
await client.connect();

for (const account of ACCOUNTS) {
  const hash = await bcrypt.hash(account.password, 10);
  // xmax = 0 only on a freshly inserted row, which tells "created" from "kept".
  const { rows } = await client.query(
    `INSERT INTO users (name, email, password_hash, phone, role)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role
     RETURNING (xmax = 0) AS created`,
    [account.name, account.email, hash, account.phone, account.role]
  );
  console.log(`${rows[0].created ? "created" : "kept   "}  ${account.email}  (${account.role})`);
}

// A valid bcrypt digest always starts with $2a/$2b/$2y. Anything else got there
// by hand and will fail every login, so hash it in place. Accounts made with
// Google hold a "google-only:" marker on purpose (no password), so leave those.
const { rows } = await client.query("SELECT id, email, password_hash FROM users");
for (const row of rows) {
  const hash = row.password_hash;
  if (typeof hash === "string" && !/^\$2[aby]\$/.test(hash) && !hash.startsWith("google-only:")) {
    const repaired = await bcrypt.hash(hash, 10);
    await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [repaired, row.id]);
    console.log(`repaired plaintext password for ${row.email} — that password now works`);
  }
}

const { rows: users } = await client.query("SELECT id, name, email, phone, role FROM users ORDER BY id");
console.table(users);

await client.end();
