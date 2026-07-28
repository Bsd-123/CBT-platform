import { loadAdminReports } from "@/lib/admin/data";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminReportsList } from "@/components/admin/AdminReportsList";

export default async function AdminReportsPage() {
  const reports = await loadAdminReports();

  return (
    <div className="stack">
      <section className="card">
        <h1>ניהול מערכת</h1>
        <AdminNav />
        <h2>דיווחים</h2>
        <p className="muted">
          טיפול בדיווחים על תוכן: סטטוס open / reviewing / resolved.
        </p>
      </section>

      <section className="card">
        <AdminReportsList reports={reports} />
      </section>
    </div>
  );
}
