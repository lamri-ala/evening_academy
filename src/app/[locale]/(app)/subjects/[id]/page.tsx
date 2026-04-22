import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Pencil } from "lucide-react";
import { db, toBool } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency } from "@/lib/money";
import { DeleteSubjectButton } from "./delete-button";

export default async function SubjectProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "subjects" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const subject = await db
    .selectFrom("Subject")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!subject) notFound();

  const moneyLocale = locale === "ar" ? "ar-DZ" : "fr-DZ";
  const rows: Array<[string, React.ReactNode]> = [
    [t("name"), subject.name],
    [t("code"), subject.code ?? "—"],
    [t("sessionPrice"), formatCurrency(subject.sessionPrice, moneyLocale)],
    [
      t("defaultTeacherRate"),
      subject.defaultTeacherRate != null
        ? formatCurrency(subject.defaultTeacherRate, moneyLocale)
        : "—",
    ],
    [
      t("color"),
      <span
        key="color"
        className="inline-flex items-center gap-2 text-sm"
      >
        <span
          aria-hidden
          className="inline-block h-4 w-4 rounded border border-border"
          style={{ backgroundColor: subject.color ?? "#94a3b8" }}
        />
        {subject.color ?? "—"}
      </span>,
    ],
    [tCommon("active"), toBool(subject.active) ? tCommon("yes") : tCommon("no")],
  ];

  return (
    <>
      <PageHeader
        title={subject.name}
        actions={
          <>
            <Link
              href={`/subjects/${id}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil className="h-4 w-4" />
              {tCommon("edit")}
            </Link>
            <DeleteSubjectButton
              id={id}
              labels={{
                delete: tCommon("delete"),
                confirm: tCommon("confirmDelete"),
              }}
            />
          </>
        }
      />

      <Card>
        <CardContent className="grid gap-3 p-6 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              <span className="text-sm">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
