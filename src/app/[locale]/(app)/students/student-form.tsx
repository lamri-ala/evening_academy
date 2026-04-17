"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-message";
import type { FormState } from "./actions";

const INITIAL: FormState = { error: null };

type Student = {
  id?: string;
  code: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  notes: string | null;
  active: boolean;
};

export function StudentForm({
  action,
  initial,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: Student;
}) {
  const t = useTranslations("students");
  const tCommon = useTranslations("common");
  const tErr = useTranslations("errors");
  const [state, formAction, isPending] = useActionState(action, INITIAL);

  const errorMessage =
    state.error === "duplicate"
      ? tErr("duplicateCode")
      : state.error === "validation"
        ? tErr("required")
        : state.error
          ? tErr("generic")
          : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormError message={errorMessage} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="code" label={t("code")} required>
          <Input id="code" name="code" defaultValue={initial?.code ?? ""} required />
        </Field>
        <Field id="active" label={tCommon("active")}>
          <div className="flex h-10 items-center">
            <input
              id="active"
              name="active"
              type="checkbox"
              defaultChecked={initial?.active ?? true}
              className="h-4 w-4 rounded border-border"
            />
          </div>
        </Field>
        <Field id="firstName" label={t("firstName")} required>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={initial?.firstName ?? ""}
            required
          />
        </Field>
        <Field id="lastName" label={t("lastName")} required>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={initial?.lastName ?? ""}
            required
          />
        </Field>
        <Field id="phone" label={t("phone")}>
          <Input id="phone" name="phone" defaultValue={initial?.phone ?? ""} />
        </Field>
        <Field id="guardianName" label={t("guardianName")}>
          <Input
            id="guardianName"
            name="guardianName"
            defaultValue={initial?.guardianName ?? ""}
          />
        </Field>
        <Field id="guardianPhone" label={t("guardianPhone")}>
          <Input
            id="guardianPhone"
            name="guardianPhone"
            defaultValue={initial?.guardianPhone ?? ""}
          />
        </Field>
      </div>

      <Field id="notes" label={t("notes")}>
        <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} />
      </Field>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {tCommon("save")}
        </Button>
        <Link
          href={
            initial?.id
              ? `/students/${initial.id}`
              : "/students"
          }
          className={buttonVariants({ variant: "outline" })}
        >
          {tCommon("cancel")}
        </Link>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="ms-1 text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
