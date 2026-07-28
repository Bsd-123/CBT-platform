import {
  loadAdminMaterialTypes,
  loadAvailableMaterialTypeKeys,
} from "@/lib/admin/data";
import { AdminMaterialTypesManager } from "@/components/admin/AdminMaterialTypesManager";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminMaterialTypesPage() {
  const [materialTypes, availableKeys] = await Promise.all([
    loadAdminMaterialTypes(),
    loadAvailableMaterialTypeKeys(),
  ]);

  return (
    <div className="stack">
      <section className="card">
        <h1>ניהול מערכת</h1>
        <AdminNav />
        <h2>קטגוריות חומרים</h2>
        <p className="muted">
          ניהול סוגי חומרים (MaterialTypes): תווית תצוגה ואייקון. המפתח נקבע לפי enum במערכת.
        </p>
      </section>

      <section className="card">
        <AdminMaterialTypesManager
          key={materialTypes.map((type) => `${type.id}:${type.label}:${type.icon ?? ""}`).join("|")}
          materialTypes={materialTypes}
          availableKeys={availableKeys}
        />
      </section>
    </div>
  );
}
