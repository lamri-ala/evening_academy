"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-message";
import { formatMoneyMinor } from "@/lib/money";
import type { FormState } from "./actions";

const INITIAL: FormState = { error: null };

type Subject = {
  id?: string;
  name: string;
  code: string | null;
  sessionPrice: number;
  defaultTeacherRate: number | null;
  color: string | null;
  active: boolean;
};

export function SubjectForm({
  action,
  initial,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: Subject;
}) {
  const t = useTranslations("subjects");
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
        <div className="space-y-1.5">
          <Label htmlFor="name">
            {t("name")} <span className="ms-1 text-destructive">*</span>
          </Label>
          <Input id="name" name="name" required defaultValue={initial?.name ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="code">{t("code")}</Label>
          <Input id="code" name="code" defaultValue={initial?.code ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sessionPrice">
            {t("sessionPrice")} <span className="ms-1 text-destructive">*</span>
          </Label>
          <Input
            id="sessionPrice"
            name="sessionPrice"
            inputMode="decimal"
            required
            defaultValue={
              initial ? formatMoneyMinor(initial.sessionPrice) : "0.00"
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="defaultTeacherRate">{t("defaultTeacherRate")}</Label>
          <Input
            id="defaultTeacherRate"
            name="defaultTeacherRate"
            inputMode="decimal"
            defaultValue={
              initial?.defaultTeacherRate != null
                ? formatMoneyMinor(initial.defaultTeacherRate)
                : ""
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="color">{t("color")}</Label>
          <Input
            id="color"
            name="color"
            type="color"
            defaultValue={initial?.color ?? "#0ea5e9"}
            className="h-10 w-20 cursor-pointer p-1"
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

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {tCommon("save")}
        </Button>
        <Link
          href={
            initial?.id
              ? `/subjects/${initial.id}`
              : "/subjects"
          }
          className={buttonVariants({ variant: "outline" })}
        >
          {tCommon("cancel")}
        </Link>
      </div>
    </form>
  );
}
