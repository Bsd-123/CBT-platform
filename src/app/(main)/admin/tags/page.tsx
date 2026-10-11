import { AdminTagsManager } from "@/components/admin/AdminTagsManager";
import { loadAdminTags } from "@/lib/admin/data";

export default async function AdminTagsPage() {
  const tags = await loadAdminTags();

  return <AdminTagsManager tags={tags} />;
}
