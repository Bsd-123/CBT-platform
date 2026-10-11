import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { getTagBadgeStyle } from "@/lib/utils/tag-colors";

type DomainBadgeProps = {
  domain: { name: string; color?: string | null } | null | undefined;
};

/** The question's domain, coloured like its tag. Renders nothing for questions without one. */
export function DomainBadge({ domain }: DomainBadgeProps) {
  if (!domain) return null;

  return (
    <span className="badge tag-badge domain-badge" style={getTagBadgeStyle(domain.color)} title="תחום">
      <MaterialIcon name="category" />
      {domain.name}
    </span>
  );
}
