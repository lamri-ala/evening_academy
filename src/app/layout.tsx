// Root layout — required by Next.js but delegates <html>/<body> to the
// locale-aware layout under src/app/[locale]/layout.tsx so we can set
// `lang` and `dir` correctly for French / Arabic.

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
