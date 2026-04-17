import { useTranslations } from "next-intl";
import { LogoutButton } from "./logout-button";
import { LocaleSwitcher } from "./locale-switcher";

export function AppHeader({
  userName,
  role,
}: {
  userName: string;
  role: string;
}) {
  return <HeaderClient userName={userName} role={role} />;
}

function HeaderClient({ userName, role }: { userName: string; role: string }) {
  return (
    <header className="no-print flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-3">
      <HeaderUser userName={userName} role={role} />
      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        <LogoutButton />
      </div>
    </header>
  );
}

function HeaderUser({ userName, role }: { userName: string; role: string }) {
  const t = useTranslations("auth");
  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium">{t("signedInAs", { name: userName })}</span>
      <span className="text-xs text-muted-foreground">{role}</span>
    </div>
  );
}
