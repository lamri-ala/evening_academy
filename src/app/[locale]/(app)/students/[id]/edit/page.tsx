import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db, toBool } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { StudentForm } from "../../student-form";
import { updateStudent } from "../../actions";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const student = await db
    .selectFrom("Student")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!student) notFound();

  const action = updateStudent.bind(null, id);

  return (
    <>
      <PageHeader title={`${tCommon("edit")} — ${student.firstName} ${student.lastName}`} />
      <StudentForm
        action={action}
        initial={{
          id: student.id,
          code: student.code,
          firstName: student.firstName,
          lastName: student.lastName,
          phone: student.phone,
          guardianName: student.guardianName,
          guardianPhone: student.guardianPhone,
          notes: student.notes,
          active: toBool(student.active),
        }}
      />
    </>
  );
}
