"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-message";
import { formatMoneyMinor } from "@/lib/money";
import type { FormState } from "./actions";

const INITIAL: FormState = { error: null };

type Teacher = {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  sessionRate: number;
  active: boolean;
};

export function TeacherForm({
  action,
  initial,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: Teacher;
}) {
  const t = useTranslations("teachers");
  const tCommon = useTranslations("common");
  const tErr = useTranslations("errors");
  const [state, formAction, isPending] = useActionState(action, INITIAL);

  const errorMessage =
    state.error === "validation"
      ? tErr("required")
      : state.error
        ? tErr("generic")
        : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormError message={errorMessage} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">
            {t("firstName")} <span className="ms-1 text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            name="firstName"
            required
            defaultValue={initial?.firstName ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">
            {t("lastName")} <span className="ms-1 text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            name="lastName"
            required
            defaultValue={initial?.lastName ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input id="phone" name="phone" defaultValue={initial?.phone ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            dir="ltr"
            defaultValue={initial?.email ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sessionRate">{t("sessionRate")}</Label>
          <Input
            id="sessionRate"
            name="sessionRate"
            inputMode="decimal"
            defaultValue={
              initial ? formatMoneyMinor(initial.sessionRate) : "0.00"
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="active">{tCommon("active")}</Label>
          <div className="flex h-10 items-center">
            <input
              id="active"
              name="active"
              type="checkbox"
              defaultChecked={initial?.active ?? true}
              className="h-4 w-4 rounded border-border"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {tCommon("save")}
        </Button>
        <Link
          href={
            initial?.id
              ? `/teachers/${initial.id}`
              : "/teachers"
          }
          className={buttonVariants({ variant: "outline" })}
        >
          {tCommon("cancel")}
        </Link>
      </div>
    </form>
  );
}
