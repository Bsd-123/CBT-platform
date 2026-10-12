import type { Metadata } from "next";
import "./globals.css";

// Every page must render per request so Next.js can apply the CSP nonce from src/proxy.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "CBTeam · קהילת מטפלי CBT",
    template: "%s · CBTeam",
  },
  description: "פלטפורמת קהילה מקצועית למטפלי CBT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
