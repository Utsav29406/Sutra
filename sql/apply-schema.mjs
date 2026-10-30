/**
 * Applies sql/schema.sql to the PostgreSQL database in POSTGRES_URL. Every
 * statement is IF NOT EXISTS / OR REPLACE, so it is safe to re-run.
 *
 *   node sql/apply-schema.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";
import { connectionConfig } from "./db-config.mjs";

const config = connectionConfig();
const client = new pg.Client(config);
await client.connect();
console.log(`connected to ${config.host}/${config.database}`);

await client.query(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
console.log("schema applied");

const { rows } = await client.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
);
console.log("tables:", rows.map((r) => r.table_name).join(", "));
await client.end();
