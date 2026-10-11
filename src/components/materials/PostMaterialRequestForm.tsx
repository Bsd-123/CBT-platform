"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitMaterialRequest } from "@/lib/actions/submit";
import { unwrap } from "@/lib/actions/result";

export function PostMaterialRequestForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const request = unwrap(await submitMaterialRequest({ title, description }));
      setTitle("");
      setDescription("");
      router.push(`/materials/requests/${request.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "הפרסום נכשל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <h2>בקשת חומר</h2>
      <div className="form-field">
        <label htmlFor="request-title">כותרת</label>
        <input id="request-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="request-description">תיאור הבקשה</label>
        <textarea id="request-description" rows={4} required value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="materials-btn-primary" disabled={loading}>
        {loading ? "מפרסם..." : "פרסום בקשה"}
      </button>
    </form>
  );
}
