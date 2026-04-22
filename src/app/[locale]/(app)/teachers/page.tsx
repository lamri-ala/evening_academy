import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { db, toBool } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatCurrency } from "@/lib/money";

export default async function TeachersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "teachers" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const teachers = await db
    .selectFrom("Teacher")
    .selectAll()
    .orderBy("active", "desc")
    .orderBy("lastName", "asc")
    .orderBy("firstName", "asc")
    .execute();

  const moneyLocale = locale === "ar" ? "ar-DZ" : "fr-DZ";

  return (
    <>
      <PageHeader
        title={t("title")}
        actions={
          <Link href="/teachers/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="h-4 w-4" />
            {t("new")}
          </Link>
        }
      />

      {teachers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tCommon("empty")}</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t("lastName")}</TH>
              <TH>{t("firstName")}</TH>
              <TH>{t("phone")}</TH>
              <TH>{t("sessionRate")}</TH>
              <TH>{tCommon("active")}</TH>
            </TR>
          </THead>
          <TBody>
            {teachers.map((tr) => (
              <TR key={tr.id}>
                <TD>
                  <Link
                    href={`/teachers/${tr.id}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {tr.lastName}
                  </Link>
                </TD>
                <TD>{tr.firstName}</TD>
                <TD>{tr.phone ?? "—"}</TD>
                <TD>{formatCurrency(tr.sessionRate, moneyLocale)}</TD>
                <TD>{toBool(tr.active) ? tCommon("yes") : tCommon("no")}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
