"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-message";
import { loginAction, type LoginState } from "./actions";

const INITIAL: LoginState = { error: null };

export function LoginForm() {
  const t = useTranslations("auth");
  const tErr = useTranslations("errors");
  const [state, formAction, isPending] = useActionState(loginAction, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormError
        message={
          state.error === "invalid"
            ? t("invalidCredentials")
            : state.error
              ? tErr("generic")
              : null
        }
      />
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          dir="ltr"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {t("submit")}
      </Button>
    </form>
  );
}
