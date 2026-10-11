import {
  loadAdminMaterialTypes,
  loadAvailableMaterialTypeKeys,
} from "@/lib/admin/data";
import { AdminMaterialTypesManager } from "@/components/admin/AdminMaterialTypesManager";

export default async function AdminMaterialTypesPage() {
  const [materialTypes, availableKeys] = await Promise.all([
    loadAdminMaterialTypes(),
    loadAvailableMaterialTypeKeys(),
  ]);

  return (
    <AdminMaterialTypesManager
      key={materialTypes.map((type) => `${type.id}:${type.label}:${type.icon ?? ""}`).join("|")}
      materialTypes={materialTypes}
      availableKeys={availableKeys}
    />
  );
}
