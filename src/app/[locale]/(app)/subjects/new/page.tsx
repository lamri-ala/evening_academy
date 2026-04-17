import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { SubjectForm } from "../subject-form";
import { createSubject } from "../actions";

export default async function NewSubjectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "subjects" });
  return (
    <>
      <PageHeader title={t("new")} />
      <SubjectForm action={createSubject} />
    </>
  );
}
