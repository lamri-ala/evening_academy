import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function StudentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "students" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const students = await prisma.student.findMany({
    orderBy: [{ active: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <>
      <PageHeader
        title={t("title")}
        actions={
          <Link href="/students/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="h-4 w-4" />
            {t("new")}
          </Link>
        }
      />

      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tCommon("empty")}</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t("code")}</TH>
              <TH>{t("lastName")}</TH>
              <TH>{t("firstName")}</TH>
              <TH>{t("phone")}</TH>
              <TH>{tCommon("active")}</TH>
            </TR>
          </THead>
          <TBody>
            {students.map((s) => (
              <TR key={s.id}>
                <TD>
                  <Link
                    href={`/students/${s.id}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {s.code}
                  </Link>
                </TD>
                <TD>{s.lastName}</TD>
                <TD>{s.firstName}</TD>
                <TD>{s.phone ?? "—"}</TD>
                <TD>{s.active ? tCommon("yes") : tCommon("no")}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
