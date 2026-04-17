import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { StudentForm } from "../student-form";
import { createStudent } from "../actions";

export default async function NewStudentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "students" });
  return (
    <>
      <PageHeader title={t("new")} />
      <StudentForm action={createStudent} />
    </>
  );
}
