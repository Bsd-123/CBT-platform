import { readdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "@/components/layout/SiteFooter";

const LEGAL_PATHS = ["/terms", "/privacy", "/accessibility", "/contact"];

describe("site footer", () => {
  const html = renderToStaticMarkup(<SiteFooter />);

  it("is a footer landmark with a labelled nav for the legal and support links", () => {
    expect(html).toMatch(/^<footer /);
    expect(html).toContain('aria-labelledby="footer-legal"');
    expect(html).toContain('id="footer-legal"');
  });

  it("links to every legal and support page", () => {
    for (const path of LEGAL_PATHS) {
      expect(html).toContain(`href="${path}"`);
    }
  });

  it("only links to pages that exist", () => {
    const pages = join(process.cwd(), "src", "app", "(info)");
    const existing = readdirSync(pages, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `/${entry.name}`);
    for (const path of LEGAL_PATHS) {
      expect(existing).toContain(path);
    }
  });
});
