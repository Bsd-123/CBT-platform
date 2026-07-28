import { AdminNav } from "@/components/admin/AdminNav";
import {
  loadAdminExpertApprovals,
  loadAdminMaterialTypes,
  loadAdminReports,
  loadAdminTags,
  loadAdminUsers,
} from "@/lib/admin/data";

export default async function AdminIndexPage() {
  const [reports, users, tags, materialTypes, expertApprovals] = await Promise.all([
    loadAdminReports(),
    loadAdminUsers(),
    loadAdminTags(),
    loadAdminMaterialTypes(),
    loadAdminExpertApprovals(),
  ]);

  return (
    <div className="stack">
      <section className="card">
        <h1>ניהול מערכת</h1>
        <AdminNav />
        <p className="muted">תקציר מהיר של אזור הניהול.</p>
      </section>

      <section className="card">
        <h2>מבט מהיר</h2>
        <ul>
          <li>דיווחים: {reports.length}</li>
          <li>משתמשים: {users.length}</li>
          <li>אישורי הרשמה (מומחים): {expertApprovals.length}</li>
          <li>תגיות: {tags.length}</li>
          <li>קטגוריות חומרים: {materialTypes.length}</li>
        </ul>
      </section>
    </div>
  );
}
