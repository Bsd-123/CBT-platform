import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { loadAdminUsersPage } from "@/lib/admin/data";
import "@/app/admin-users.css";

export default async function AdminUsersPage() {
  const { users, stats } = await loadAdminUsersPage();

  return (
    <div className="stack">
      <AdminUsersTable users={users} stats={stats} />
    </div>
  );
}
