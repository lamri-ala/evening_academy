// Shared Kysely + better-sqlite3 client for the evening-academy app.
//
// Design notes:
//   * better-sqlite3 is synchronous but Kysely wraps it with its async API.
//   * We enable foreign keys and WAL mode on every connection.
//   * The module exports a single long-lived `db` instance. Next.js HMR can
//     re-evaluate modules; we stash the instance on globalThis so dev
//     reloads don't leak file descriptors.

import BetterSqlite3 from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import type { Database as DatabaseSchema } from "../../db/types";

const DB_PATH = process.env.DATABASE_PATH ?? "dev.db";

type GlobalWithDb = typeof globalThis & {
  __eveningAcademyDb?: Kysely<DatabaseSchema>;
};

function createDb(): Kysely<DatabaseSchema> {
  const sqlite = new BetterSqlite3(DB_PATH);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");
  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({ database: sqlite }),
  });
}

const globalForDb = globalThis as GlobalWithDb;
export const db: Kysely<DatabaseSchema> =
  globalForDb.__eveningAcademyDb ?? createDb();
if (process.env.NODE_ENV !== "production") {
  globalForDb.__eveningAcademyDb = db;
}

// Helpers for translating between JS booleans and SQLite 0/1 INTEGER columns.
// Kysely's types don't know that our `active` columns are logical booleans,
// so app code should use these explicitly at the boundary.
export const toInt = (b: boolean): 0 | 1 => (b ? 1 : 0);
export const toBool = (i: number | null | undefined): boolean => i === 1;

// Unique-constraint detection. better-sqlite3 throws `SqliteError` with
// `code === "SQLITE_CONSTRAINT_UNIQUE"` (or sometimes "_PRIMARYKEY").
export function isUniqueConstraintError(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const code = (e as { code?: string }).code;
  return (
    code === "SQLITE_CONSTRAINT_UNIQUE" ||
    code === "SQLITE_CONSTRAINT_PRIMARYKEY"
  );
}

// Cheap ISO-8601 UTC timestamp for columns that SQLite's DEFAULT would fill.
// Use this when you're building an UPDATE and need to refresh `updatedAt`.
export const nowIso = (): string => new Date().toISOString();

export type { DatabaseSchema };
