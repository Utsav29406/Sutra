import "server-only";
import { Pool, type PoolClient, type PoolConfig } from "pg";

/**
 * PostgreSQL (Neon in production). The connection string comes from
 * POSTGRES_URL, or from DATABASE_URL when that one is a postgres:// URL:
 *
 *   POSTGRES_URL=postgresql://user:password@host/dbname?sslmode=require
 *
 * Its own name, rather than reusing DATABASE_URL, so deployments made before
 * the move to PostgreSQL keep reading the old MySQL setting and can still be
 * rolled back to.
 */

/**
 * Env values pasted through dashboards and shells routinely carry a stray BOM,
 * surrounding quotes, or a trailing newline, so clean the value first.
 */
function readUrl(): string | undefined {
  const pick = [process.env.POSTGRES_URL, process.env.DATABASE_URL].find((v) =>
    v?.replace(/^﻿/, "").trim().replace(/^["']/, "").startsWith("postgres")
  );
  const cleaned = pick?.replace(/^﻿/, "").trim().replace(/^["']|["']$/g, "");
  return cleaned || undefined;
}

const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

/**
 * Splits postgres://user:password@host:port/database?options into its parts.
 * Read by position, the password running to the last @, so a password holding
 * # ? / or @ works even when it was not percent-encoded. The error never
 * repeats the URL, which holds the password.
 */
function parseDbUrl(url: string) {
  const m = /^postgres(?:ql)?:\/\/([^:@/]*):(.*)@([^@:/]+)(?::(\d+))?\/([^?#]+)(?:\?(.*))?$/.exec(url);
  if (!m) {
    throw new Error(
      "POSTGRES_URL is not a valid connection string. Expected the form " +
        "postgresql://user:password@host:port/database"
    );
  }
  return {
    user: decode(m[1]),
    password: decode(m[2]),
    host: m[3],
    port: Number(m[4] || 5432),
    database: decode(m[5]),
    options: new URLSearchParams(m[6] ?? ""),
  };
}

function poolConfig(): PoolConfig {
  const url = readUrl();
  if (!url) throw new Error("POSTGRES_URL is not set.");
  const { options, ...parts } = parseDbUrl(url);
  const isLocal = parts.host === "localhost" || parts.host === "127.0.0.1";
  return {
    ...parts,
    // Serverless functions each hold their own pool, so keep it small: a large
    // limit times many warm instances will exhaust the database's connections.
    max: process.env.VERCEL ? 3 : 10,
    // Hosted Postgres (Neon, Supabase) requires TLS; a local server usually
    // has none. sslmode=disable in the URL turns it off explicitly.
    ssl: isLocal || options.get("sslmode") === "disable" ? false : true,
  };
}

// Next dev reloads modules on every edit, so the pool is cached on globalThis to
// avoid leaking a new set of connections with each hot reload.
const globalForDb = globalThis as unknown as { sutraPool?: Pool };

/**
 * Created on first use, never at import time. `next build` loads these modules
 * to collect route metadata, and a pool built during that step would make a bad
 * or missing connection string fail the whole build rather than one request.
 */
function getPool(): Pool {
  if (!globalForDb.sutraPool) {
    globalForDb.sutraPool = new Pool(poolConfig());
    // An idle client dropped by the server (Neon suspends idle databases) must
    // not crash the function; the pool replaces it on the next query.
    globalForDb.sutraPool.on("error", (error) => console.error("[db] idle client error", error.message));
  }
  return globalForDb.sutraPool;
}

/** What a $1, $2 … placeholder may be bound to. */
export type SqlParam = string | number | boolean | Date | Buffer | null | string[];

/** SELECT (or anything with RETURNING): the rows. */
export async function query<T = Record<string, unknown>[]>(sql: string, params: SqlParam[] = []): Promise<T> {
  const result = await getPool().query(sql, params);
  return result.rows as T;
}

/** INSERT/UPDATE/DELETE: how many rows it touched. */
export async function mutate(sql: string, params: SqlParam[] = []): Promise<{ affectedRows: number }> {
  const result = await getPool().query(sql, params);
  return { affectedRows: result.rowCount ?? 0 };
}

/** Runs `fn` inside a transaction on one connection, rolling back if it throws. */
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/** PostgreSQL's code for a broken unique constraint (a duplicate key). */
export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  const e = error as { code?: string; constraint?: string };
  return e?.code === "23505" && (constraint === undefined || e.constraint === constraint);
}

/** A timestamp for a timestamptz column, from an ISO string; null if missing or invalid. */
export function toSqlDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** A timestamptz value (pg returns a Date) back into the ISO form the UI renders. */
export function fromSqlDate(value: string | Date | null): string {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}
