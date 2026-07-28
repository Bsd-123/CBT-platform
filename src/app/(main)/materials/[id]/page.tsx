import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchEntityTags,
  fetchMaterialAverageRating,
  fetchMaterialById,
  fetchUserMaterialRating,
} from "@/lib/actions";
import { fetchAuthenticatedProfile } from "@/lib/actions/auth";
import { MaterialRatingForm } from "@/components/materials/MaterialRatingForm";
import { DownloadMaterialButton } from "@/components/materials/DownloadMaterialButton";
import { ReportForm } from "@/components/shared/ReportForm";
import { TagList } from "@/components/shared/TagList";
import { StarRating } from "@/components/shared/StarRating";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { getMaterialTypeBadgeVariant } from "@/lib/utils/material-type-ui";

type MaterialDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MaterialDetailPage({ params }: MaterialDetailPageProps) {
  const { id } = await params;
  const [material, tags, averageRating, auth] = await Promise.all([
    fetchMaterialById(id),
    fetchEntityTags("material", id),
    fetchMaterialAverageRating(id),
    fetchAuthenticatedProfile(),
  ]);

  if (!material) notFound();

  const userRating = auth
    ? await fetchUserMaterialRating(id, auth.userId)
    : null;

  const badgeVariant = getMaterialTypeBadgeVariant(material.material_type?.key);
  const formattedDate = new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(material.created_at));

  return (
    <>
      <Link href="/materials" className="materials-back-link">
        <MaterialIcon name="arrow_forward" />
        חזרה לספריית חומרים
      </Link>

      <article className="materials-clinical-card">
        <div className="materials-clinical-card-accent" />
        <div className="materials-clinical-card-body stack">
          <div className="material-card-header">
            <span className={`material-type-badge ${badgeVariant}`}>
              {material.material_type?.label}
            </span>
            <div className="material-card-rating">
              <MaterialIcon name="star" filled />
              <span>{averageRating ? averageRating.toFixed(1) : "—"}</span>
            </div>
          </div>

          <h1 className="material-card-title">{material.title}</h1>
          <p className="muted">{material.user?.full_name}</p>
          <p className="material-card-desc" style={{ WebkitLineClamp: "unset" }}>
            {material.description}
          </p>

          {tags.length > 0 && (
            <div className="materials-detail-tags">
              <span className="materials-detail-tags-label">תגיות</span>
              <TagList tags={tags} />
            </div>
          )}

          <div className="materials-detail-meta">
            <span className="material-card-date">
              <MaterialIcon name="calendar_today" />
              {formattedDate}
            </span>
            <StarRating
              value={averageRating ? Math.round(averageRating) : 0}
              readOnly
              size="sm"
            />
          </div>

          <div className="materials-detail-actions">
            <DownloadMaterialButton fileKey={material.file_url} />
            <ReportForm targetType="material" targetId={material.id} />
          </div>
        </div>
      </article>

      <section className="materials-clinical-card">
        <div className="materials-clinical-card-body">
          <MaterialRatingForm materialId={material.id} currentRating={userRating?.rating ?? null} />
        </div>
      </section>
    </>
  );
}
