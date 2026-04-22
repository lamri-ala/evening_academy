import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { SlotForm } from "../../slot-form";
import { updateTimetableSlot } from "../../actions";
import { DeleteSlotButton } from "./delete-button";

export default async function EditSlotPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const t = await getTranslations({ locale, namespace: "timetable" });

  const [slot, subjects, teachers, classrooms] = await Promise.all([
    db
      .selectFrom("TimetableSlot")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst(),
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

  if (!slot) notFound();
  const action = updateTimetableSlot.bind(null, id);

  return (
    <>
      <PageHeader
        title={t("edit")}
        actions={
          <DeleteSlotButton
            id={id}
            labels={{
              delete: tCommon("delete"),
              confirm: tCommon("confirmDelete"),
            }}
          />
        }
      />
      <SlotForm
        action={action}
        initial={{
          id: slot.id,
          dayOfWeek: slot.dayOfWeek,
          startMinute: slot.startMinute,
          endMinute: slot.endMinute,
          subjectId: slot.subjectId,
          teacherId: slot.teacherId,
          classroomId: slot.classroomId,
          label: slot.label,
        }}
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
