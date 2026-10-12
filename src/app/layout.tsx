import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { ENABLE_SCRIPT_SRC } from "@/lib/site";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The proxy puts the per-request nonce in the request's CSP header; third-party scripts need it.
  const csp = (await headers()).get("content-security-policy") ?? "";
  const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];

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
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..24,400,0..1,0&display=block"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Script src={ENABLE_SCRIPT_SRC} nonce={nonce} strategy="afterInteractive" />
      </body>
    </html>
  );
}
