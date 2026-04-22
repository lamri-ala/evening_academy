// Tiny forward-only migration runner for the evening-academy SQLite DB.
//
// Usage: `npm run db:migrate`
//
// Applies every *.sql file in db/migrations in alphanumeric order and records
// applied ones in a `_Migrations` table. Each file runs inside a transaction.
// Keep migration files immutable once committed; add new ones instead of
// editing old ones.

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const MIGRATIONS_DIR = path.resolve(__dirname, "migrations");
const DB_PATH = process.env.DATABASE_PATH ?? "dev.db";

function run() {
  const db = new Database(DB_PATH);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");

  db.exec(
    `CREATE TABLE IF NOT EXISTS "_Migrations" (
       "id" INTEGER PRIMARY KEY AUTOINCREMENT,
       "name" TEXT NOT NULL UNIQUE,
       "appliedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
     );`,
  );

  const applied = new Set(
    db
      .prepare(`SELECT "name" FROM "_Migrations"`)
      .all()
      .map((r) => (r as { name: string }).name),
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let appliedCount = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const apply = db.transaction(() => {
      db.exec(sql);
      db.prepare(`INSERT INTO "_Migrations" ("name") VALUES (?)`).run(file);
    });
    apply();
    console.log(`applied ${file}`);
    appliedCount += 1;
  }

  if (appliedCount === 0) {
    console.log("no migrations to apply");
  }

  db.close();
}

run();
