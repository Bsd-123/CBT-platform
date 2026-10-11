"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagSelect } from "@/components/shared/TagSelect";
import type { PublicTag } from "@/lib/models/tag";
import { submitForumQuestion } from "@/lib/actions/submit";
import { unwrap } from "@/lib/actions/result";

type PostForumQuestionFormProps = {
  /** The existing tags the asker may attach (all optional). */
  tags: PublicTag[];
};

export function PostForumQuestionForm({ tags }: PostForumQuestionFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const question = unwrap(await submitForumQuestion({ title, content, tag_ids: selectedTagIds }));
      setTitle("");
      setContent("");
      setSelectedTagIds([]);
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
      <TagSelect tags={tags} value={selectedTagIds} onChange={setSelectedTagIds} optional />
      {error && <p className="error">{error}</p>}
      <button type="submit" className="button" disabled={loading}>{loading ? "מפרסם..." : "פרסום שאלה"}</button>
    </form>
  );
}
