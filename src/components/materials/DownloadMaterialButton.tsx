"use client";

import { useState } from "react";
import { fileDownloadPath } from "@/lib/files/path";

type DownloadMaterialButtonProps = {
  fileKey: string;
  label?: string;
};

const FAILURE_MESSAGES: Record<number, string> = {
  401: "יש להתחבר מחדש כדי להמשיך.",
  404: "הקובץ לא נמצא.",
  429: "יותר מדי בקשות. נסו שוב בעוד רגע.",
  502: "שירות האחסון אינו נגיש כרגע מהרשת של השרת (ייתכן שהוא חסום במסנן).",
};

/**
 * Downloads from the app's own domain (`/api/files/...`). A quick HEAD request first lets us
 * show a readable message when access is refused, instead of landing on a bare error page.
 */
export function DownloadMaterialButton({
  fileKey,
  label = "הורדת קובץ",
}: DownloadMaterialButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setError(null);
    setLoading(true);

    try {
      const url = fileDownloadPath(fileKey);
      const check = await fetch(url, { method: "HEAD", credentials: "same-origin" });
      if (!check.ok) throw new Error(FAILURE_MESSAGES[check.status] ?? "ההורדה נכשלה. נסו שוב.");

      const link = document.createElement("a");
      link.href = url;
      link.download = "";
      document.body.append(link);
      link.click();
      link.remove();
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "ההורדה נכשלה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <button type="button" className="materials-btn-secondary" disabled={loading} onClick={() => void handleDownload()}>
        {loading ? "מכין..." : label}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
