"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

const ADMIN_LINKS = [
  { href: "/admin", icon: "dashboard", label: "לוח בקרה", exact: true },
  { href: "/admin/reports", icon: "flag", label: "דיווחים" },
  { href: "/admin/materials", icon: "library_books", label: "חומרים" },
  { href: "/admin/users", icon: "group", label: "משתמשים" },
  { href: "/admin/experts", icon: "workspace_premium", label: "מומחים" },
  { href: "/admin/tags", icon: "sell", label: "תגיות" },
  { href: "/admin/categories", icon: "category", label: "קטגוריות" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="tabs" aria-label="ניהול מערכת">
      {ADMIN_LINKS.map((link) => {
        const active =
          "exact" in link ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className="tab"
            aria-current={active ? "page" : undefined}
          >
            <MaterialIcon name={link.icon} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
