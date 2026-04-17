import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function ClassroomsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "classrooms" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const classrooms = await prisma.classroom.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <>
      <PageHeader
        title={t("title")}
        actions={
          <Link href="/classrooms/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="h-4 w-4" />
            {t("new")}
          </Link>
        }
      />

      {classrooms.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tCommon("empty")}</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t("name")}</TH>
              <TH>{t("capacity")}</TH>
              <TH>{tCommon("active")}</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {classrooms.map((c) => (
              <TR key={c.id}>
                <TD>{c.name}</TD>
                <TD>{c.capacity ?? "—"}</TD>
                <TD>{c.active ? tCommon("yes") : tCommon("no")}</TD>
                <TD>
                  <Link
                    href={`/classrooms/${c.id}/edit`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {tCommon("edit")}
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}
