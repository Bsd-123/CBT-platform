"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  adminHideReportedContent,
  adminRestoreReportedContent,
  adminDeleteReportedContent,
} from "@/lib/actions/admin";
import type { AdminMaterialItem } from "@/lib/repositories/material.repository";

type Props = {
  initialMaterials: AdminMaterialItem[];
  total: number;
  page: number;
  pageSize: number;
};

export function AdminMaterialsList({ initialMaterials, total, page, pageSize }: Props) {
  const router = useRouter();
  const [materials] = useState(initialMaterials);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function handleAction(action: "hide" | "restore" | "delete", id: string) {
    setLoadingId(id);
    try {
      if (action === "hide") await adminHideReportedContent("material", id);
      if (action === "restore") await adminRestoreReportedContent("material", id);
      if (action === "delete") await adminDeleteReportedContent("material", id);
      router.refresh();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert("הפעולה נכשלה");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      {materials.length === 0 ? (
        <p className="muted">לא נמצאו חומרים.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>כותרת</th>
              <th>מצב</th>
              <th>מעלה</th>
              <th>נוצר בתאריך</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id}>
                <td>{m.title}</td>
                <td>{m.isHidden ? "מוסתר" : "גלוי"}</td>
                <td>{m.uploader?.full_name ?? "-"}</td>
                <td>{new Date(m.createdAt).toLocaleString()}</td>
                <td>
                  {m.isHidden ? (
                    <button disabled={loadingId === m.id} onClick={() => void handleAction("restore", m.id)} className="button">
                      שחזור
                    </button>
                  ) : (
                    <button disabled={loadingId === m.id} onClick={() => void handleAction("hide", m.id)} className="button secondary">
                      הסתר
                    </button>
                  )}
                  <button disabled={loadingId === m.id} onClick={() => { if (confirm("בטוח שברצונך למחוק את הפריט?")) void handleAction("delete", m.id); }} className="button danger">
                    מחיקה
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "1rem" }}>
        <button className="button" disabled={page <= 1} onClick={() => void router.push(`/admin/materials?page=${page - 1}`)}>
          קודם
        </button>
        <span>
          עמוד {page} מתוך {totalPages}
        </span>
        <button className="button" disabled={page >= totalPages} onClick={() => void router.push(`/admin/materials?page=${page + 1}`)}>
          הבא
        </button>
      </div>
    </div>
  );
}
