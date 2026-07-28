import Link from "next/link";
import { Suspense } from "react";
import type { MaterialTypeKey } from "@prisma/client";
import {
  fetchEntityTags,
  fetchMaterialAverageRating,
  fetchMaterials,
  fetchMaterialRequests,
  fetchMaterialTypes,
  fetchTags,
} from "@/lib/actions";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { MaterialRequestListItem } from "@/components/materials/MaterialRequestListItem";
import { MaterialsActiveTagFilters } from "@/components/materials/MaterialsActiveTagFilters";
import { MaterialsLibraryTabs, type MaterialsLibraryTab } from "@/components/materials/MaterialsLibraryTabs";
import { MaterialsSearchBar } from "@/components/materials/MaterialsSearchBar";
import { MaterialsSidebar } from "@/components/materials/MaterialsSidebar";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

type MaterialsPageProps = {
  searchParams: Promise<{ type?: string; q?: string; tags?: string; tab?: string }>;
};

function parseTab(tab?: string): MaterialsLibraryTab {
  return tab === "requests" ? "requests" : "materials";
}

export default async function MaterialsPage({ searchParams }: MaterialsPageProps) {
  const { type, q, tags, tab: tabParam } = await searchParams;
  const activeTab = parseTab(tabParam);

  const materialTypes = await fetchMaterialTypes();
  const availableTags = await fetchTags();

  const typeKey = materialTypes.some((item) => item.key === type)
    ? (type as MaterialTypeKey)
    : undefined;

  const tagIds = tags
    ? tags.split(",").map((item) => item.trim()).filter(Boolean)
    : [];

  const [allMaterials, materials, requests] = await Promise.all([
    fetchMaterials({}),
    activeTab === "materials"
      ? fetchMaterials({
          material_type_key: typeKey,
          search: q,
          tag_ids: tagIds,
        })
      : Promise.resolve([]),
    fetchMaterialRequests(),
  ]);

  const typeCounts = Object.fromEntries(
    materialTypes.map((materialType) => [
      materialType.id,
      allMaterials.filter((item) => item.material_type_id === materialType.id).length,
    ]),
  );

  const selectedTags = availableTags.filter((tag) => tagIds.includes(tag.id));

  const materialsWithMeta =
    activeTab === "materials"
      ? await Promise.all(
          materials.map(async (material) => {
            const [entityTags, averageRating] = await Promise.all([
              fetchEntityTags("material", material.id),
              fetchMaterialAverageRating(material.id),
            ]);

            return { material, tags: entityTags, averageRating };
          }),
        )
      : [];

  return (
    <>
      <div className="materials-hero">
        <div>
          <h1>ספריית חומרים</h1>
          <p>גלו ונהלו משאבים טיפוליים לצורך מצוינות קלינית.</p>
        </div>
        <div className="action-buttons">
          <Link href="/materials/upload" className="materials-btn-primary">
            <MaterialIcon name="upload" />
            העלאת חומר
          </Link>
          <Link href="/materials/request" className="materials-btn-secondary">
            <MaterialIcon name="help" />
            בקשת חומר
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="materials-library-tabs" />}>
        <MaterialsLibraryTabs
          activeTab={activeTab}
          materialsCount={allMaterials.length}
          requestsCount={requests.length}
        />
      </Suspense>

      {activeTab === "materials" ? (
        <div className="materials-layout">
          <Suspense
            fallback={
              <aside className="materials-sidebar">
                <div className="materials-sidebar-panel">
                  <p className="muted">טוען סינון...</p>
                </div>
              </aside>
            }
          >
            <MaterialsSidebar
              materialTypes={materialTypes}
              typeCounts={typeCounts}
              totalCount={allMaterials.length}
              tags={availableTags}
              currentType={typeKey}
              currentTagIds={tagIds}
            />
          </Suspense>

          <div className="materials-main">
            <Suspense fallback={<div className="materials-toolbar" />}>
              <MaterialsSearchBar defaultValue={q} />
            </Suspense>

            <MaterialsActiveTagFilters
              selectedTags={selectedTags}
              currentType={typeKey}
              currentQuery={q}
            />

            <div className="materials-grid">
              {materialsWithMeta.length === 0 ? (
                <div className="materials-empty">
                  <MaterialIcon name="folder_off" />
                  <p>לא נמצאו חומרים לפי הסינון הנוכחי.</p>
                </div>
              ) : (
                materialsWithMeta.map(({ material, tags: materialTags, averageRating }) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    tags={materialTags}
                    averageRating={averageRating}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="materials-main materials-main-full">
          {requests.length === 0 ? (
            <div className="materials-empty">
              <MaterialIcon name="help_outline" />
              <p>עדיין לא פורסמו בקשות חומרים.</p>
              <Link href="/materials/request" className="materials-btn-primary">
                פרסום בקשה ראשונה
              </Link>
            </div>
          ) : (
            <div className="materials-requests-list">
              {requests.map((request) => (
                <MaterialRequestListItem key={request.id} request={request} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
