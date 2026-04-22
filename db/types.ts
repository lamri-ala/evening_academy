// Kysely database types for the evening-academy SQLite schema.
// Every table here mirrors db/migrations/*.sql one-to-one.
//
// Conventions:
//   * `id` / foreign-key columns are TEXT (uuid v4).
//   * Booleans are stored as 0/1 INTEGER — we expose them as `number` here and
//     convert at the edges (boolToInt / intToBool in src/lib/db.ts).
//   * Timestamps are ISO-8601 TEXT. We never ask SQLite to compare them as
//     dates; if we need sorting, alphabetical is fine for ISO-8601.
//   * Money is INTEGER minor units (centimes). Never floats.

import type { ColumnType, Generated } from "kysely";

// Timestamps that SQLite generates via a column DEFAULT. From TS's point of
// view callers never need to provide them.
type TimestampDefault = ColumnType<string, string | undefined, string>;

// Int columns that have a DEFAULT but callers may still supply a value.
type IntDefault = ColumnType<number, number | undefined, number>;

export type UserRole = "DIRECTOR" | "STAFF";
export type StudentLedgerKind =
  | "PAYMENT"
  | "SESSION_CHARGE"
  | "ADJUSTMENT"
  | "REFUND";
export type TeacherLedgerKind = "EARNING" | "PAYMENT" | "ADJUSTMENT";

export interface UserTable {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: ColumnType<UserRole, UserRole | undefined, UserRole>;
  active: IntDefault;
  createdAt: TimestampDefault;
  updatedAt: TimestampDefault;
}

export interface SubjectTable {
  id: string;
  name: string;
  code: string | null;
  sessionPrice: number;
  defaultTeacherRate: number | null;
  color: string | null;
  active: IntDefault;
  createdAt: TimestampDefault;
  updatedAt: TimestampDefault;
}

export interface ClassroomTable {
  id: string;
  name: string;
  capacity: number | null;
  notes: string | null;
  active: IntDefault;
  createdAt: TimestampDefault;
  updatedAt: TimestampDefault;
}

export interface StudentTable {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  notes: string | null;
  cachedBalance: IntDefault;
  active: IntDefault;
  createdAt: TimestampDefault;
  updatedAt: TimestampDefault;
}

export interface TeacherTable {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  sessionRate: IntDefault;
  notes: string | null;
  cachedBalance: IntDefault;
  active: IntDefault;
  createdAt: TimestampDefault;
  updatedAt: TimestampDefault;
}

export interface TimetableSlotTable {
  id: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  subjectId: string;
  teacherId: string;
  classroomId: string;
  label: string | null;
  active: IntDefault;
  createdAt: TimestampDefault;
  updatedAt: TimestampDefault;
}

export interface StudentLedgerEntryTable {
  id: string;
  studentId: string;
  kind: StudentLedgerKind;
  amount: number;
  balanceAfter: number;
  reason: string | null;
  recordedById: string;
  createdAt: TimestampDefault;
}

export interface TeacherLedgerEntryTable {
  id: string;
  teacherId: string;
  kind: TeacherLedgerKind;
  amount: number;
  balanceAfter: number;
  reason: string | null;
  recordedById: string;
  createdAt: TimestampDefault;
}

export interface AuditLogTable {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  payload: string | null;
  createdAt: TimestampDefault;
}

export interface MigrationTable {
  id: Generated<number>;
  name: string;
  appliedAt: TimestampDefault;
}

export interface Database {
  User: UserTable;
  Subject: SubjectTable;
  Classroom: ClassroomTable;
  Student: StudentTable;
  Teacher: TeacherTable;
  TimetableSlot: TimetableSlotTable;
  StudentLedgerEntry: StudentLedgerEntryTable;
  TeacherLedgerEntry: TeacherLedgerEntryTable;
  AuditLog: AuditLogTable;
  _Migrations: MigrationTable;
}
