import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { TeacherForm } from "../teacher-form";
import { createTeacher } from "../actions";

export default async function NewTeacherPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "teachers" });
  return (
    <>
      <PageHeader title={t("new")} />
      <TeacherForm action={createTeacher} />
    </>
  );
}
