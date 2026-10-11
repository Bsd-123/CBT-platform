"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MaterialTypeKey } from "@prisma/client";
import {
  adminCreateMaterialType,
  adminDeleteMaterialType,
  adminUpdateMaterialType,
} from "@/lib/actions/admin";
import { EmptyState } from "@/components/ui/EmptyState";
import { useUi } from "@/components/ui/UiProvider";
import type { PublicMaterialType } from "@/lib/models/material-type";
import { unwrap } from "@/lib/actions/result";

const KEY_LABELS: Record<MaterialTypeKey, string> = {
  game: "משחק (game)",
  reading: "קריאה (reading)",
  worksheet: "דף עבודה (worksheet)",
  treatment_plan: "תוכנית טיפול (treatment_plan)",
  presentation: "מצגת (presentation)",
  video: "וידאו (video)",
};

type AdminMaterialTypesManagerProps = {
  materialTypes: PublicMaterialType[];
  availableKeys: MaterialTypeKey[];
};

export function AdminMaterialTypesManager({
  materialTypes,
  availableKeys,
}: AdminMaterialTypesManagerProps) {
  const router = useRouter();
  const { toast, confirm } = useUi();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<MaterialTypeKey | "">(availableKeys[0] ?? "");
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [creating, setCreating] = useState(false);
  const [edits, setEdits] = useState<Record<string, { label: string; icon: string }>>(() =>
    Object.fromEntries(
      materialTypes.map((type) => [type.id, { label: type.label, icon: type.icon ?? "" }]),
    ),
  );

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!newKey) {
      toast("יש לבחור מפתח לקטגוריה.", "error");
      return;
    }

    setCreating(true);
    try {
      unwrap(await adminCreateMaterialType({ key: newKey, label: newLabel, icon: newIcon || null }));
      setNewLabel("");
      setNewIcon("");
      toast("הקטגוריה נוצרה");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "יצירת הקטגוריה נכשלה", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(type: PublicMaterialType) {
    const edit = edits[type.id];
    if (!edit) return;

    setLoadingId(type.id);
    try {
      unwrap(await adminUpdateMaterialType(type.id, { label: edit.label, icon: edit.icon || null }));
      toast("הקטגוריה עודכנה");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "העדכון נכשל", "error");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(type: PublicMaterialType) {
    const approved = await confirm({
      title: `מחיקת הקטגוריה "${type.label}"`,
      message: "לא ניתן למחוק קטגוריה שיש בה חומרים.",
      confirmLabel: "מחיקה",
      danger: true,
    });
    if (!approved) return;

    setLoadingId(type.id);
    try {
      unwrap(await adminDeleteMaterialType(type.id));
      toast("הקטגוריה נמחקה");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "המחיקה נכשלה", "error");
    } finally {
      setLoadingId(null);
    }
  }

  function setEdit(type: PublicMaterialType, patch: Partial<{ label: string; icon: string }>) {
    setEdits((current) => ({
      ...current,
      [type.id]: {
        label: current[type.id]?.label ?? type.label,
        icon: current[type.id]?.icon ?? type.icon ?? "",
        ...patch,
      },
    }));
  }

  return (
    <>
      {availableKeys.length > 0 && (
        <section className="ui-section">
          <h2>קטגוריית חומר חדשה</h2>
          <form className="ui-inline-form" onSubmit={handleCreate}>
            <div className="form-field">
              <label htmlFor="material-type-key">מפתח</label>
              <select
                id="material-type-key"
                required
                value={newKey}
                onChange={(event) => setNewKey(event.target.value as MaterialTypeKey)}
              >
                {availableKeys.map((key) => (
                  <option key={key} value={key}>
                    {KEY_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="material-type-label">תווית תצוגה</label>
              <input
                id="material-type-label"
                required
                value={newLabel}
                onChange={(event) => setNewLabel(event.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="material-type-icon">אייקון (אופציונלי)</label>
              <input
                id="material-type-icon"
                value={newIcon}
                onChange={(event) => setNewIcon(event.target.value)}
              />
            </div>
            <button type="submit" className="materials-btn-primary" disabled={creating}>
              {creating ? "שומר..." : "הוספה"}
            </button>
          </form>
        </section>
      )}

      <section className="ui-section">
        <h2>קטגוריות קיימות ({materialTypes.length})</h2>
        {materialTypes.length === 0 ? (
          <EmptyState icon="category" title="אין קטגוריות" />
        ) : (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>מפתח</th>
                  <th>תווית</th>
                  <th>אייקון</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {materialTypes.map((type) => {
                  const edit = edits[type.id] ?? { label: type.label, icon: type.icon ?? "" };
                  return (
                    <tr key={type.id}>
                      <td>{KEY_LABELS[type.key]}</td>
                      <td>
                        <input
                          aria-label={`תווית עבור ${type.key}`}
                          value={edit.label}
                          onChange={(event) => setEdit(type, { label: event.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`אייקון עבור ${type.key}`}
                          value={edit.icon}
                          onChange={(event) => setEdit(type, { icon: event.target.value })}
                        />
                      </td>
                      <td>
                        <div className="ui-table-actions">
                          <button
                            type="button"
                            className="materials-btn-secondary"
                            disabled={loadingId === type.id}
                            onClick={() => void handleUpdate(type)}
                          >
                            שמירה
                          </button>
                          <button
                            type="button"
                            className="materials-btn-primary"
                            data-danger="true"
                            disabled={loadingId === type.id}
                            onClick={() => void handleDelete(type)}
                          >
                            מחיקה
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
