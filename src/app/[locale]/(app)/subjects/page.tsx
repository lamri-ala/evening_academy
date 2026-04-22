import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { db, toBool } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatCurrency } from "@/lib/money";

export default async function SubjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "subjects" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const subjects = await db
    .selectFrom("Subject")
    .selectAll()
    .orderBy("active", "desc")
    .orderBy("name", "asc")
    .execute();

  const moneyLocale = locale === "ar" ? "ar-DZ" : "fr-DZ";

  return (
    <>
      <PageHeader
        title={t("title")}
        actions={
          <Link href="/subjects/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="h-4 w-4" />
            {t("new")}
          </Link>
        }
      />

      {subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tCommon("empty")}</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH></TH>
              <TH>{t("name")}</TH>
              <TH>{t("code")}</TH>
              <TH>{t("sessionPrice")}</TH>
              <TH>{tCommon("active")}</TH>
            </TR>
          </THead>
          <TBody>
            {subjects.map((s) => (
              <TR key={s.id}>
                <TD>
                  <span
                    aria-hidden
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: s.color ?? "#94a3b8" }}
                  />
                </TD>
                <TD>
                  <Link
                    href={`/subjects/${s.id}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {s.name}
                  </Link>
                </TD>
                <TD>{s.code ?? "—"}</TD>
                <TD>{formatCurrency(s.sessionPrice, moneyLocale)}</TD>
                <TD>{toBool(s.active) ? tCommon("yes") : tCommon("no")}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
