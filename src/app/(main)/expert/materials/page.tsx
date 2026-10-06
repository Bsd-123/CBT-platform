import type { MaterialApprovalStatus } from "@prisma/client";
import Link from "next/link";
import { DownloadMaterialButton } from "@/components/materials/DownloadMaterialButton";
import { MaterialReviewActions } from "@/components/materials/MaterialReviewActions";
import { TagList } from "@/components/shared/TagList";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { Pagination } from "@/components/ui/Pagination";
import { TabNav } from "@/components/ui/TabNav";
import { assertReviewerAccess } from "@/lib/auth";
import { fetchMaterialsForReview } from "@/lib/data";
import { formatDate } from "@/lib/utils/format";
import { pageWindow, parsePage, totalPages } from "@/lib/utils/pagination";

const TABS: { status: MaterialApprovalStatus; label: string; icon: string }[] = [
  { status: "pending", label: "ממתינים לאישור", icon: "hourglass_top" },
  { status: "approved", label: "אושרו", icon: "check_circle" },
  { status: "rejected", label: "נדחו", icon: "cancel" },
];

type ReviewPageProps = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

export default async function MaterialReviewPage({ searchParams }: ReviewPageProps) {
  await assertReviewerAccess();

  const { status: statusParam, page: pageParam } = await searchParams;
  const status = TABS.find((tab) => tab.status === statusParam)?.status ?? "pending";
  const page = parsePage(pageParam);

  const { items, total } = await fetchMaterialsForReview(status, pageWindow(page));

  return (
    <>
      <PageHero
        title="אישור חומרים"
        subtitle="חומרים שהועלו על ידי משתמשים מתפרסמים רק לאחר אישור מומחה."
      />

      <TabNav
        ariaLabel="סינון חומרים לפי סטטוס"
        items={TABS.map((tab) => ({
          href: tab.status === "pending" ? "/expert/materials" : `/expert/materials?status=${tab.status}`,
          label: tab.label,
          icon: tab.icon,
          active: tab.status === status,
        }))}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={status === "pending" ? "task_alt" : "inventory_2"}
          title={status === "pending" ? "אין חומרים שממתינים לאישור" : "אין חומרים להצגה"}
          description={status === "pending" ? "כל החומרים שהועלו כבר טופלו." : undefined}
        />
      ) : (
        <ul className="ui-list">
          {items.map((material) => (
            <li key={material.id}>
              <article className="ui-card">
                <div className="ui-card-body">
                  <div className="ui-card-head">
                    <h2 className="ui-card-title">
                      <Link href={`/materials/${material.id}`}>{material.title}</Link>
                    </h2>
                    {material.material_type && (
                      <span className="ui-badge">{material.material_type.label}</span>
                    )}
                  </div>

                  <p className="ui-card-excerpt" style={{ WebkitLineClamp: "unset" }}>
                    {material.description}
                  </p>

                  <TagList tags={material.tags} />

                  <div className="ui-card-meta">
                    <span>{material.user?.full_name ?? "משתמש"}</span>
                    <span>{formatDate(material.created_at)}</span>
                  </div>

                  {material.approval_status === "rejected" && material.rejection_reason && (
                    <p className="muted">סיבת הדחייה: {material.rejection_reason}</p>
                  )}

                  <div className="ui-table-actions">
                    <DownloadMaterialButton fileKey={material.file_url} label="הורדת הקובץ לבדיקה" />
                    {material.approval_status === "pending" && (
                      <MaterialReviewActions
                        materialId={material.id}
                        materialTitle={material.title}
                      />
                    )}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        basePath="/expert/materials"
        params={{ status: status === "pending" ? undefined : status }}
        page={page}
        totalPages={totalPages(total)}
      />
    </>
  );
}
