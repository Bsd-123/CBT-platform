"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitProfessionalRequest } from "@/lib/actions/submit";

export function PostProfessionalRequestForm() {
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
      const item = await submitProfessionalRequest({ title, description });
      setTitle("");
      setDescription("");
      router.push(`/professional-requests/${item.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "הפרסום נכשל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="pro-title">כותרת</label>
        <input id="pro-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="pro-description">תיאור</label>
        <textarea id="pro-description" rows={5} required value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="button" disabled={loading}>{loading ? "מפרסם..." : "פרסום פנייה"}</button>
    </form>
  );
}
