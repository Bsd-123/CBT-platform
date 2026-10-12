import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FilePreviewButton } from "@/components/materials/FilePreviewButton";
import { previewErrorMessage, previewKindForKey } from "@/lib/files/preview";

const KEY = "materials/0b9f2b1e-7c1d-4c55-9c0a-5a1b2c3d4e5f/1700000000000-lesson.";

describe("previewKindForKey", () => {
  it("picks a viewer by file type", () => {
    expect(previewKindForKey(`${KEY}pdf`)).toBe("pdf");
    expect(previewKindForKey(`${KEY}PNG`)).toBe("image");
    expect(previewKindForKey(`${KEY}jpeg`)).toBe("image");
    expect(previewKindForKey(`${KEY}mp4`)).toBe("video");
    expect(previewKindForKey(`${KEY}mp3`)).toBe("audio");
    expect(previewKindForKey(`${KEY}txt`)).toBe("text");
  });

  it("falls back to download-only for types without an inline view", () => {
    expect(previewKindForKey(`${KEY}docx`)).toBe("none");
    expect(previewKindForKey(`${KEY}pptx`)).toBe("none");
    expect(previewKindForKey("materials/u/noextension")).toBe("none");
  });
});

describe("previewErrorMessage", () => {
  it("explains the refusals a member can hit", () => {
    expect(previewErrorMessage(401)).toContain("להתחבר");
    expect(previewErrorMessage(404)).toContain("לא נמצא");
    expect(previewErrorMessage(429)).toContain("בקשות");
    expect(previewErrorMessage(500)).toContain("לא ניתן להציג");
  });
});

describe("FilePreviewButton", () => {
  it("renders a button that opens a dialog, and no dialog or download until then", () => {
    const html = renderToStaticMarkup(<FilePreviewButton fileKey={`${KEY}pdf`} />);
    expect(html).toMatch(/^<button /);
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain("צפייה בקובץ");
    expect(html).not.toContain("/api/files/");
    expect(html).not.toContain('role="dialog"');
  });
});
