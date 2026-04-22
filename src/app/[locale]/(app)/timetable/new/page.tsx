import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
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
    db
      .selectFrom("Subject")
      .select(["id", "name"])
      .where("active", "=", 1)
      .orderBy("name", "asc")
      .execute(),
    db
      .selectFrom("Teacher")
      .select(["id", "firstName", "lastName"])
      .where("active", "=", 1)
      .orderBy("lastName", "asc")
      .orderBy("firstName", "asc")
      .execute(),
    db
      .selectFrom("Classroom")
      .select(["id", "name"])
      .where("active", "=", 1)
      .orderBy("name", "asc")
      .execute(),
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
