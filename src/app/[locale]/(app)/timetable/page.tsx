import { getTranslations } from "next-intl/server";
import { Plus, Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { formatHHMM, DAY_KEYS } from "@/lib/time";
import { PrintButton } from "./print-button";

export default async function TimetablePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "timetable" });
  const tDays = await getTranslations({ locale, namespace: "timetable.days" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const slots = await db
    .selectFrom("TimetableSlot")
    .innerJoin("Subject", "Subject.id", "TimetableSlot.subjectId")
    .innerJoin("Teacher", "Teacher.id", "TimetableSlot.teacherId")
    .innerJoin("Classroom", "Classroom.id", "TimetableSlot.classroomId")
    .select([
      "TimetableSlot.id",
      "TimetableSlot.dayOfWeek",
      "TimetableSlot.startMinute",
      "TimetableSlot.endMinute",
      "TimetableSlot.label",
      "Subject.name as subjectName",
      "Subject.color as subjectColor",
      "Teacher.firstName as teacherFirstName",
      "Teacher.lastName as teacherLastName",
      "Classroom.name as classroomName",
    ])
    .where("TimetableSlot.active", "=", 1)
    .orderBy("TimetableSlot.dayOfWeek", "asc")
    .orderBy("TimetableSlot.startMinute", "asc")
    .execute();

  // Group by day
  const byDay = new Map<number, typeof slots>();
  for (let i = 0; i < 7; i++) byDay.set(i, []);
  for (const s of slots) byDay.get(s.dayOfWeek)!.push(s);

  // Phase 1: day-column list layout. Readable, printable, no grid math yet.
  // A pixel-perfect grid ships in Phase 2 alongside attendance.
  const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun for typical work-week display

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("weeklyGrid")}
        actions={
          <>
            <Link
              href="/timetable/new"
              className={buttonVariants({ size: "sm" })}
            >
              <Plus className="h-4 w-4" />
              {t("new")}
            </Link>
            <PrintButton label={tCommon("print")} />
          </>
        }
      />

      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tCommon("empty")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dayOrder.map((d) => {
            const daySlots = byDay.get(d)!;
            return (
              <section
                key={d}
                className="rounded-md border border-border bg-card"
              >
                <header className="border-b border-border px-4 py-2 text-sm font-semibold">
                  {tDays(DAY_KEYS[d])}
                </header>
                {daySlots.length === 0 ? (
                  <div className="px-4 py-6 text-xs text-muted-foreground">
                    {tCommon("empty")}
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {daySlots.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-start justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 text-sm">
                            <span
                              aria-hidden
                              className="inline-block h-2.5 w-2.5 rounded-sm"
                              style={{
                                backgroundColor: s.subjectColor ?? "#94a3b8",
                              }}
                            />
                            <span className="font-medium">{s.subjectName}</span>
                            {s.label ? (
                              <span className="text-xs text-muted-foreground">
                                · {s.label}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatHHMM(s.startMinute)} – {formatHHMM(s.endMinute)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {s.teacherFirstName} {s.teacherLastName} ·{" "}
                            {s.classroomName}
                          </div>
                        </div>
                        <Link
                          href={`/timetable/${s.id}/edit`}
                          className="no-print text-xs text-primary underline-offset-4 hover:underline"
                          aria-label={tCommon("edit")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
