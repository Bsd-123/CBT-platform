"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      className="nav-icon-btn"
      onClick={() => void handleLogout()}
      aria-label="יציאה"
      data-tooltip="יציאה"
    >
      <MaterialIcon name="logout" />
    </button>
  );
}
