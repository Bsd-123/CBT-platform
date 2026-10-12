"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { useFocusTrap } from "@/components/ui/useFocusTrap";
import { FileFetchError, fetchImageSource } from "@/lib/files/encoded";
import { fileDownloadPath, fileNameFromKey } from "@/lib/files/path";
import { previewErrorMessage, previewKindForKey, type PreviewKind } from "@/lib/files/preview";

type FilePreviewButtonProps = {
  /** Storage key of the file (`materials/<user id>/<timestamp>-<name>`). */
  fileKey: string;
  /** Text of the button that opens the preview. */
  label?: string;
};

type Status = "checking" | "ready" | "error";

/** Below this width a PDF viewer is unusable, so the dialog offers the download instead. */
const NARROW_QUERY = "(max-width: 640px)";

function subscribeNarrow(onChange: () => void) {
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const isNarrow = () => window.matchMedia(NARROW_QUERY).matches;

/**
 * Opens a stored file in a dialog on the page instead of navigating away or forcing a download.
 *
 * The preview is the app's own `/api/files/...?inline=1` route (same origin, access-checked), and
 * the header always carries a small download link to the same route without `inline`. Images first
 * request the encoded JSON form so a client-side image filter cannot match the payload; other
 * types HEAD the route so a refusal becomes a readable message instead of raw JSON in a frame.
 */
export function FilePreviewButton({ fileKey, label = "צפייה בקובץ" }: FilePreviewButtonProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="btn btn-secondary"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <MaterialIcon name="visibility" />
        {label}
      </button>
      {open && <PreviewDialog fileKey={fileKey} onClose={close} />}
    </>
  );
}

