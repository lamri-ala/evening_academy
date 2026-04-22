-- Evening Academy Management System — Phase 1 schema (SQLite, Kysely-friendly)
--
-- Design notes:
--   * IDs are TEXT (uuid v4, generated in app code with crypto.randomUUID()).
--   * Booleans are stored as INTEGER 0/1 (SQLite has no native BOOLEAN).
--   * Timestamps are stored as TEXT in ISO-8601 UTC (e.g. 2026-04-22T20:00:00.000Z).
--     SQLite has no real date type; keeping ISO strings plays best with JSON, Tauri,
--     and Kysely's string-typed columns.
--   * Money is INTEGER minor units (centimes DZD). Never floats.
--   * Enum-like columns use TEXT with a CHECK constraint.
--   * Foreign keys are enforced via `PRAGMA foreign_keys = ON` at connection time.
--   * Ledger tables are append-only; UI wiring comes in Phase 2.

-- ---------- Auth ----------

CREATE TABLE "User" (
  "id"           TEXT PRIMARY KEY,
  "email"        TEXT NOT NULL UNIQUE,
  "name"         TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role"         TEXT NOT NULL DEFAULT 'STAFF' CHECK ("role" IN ('DIRECTOR', 'STAFF')),
  "active"       INTEGER NOT NULL DEFAULT 1 CHECK ("active" IN (0, 1)),
  "createdAt"    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "updatedAt"    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ---------- Academic entities ----------

CREATE TABLE "Subject" (
  "id"                 TEXT PRIMARY KEY,
  "name"               TEXT NOT NULL UNIQUE,
  "code"               TEXT UNIQUE,
  "sessionPrice"       INTEGER NOT NULL,
  "defaultTeacherRate" INTEGER,
  "color"              TEXT,
  "active"             INTEGER NOT NULL DEFAULT 1 CHECK ("active" IN (0, 1)),
  "createdAt"          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "updatedAt"          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE "Classroom" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL UNIQUE,
  "capacity"  INTEGER,
  "notes"     TEXT,
  "active"    INTEGER NOT NULL DEFAULT 1 CHECK ("active" IN (0, 1)),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE "Student" (
  "id"            TEXT PRIMARY KEY,
  "code"          TEXT NOT NULL UNIQUE,
  "firstName"     TEXT NOT NULL,
  "lastName"      TEXT NOT NULL,
  "phone"         TEXT,
  "guardianName"  TEXT,
  "guardianPhone" TEXT,
  "notes"         TEXT,
  "cachedBalance" INTEGER NOT NULL DEFAULT 0,
  "active"        INTEGER NOT NULL DEFAULT 1 CHECK ("active" IN (0, 1)),
  "createdAt"     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "updatedAt"     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE "Teacher" (
  "id"            TEXT PRIMARY KEY,
  "firstName"     TEXT NOT NULL,
  "lastName"      TEXT NOT NULL,
  "phone"         TEXT,
  "email"         TEXT,
  "sessionRate"   INTEGER NOT NULL DEFAULT 0,
  "notes"         TEXT,
  "cachedBalance" INTEGER NOT NULL DEFAULT 0,
  "active"        INTEGER NOT NULL DEFAULT 1 CHECK ("active" IN (0, 1)),
  "createdAt"     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "updatedAt"     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ---------- Timetable (Phase 1 UI target) ----------

-- dayOfWeek: 0=Sunday ... 6=Saturday (matches JS Date#getDay()).
-- startMinute/endMinute: minutes since midnight local time (18:30 = 1110).
CREATE TABLE "TimetableSlot" (
  "id"          TEXT PRIMARY KEY,
  "dayOfWeek"   INTEGER NOT NULL CHECK ("dayOfWeek" BETWEEN 0 AND 6),
  "startMinute" INTEGER NOT NULL CHECK ("startMinute" BETWEEN 0 AND 1439),
  "endMinute"   INTEGER NOT NULL CHECK ("endMinute" BETWEEN 1 AND 1440),
  "subjectId"   TEXT NOT NULL REFERENCES "Subject"("id") ON DELETE RESTRICT,
  "teacherId"   TEXT NOT NULL REFERENCES "Teacher"("id") ON DELETE RESTRICT,
  "classroomId" TEXT NOT NULL REFERENCES "Classroom"("id") ON DELETE RESTRICT,
  "label"       TEXT,
  "active"      INTEGER NOT NULL DEFAULT 1 CHECK ("active" IN (0, 1)),
  "createdAt"   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "updatedAt"   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK ("endMinute" > "startMinute")
);

CREATE INDEX "TimetableSlot_day_start_idx" ON "TimetableSlot"("dayOfWeek", "startMinute");
CREATE INDEX "TimetableSlot_teacher_day_idx" ON "TimetableSlot"("teacherId", "dayOfWeek");
CREATE INDEX "TimetableSlot_classroom_day_idx" ON "TimetableSlot"("classroomId", "dayOfWeek");

-- ---------- Append-only ledgers (schema present, UI deferred to Phase 2) ----------

CREATE TABLE "StudentLedgerEntry" (
  "id"           TEXT PRIMARY KEY,
  "studentId"    TEXT NOT NULL REFERENCES "Student"("id") ON DELETE RESTRICT,
  "kind"         TEXT NOT NULL CHECK ("kind" IN ('PAYMENT', 'SESSION_CHARGE', 'ADJUSTMENT', 'REFUND')),
  "amount"       INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "reason"       TEXT,
  "recordedById" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
  "createdAt"    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX "StudentLedgerEntry_student_idx" ON "StudentLedgerEntry"("studentId", "createdAt");

CREATE TABLE "TeacherLedgerEntry" (
  "id"           TEXT PRIMARY KEY,
  "teacherId"    TEXT NOT NULL REFERENCES "Teacher"("id") ON DELETE RESTRICT,
  "kind"         TEXT NOT NULL CHECK ("kind" IN ('EARNING', 'PAYMENT', 'ADJUSTMENT')),
  "amount"       INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "reason"       TEXT,
  "recordedById" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
  "createdAt"    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX "TeacherLedgerEntry_teacher_idx" ON "TeacherLedgerEntry"("teacherId", "createdAt");

-- ---------- Audit log ----------

CREATE TABLE "AuditLog" (
  "id"        TEXT PRIMARY KEY,
  "actorId"   TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
  "action"    TEXT NOT NULL,
  "entity"    TEXT NOT NULL,
  "entityId"  TEXT NOT NULL,
  "payload"   TEXT,
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "AuditLog_actor_idx" ON "AuditLog"("actorId", "createdAt");
