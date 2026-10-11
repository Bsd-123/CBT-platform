import Link from "next/link";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

export type TabNavItem = {
  href: string;
  label: string;
  icon?: string;
  active: boolean;
};

type TabNavProps = {
  items: TabNavItem[];
  ariaLabel: string;
};

/** Segmented link tabs, same look as the Materials Library tabs. */
export function TabNav({ items, ariaLabel }: TabNavProps) {
  return (
    <nav className="ui-tabs" aria-label={ariaLabel}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`ui-tab${item.active ? " is-active" : ""}`}
          aria-current={item.active ? "page" : undefined}
        >
          {item.icon && <MaterialIcon name={item.icon} />}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
