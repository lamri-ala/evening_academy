import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

// Hitting the root redirects to the default-locale dashboard. Middleware
// will subsequently bounce unauthenticated users to /login.
export default function RootPage() {
  redirect(`/${routing.defaultLocale}/dashboard`);
}
