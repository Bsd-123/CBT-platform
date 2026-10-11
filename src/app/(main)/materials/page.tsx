import Link from "next/link";
import { Suspense } from "react";
import type { MaterialTypeKey } from "@prisma/client";
import {
  fetchEntityTagsForEntities,
  fetchMaterialAverageRatings,
  fetchMaterialCount,
  fetchMaterialCountsByType,
  fetchMaterialRequestCount,
  fetchMaterials,
  fetchMaterialRequests,
  fetchMaterialTypes,
  fetchTags,
} from "@/lib/data";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { MaterialRequestListItem } from "@/components/materials/MaterialRequestListItem";
import { MaterialsActiveTagFilters } from "@/components/materials/MaterialsActiveTagFilters";
import { MaterialsLibraryTabs, type MaterialsLibraryTab } from "@/components/materials/MaterialsLibraryTabs";
import { MaterialsSearchBar } from "@/components/materials/MaterialsSearchBar";
import { MaterialsSidebar } from "@/components/materials/MaterialsSidebar";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { Pagination } from "@/components/ui/Pagination";
import { pageWindow, parsePage, totalPages } from "@/lib/utils/pagination";

type MaterialsPageProps = {
  searchParams: Promise<{ type?: string; q?: string; tags?: string; tab?: string; page?: string }>;
};

function parseTab(tab?: string): MaterialsLibraryTab {
  return tab === "requests" ? "requests" : "materials";
}

export default async function MaterialsPage({ searchParams }: MaterialsPageProps) {
  const { type, q, tags, tab: tabParam, page: pageParam } = await searchParams;
  const activeTab = parseTab(tabParam);
  const page = parsePage(pageParam);

  const [materialTypes, availableTags, typeCounts, requestsCount] = await Promise.all([
    fetchMaterialTypes(),
    fetchTags(),
    fetchMaterialCountsByType(),
    fetchMaterialRequestCount(),
  ]);

  const typeKey = materialTypes.some((item) => item.key === type)
    ? (type as MaterialTypeKey)
    : undefined;

  const tagIds = tags
    ? tags.split(",").map((item) => item.trim()).filter(Boolean)
    : [];

  const totalMaterials = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);
  const filter = { material_type_key: typeKey, search: q, tag_ids: tagIds };

  const [materials, filteredTotal, requests] = await Promise.all([
    activeTab === "materials"
      ? fetchMaterials({ ...filter, ...pageWindow(page) })
      : Promise.resolve([]),
    activeTab === "materials" ? fetchMaterialCount(filter) : Promise.resolve(0),
    activeTab === "requests"
      ? fetchMaterialRequests(pageWindow(page))
      : Promise.resolve([]),
  ]);

  const selectedTags = availableTags.filter((tag) => tagIds.includes(tag.id));

  const materialIds = materials.map((material) => material.id);
  const [tagsByMaterial, averageRatings] = await Promise.all([
    fetchEntityTagsForEntities("material", materialIds),
    fetchMaterialAverageRatings(materialIds),
  ]);

  const materialsWithMeta = materials.map((material) => ({
    material,
    tags: tagsByMaterial.get(material.id) ?? [],
    averageRating: averageRatings.get(material.id) ?? null,
  }));

  const paginationParams = { type: typeKey, q, tags, tab: activeTab === "requests" ? "requests" : undefined };
  const pages = totalPages(activeTab === "materials" ? filteredTotal : requestsCount);

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
          materialsCount={totalMaterials}
          requestsCount={requestsCount}
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
              totalCount={totalMaterials}
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

            <Pagination basePath="/materials" params={paginationParams} page={page} totalPages={pages} />
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

          <Pagination basePath="/materials" params={paginationParams} page={page} totalPages={pages} />
        </div>
      )}
    </>
  );
}
