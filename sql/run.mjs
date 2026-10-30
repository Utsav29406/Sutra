/**
 * Runs SQL against the PostgreSQL database in POSTGRES_URL.
 *
 *   node sql/run.mjs "SELECT id, name, email, role FROM users ORDER BY id"
 *   node sql/run.mjs "SELECT * FROM orders"
 *
 * With no argument it prints a summary of every table.
 */
import pg from "pg";
import { connectionConfig } from "./db-config.mjs";

const sql = process.argv.slice(2).join(" ").trim();
const config = connectionConfig();
const client = new pg.Client(config);
await client.connect();

console.log(`connected to ${config.host}/${config.database}\n`);

if (sql) {
  const result = await client.query(sql);
  if (result.rows.length || result.command === "SELECT") console.table(result.rows);
  else console.log(`${result.command}${result.rowCount == null ? "" : `: ${result.rowCount} row(s)`}`);
} else {
  const { rows: counts } = await client.query(
    `SELECT (SELECT COUNT(*) FROM users)::int AS users,
            (SELECT COUNT(*) FROM orders)::int AS orders,
            (SELECT COUNT(*) FROM order_items)::int AS order_items,
            (SELECT COUNT(*) FROM reviews)::int AS reviews`
  );
  console.table(counts);
  const { rows: users } = await client.query("SELECT id, name, email, phone, role FROM users ORDER BY id");
  console.table(users);
}

await client.end();
