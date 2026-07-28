"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_LINKS = [
  { href: "/admin/reports", label: "דיווחים" },
  { href: "/admin/users", label: "משתמשים" },
  { href: "/admin/experts", label: "מומחים" },
  { href: "/admin/tags", label: "תגיות" },
  { href: "/admin/categories", label: "קטגוריות" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-links" aria-label="ניהול מערכת" style={{ marginBottom: "1rem" }}>
      {ADMIN_LINKS.map((link) => (
        <Link key={link.href} href={link.href} data-active={pathname.startsWith(link.href)}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
