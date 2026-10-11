import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push() {}, refresh() {} }) }));
vi.mock("@/lib/actions/submit", () => ({ submitForumQuestion: vi.fn() }));

import { PostForumQuestionForm } from "@/components/forum/PostForumQuestionForm";

const domains = [
  { id: "t1", name: "חרדה", color: "#ec4899" },
  { id: "t2", name: "דיכאון", color: "#8b5cf6" },
  { id: "t3", name: "ילדים", color: "#14b8a6" },
];

describe("new question form", () => {
  it("offers a required domain select listing the existing tags, unselected by default", () => {
    const html = renderToStaticMarkup(<PostForumQuestionForm domains={domains} />);
    expect(html).toContain('id="question-domain"');
    expect(html).toMatch(/<select[^>]*id="question-domain"[^>]*required/);
    expect(html).toContain("תחום (חובה)");
    expect(html).toContain("בחרו תחום...");
    for (const domain of domains) expect(html).toContain(`value="${domain.id}">${domain.name}`);
  });

  it("makes the extra tags optional", () => {
    const html = renderToStaticMarkup(<PostForumQuestionForm domains={domains} />);
    expect(html).toContain("תגיות נוספות (לא חובה)");
    expect(html).not.toMatch(/<input[^>]*id="tags"[^>]*required/);
  });

  it("blocks publishing and explains when there are no domains", () => {
    const html = renderToStaticMarkup(<PostForumQuestionForm domains={[]} />);
    expect(html).toContain("אין תחומים זמינים");
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled/);
  });

  it("writes a preview document for visual checks when asked", () => {
    if (!process.env.FORUM_PREVIEW_DIR) return;
    mkdirSync(process.env.FORUM_PREVIEW_DIR, { recursive: true });
    const form = renderToStaticMarkup(<PostForumQuestionForm domains={domains} />);
    const page =
      `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap">` +
      `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap">` +
      `<link rel="stylesheet" href="/src/app/globals.css"></head><body><main><div class="ui-dialog" style="position:static;max-width:34rem;margin:auto"><div class="ui-dialog-header"><h2>פרסום שאלה</h2></div><div class="ui-dialog-body">${form}</div></div></main></body></html>`;
    writeFileSync(join(process.env.FORUM_PREVIEW_DIR, "form.html"), page);
  });
});
