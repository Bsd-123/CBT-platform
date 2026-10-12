import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DownloadMaterialButton } from "@/components/materials/DownloadMaterialButton";

const KEY = "materials/0b9f2b1e-7c1d-4c55-9c0a-5a1b2c3d4e5f/1700000000000-lesson.";

describe("download button", () => {
  it("is a real link that opens in a new tab, so a network filter's page can be shown", () => {
    const html = renderToStaticMarkup(<DownloadMaterialButton fileKey={`${KEY}pdf`} />);
    expect(html).toMatch(/^<a /);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain("download=");
    expect(html).toContain("הורדת קובץ");
  });

  it("points at the app's own domain, never at the storage host", () => {
    const html = renderToStaticMarkup(<DownloadMaterialButton fileKey={`${KEY}pdf`} />);
    expect(html).toContain('href="/api/files/materials/');
    expect(html).not.toMatch(/cloudflarestorage|X-Amz/i);
  });

  it("opens viewable types in the tab and downloads the rest", () => {
    expect(renderToStaticMarkup(<DownloadMaterialButton fileKey={`${KEY}pdf`} />)).toContain("?inline=1");
    expect(renderToStaticMarkup(<DownloadMaterialButton fileKey={`${KEY}png`} />)).toContain("?inline=1");
    expect(renderToStaticMarkup(<DownloadMaterialButton fileKey={`${KEY}docx`} />)).not.toContain("inline=1");
  });
});
