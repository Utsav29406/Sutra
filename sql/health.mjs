/**
 * Read-only health check of the PostgreSQL database in POSTGRES_URL. It only
 * runs SELECTs and prints counts and yes/no answers: no emails, no hashes.
 *
 *   node sql/health.mjs
 *
 * Checks: connection and speed, every table and its row count, columns
 * against sql/schema.sql, line items or reviews pointing at orders that are
 * gone, passwords that are not bcrypt hashes, the admin account and whether it
 * still has the old default password, and leftover reset codes and pauses.
 */
import { readFileSync } from "node:fs";
import pg from "pg";
import bcrypt from "bcryptjs";
import { connectionConfig } from "./db-config.mjs";

const config = connectionConfig();
const started = Date.now();
const client = new pg.Client(config);
try {
  await client.connect();
} catch (error) {
  console.error(`Could not connect to ${config.host}: ${error.code ?? ""} ${error.message}`);
  console.error("If it says password authentication failed, the password in POSTGRES_URL is wrong.");
  process.exit(1);
}
const q = async (sql, params = []) => (await client.query(sql, params)).rows;
const ok = (good, text) => console.log(`${good ? "  ok  " : "  !!  "} ${text}`);

const [{ version }] = await q("SELECT version()");
console.log(`Connected to ${config.host}/${config.database} in ${Date.now() - started} ms (${version.split(" on ")[0]})\n`);

const t0 = Date.now();
await q("SELECT 1");
ok(Date.now() - t0 < 500, `simple query round trip: ${Date.now() - t0} ms`);

// Tables, rows and size.
const tables = await q(
  `SELECT table_name AS name, pg_total_relation_size(quote_ident(table_name)) AS bytes
     FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`
);
console.log("\nTables");
for (const t of tables) {
  const [{ n }] = await q(`SELECT COUNT(*)::int AS n FROM "${t.name}"`);
  console.log(`        ${t.name.padEnd(16)} ${String(n).padStart(7)} rows  ${(Number(t.bytes) / 1024).toFixed(0).padStart(6)} KB`);
}

// Columns compared with sql/schema.sql.
console.log("\nStructure against sql/schema.sql");
const schema = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
const expected = {};
for (const m of schema.matchAll(/CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\n\);/g)) {
  // Columns are lower case and SQL keywords upper case, which keeps out
  // CONSTRAINT lines and wrapped CHECK continuations.
  expected[m[1]] = [...m[2].matchAll(/^\s+([a-z_][a-z0-9_]*)\s+[a-z]/gm)].map((c) => c[1]);
}
const have = {};
for (const row of await q(
  "SELECT table_name AS t, column_name AS c FROM information_schema.columns WHERE table_schema = 'public'"
)) {
  (have[row.t] ??= []).push(row.c);
}
for (const [table, cols] of Object.entries(expected)) {
  if (!have[table]) {
    ok(false, `${table}: table missing (node sql/apply-schema.mjs creates it)`);
    continue;
  }
  const missing = cols.filter((c) => !have[table].includes(c));
  const extra = have[table].filter((c) => !cols.includes(c));
  ok(missing.length === 0, `${table}: ${missing.length ? `missing ${missing.join(", ")}` : "all columns present"}${extra.length ? `; extra ${extra.join(", ")}` : ""}`);
}
const unknown = Object.keys(have).filter((t) => !expected[t]);
if (unknown.length) console.log(`        not in schema.sql (left alone): ${unknown.join(", ")}`);

const exists = (t) => Boolean(have[t]);
console.log("\nData");
if (exists("order_items") && exists("orders")) {
  const [{ n }] = await q("SELECT COUNT(*)::int AS n FROM order_items i LEFT JOIN orders o ON o.id = i.order_id WHERE o.id IS NULL");
  ok(n === 0, `line items whose order is gone: ${n}`);
  const [{ e }] = await q("SELECT COUNT(*)::int AS e FROM orders o LEFT JOIN order_items i ON i.order_id = o.id WHERE i.id IS NULL");
  ok(e === 0, `orders with no line items: ${e}`);
}
if (exists("reviews") && exists("orders")) {
  const [{ n }] = await q("SELECT COUNT(*)::int AS n FROM reviews r LEFT JOIN orders o ON o.id = r.order_id WHERE r.order_id IS NOT NULL AND o.id IS NULL");
  ok(n === 0, `reviews pointing at a missing order: ${n}`);
}
if (exists("users")) {
  const users = await q("SELECT email, role, password_hash AS h FROM users");
  const notBcrypt = users.filter((u) => typeof u.h !== "string" || (!/^\$2[aby]\$/.test(u.h) && !u.h.startsWith("google-only:"))).length;
  ok(notBcrypt === 0, `accounts whose password is not a bcrypt hash: ${notBcrypt}`);
  const admins = users.filter((u) => u.role === "ADMIN");
  ok(admins.length > 0, `admin accounts: ${admins.length}`);
  const seeded = users.find((u) => u.email === "admin@sutra.in");
  if (seeded) {
    const stillDefault = typeof seeded.h === "string" && /^\$2[aby]\$/.test(seeded.h) && (await bcrypt.compare("admin123", seeded.h));
    ok(!stillDefault, stillDefault
      ? "admin@sutra.in still has the old default password: run node sql/set-password.mjs"
      : "admin@sutra.in no longer has the old default password");
  }
}
if (exists("otp_challenges")) {
  const [{ n }] = await q("SELECT COUNT(*)::int AS n FROM otp_challenges WHERE expires_at < now() - interval '1 day'");
  ok(n < 1000, `expired reset codes older than a day (safe to clear): ${n}`);
}
if (exists("otp_locks")) {
  const [{ n }] = await q("SELECT COUNT(*)::int AS n FROM otp_locks WHERE paused_until > now()");
  console.log(`        addresses paused from password reset or sign-in right now: ${n}`);
}

await client.end();
console.log("\nRead-only: nothing was changed.");
