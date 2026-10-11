"use client";

import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { useUi } from "@/components/ui/UiProvider";

type ShareButtonProps = {
  /** Path (and optional #anchor) to share, e.g. "/forum/123#answer-456". */
  path: string;
  label?: string;
};

/** Copies a link to the clipboard and confirms with the app's toast. */
export function ShareButton({ path, label = "שיתוף" }: ShareButtonProps) {
  const { toast } = useUi();

  async function handleShare() {
    const url = new URL(path, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      toast("הקישור הועתק");
    } catch {
      // Clipboard access can be refused (permissions, insecure context): show the link instead.
      toast(`העתיקו את הקישור: ${url}`, "error");
    }
  }

  return (
    <button type="button" className="fq-action" onClick={() => void handleShare()}>
      <MaterialIcon name="share" />
      {label}
    </button>
  );
}
