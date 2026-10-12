import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {} }) }));
vi.mock("@/lib/actions/submit", () => ({
  submitProfessionalRequestComment: vi.fn(),
  submitContentReport: vi.fn(),
}));

import { ProfessionalRequestThread } from "@/components/professional-requests/ProfessionalRequestThread";

const user = { id: "u1", full_name: "רחל פרץ", title: null, role: "user" as const, created_at: new Date(), expert_code: null };
const request = {
  id: "r1", title: "איך מתחילים טיפול בחשיפה?", description: "מחפשת הכוונה.", created_at: new Date("2026-10-01T09:00:00Z"), user,
};
const comment = (id: string, content: string, replies: unknown[] = []) =>
  ({ id, request_id: "r1", user_id: "u1", content, parent_comment_id: null, created_at: new Date("2026-10-02T09:00:00Z"), user, replies }) as never;

describe("professional request thread", () => {
  it("uses the recommendations thread layout with the request as the parent bubble", () => {
    const html = renderToStaticMarkup(<ProfessionalRequestThread request={request} comments={[]} />);
    expect(html).toContain("rec-chat-thread");
    expect(html).toContain("rec-chat-message--parent");
    expect(html).toContain("פנייה מקצועית");
    expect(html).toContain("איך מתחילים טיפול בחשיפה?");
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it("hides the response form until the add-response button is pressed", () => {
    const html = renderToStaticMarkup(<ProfessionalRequestThread request={request} comments={[]} />);
    expect(html).toContain("הוסיפו תגובה ראשונה");
    expect(html).not.toContain("<textarea");
    expect(html).not.toContain("rec-chat-reply-form");
  });

  it("nests replies under their comment and offers a reply button per comment", () => {
    const html = renderToStaticMarkup(
      <ProfessionalRequestThread request={request} comments={[comment("c1", "תגובה ראשונה", [comment("c2", "מענה")])]} />,
    );
    expect(html).toContain("הוספת תגובה");
    expect(html).toContain("rec-chat-nested-replies");
    expect(html.indexOf("תגובה ראשונה")).toBeLessThan(html.indexOf("מענה"));
    expect(html.match(/>השב</g)).toHaveLength(2);
    expect(html).not.toContain("<textarea");
  });
});
