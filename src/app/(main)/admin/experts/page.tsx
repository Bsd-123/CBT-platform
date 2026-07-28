import { AdminExpertsDirectoryTable } from "@/components/admin/AdminExpertsDirectoryTable";
import { AdminExpertsTable } from "@/components/admin/AdminExpertsTable";
import { AdminNav } from "@/components/admin/AdminNav";
import { loadAdminExpertApprovals, loadAdminExpertDirectory } from "@/lib/admin/data";
import "@/app/admin-experts.css";

export default async function AdminExpertsPage() {
  const [experts, approvals] = await Promise.all([
    loadAdminExpertDirectory(),
    loadAdminExpertApprovals(),
  ]);

  return (
    <div className="admin-experts-page stack">
      <section className="card admin-experts-header">
        <h1>ניהול מערכת</h1>
        <AdminNav />
      </section>

      <AdminExpertsDirectoryTable experts={experts} />
      <AdminExpertsTable approvals={approvals} />
    </div>
  );
}
