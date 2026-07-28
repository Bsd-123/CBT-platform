import { AdminNav } from "@/components/admin/AdminNav";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { loadAdminUsersPage } from "@/lib/admin/data";
import "@/app/admin-users.css";

export default async function AdminUsersPage() {
  const { users, stats } = await loadAdminUsersPage();

  return (
    <div className="stack">
      <section className="card admin-users-header">
        <h1>ניהול מערכת</h1>
        <AdminNav />
      </section>

      <AdminUsersTable users={users} stats={stats} />
    </div>
  );
}
