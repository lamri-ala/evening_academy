import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Kysely } from "kysely";
import type { Database as DatabaseSchema } from "../../../../../db/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations({ locale, namespace: "dashboard" });

  const countActive = async (
    table: "Student" | "Teacher" | "Subject" | "Classroom" | "TimetableSlot",
  ): Promise<number> => {
    const row = await (db as Kysely<DatabaseSchema>)
      .selectFrom(table)
      .select((eb) => eb.fn.countAll<number>().as("n"))
      .where("active", "=", 1)
      .executeTakeFirstOrThrow();
    return Number(row.n);
  };

  const [students, teachers, subjects, classrooms, slots] = await Promise.all([
    countActive("Student"),
    countActive("Teacher"),
    countActive("Subject"),
    countActive("Classroom"),
    countActive("TimetableSlot"),
  ]);

  const cards: Array<{ key: "students" | "teachers" | "subjects" | "classrooms" | "timetableSlots"; value: number }> = [
    { key: "students", value: students },
    { key: "teachers", value: teachers },
    { key: "subjects", value: subjects },
    { key: "classrooms", value: classrooms },
    { key: "timetableSlots", value: slots },
  ];

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("welcome", { name: session?.user?.name ?? "" })}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.key}>
            <CardContent className="flex flex-col gap-1 p-6">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {t(c.key)}
              </span>
              <span className="text-3xl font-semibold">{c.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          {t("phase1Note")}
        </CardContent>
      </Card>
    </>
  );
}
