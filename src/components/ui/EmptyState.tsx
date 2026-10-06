import type { ReactNode } from "react";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon = "inbox", title, description, action }: EmptyStateProps) {
  return (
    <div className="ui-empty">
      <MaterialIcon name={icon} />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
