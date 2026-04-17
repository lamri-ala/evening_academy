import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { ClassroomForm } from "../classroom-form";
import { createClassroom } from "../actions";

export default async function NewClassroomPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "classrooms" });
  return (
    <>
      <PageHeader title={t("new")} />
      <ClassroomForm action={createClassroom} />
    </>
  );
}
