"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Select } from "@/components/ui/select";

const LABELS: Record<string, string> = {
  fr: "Français",
  ar: "العربية",
  en: "English",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={locale}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as (typeof routing.locales)[number];
        startTransition(() => {
          router.replace(pathname, { locale: next });
        });
      }}
      aria-label="Language"
      className="h-9 w-auto min-w-36"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {LABELS[l] ?? l}
        </option>
      ))}
    </Select>
  );
}
