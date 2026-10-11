"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReportTargetType } from "@prisma/client";
import { submitContentReport } from "@/lib/actions/submit";
import { unwrap } from "@/lib/actions/result";

type ReportFormProps = {
  targetType: ReportTargetType;
  targetId: string;
};

export function ReportForm({ targetType, targetId }: ReportFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      unwrap(await submitContentReport({
        target_type: targetType,
        target_id: targetId,
        reason,
      }));
      setDone(true);
      setReason("");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "הדיווח נכשל");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <p className="muted">הדיווח נשלח. תודה.</p>;
  }

  if (!open) {
    return (
      <button type="button" className="button secondary" onClick={() => setOpen(true)}>
        דווח על תוכן
      </button>
    );
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor={`report-${targetId}`}>סיבת הדיווח</label>
        <textarea
          id={`report-${targetId}`}
          rows={3}
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
      {error && <p className="error">{error}</p>}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="submit" className="button danger" disabled={loading}>
          {loading ? "שולח..." : "שליחת דיווח"}
        </button>
        <button type="button" className="button secondary" onClick={() => setOpen(false)}>
          ביטול
        </button>
      </div>
    </form>
  );
}
