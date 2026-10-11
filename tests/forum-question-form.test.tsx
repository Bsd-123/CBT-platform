import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push() {}, refresh() {} }) }));
vi.mock("@/lib/actions/submit", () => ({ submitForumQuestion: vi.fn() }));

import { PostForumQuestionForm } from "@/components/forum/PostForumQuestionForm";

const tags = [
  { id: "t1", name: "חרדה", color: "#ec4899" },
  { id: "t2", name: "דיכאון", color: "#8b5cf6" },
];

describe("new question form", () => {
  it("offers every existing tag as a clickable chip, none selected", () => {
    const html = renderToStaticMarkup(<PostForumQuestionForm tags={tags} />);
    expect(html.match(/class="tag-chip"/g)).toHaveLength(2);
    expect(html).not.toContain("is-selected");
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(2);
    for (const tag of tags) expect(html).toContain(tag.name);
  });

  it("marks tags as optional and never requires a selection", () => {
    const html = renderToStaticMarkup(<PostForumQuestionForm tags={tags} />);
    expect(html).toContain("תגיות (לא חובה)");
    expect(html).not.toContain("(חובה)");
    expect(html).not.toMatch(/<select/);
    expect(html).toMatch(/<button[^>]*type="submit"(?![^>]*disabled)/);
  });

  it("still lets the question be published when there are no tags to pick", () => {
    const html = renderToStaticMarkup(<PostForumQuestionForm tags={[]} />);
    expect(html).toMatch(/<button[^>]*type="submit"(?![^>]*disabled)/);
  });
});
