import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * Terms, privacy, accessibility and contact: readable without signing in (a visitor must be able
 * to read the terms before registering), so this group has its own light header instead of the
 * members' navigation.
 */
export default function InfoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <BrandLogo />
          <Link href="/" className="btn btn-secondary btn-sm">
            חזרה לאתר
          </Link>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <SiteFooter />
    </div>
  );
}
