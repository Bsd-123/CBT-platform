"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MaterialTypeKey } from "@prisma/client";
import {
  adminCreateMaterialType,
  adminDeleteMaterialType,
  adminUpdateMaterialType,
} from "@/lib/actions/admin";
import type { PublicMaterialType } from "@/lib/models/material-type";

const KEY_LABELS: Record<MaterialTypeKey, string> = {
  game: "game",
  reading: "reading",
  worksheet: "worksheet",
  treatment_plan: "treatment_plan",
  presentation: "presentation",
  video: "video",
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
  const [error, setError] = useState<string | null>(null);
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
      setError("יש לבחור מפתח לקטגוריה.");
      return;
    }

    setError(null);
    setCreating(true);

    try {
      await adminCreateMaterialType({
        key: newKey,
        label: newLabel,
        icon: newIcon || null,
      });
      setNewLabel("");
      setNewIcon("");
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "יצירת הקטגוריה נכשלה");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(type: PublicMaterialType) {
    const edit = edits[type.id];
    if (!edit) return;

    setError(null);
    setLoadingId(type.id);

    try {
      await adminUpdateMaterialType(type.id, {
        label: edit.label,
        icon: edit.icon || null,
      });
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "העדכון נכשל");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setLoadingId(id);

    try {
      await adminDeleteMaterialType(id);
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "המחיקה נכשלה");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="stack">
      {availableKeys.length > 0 && (
        <form className="stack card" onSubmit={handleCreate}>
          <h2>קטגוריית חומר חדשה</h2>
          <div className="form-field">
            <label htmlFor="material-type-key">מפתח (enum)</label>
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
          <button type="submit" className="button" disabled={creating}>
            {creating ? "שומר..." : "הוספת קטגוריה"}
          </button>
        </form>
      )}

      {error && <p className="error">{error}</p>}

      <section className="stack">
        <h2>קטגוריות קיימות ({materialTypes.length})</h2>
        {materialTypes.length === 0 ? (
          <p className="muted">אין קטגוריות.</p>
        ) : (
          <ul className="list-plain">
            {materialTypes.map((type) => {
              const edit = edits[type.id] ?? { label: type.label, icon: type.icon ?? "" };
              return (
                <li key={type.id} className="card stack">
                  <p className="muted">מפתח: {type.key}</p>
                  <div className="form-field">
                    <label htmlFor={`label-${type.id}`}>תווית</label>
                    <input
                      id={`label-${type.id}`}
                      value={edit.label}
                      onChange={(event) =>
                        setEdits((current) => ({
                          ...current,
                          [type.id]: { ...edit, label: event.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor={`icon-${type.id}`}>אייקון</label>
                    <input
                      id={`icon-${type.id}`}
                      value={edit.icon}
                      onChange={(event) =>
                        setEdits((current) => ({
                          ...current,
                          [type.id]: { ...edit, icon: event.target.value },
                        }))
                      }
                    />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="button secondary"
                      disabled={loadingId === type.id}
                      onClick={() => void handleUpdate(type)}
                    >
                      שמירה
                    </button>
                    <button
                      type="button"
                      className="button secondary"
                      disabled={loadingId === type.id}
                      onClick={() => void handleDelete(type.id)}
                    >
                      מחיקה
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
