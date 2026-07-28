"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

export type MaterialsLibraryTab = "materials" | "requests";

type MaterialsLibraryTabsProps = {
  activeTab: MaterialsLibraryTab;
  materialsCount: number;
  requestsCount: number;
};

export function MaterialsLibraryTabs({
  activeTab,
  materialsCount,
  requestsCount,
}: MaterialsLibraryTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildTabHref(tab: MaterialsLibraryTab): string {
    const params = new URLSearchParams();

    if (tab === "requests") {
      params.set("tab", "requests");
      return `${pathname}?${params.toString()}`;
    }

    searchParams.forEach((value, key) => {
      if (key !== "tab") {
        params.set(key, value);
      }
    });

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <nav className="materials-library-tabs" aria-label="ספריית חומרים">
      <Link
        href={buildTabHref("materials")}
        className={`materials-library-tab${activeTab === "materials" ? " is-active" : ""}`}
        aria-current={activeTab === "materials" ? "page" : undefined}
      >
        <MaterialIcon name="folder" />
        חומרים ({materialsCount})
      </Link>
      <Link
        href={buildTabHref("requests")}
        className={`materials-library-tab${activeTab === "requests" ? " is-active" : ""}`}
        aria-current={activeTab === "requests" ? "page" : undefined}
      >
        <MaterialIcon name="help" />
        בקשות ({requestsCount})
      </Link>
    </nav>
  );
}
