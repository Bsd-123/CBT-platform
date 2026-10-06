"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_LINKS = [
  { href: "/admin", label: "סקירה", exact: true },
  { href: "/admin/reports", label: "דיווחים" },
  { href: "/admin/materials", label: "חומרים" },
  { href: "/admin/users", label: "משתמשים" },
  { href: "/admin/experts", label: "מומחים" },
  { href: "/admin/tags", label: "תגיות" },
  { href: "/admin/categories", label: "קטגוריות" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="ui-tabs ui-tabs-scroll" aria-label="ניהול מערכת">
      {ADMIN_LINKS.map((link) => {
        const active =
          "exact" in link ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`ui-tab${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
