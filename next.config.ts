import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Native modules and bcrypt must stay as CJS externals on the server.
  serverExternalPackages: ["better-sqlite3", "bcryptjs"],
  // Typed routes interact poorly with next-intl's `Link` href-object form.
  // Re-enable in a later phase once we standardise on a single navigation helper.
  typedRoutes: false,
};

export default withNextIntl(nextConfig);
