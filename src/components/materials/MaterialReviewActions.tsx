"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { unwrap } from "@/lib/actions/result";
import { reviewMaterialUpload } from "@/lib/actions/review";
import { ModalButton } from "@/components/ui/Modal";
import { useUi } from "@/components/ui/UiProvider";

type MaterialReviewActionsProps = {
  materialId: string;
  materialTitle: string;
};

/** Approve / reject buttons for a pending material (experts and admins). */
export function MaterialReviewActions({ materialId, materialTitle }: MaterialReviewActionsProps) {
  const router = useRouter();
  const { toast } = useUi();
  const [busy, setBusy] = useState(false);

  async function handleApprove() {
    setBusy(true);
    try {
      unwrap(await reviewMaterialUpload({ material_id: materialId, decision: "approved" }));
      toast("החומר אושר ופורסם");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "האישור נכשל", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ui-table-actions">
      <button
        type="button"
        className="materials-btn-primary"
        disabled={busy}
        onClick={() => void handleApprove()}
      >
        אישור ופרסום
      </button>
      <ModalButton
        label="דחייה"
        title={`דחיית החומר: ${materialTitle}`}
        triggerClassName="materials-btn-secondary"
      >
        <RejectMaterialForm materialId={materialId} />
      </ModalButton>
    </div>
  );
}

function RejectMaterialForm({ materialId }: { materialId: string }) {
  const router = useRouter();
  const { toast } = useUi();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      unwrap(await reviewMaterialUpload({
        material_id: materialId,
        decision: "rejected",
        rejection_reason: reason,
      }));
      toast("החומר נדחה והמעלה קיבל הודעה");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "הדחייה נכשלה");
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor={`reject-reason-${materialId}`}>סיבת הדחייה (תוצג למי שהעלה את החומר)</label>
        <textarea
          id={`reject-reason-${materialId}`}
          rows={4}
          required
          minLength={3}
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="materials-btn-primary" data-danger="true" disabled={loading}>
        {loading ? "שולח..." : "דחיית החומר"}
      </button>
    </form>
  );
}
