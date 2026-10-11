import Link from "next/link";
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

  const stats = [
    {
      href: "/admin/reports",
      label: "דיווחים פתוחים",
      value: reports.filter((report) => report.status !== "resolved").length,
    },
    { href: "/admin/users", label: "משתמשים", value: users.length },
    {
      href: "/admin/experts",
      label: "ממתינים לאישור",
      value: expertApprovals.filter((approval) => approval.status === "pending").length,
    },
    { href: "/admin/tags", label: "תגיות", value: tags.length },
    { href: "/admin/categories", label: "קטגוריות חומרים", value: materialTypes.length },
  ];

  return (
    <div className="ui-stat-grid">
      {stats.map((stat) => (
        <Link key={stat.href} href={stat.href} className="ui-stat">
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
        </Link>
      ))}
    </div>
  );
}
