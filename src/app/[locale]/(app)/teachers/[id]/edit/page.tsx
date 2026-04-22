import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db, toBool } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { TeacherForm } from "../../teacher-form";
import { updateTeacher } from "../../actions";

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const teacher = await db
    .selectFrom("Teacher")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!teacher) notFound();

  const action = updateTeacher.bind(null, id);

  return (
    <>
      <PageHeader title={`${tCommon("edit")} — ${teacher.firstName} ${teacher.lastName}`} />
      <TeacherForm
        action={action}
        initial={{
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          phone: teacher.phone,
          email: teacher.email,
          notes: teacher.notes,
          sessionRate: teacher.sessionRate,
          active: toBool(teacher.active),
        }}
      />
    </>
  );
}
