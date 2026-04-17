// Dev seed: 1 director, 1 staff, a handful of subjects, classrooms, teachers,
// students, and a few timetable slots so Phase 1 pages aren't empty on first
// boot. Idempotent: uses upsert on email/code/name.
//
// Run with: npm run db:seed
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password", 10);

  const [director, staff] = await Promise.all([
    prisma.user.upsert({
      where: { email: "director@example.com" },
      update: {},
      create: {
        email: "director@example.com",
        name: "Directeur Dev",
        passwordHash: password,
        role: UserRole.DIRECTOR,
      },
    }),
    prisma.user.upsert({
      where: { email: "staff@example.com" },
      update: {},
      create: {
        email: "staff@example.com",
        name: "Staff Dev",
        passwordHash: password,
        role: UserRole.STAFF,
      },
    }),
  ]);

  const subjects = await Promise.all(
    [
      { name: "Mathématiques", code: "MATH", sessionPrice: 50000, color: "#0ea5e9" },
      { name: "Physique", code: "PHYS", sessionPrice: 50000, color: "#8b5cf6" },
      { name: "Anglais", code: "ENG", sessionPrice: 40000, color: "#10b981" },
      { name: "Français", code: "FR", sessionPrice: 40000, color: "#f59e0b" },
    ].map((s) =>
      prisma.subject.upsert({
        where: { name: s.name },
        update: {},
        create: { ...s, defaultTeacherRate: Math.floor(s.sessionPrice * 0.4) },
      }),
    ),
  );

  const classrooms = await Promise.all(
    [
      { name: "Salle 1", capacity: 20 },
      { name: "Salle 2", capacity: 15 },
      { name: "Salle 3", capacity: 25 },
    ].map((c) =>
      prisma.classroom.upsert({
        where: { name: c.name },
        update: {},
        create: c,
      }),
    ),
  );

  const teachers = [
    { firstName: "Amine", lastName: "Benali", sessionRate: 20000 },
    { firstName: "Sara", lastName: "Khaled", sessionRate: 22000 },
  ];
  const teacherRecords = await Promise.all(
    teachers.map((t) =>
      prisma.teacher.findFirst({
        where: { firstName: t.firstName, lastName: t.lastName },
      }).then(async (existing) => {
        if (existing) return existing;
        return prisma.teacher.create({ data: t });
      }),
    ),
  );

  const students = [
    { code: "S001", firstName: "Yacine", lastName: "Mansouri" },
    { code: "S002", firstName: "Leïla", lastName: "Cherif" },
    { code: "S003", firstName: "Omar", lastName: "Hamdi" },
  ];
  await Promise.all(
    students.map((s) =>
      prisma.student.upsert({
        where: { code: s.code },
        update: {},
        create: s,
      }),
    ),
  );

  const mathId = subjects.find((s) => s.code === "MATH")!.id;
  const physId = subjects.find((s) => s.code === "PHYS")!.id;
  const room1 = classrooms[0].id;
  const room2 = classrooms[1].id;
  const t1 = teacherRecords[0].id;
  const t2 = teacherRecords[1].id;

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
    const existing = await prisma.timetableSlot.findFirst({
      where: {
        dayOfWeek: slot.dayOfWeek,
        startMinute: slot.startMinute,
        subjectId: slot.subjectId,
        teacherId: slot.teacherId,
        classroomId: slot.classroomId,
      },
    });
    if (!existing) await prisma.timetableSlot.create({ data: slot });
  }

  console.log(
    `Seeded: director=${director.email}, staff=${staff.email}, subjects=${subjects.length}, classrooms=${classrooms.length}, teachers=${teacherRecords.length}, students=${students.length}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
