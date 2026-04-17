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

type Classroom = {
  id?: string;
  name: string;
  capacity: number | null;
  notes: string | null;
  active: boolean;
};

export function ClassroomForm({
  action,
  initial,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: Classroom;
}) {
  const t = useTranslations("classrooms");
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
          <Label htmlFor="capacity">{t("capacity")}</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={0}
            defaultValue={initial?.capacity ?? ""}
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
        <Link href="/classrooms" className={buttonVariants({ variant: "outline" })}>
          {tCommon("cancel")}
        </Link>
      </div>
    </form>
  );
}
