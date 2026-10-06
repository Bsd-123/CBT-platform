"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicMaterialType } from "@/lib/models/material-type";
import type { PublicTag } from "@/lib/models/tag";
import { TagSelect } from "@/components/shared/TagSelect";
import { uploadMaterialFileResilient } from "@/lib/client/upload-api";
import { submitMaterialUpload } from "@/lib/actions/submit";
import { unwrap } from "@/lib/actions/result";

type UploadMaterialFormProps = {
  materialTypes: PublicMaterialType[];
  tags: PublicTag[];
  /** True for regular users: the upload waits for an expert before it is published. */
  requiresApproval?: boolean;
};

export function UploadMaterialForm({
  materialTypes,
  tags,
  requiresApproval = false,
}: UploadMaterialFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialTypeId, setMaterialTypeId] = useState(materialTypes[0]?.id ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("יש לבחור קובץ להעלאה.");
      return;
    }
    if (selectedTagIds.length === 0) {
      setError("יש לבחור לפחות תגית אחת.");
      return;
    }
    if (!materialTypeId) {
      setError("לא נמצאו סוגי חומר. הריצו db:seed או הוסיפו סוגים בניהול.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const fileUrl = await uploadMaterialFileResilient(file);

      const material = unwrap(await submitMaterialUpload({
        title,
        description,
        material_type_id: materialTypeId,
        file_url: fileUrl,
        tag_ids: selectedTagIds,
      }));

      router.push(`/materials/${material.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "ההעלאה נכשלה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <h2>העלאת חומר</h2>
      {requiresApproval && (
        <p className="banner-warning">
          חומרים שמועלים על ידי משתמשים מתפרסמים בספרייה רק לאחר אישור מומחה. תקבלו התראה כשהחומר יאושר או יידחה.
        </p>
      )}
      <div className="form-field">
        <label htmlFor="material-title">כותרת</label>
        <input id="material-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="material-description">תיאור</label>
        <textarea id="material-description" rows={4} required value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="form-field">
        <label htmlFor="material-type">סוג חומר</label>
        <select id="material-type" required value={materialTypeId} onChange={(e) => setMaterialTypeId(e.target.value)}>
          {materialTypes.map((type) => (
            <option key={type.id} value={type.id}>{type.label}</option>
          ))}
        </select>
      </div>
      <TagSelect tags={tags} value={selectedTagIds} onChange={setSelectedTagIds} required />
      <div className="form-field">
        <label htmlFor="material-file">קובץ</label>
        <input id="material-file" type="file" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="materials-btn-primary" disabled={loading}>
        {loading ? "מעלה..." : "העלאת חומר"}
      </button>
    </form>
  );
}
