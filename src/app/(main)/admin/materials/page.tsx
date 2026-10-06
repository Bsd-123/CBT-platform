import { AdminMaterialsList } from "@/components/admin/AdminMaterialsList";
import { loadAdminMaterials } from "@/lib/admin/data";

const PAGE_SIZE = 50;

type AdminMaterialsPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminMaterialsPage({ searchParams }: AdminMaterialsPageProps) {
  const { page: pageParam } = await searchParams;
  const parsed = Number.parseInt(pageParam ?? "1", 10);
  const page = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  const offset = (page - 1) * PAGE_SIZE;

  const { items, total } = await loadAdminMaterials({ limit: PAGE_SIZE, offset });

  return <AdminMaterialsList materials={items} total={total} page={page} pageSize={PAGE_SIZE} />;
}
