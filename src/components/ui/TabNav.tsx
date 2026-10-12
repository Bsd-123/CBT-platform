import Link from "next/link";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

export type TabNavItem = {
  href: string;
  label: string;
  icon?: string;
  active: boolean;
  /** Optional number shown in a pill next to the label. */
  count?: number;
};

type TabNavProps = {
  items: TabNavItem[];
  ariaLabel: string;
  /**
   * "segmented" switches between views of the same content (list / calendar);
   * "underline" moves between sections or statuses of a page.
   */
  variant?: "segmented" | "underline";
};

export function TabNav({ items, ariaLabel, variant = "segmented" }: TabNavProps) {
  const underline = variant === "underline";
  return (
    <nav className={underline ? "tabs" : "ui-tabs"} aria-label={ariaLabel}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={underline ? "tab" : `ui-tab${item.active ? " is-active" : ""}`}
          aria-current={item.active ? "page" : undefined}
        >
          {item.icon && <MaterialIcon name={item.icon} />}
          {item.label}
          {item.count !== undefined && <span className="count">{item.count}</span>}
        </Link>
      ))}
    </nav>
  );
}
