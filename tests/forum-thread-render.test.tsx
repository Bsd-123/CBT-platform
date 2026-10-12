import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh() {}, replace() {}, push() {} }),
  usePathname: () => "/forum/q1",
}));
vi.mock("@/lib/actions/submit", () => ({
  submitForumAnswer: vi.fn(),
  submitForumLikeToggle: vi.fn(),
  submitContentReport: vi.fn(),
}));
vi.mock("@/components/ui/UiProvider", () => ({ useUi: () => ({ toast() {}, confirm: async () => true }) }));

import { ForumAnswerForm } from "@/components/forum/ForumAnswerForm";
import { ForumAnswersSection } from "@/components/forum/ForumAnswersSection";
import { ForumQuestionCard } from "@/components/forum/ForumQuestionCard";
import type { PublicForumAnswerWithLikes } from "@/lib/services/forum-likes";

const user = (id: string, full_name: string, role: "user" | "expert" | "admin" = "user") => ({
  id, full_name, title: null, role, created_at: new Date("2026-01-01T00:00:00Z"), expert_code: null,
});

const day = (d: number) => new Date(Date.UTC(2026, 9, d, 9, 0, 0));

function answer(
  id: string, userId: string, name: string, content: string, d: number, likes: number,
  role: "user" | "expert" | "admin" = "user", replies: PublicForumAnswerWithLikes[] = [],
): PublicForumAnswerWithLikes {
  return {
    id, question_id: "q1", user_id: userId, content, parent_answer_id: null, created_at: day(d),
    user: user(userId, name, role), like_count: likes, user_liked: false, replies,
  } as PublicForumAnswerWithLikes;
}

const asker = "u-asker";
const reply2 = answer("r1b", "u-3", "חנה אביב", "אצלנו ציפיות השתנו, לא SUDS.", 7, 1);
const reply1 = answer("r1a", asker, "רחל פרץ", "תודה, זה עוזר מאוד.", 6, 2, "user", [reply2]);
const answers = [
  answer("a-old", "u-1", "לאה בן דוד", "מומלץ להתחיל בניסוי קצר.", 5, 3, "admin", [reply1]),
  answer("a-top", "u-2", "ד״ר מרים לוי", "הסירוב הוא מידע. התחילו מהאמונה.\n\nשלב 1: ניבוי.", 6, 9, "expert"),
  answer("a-new", "u-4", "אסתר מזרחי", "אולי שעון דופק?", 9, 0),
];

const question = {
  id: "q1", user_id: asker, title: "איך בונים היררכיית חשיפה לנערה עם הפרעת פאניקה?",
  content: "היא מסרבת לתרגילים אינטרוצפטיביים.\nמה ניסיתם?", created_at: day(1),
  user: user(asker, "רחל פרץ"), answers, answer_count: 3, like_count: 4, user_liked: true,
};

function thread(sort: "top" | "newest" | "oldest") {
  return renderToStaticMarkup(
    <div className="fq-page">
      <ForumQuestionCard
        question={question as never}
        tags={[{ id: "t1", name: "פאניקה", color: "#ec4899" }]}
        answerCount={answers.length}
      />
      <ForumAnswersSection questionId="q1" questionOwnerId={asker} answers={answers} sort={sort} />
      <section id="answer-form" className="fq-card fq-composer">
        <h2>התשובה שלך</h2>
        <ForumAnswerForm questionId="q1" />
      </section>
    </div>,
  );
}

describe("forum thread rendering", () => {
  it("shows the most-liked answer in a highlighted card above the rest", () => {
    const html = thread("top");
    expect(html.match(/fq-answer--top/g)).toHaveLength(1);
    expect(html).toContain("התשובה המובילה");
    expect(html.indexOf("a-top")).toBeLessThan(html.indexOf("a-old"));
    expect(html.indexOf("a-top")).toBeLessThan(html.indexOf("a-new"));
  });

  it("orders the remaining answers by the chosen sort, keeping the top answer first", () => {
    const order = (html: string) => ["a-old", "a-new"].map((id) => html.indexOf(`answer-${id}`));
    const [oldTop, newTop] = order(thread("top"));
    expect(oldTop).toBeLessThan(newTop); // 3 likes before 0
    const [oldNewest, newNewest] = order(thread("newest"));
    expect(newNewest).toBeLessThan(oldNewest);
    const html = thread("newest");
    expect(html.indexOf("answer-a-top")).toBeLessThan(html.indexOf("answer-a-new"));
  });

  it("nests replies under their parent with guide-line containers", () => {
    const html = thread("top");
    expect(html.match(/class="fq-replies"/g)).toHaveLength(2); // reply1 under a-old, reply2 under reply1
    expect(html.indexOf("answer-a-old")).toBeLessThan(html.indexOf("answer-r1a"));
    expect(html.indexOf("answer-r1a")).toBeLessThan(html.indexOf("answer-r1b"));
    expect(html.match(/fq-answer--reply/g)).toHaveLength(2);
  });

  it("marks the asker (OP), experts and admins, and keeps one h1", () => {
    const html = thread("top");
    expect(html).toContain('data-kind="op"');
    expect(html).toContain('data-kind="expert"');
    expect(html).toContain('data-kind="admin"');
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("3 תשובות");
  });

  it("renders the sort select and the composer", () => {
    const html = thread("newest");
    expect(html).toContain('id="answer-sort"');
    expect(html).toMatch(/<option value="newest" selected/);
    expect(html).toContain("פרסום תשובה");
    expect(html).toContain('id="answer-root"');
  });

  it("writes a preview document for visual checks when asked", () => {
    if (!process.env.FORUM_PREVIEW_DIR) return;
    mkdirSync(process.env.FORUM_PREVIEW_DIR, { recursive: true });
    const page = (body: string) =>
      `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap">` +
      `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap">` +
      `<link rel="stylesheet" href="/src/app/globals.css"></head><body><main>${body}</main></body></html>`;
    writeFileSync(join(process.env.FORUM_PREVIEW_DIR, "thread.html"), page(thread("top")));
  });
});
