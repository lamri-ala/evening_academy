// Dev seed: 1 director, 1 staff, a handful of subjects, classrooms, teachers,
// students, and a few timetable slots so Phase 1 pages aren't empty on first
// boot. Idempotent: safe to run repeatedly (lookups by unique columns).
//
// Run with: npm run db:seed
import { randomUUID } from "node:crypto";
import BetterSqlite3 from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import bcrypt from "bcryptjs";
import type { Database as DatabaseSchema, UserRole } from "./types";

const DB_PATH = process.env.DATABASE_PATH ?? "dev.db";

async function getOrCreateUser(
  db: Kysely<DatabaseSchema>,
  values: { email: string; name: string; passwordHash: string; role: UserRole },
): Promise<{ id: string; email: string }> {
  const existing = await db
    .selectFrom("User")
    .select(["id", "email"])
    .where("email", "=", values.email)
    .executeTakeFirst();
  if (existing) return existing;
  const id = randomUUID();
  await db.insertInto("User").values({ id, ...values }).execute();
  return { id, email: values.email };
}

async function getOrCreateSubject(
  db: Kysely<DatabaseSchema>,
  values: {
    name: string;
    code: string;
    sessionPrice: number;
    color: string;
    defaultTeacherRate: number;
  },
): Promise<{ id: string; code: string }> {
  const existing = await db
    .selectFrom("Subject")
    .select(["id", "code"])
    .where("name", "=", values.name)
    .executeTakeFirst();
  if (existing) return { id: existing.id, code: existing.code ?? values.code };
  const id = randomUUID();
  await db.insertInto("Subject").values({ id, ...values }).execute();
  return { id, code: values.code };
}

async function getOrCreateClassroom(
  db: Kysely<DatabaseSchema>,
  values: { name: string; capacity: number },
): Promise<{ id: string }> {
  const existing = await db
    .selectFrom("Classroom")
    .select(["id"])
    .where("name", "=", values.name)
    .executeTakeFirst();
  if (existing) return existing;
  const id = randomUUID();
  await db.insertInto("Classroom").values({ id, ...values }).execute();
  return { id };
}

async function getOrCreateTeacher(
  db: Kysely<DatabaseSchema>,
  values: { firstName: string; lastName: string; sessionRate: number },
): Promise<{ id: string }> {
  const existing = await db
    .selectFrom("Teacher")
    .select(["id"])
    .where("firstName", "=", values.firstName)
    .where("lastName", "=", values.lastName)
    .executeTakeFirst();
  if (existing) return existing;
  const id = randomUUID();
  await db.insertInto("Teacher").values({ id, ...values }).execute();
  return { id };
}

async function getOrCreateStudent(
  db: Kysely<DatabaseSchema>,
  values: { code: string; firstName: string; lastName: string },
): Promise<{ id: string }> {
  const existing = await db
    .selectFrom("Student")
    .select(["id"])
    .where("code", "=", values.code)
    .executeTakeFirst();
  if (existing) return existing;
  const id = randomUUID();
  await db.insertInto("Student").values({ id, ...values }).execute();
  return { id };
}

async function main(): Promise<void> {
  const sqlite = new BetterSqlite3(DB_PATH);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");
  const db = new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({ database: sqlite }),
  });

  try {
    const passwordHash = await bcrypt.hash("password", 10);

    const director = await getOrCreateUser(db, {
      email: "director@example.com",
      name: "Directeur Dev",
      passwordHash,
      role: "DIRECTOR",
    });
    const staff = await getOrCreateUser(db, {
      email: "staff@example.com",
      name: "Staff Dev",
      passwordHash,
      role: "STAFF",
    });

    const subjectSeeds = [
      { name: "Mathématiques", code: "MATH", sessionPrice: 50000, color: "#0ea5e9" },
      { name: "Physique", code: "PHYS", sessionPrice: 50000, color: "#8b5cf6" },
      { name: "Anglais", code: "ENG", sessionPrice: 40000, color: "#10b981" },
      { name: "Français", code: "FR", sessionPrice: 40000, color: "#f59e0b" },
    ];
    const subjects = [];
    for (const s of subjectSeeds) {
      subjects.push(
        await getOrCreateSubject(db, {
          ...s,
          defaultTeacherRate: Math.floor(s.sessionPrice * 0.4),
        }),
      );
    }

    const classroomSeeds = [
      { name: "Salle 1", capacity: 20 },
      { name: "Salle 2", capacity: 15 },
      { name: "Salle 3", capacity: 25 },
    ];
    const classrooms = [];
    for (const c of classroomSeeds) classrooms.push(await getOrCreateClassroom(db, c));

    const teacherSeeds = [
      { firstName: "Amine", lastName: "Benali", sessionRate: 20000 },
      { firstName: "Sara", lastName: "Khaled", sessionRate: 22000 },
    ];
    const teachers = [];
    for (const t of teacherSeeds) teachers.push(await getOrCreateTeacher(db, t));

    const studentSeeds = [
      { code: "S001", firstName: "Yacine", lastName: "Mansouri" },
      { code: "S002", firstName: "Leïla", lastName: "Cherif" },
      { code: "S003", firstName: "Omar", lastName: "Hamdi" },
    ];
    for (const s of studentSeeds) await getOrCreateStudent(db, s);

    const mathId = subjects.find((s) => s.code === "MATH")!.id;
    const physId = subjects.find((s) => s.code === "PHYS")!.id;
    const room1 = classrooms[0].id;
    const room2 = classrooms[1].id;
    const t1 = teachers[0].id;
    const t2 = teachers[1].id;

    const slotSeeds = [
      {
        dayOfWeek: 1,
        startMinute: 18 * 60,
        endMinute: 19 * 60 + 30,
        subjectId: mathId,
        teacherId: t1,
        classroomId: room1,
      },
      {
        dayOfWeek: 3,
        startMinute: 18 * 60,
        endMinute: 19 * 60 + 30,
        subjectId: physId,
        teacherId: t2,
        classroomId: room2,
      },
    ];
    for (const slot of slotSeeds) {
      const existing = await db
        .selectFrom("TimetableSlot")
        .select(["id"])
        .where("dayOfWeek", "=", slot.dayOfWeek)
        .where("startMinute", "=", slot.startMinute)
        .where("subjectId", "=", slot.subjectId)
        .where("teacherId", "=", slot.teacherId)
        .where("classroomId", "=", slot.classroomId)
        .executeTakeFirst();
      if (!existing) {
        await db
          .insertInto("TimetableSlot")
          .values({ id: randomUUID(), ...slot })
          .execute();
      }
    }

    console.log(
      `Seeded: director=${director.email}, staff=${staff.email}, subjects=${subjects.length}, classrooms=${classrooms.length}, teachers=${teachers.length}, students=${studentSeeds.length}`,
    );
  } finally {
    await db.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
