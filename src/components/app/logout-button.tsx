"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "./logout-action";

export function LogoutButton() {
  const t = useTranslations("nav");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        startTransition(async () => {
          await signOutAction();
        });
      }}
    >
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        <LogOut className="h-4 w-4" />
        {t("logout")}
      </Button>
    </form>
  );
}
