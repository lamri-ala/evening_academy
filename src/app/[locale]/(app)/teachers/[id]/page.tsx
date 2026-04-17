import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency } from "@/lib/money";
import { DeleteTeacherButton } from "./delete-button";

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "teachers" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) notFound();

  const moneyLocale = locale === "ar" ? "ar-DZ" : "fr-DZ";
  const rows: Array<[string, React.ReactNode]> = [
    [t("firstName"), teacher.firstName],
    [t("lastName"), teacher.lastName],
    [t("phone"), teacher.phone ?? "—"],
    [t("email"), teacher.email ?? "—"],
    [t("sessionRate"), formatCurrency(teacher.sessionRate, moneyLocale)],
    [t("notes"), teacher.notes ?? "—"],
    [tCommon("active"), teacher.active ? tCommon("yes") : tCommon("no")],
  ];

  return (
    <>
      <PageHeader
        title={`${teacher.firstName} ${teacher.lastName}`}
        description={t("profile")}
        actions={
          <>
            <Link
              href={`/teachers/${id}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil className="h-4 w-4" />
              {tCommon("edit")}
            </Link>
            <DeleteTeacherButton
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
