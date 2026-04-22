import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db, toBool } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { SubjectForm } from "../../subject-form";
import { updateSubject } from "../../actions";

export default async function EditSubjectPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const subject = await db
    .selectFrom("Subject")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!subject) notFound();

  const action = updateSubject.bind(null, id);

  return (
    <>
      <PageHeader title={`${tCommon("edit")} — ${subject.name}`} />
      <SubjectForm
        action={action}
        initial={{
          id: subject.id,
          name: subject.name,
          code: subject.code,
          sessionPrice: subject.sessionPrice,
          defaultTeacherRate: subject.defaultTeacherRate,
          color: subject.color,
          active: toBool(subject.active),
        }}
      />
    </>
  );
}
