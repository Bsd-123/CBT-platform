import { fileDownloadPath, fileNameFromKey } from "@/lib/files/path";
import { canViewInline } from "@/lib/uploads/file-policy";

type DownloadMaterialButtonProps = {
  fileKey: string;
  label?: string;
};

/**
 * A plain link that opens the file in a new tab, on the app's own domain.
 *
 * It must be a real navigation, not a script-triggered download: network filters answer an
 * unknown file with their own HTML page ("this file will be filtered, continue?"). A navigation
 * shows that page so the member can click through; a forced download tries to save the page as
 * a file and fails. Viewable types (PDF, images, audio, video, text) open in the tab; the rest
 * are downloaded once the filter's page is dismissed.
 */
export function DownloadMaterialButton({
  fileKey,
  label = "הורדת קובץ",
}: DownloadMaterialButtonProps) {
  const inline = canViewInline(fileNameFromKey(fileKey));

  return (
    <a
      className="btn btn-secondary"
      href={fileDownloadPath(fileKey, { inline })}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
    </a>
  );
}
