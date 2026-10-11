import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {} }) }));
vi.mock("@/lib/actions/submit", () => ({ submitEventComment: vi.fn() }));

import { EventCommentForm } from "@/components/events/EventCommentForm";

describe("event comment form", () => {
  const html = renderToStaticMarkup(<EventCommentForm eventId="e1" />);

  it("shows only the add-comment button at first", () => {
    expect(html).toContain("הוספת תגובה");
    expect(html).toMatch(/<button[^>]*aria-expanded="false"/);
  });

  it("keeps the form collapsed and hidden from assistive tech until opened", () => {
    expect(html).toMatch(/class="event-comment-panel"[^>]*aria-hidden="true"/);
    expect(html).not.toContain("is-open");
  });

  it("offers submit and cancel inside the form", () => {
    expect(html).toContain("פרסום תגובה");
    expect(html).toContain("ביטול");
  });
});
