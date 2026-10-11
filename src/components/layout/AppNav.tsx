"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { PublicUser } from "@/lib/models/user";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

const SPACE_LINKS = [
  { href: "/materials", label: "ספריית חומרים" },
  { href: "/forum", label: "פורום שאלות ותשובות" },
  { href: "/recommendations", label: "המלצות" },
  { href: "/events", label: "אירועים וסדנאות" },
  { href: "/professional-requests", label: "פניות מקצועיות" },
] as const;

type AppNavProps = {
  profile: PublicUser;
};

export function AppNav({ profile }: AppNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          קהילת מטפלי CBT
        </Link>

        <nav
          id="main-nav"
          className="nav-links"
          aria-label="ניווט ראשי"
          data-open={menuOpen}
        >
          {SPACE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-active={pathname.startsWith(link.href)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/profile" data-active={pathname.startsWith("/profile")}>
            הפרופיל שלי
          </Link>
          {profile.role === "expert" && (
            <Link
              href="/expert/referrals"
              data-active={pathname.startsWith("/expert/referrals")}
            >
              אישורי הרשמה
            </Link>
          )}
          {profile.role === "admin" && (
            <Link href="/admin/reports" data-active={pathname.startsWith("/admin")}>
              ניהול
            </Link>
          )}
        </nav>

        <div className="nav-actions">
          <NotificationsBell userId={profile.id} />
          <LogoutButton />
          <button
            type="button"
            className="nav-icon-btn nav-menu-toggle"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            aria-label={menuOpen ? "סגירת תפריט" : "פתיחת תפריט"}
          >
            <MaterialIcon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
      </div>
    </header>
  );
}
