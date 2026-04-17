import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { SlotForm } from "../slot-form";
import { createTimetableSlot } from "../actions";

export default async function NewSlotPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "timetable" });

  const [subjects, teachers, classrooms] = await Promise.all([
    prisma.subject.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.teacher.findMany({
      where: { active: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.classroom.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (subjects.length === 0 || teachers.length === 0 || classrooms.length === 0) {
    // Phase 1: we assume the director seeds these first. A friendlier
    // missing-prereqs screen ships in Phase 2.
    notFound();
  }

  return (
    <>
      <PageHeader title={t("new")} />
      <SlotForm
        action={createTimetableSlot}
        subjects={subjects.map((s) => ({ id: s.id, label: s.name }))}
        teachers={teachers.map((tr) => ({
          id: tr.id,
          label: `${tr.lastName} ${tr.firstName}`,
        }))}
        classrooms={classrooms.map((c) => ({ id: c.id, label: c.name }))}
      />
    </>
  );
}
