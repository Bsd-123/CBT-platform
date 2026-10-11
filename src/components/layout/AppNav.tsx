"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { PublicUser } from "@/lib/models/user";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { LogoutButton } from "@/components/auth/LogoutButton";

const SPACE_LINKS = [
  { href: "/materials", label: "ספריית חומרים" },
  { href: "/forum", label: "פורום שאלות ותשובות" },
  { href: "/recommendations", label: "המלצות" },
  { href: "/events", label: "אירועים וסדנאות" },
  { href: "/professional-requests", label: "פניות מקצועיות" },
] as const;

type AppNavProps = {
  profile: PublicUser;
  /** Materials waiting for review; shown to experts and admins. */
  pendingMaterials?: number;
};

export function AppNav({ profile, pendingMaterials = 0 }: AppNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu after navigating.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          קהילת מטפלי CBT
        </Link>

        <div className="nav-actions-mobile">
          <NotificationsBell userId={profile.id} />
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="main-nav"
            aria-label={open ? "סגירת התפריט" : "פתיחת התפריט"}
            onClick={() => setOpen((value) => !value)}
          >
            <span aria-hidden="true">{open ? "✕" : "☰"}</span>
          </button>
        </div>

        <nav
          id="main-nav"
          className="nav-links"
          data-open={open}
          aria-label="ניווט ראשי"
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
          {(profile.role === "expert" || profile.role === "admin") && (
            <Link
              href="/expert/materials"
              data-active={pathname.startsWith("/expert/materials")}
            >
              אישור חומרים{pendingMaterials > 0 ? ` (${pendingMaterials})` : ""}
            </Link>
          )}
          {profile.role === "admin" && (
            <Link href="/admin/reports" data-active={pathname.startsWith("/admin")}>
              ניהול
            </Link>
          )}
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
