import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

/**
 * Redirect to a path within the current locale. Wraps Next.js's redirect
 * so callers don't have to thread the locale through every server action.
 * Returns `never` — calling this terminates the action.
 */
export async function redirectLocalized(href: string): Promise<never> {
  const locale = await getLocale();
  const normalized = href.startsWith("/") ? href : `/${href}`;
  redirect(`/${locale}${normalized}`);
}
