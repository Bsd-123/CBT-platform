import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {} }) }));
vi.mock("@/lib/actions/admin", () => ({
  adminDeleteReportedContent: vi.fn(),
  adminHideReportedContent: vi.fn(),
  adminRestoreReportedContent: vi.fn(),
  resolveReport: vi.fn(),
}));
vi.mock("@/components/ui/UiProvider", () => ({ useUi: () => ({ toast() {}, confirm: async () => true }) }));

import { AdminReportsList } from "@/components/admin/AdminReportsList";

const report = (id: string, target_type: string, target_id: string, content: unknown) =>
  ({
    id, user_id: "u1", target_type, target_id, reason: "spam", status: "open",
    created_at: new Date("2026-10-01T00:00:00Z"), user: { full_name: "דבורה כהן" }, content,
  }) as never;

describe("admin reports list", () => {
  const html = renderToStaticMarkup(
    <AdminReportsList
      reports={[
        report("r1", "forum_question", "q1", {
          found: true, title: "Hidden question", excerpt: "the question body", is_hidden: true, parent_id: null,
        }),
        report("r2", "forum_answer", "a1", {
          found: true, title: null, excerpt: "an answer body", is_hidden: false, parent_id: "q9",
        }),
        report("r3", "event", "e1", null),
      ]}
    />,
  );

  it("shows the reported content with a hidden marker", () => {
    expect(html).toContain("Hidden question");
    expect(html).toContain("the question body");
    expect(html).toContain("מוסתר");
  });

  it("links a reported answer to its place in the question", () => {
    expect(html).toContain('href="/forum/q9#answer-a1"');
  });

  it("says so when the content no longer exists", () => {
    expect(html).toContain("התוכן נמחק או שאינו זמין.");
  });
});