function PreviewDialog({ fileKey, onClose }: { fileKey: string; onClose: () => void }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileName = fileNameFromKey(fileKey);
  const kind = previewKindForKey(fileKey);
  const isImage = kind === "image";
  const inlineUrl = fileDownloadPath(fileKey, { inline: true });
  const encodedUrl = fileDownloadPath(fileKey, { inline: true, encoded: true });
  const downloadUrl = fileDownloadPath(fileKey);
  const narrow = useSyncExternalStore(subscribeNarrow, isNarrow, () => false);

  // Documents need a viewer that phones do not have; media and images scale down fine.
  const canEmbed = kind !== "none" && !(narrow && (kind === "pdf" || kind === "text"));

  const [status, setStatus] = useState<Status>(canEmbed ? "checking" : "ready");
  const [errorMessage, setErrorMessage] = useState("");
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const releaseImageRef = useRef<(() => void) | null>(null);

  useFocusTrap(dialogRef, true);

  useEffect(() => {
    dialogRef.current?.focus();
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    if (!canEmbed) return;
    const controller = new AbortController();

    if (isImage) {
      fetchImageSource(encodedUrl, controller.signal)
        .then((source) => {
          if (controller.signal.aborted) {
            source.release();
            return;
          }
          releaseImageRef.current = source.release;
          setImageSrc(source.src);
          setStatus("ready");
        })
        .catch((error: unknown) => {
          if ((error as { name?: string }).name === "AbortError") return;
          const statusCode = error instanceof FileFetchError ? error.status : 0;
          setErrorMessage(previewErrorMessage(statusCode));
          setStatus("error");
        });

      return () => {
        controller.abort();
        releaseImageRef.current?.();
        releaseImageRef.current = null;
      };
    }

    fetch(inlineUrl, { method: "HEAD", signal: controller.signal })
      .then((response) => {
        if (response.ok) {
          setStatus("ready");
        } else {
          setErrorMessage(previewErrorMessage(response.status));
          setStatus("error");
        }
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name === "AbortError") return;
        setErrorMessage(previewErrorMessage(0));
        setStatus("error");
      });

    return () => controller.abort();
  }, [canEmbed, encodedUrl, inlineUrl, isImage]);

  function showError() {
    setErrorMessage(previewErrorMessage(0));
    setStatus("error");
  }

  return (
    <div
      className="ui-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="ui-dialog ui-dialog-preview"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="file-preview-header">
          <h2 id={titleId} className="file-preview-title" title={fileName}>
            {fileName}
          </h2>
          <a
            className="btn btn-secondary btn-sm"
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={imageSrc ? fileName : undefined}
            onClick={(event) => {
              if (!imageSrc) return;
              event.preventDefault();
              void (async () => {
                let href = imageSrc;
                let release = () => {};
                if (imageSrc.startsWith("data:")) {
                  const blob = await fetch(imageSrc).then((response) => response.blob());
                  href = URL.createObjectURL(blob);
                  release = () => URL.revokeObjectURL(href);
                }
                const link = document.createElement("a");
                link.href = href;
                link.download = fileName;
                link.rel = "noopener";
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.setTimeout(release, 1000);
              })();
            }}
          >
            <MaterialIcon name="download" />
            הורדה
          </a>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            aria-label="סגירה"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        <div className="file-preview-stage" aria-busy={status === "checking"}>
          {status === "checking" && (
            <div className="file-preview-state" role="status">
              <span className="spinner" aria-hidden="true" />
              <p>טוען את הקובץ…</p>
            </div>
          )}

          {status === "error" && (
            <FallbackPanel
              icon="error"
              title="לא ניתן להציג את הקובץ"
              message={errorMessage}
              downloadUrl={downloadUrl}
              showDownload={false}
            />
          )}

          {status === "ready" && !canEmbed && (
            <FallbackPanel
              icon="description"
              title={kind === "none" ? "אין תצוגה מקדימה לסוג קובץ זה" : "התצוגה המקדימה אינה זמינה במסך קטן"}
              message="אפשר להוריד את הקובץ ולפתוח אותו במכשיר."
              downloadUrl={downloadUrl}
              showDownload
            />
          )}

          {status === "ready" && canEmbed && (!isImage || imageSrc) && (
            <>
              {!frameLoaded && kind !== "image" && (
                <div className="file-preview-state file-preview-state-overlay" role="status">
                  <span className="spinner" aria-hidden="true" />
                  <p>טוען את הקובץ…</p>
                </div>
              )}
              <PreviewContent
                kind={kind}
                src={isImage ? imageSrc! : inlineUrl}
                name={fileName}
                onLoaded={() => setFrameLoaded(true)}
                onFailed={showError}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type PreviewContentProps = {
  kind: PreviewKind;
  src: string;
  name: string;
  onLoaded: () => void;
  onFailed: () => void;
};

function PreviewContent({ kind, src, name, onLoaded, onFailed }: PreviewContentProps) {
  switch (kind) {
    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element -- a private, access-checked file route
        <img className="file-preview-image" src={src} alt={name} onLoad={onLoaded} onError={onFailed} />
      );
    case "video":
      return (
        <video
          className="file-preview-media"
          src={src}
          controls
          preload="metadata"
          onLoadedMetadata={onLoaded}
          onError={onFailed}
        />
      );
    case "audio":
      return (
        <div className="file-preview-audio">
          <MaterialIcon name="audio_file" />
          <audio src={src} controls preload="metadata" onLoadedMetadata={onLoaded} onError={onFailed} />
        </div>
      );
    default:
      return <iframe className="file-preview-frame" src={src} title={name} onLoad={onLoaded} />;
  }
}

type FallbackPanelProps = {
  icon: string;
  title: string;
  message: string;
  downloadUrl: string;
  showDownload: boolean;
};

function FallbackPanel({ icon, title, message, downloadUrl, showDownload }: FallbackPanelProps) {
  return (
    <div className="file-preview-state" role="status">
      <MaterialIcon name={icon} className="file-preview-state-icon" />
      <h3>{title}</h3>
      <p>{message}</p>
      {showDownload && (
        <a className="btn btn-primary" href={downloadUrl} target="_blank" rel="noopener noreferrer">
          <MaterialIcon name="download" />
          הורדת הקובץ
        </a>
      )}
    </div>
  );
}
