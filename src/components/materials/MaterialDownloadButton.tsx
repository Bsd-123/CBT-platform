"use client";

import { useState } from "react";
import { requestFileDownloadUrl } from "@/lib/actions/auth";

type MaterialDownloadButtonProps = {
  fileKey: string;
  label?: string;
};

export function MaterialDownloadButton({
  fileKey,
  label = "הורדת קובץ",
}: MaterialDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setError(null);
    setLoading(true);

    try {
      const url = await requestFileDownloadUrl(fileKey);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "ההורדה נכשלה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" className="button secondary" disabled={loading} onClick={() => void handleDownload()}>
        {loading ? "מכין..." : label}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
