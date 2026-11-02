/**
 * One-off move of every row from the old MySQL/TiDB database (DATABASE_URL)
 * into PostgreSQL (POSTGRES_URL).
 *
 *   node sql/migrate-from-mysql.mjs             copy into an empty PostgreSQL
 *   node sql/migrate-from-mysql.mjs --replace   empty PostgreSQL's tables first
 *
 * The MySQL side is only read, so it stays a complete backup. The PostgreSQL
 * side is written in one transaction: if anything fails, or the copy does not
 * match the original table for table, nothing is kept.
 *
 * What changes on the way, on purpose:
 *   - times become timestamptz (the MySQL values are UTC; this is checked);
 *   - used/dead flags become true/false;
 *   - emails are stored lower case, as the app always looks them up that way
 *     (MySQL matched them case-insensitively, PostgreSQL does not).
 * Password hashes are copied exactly, so every password keeps working.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";
import pg from "pg";
import { connectionConfig, mysqlConfig } from "./db-config.mjs";

const replace = process.argv.includes("--replace");

// Parents before children, so foreign keys hold at every step.
const TABLES = [
  { name: "users", key: "id", identity: true },
  { name: "orders", key: "id" },
  { name: "order_items", key: "id", identity: true },
  { name: "reviews", key: "id" },
  { name: "otp_challenges", key: "id" },
  { name: "otp_locks", key: "identifier" },
];
const LOWER_EMAIL = { users: "email", orders: "email" };
const BOOLEANS = new Set(["used", "dead"]);

function stop(message) {
  console.error(`\nStopped: ${message}\nNothing was written to PostgreSQL.`);
  process.exit(1);
}

const my = await mysql.createConnection({ ...mysqlConfig(), dateStrings: true, connectTimeout: 15000 }).catch((e) =>
  stop(`could not connect to MySQL (${e.code ?? e.message}). Check DATABASE_URL in .env.local.`)
);
const pgConfig = connectionConfig();
const pgc = new pg.Client(pgConfig);
await pgc.connect().catch((e) => stop(`could not connect to PostgreSQL (${e.code ?? e.message}). Check POSTGRES_URL.`));
console.log(`from MySQL       ${mysqlConfig().host}`);
console.log(`to   PostgreSQL  ${pgConfig.host}\n`);

// MySQL DATETIME has no zone. The app wrote UTC (Vercel's clock) and NOW() is
// the server's zone, so only go ahead when that zone is UTC.
const [[tz]] = await my.query("SELECT @@session.time_zone AS session, @@system_time_zone AS system, TIMESTAMPDIFF(MINUTE, UTC_TIMESTAMP(), NOW()) AS offset");
if (Number(tz.offset) !== 0) stop(`MySQL's clock is ${tz.offset} minutes off UTC (${tz.session}/${tz.system}); times would shift.`);

// Schema first (idempotent), then refuse to mix with rows already there.
await pgc.query(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
for (const t of TABLES) {
  const { rows } = await pgc.query(`SELECT COUNT(*)::int AS n FROM ${t.name}`);
  if (rows[0].n > 0 && !replace) stop(`PostgreSQL table ${t.name} already has ${rows[0].n} rows. Re-run with --replace to empty it first.`);
}

const [mysqlTables] = await my.query("SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()");
const present = new Set(mysqlTables.map((r) => r.t));
const extraTables = [...present].filter((t) => !TABLES.some((x) => x.name === t));
if (extraTables.length) stop(`MySQL has tables this migration does not know: ${extraTables.join(", ")}. Add them to the PostgreSQL schema first.`);

/** A row as both sides should agree on it, for the checksum. */
function canonical(table, row, cols) {
  return JSON.stringify(
    cols.map((c) => {
      const v = row[c];
      if (v === null || v === undefined) return null;
      if (v instanceof Date) return v.toISOString();
      if (c === LOWER_EMAIL[table]) return String(v).toLowerCase();
      if (BOOLEANS.has(c)) return Boolean(Number(v));
      if (typeof v === "string" && /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(v)) return new Date(v.replace(" ", "T") + "Z").toISOString();
      if (typeof v === "string" && /^-?\d+\.\d+$/.test(v)) return Number(v).toFixed(2);
      return typeof v === "number" ? String(v) : String(v);
    })
  );
}
// Sorted here rather than trusting ORDER BY: MySQL and PostgreSQL collate text
// keys differently, and the same rows in another order are still the same rows.
const digest = (lines) => createHash("sha256").update(lines.sort().join("\n")).digest("hex");

const report = [];
try {
  await pgc.query("BEGIN");
  if (replace) await pgc.query(`TRUNCATE ${TABLES.map((t) => t.name).join(", ")} RESTART IDENTITY CASCADE`);

  for (const t of TABLES) {
    if (!present.has(t.name)) {
      report.push([t.name, 0, 0, "not in MySQL (left empty)"]);
      continue;
    }
    const [myCols] = await my.query(
      "SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
      [t.name]
    );
    const { rows: pgCols } = await pgc.query(
      "SELECT column_name AS c FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
      [t.name]
    );
    const pgSet = new Set(pgCols.map((r) => r.c));
    const cols = myCols.map((r) => r.c);
    const lost = cols.filter((c) => !pgSet.has(c));
    if (lost.length) throw new Error(`${t.name} has columns PostgreSQL lacks (${lost.join(", ")}); their data would be lost.`);

    const [rows] = await my.query(`SELECT * FROM \`${t.name}\` ORDER BY \`${t.key}\``);
    for (const row of rows) {
      const values = cols.map((c) => {
        const v = row[c];
        if (v === null) return null;
        if (c === LOWER_EMAIL[t.name]) return String(v).trim().toLowerCase();
        if (BOOLEANS.has(c)) return Boolean(Number(v));
        if (typeof v === "string" && /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(v)) return v.replace(" ", "T") + "Z";
        return v;
      });
      const override = t.identity ? " OVERRIDING SYSTEM VALUE" : "";
      await pgc.query(
        `INSERT INTO ${t.name} (${cols.join(", ")})${override} VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")})`,
        values
      );
    }
    if (t.identity) {
      // Next new row continues after the copied ids.
      await pgc.query(
        `SELECT setval(pg_get_serial_sequence('${t.name}', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM ${t.name}`
      );
    }

    // Verify: same number of rows and the same contents, row for row.
    const { rows: copied } = await pgc.query(`SELECT ${cols.join(", ")} FROM ${t.name} ORDER BY ${t.key}`);
    const a = digest(rows.map((r) => canonical(t.name, r, cols)));
    const b = digest(copied.map((r) => canonical(t.name, r, cols)));
    if (rows.length !== copied.length || a !== b) {
      throw new Error(`${t.name} does not match after copying (${rows.length} rows in MySQL, ${copied.length} in PostgreSQL).`);
    }
    report.push([t.name, rows.length, copied.length, "match"]);
  }

  await pgc.query("COMMIT");
} catch (error) {
  await pgc.query("ROLLBACK").catch(() => undefined);
  stop(error.message);
} finally {
  await my.end();
}

console.table(report.map(([table, mysqlRows, postgresRows, check]) => ({ table, mysqlRows, postgresRows, check })));
console.log("\nDone. MySQL was only read and still holds everything.");
await pgc.end();
