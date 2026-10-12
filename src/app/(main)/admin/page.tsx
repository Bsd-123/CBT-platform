import Link from "next/link";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { loadAdminDashboard } from "@/lib/admin/data";
import { REPORT_STATUS_LABELS, REPORT_TARGET_LABELS } from "@/lib/utils/admin-labels";
import { formatDate } from "@/lib/utils/format";

type StatTone = "warning" | "danger" | "primary" | "success" | "info" | "neutral";

type Stat = {
  href: string;
  icon: string;
  tone: StatTone;
  value: string | number;
  label: string;
};

const ATTENTION_LIMIT = 5;

export default async function AdminDashboardPage() {
  const data = await loadAdminDashboard();

  const stats: Stat[] = [
    {
      href: "/admin/experts",
      icon: "hourglass_top",
      tone: "warning",
      value: data.pendingApprovals.length,
      label: "הרשמות ממתינות לאישור",
    },
    {
      href: "/admin/reports",
      icon: "flag",
      tone: "danger",
      value: data.openReports.length,
      label: "דיווחים פתוחים",
    },
    {
      href: "/expert/materials",
      icon: "library_books",
      tone: "primary",
      value: data.pendingMaterials,
      label: "חומרים ממתינים לאישור",
    },
    {
      href: "/admin/users",
      icon: "group",
      tone: "success",
      value: data.userStats.total,
      label:
        data.userStats.recently_joined > 0
          ? `משתמשים · ${data.userStats.recently_joined} חדשים היום`
          : "משתמשים",
    },
    {
      href: "/admin/experts",
      icon: "workspace_premium",
      tone: "info",
      value: data.expertCount,
      label: "מומחים",
    },
    {
      href: "/admin/tags",
      icon: "sell",
      tone: "neutral",
      value: `${data.tagCount} · ${data.materialTypeCount}`,
      label: "תגיות · קטגוריות",
    },
  ];

  const reports = data.openReports.slice(0, ATTENTION_LIMIT);
  const approvals = data.pendingApprovals.slice(0, ATTENTION_LIMIT);

  return (
    <div className="admin-dashboard">
      <div className="stat-grid">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="stat-card">
            <span className={`stat-icon tone-${stat.tone}`}>
              <MaterialIcon name={stat.icon} />
            </span>
            <span className="stat-text">
              <strong className="stat-value">{stat.value}</strong>
              <span className="stat-label">{stat.label}</span>
            </span>
            <MaterialIcon name="arrow_back" className="stat-go" />
          </Link>
        ))}
      </div>

      <div className="attention-grid">
        <section className="ui-section attention-panel" aria-labelledby="attention-reports">
          <header className="attention-head">
            <h2 id="attention-reports">דיווחים שדורשים טיפול</h2>
            <Link href="/admin/reports" className="btn btn-link">
              לכל הדיווחים
            </Link>
          </header>
          {reports.length === 0 ? (
            <p className="attention-empty">
              <MaterialIcon name="task_alt" />
              אין דיווחים פתוחים
            </p>
          ) : (
            <ul className="attention-list">
              {reports.map((report) => (
                <li key={report.id}>
                  <span className="status status-neutral">
                    {REPORT_TARGET_LABELS[report.target_type]}
                  </span>
                  <span className="attention-main">{report.reason}</span>
                  <span
                    className={`status ${
                      report.status === "open" ? "status-rejected" : "status-info"
                    }`}
                  >
                    {REPORT_STATUS_LABELS[report.status]}
                  </span>
                  <span className="attention-date">{formatDate(report.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ui-section attention-panel" aria-labelledby="attention-approvals">
          <header className="attention-head">
            <h2 id="attention-approvals">הרשמות ממתינות</h2>
            <Link href="/admin/experts" className="btn btn-link">
              לכל ההרשמות
            </Link>
          </header>
          {approvals.length === 0 ? (
            <p className="attention-empty">
              <MaterialIcon name="task_alt" />
              אין הרשמות שממתינות לאישור
            </p>
          ) : (
            <ul className="attention-list attention-list-people">
              {approvals.map((approval) => (
                <li key={approval.id}>
                  <span className="attention-main">
                    {approval.user?.full_name ?? "משתמש/ת חדש/ה"}
                  </span>
                  <span className="attention-meta">
                    מומחה מפנה: {approval.expert?.full_name ?? "—"}
                  </span>
                  <span className="attention-date">{formatDate(approval.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
