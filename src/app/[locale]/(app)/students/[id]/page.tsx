import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency } from "@/lib/money";
import { DeleteStudentButton } from "./delete-button";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "students" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) notFound();

  const rows: Array<[string, React.ReactNode]> = [
    [t("code"), student.code],
    [t("firstName"), student.firstName],
    [t("lastName"), student.lastName],
    [t("phone"), student.phone ?? "—"],
    [t("guardianName"), student.guardianName ?? "—"],
    [t("guardianPhone"), student.guardianPhone ?? "—"],
    [t("notes"), student.notes ?? "—"],
    [t("balance"), formatCurrency(student.cachedBalance, locale === "ar" ? "ar-DZ" : "fr-DZ")],
    [tCommon("active"), student.active ? tCommon("yes") : tCommon("no")],
  ];

  return (
    <>
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        description={t("profile")}
        actions={
          <>
            <Link
              href={`/students/${id}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil className="h-4 w-4" />
              {tCommon("edit")}
            </Link>
            <DeleteStudentButton
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
