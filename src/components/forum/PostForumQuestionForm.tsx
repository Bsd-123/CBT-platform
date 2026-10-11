"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DomainSelect } from "@/components/shared/DomainSelect";
import { TagInput } from "@/components/shared/TagInput";
import type { PublicTag } from "@/lib/models/tag";
import { submitForumQuestion } from "@/lib/actions/submit";
import { unwrap } from "@/lib/actions/result";

type PostForumQuestionFormProps = {
  /** The existing tags, offered as the question's domain. */
  domains: PublicTag[];
};

export function PostForumQuestionForm({ domains }: PostForumQuestionFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [domainId, setDomainId] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!domainId) {
      setError("יש לבחור תחום לשאלה.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const question = unwrap(await submitForumQuestion({ title, content, domain_tag_id: domainId, tags }));
      setTitle("");
      setContent("");
      setDomainId("");
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
      <DomainSelect domains={domains} value={domainId} onChange={setDomainId} />
      <TagInput value={tags} onChange={setTags} label="תגיות נוספות (לא חובה)" />
      {error && <p className="error">{error}</p>}
      <button type="submit" className="button" disabled={loading || domains.length === 0}>{loading ? "מפרסם..." : "פרסום שאלה"}</button>
    </form>
  );
}
