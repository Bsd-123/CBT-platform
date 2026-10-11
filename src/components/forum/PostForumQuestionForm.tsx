"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagInput } from "@/components/shared/TagInput";
import { submitForumQuestion } from "@/lib/actions/submit";
import { unwrap } from "@/lib/actions/result";

export function PostForumQuestionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const question = unwrap(await submitForumQuestion({ title, content, tags }));
      setTitle("");
      setContent("");
      setTags("");
      router.push(`/forum/${question.id}`);
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
        <label htmlFor="question-title">כותרת</label>
        <input id="question-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="question-content">תוכן השאלה</label>
        <textarea id="question-content" rows={5} required value={content} onChange={(e) => setContent(e.target.value)} />
      </div>
      <TagInput value={tags} onChange={setTags} required />
      {error && <p className="error">{error}</p>}
      <button type="submit" className="button" disabled={loading}>{loading ? "מפרסם..." : "פרסום שאלה"}</button>
    </form>
  );
}
