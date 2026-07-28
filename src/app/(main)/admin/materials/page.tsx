import { loadAdminMaterials } from "@/lib/admin/data";
import { AdminMaterialsList } from "@/components/admin/AdminMaterialsList";

const PAGE_SIZE = 50;

type AdminMaterialsPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminMaterialsPage({ searchParams }: AdminMaterialsPageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1"));
  const offset = (page - 1) * PAGE_SIZE;

  const { items, total } = await loadAdminMaterials({ limit: PAGE_SIZE, offset });

  return (
    <div className="stack">
      <section className="card">
        <h1>ניהול חומרים</h1>
        <p className="muted">רשימת חומרים להחלטת ניהול (הסתרה / שחזור / מחיקה).</p>
      </section>

      <section className="card">
        <AdminMaterialsList initialMaterials={items} total={total} page={page} pageSize={PAGE_SIZE} />
      </section>
    </div>
  );
}
