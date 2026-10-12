"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { PublicUser } from "@/lib/models/user";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { UserMenu } from "@/components/layout/UserMenu";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

const SPACE_LINKS = [
  { href: "/materials", icon: "library_books", label: "ספריית חומרים" },
  { href: "/forum", icon: "forum", label: "פורום" },
  { href: "/recommendations", icon: "recommend", label: "המלצות" },
  { href: "/events", icon: "event", label: "אירועים" },
  { href: "/professional-requests", icon: "contact_support", label: "פניות מקצועיות" },
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
        <BrandLogo />

        <nav
          id="main-nav"
          className="nav-links"
          data-open={open}
          aria-label="ניווט ראשי"
        >
          {SPACE_LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                data-active={active}
                aria-current={active ? "page" : undefined}
              >
                <MaterialIcon name={link.icon} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="nav-actions">
          <NotificationsBell userId={profile.id} />
          <UserMenu profile={profile} pendingMaterials={pendingMaterials} />
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="main-nav"
            aria-label={open ? "סגירת התפריט" : "פתיחת התפריט"}
            onClick={() => setOpen((value) => !value)}
          >
            <MaterialIcon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>
    </header>
  );
}
