"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import type { PublicUser } from "@/lib/models/user";
import { getInitials } from "@/lib/utils/expert-approval-ui";

type UserMenuProps = {
  profile: PublicUser;
  pendingMaterials: number;
};

const ROLE_LABELS = {
  admin: "מנהל/ת מערכת",
  expert: "מומחה/ית",
  user: "מטפל/ת",
} as const;

/** Avatar button that opens the personal menu: profile, review queues, admin, logout. */
export function UserMenu({ profile, pendingMaterials }: UserMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const role = profile.role ?? "user";
  const name = profile.full_name || "המשתמש שלי";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  const items = [
    { href: "/profile", icon: "person", label: "הפרופיל שלי", show: true },
    {
      href: "/expert/referrals",
      icon: "how_to_reg",
      label: "אישורי הרשמה",
      show: role === "expert",
    },
    {
      href: "/expert/materials",
      icon: "fact_check",
      label: "אישור חומרים",
      count: pendingMaterials,
      show: role === "expert" || role === "admin",
    },
    { href: "/admin", icon: "admin_panel_settings", label: "ניהול", show: role === "admin" },
  ].filter((item) => item.show);

  return (
    <div className="user-menu" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className="user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="avatar avatar-sm" aria-hidden="true">
          {getInitials(name)}
        </span>
        <span className="user-menu-name">{name.split(" ")[0]}</span>
        {pendingMaterials > 0 && (role === "expert" || role === "admin") && (
          <span className="user-menu-dot" aria-label={`${pendingMaterials} חומרים ממתינים`} />
        )}
        <MaterialIcon name="expand_more" />
      </button>

      {open && (
        <div id="user-menu-panel" className="user-menu-panel" role="menu">
          <div className="user-menu-header">
            <span className="avatar" aria-hidden="true">
              {getInitials(name)}
            </span>
            <span>
              <strong>{name}</strong>
              <small>{ROLE_LABELS[role]}</small>
            </span>
          </div>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className="user-menu-item"
              data-active={pathname.startsWith(item.href)}
            >
              <MaterialIcon name={item.icon} />
              <span>{item.label}</span>
              {item.count ? <span className="count">{item.count}</span> : null}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            className="user-menu-item user-menu-logout"
            onClick={() => void handleLogout()}
          >
            <MaterialIcon name="logout" />
            <span>התנתקות</span>
          </button>
        </div>
      )}
    </div>
  );
}
