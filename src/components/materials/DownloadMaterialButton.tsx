"use client";

import { useState } from "react";
import { requestFileDownloadUrl } from "@/lib/actions/auth";

type DownloadMaterialButtonProps = {
  fileKey: string;
  label?: string;
};

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
      const url = await requestFileDownloadUrl(fileKey);
      window.open(url, "_blank", "noopener,noreferrer");
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
