"use client";

import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  DoorOpen,
  CalendarDays,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Item = {
  href: "/dashboard" | "/students" | "/teachers" | "/subjects" | "/classrooms" | "/timetable";
  labelKey:
    | "dashboard"
    | "students"
    | "teachers"
    | "subjects"
    | "classrooms"
    | "timetable";
  // Require DIRECTOR? Phase 1 has no director-only pages; left for future.
  Icon: React.ComponentType<{ className?: string }>;
};

const ITEMS: Item[] = [
  { href: "/dashboard", labelKey: "dashboard", Icon: LayoutDashboard },
  { href: "/students", labelKey: "students", Icon: Users },
  { href: "/teachers", labelKey: "teachers", Icon: GraduationCap },
  { href: "/subjects", labelKey: "subjects", Icon: BookOpen },
  { href: "/classrooms", labelKey: "classrooms", Icon: DoorOpen },
  { href: "/timetable", labelKey: "timetable", Icon: CalendarDays },
];

export function Sidebar() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();

  return (
    <aside className="no-print flex h-screen w-64 flex-col border-e border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
          EA
        </div>
        <span className="text-sm font-semibold">{tCommon("appName")}</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {ITEMS.map(({ href, labelKey, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
