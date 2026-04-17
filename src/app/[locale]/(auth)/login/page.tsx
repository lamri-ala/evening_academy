import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (session?.user) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations({ locale, namespace: "auth" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {tCommon("appName")}
          </p>
          <h1 className="text-2xl font-semibold">{t("welcomeTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("welcomeSubtitle")}</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
