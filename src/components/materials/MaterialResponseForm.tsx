"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { uploadMaterialResponseFileResilient } from "@/lib/client/upload-api";
import { submitMaterialResponse } from "@/lib/actions/submit";

type MaterialResponseFormProps = {
  requestId: string;
};

export function MaterialResponseForm({ requestId }: MaterialResponseFormProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!text.trim() && !file) {
      setError("יש לכלול טקסט, קובץ, או שניהם.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const file_url = file ? await uploadMaterialResponseFileResilient(file) : undefined;

      await submitMaterialResponse({
        request_id: requestId,
        text: text.trim() || undefined,
        file_url,
      });

      setText("");
      setFile(null);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "התגובה נכשלה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <h3>העלאת חומר לבקשה</h3>
      <div className="form-field">
        <label htmlFor="response-text">טקסט (אופציונלי)</label>
        <textarea id="response-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="response-file">קובץ (אופציונלי)</label>
        <input id="response-file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="button" disabled={loading}>{loading ? "שולח..." : "שליחת תגובה"}</button>
    </form>
  );
}
