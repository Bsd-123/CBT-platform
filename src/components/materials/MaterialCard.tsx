import Link from "next/link";
import type { PublicMaterial } from "@/lib/models/material";
import type { PublicTag } from "@/lib/models/tag";
import { TagList } from "@/components/shared/TagList";
import { getMaterialTypeBadgeVariant } from "@/lib/utils/material-type-ui";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

type MaterialCardProps = {
  material: PublicMaterial;
  tags: PublicTag[];
  averageRating: number | null;
};

export function MaterialCard({ material, tags, averageRating }: MaterialCardProps) {
  const typeKey = material.material_type?.key;
  const badgeVariant = getMaterialTypeBadgeVariant(typeKey);
  const formattedDate = new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(material.created_at));

  return (
    <article className="material-card">
      <div className="material-card-accent" />
      <div className="material-card-body">
        <div className="material-card-header">
          <span className={`material-type-badge ${badgeVariant}`}>
            {material.material_type?.label ?? "חומר"}
          </span>
          <div className="material-card-rating">
            <MaterialIcon name="star" filled />
            <span>{averageRating ? averageRating.toFixed(1) : "—"}</span>
          </div>
        </div>

        <h3 className="material-card-title">
          <Link href={`/materials/${material.id}`}>{material.title}</Link>
        </h3>

        <p className="material-card-desc">{material.description}</p>

        {tags.length > 0 && (
          <div className="material-card-tags">
            <TagList tags={tags} />
          </div>
        )}

        <div className="material-card-footer">
          <span className="material-card-date">
            <MaterialIcon name="calendar_today" />
            {formattedDate}
          </span>
          <Link href={`/materials/${material.id}`} className="material-card-link">
            צפייה
            <MaterialIcon name="arrow_back" />
          </Link>
        </div>
      </div>
    </article>
  );
}
