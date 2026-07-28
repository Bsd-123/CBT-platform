import { loadAdminTags } from "@/lib/admin/data";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminTagsManager } from "@/components/admin/AdminTagsManager";

export default async function AdminTagsPage() {
  const tags = await loadAdminTags();

  return (
    <div className="stack">
      <section className="card">
        <h1>ניהול מערכת</h1>
        <AdminNav />
        <h2>תגיות</h2>
        <p className="muted">יצירה ומחיקה של תגיות במערכת.</p>
      </section>

      <section className="card">
        <AdminTagsManager tags={tags} />
      </section>
    </div>
  );
}
