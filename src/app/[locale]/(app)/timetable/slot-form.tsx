"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-message";
import { formatHHMM, DAY_KEYS } from "@/lib/time";
import type { FormState } from "./actions";

const INITIAL: FormState = { error: null };

type SlotInitial = {
  id?: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  subjectId: string;
  teacherId: string;
  classroomId: string;
  label: string | null;
};

type Option = { id: string; label: string };

export function SlotForm({
  action,
  initial,
  subjects,
  teachers,
  classrooms,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: SlotInitial;
  subjects: Option[];
  teachers: Option[];
  classrooms: Option[];
}) {
  const t = useTranslations("timetable");
  const tDays = useTranslations("timetable.days");
  const tCommon = useTranslations("common");
  const tErr = useTranslations("errors");
  const [state, formAction, isPending] = useActionState(action, INITIAL);

  const errorMessage = state.error?.startsWith("conflict:")
    ? state.error === "conflict:teacher"
      ? t("conflictTeacher")
      : t("conflictClassroom")
    : state.error === "validation"
      ? tErr("required")
      : state.error
        ? tErr("generic")
        : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormError message={errorMessage} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="dayOfWeek">{t("day")}</Label>
          <Select
            id="dayOfWeek"
            name="dayOfWeek"
            defaultValue={String(initial?.dayOfWeek ?? 1)}
            required
          >
            {DAY_KEYS.map((k, idx) => (
              <option key={k} value={idx}>
                {tDays(k)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="label">{t("label")}</Label>
          <Input id="label" name="label" defaultValue={initial?.label ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="start">
            {t("start")} <span className="ms-1 text-destructive">*</span>
          </Label>
          <Input
            id="start"
            name="start"
            type="time"
            required
            defaultValue={initial ? formatHHMM(initial.startMinute) : "18:00"}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end">
            {t("end")} <span className="ms-1 text-destructive">*</span>
          </Label>
          <Input
            id="end"
            name="end"
            type="time"
            required
            defaultValue={initial ? formatHHMM(initial.endMinute) : "19:30"}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subjectId">
            {t("subject")} <span className="ms-1 text-destructive">*</span>
          </Label>
          <Select
            id="subjectId"
            name="subjectId"
            defaultValue={initial?.subjectId ?? ""}
            required
          >
            <option value="" disabled>
              —
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="teacherId">
            {t("teacher")} <span className="ms-1 text-destructive">*</span>
          </Label>
          <Select
            id="teacherId"
            name="teacherId"
            defaultValue={initial?.teacherId ?? ""}
            required
          >
            <option value="" disabled>
              —
            </option>
            {teachers.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="classroomId">
            {t("classroom")} <span className="ms-1 text-destructive">*</span>
          </Label>
          <Select
            id="classroomId"
            name="classroomId"
            defaultValue={initial?.classroomId ?? ""}
            required
          >
            <option value="" disabled>
              —
            </option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {tCommon("save")}
        </Button>
        <Link href="/timetable" className={buttonVariants({ variant: "outline" })}>
          {tCommon("cancel")}
        </Link>
      </div>
    </form>
  );
}
