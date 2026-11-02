/** Shared connection settings for the sql/ scripts — mirrors src/lib/db.ts. */
import { readFileSync } from "node:fs";

export function loadEnv() {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^"|"$/g, "");
      }
    }
  } catch {
    // No .env.local — fall back to real environment variables.
  }
}

const decode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

const clean = (v) => (v ?? "").replace(/^﻿/, "").trim().replace(/^["']|["']$/g, "");

/**
 * Splits a connection URL by position (the password runs to the last @), so a
 * raw # ? / or @ in the password works. Never let an error print the URL,
 * since it holds the password.
 */
export function parseDbUrl(url, scheme) {
  const m = new RegExp(`^${scheme}:\\/\\/([^:@/]*):(.*)@([^@:/]+)(?::(\\d+))?\\/([^?#]+)(?:\\?(.*))?$`).exec(url);
  if (!m) throw new Error(`Not a valid ${scheme}:// connection string (expected ${scheme}://user:password@host:port/database).`);
  return {
    user: decode(m[1]),
    password: decode(m[2]),
    host: m[3],
    port: m[4] ? Number(m[4]) : undefined,
    database: decode(m[5]),
    options: new URLSearchParams(m[6] ?? ""),
  };
}

/** PostgreSQL settings from POSTGRES_URL (or a postgres:// DATABASE_URL), for `new pg.Client()`. */
export function connectionConfig() {
  loadEnv();
  const url = [process.env.POSTGRES_URL, process.env.DATABASE_URL].map(clean).find((v) => v.startsWith("postgres"));
  if (!url) {
    throw new Error("POSTGRES_URL is not set. Put the Neon connection string in .env.local as POSTGRES_URL=...");
  }
  const { options, ...parts } = parseDbUrl(url, "postgres(?:ql)?");
  const isLocal = parts.host === "localhost" || parts.host === "127.0.0.1";
  return {
    ...parts,
    port: parts.port ?? 5432,
    ssl: isLocal || options.get("sslmode") === "disable" ? false : true,
    connectionTimeoutMillis: 15000,
  };
}

/** The old MySQL (TiDB) settings from DATABASE_URL, for the one-off migration. */
export function mysqlConfig() {
  loadEnv();
  const url = clean(process.env.DATABASE_URL || process.env.MYSQL_URL);
  if (!url.startsWith("mysql")) throw new Error("DATABASE_URL is not a mysql:// connection string.");
  const { options, ...parts } = parseDbUrl(url, "mysql");
  const isLocal = parts.host === "localhost" || parts.host === "127.0.0.1";
  return { ...parts, port: parts.port ?? 3306, ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }) };
}
