import { describe, expect, it } from "vitest";
import {
  authorBadges,
  countReplies,
  initialsOf,
  parseAnswerSort,
  pickTopAnswer,
  sortAnswers,
} from "@/lib/forum/thread";

const answer = (id: string, day: number, likes: number) => ({
  id,
  created_at: new Date(Date.UTC(2026, 9, day)),
  like_count: likes,
});

describe("parseAnswerSort", () => {
  it("accepts the three known values and defaults otherwise", () => {
    expect(parseAnswerSort("newest")).toBe("newest");
    expect(parseAnswerSort("oldest")).toBe("oldest");
    expect(parseAnswerSort("top")).toBe("top");
    expect(parseAnswerSort("nonsense")).toBe("top");
    expect(parseAnswerSort(undefined)).toBe("top");
    expect(parseAnswerSort(["newest", "oldest"])).toBe("newest");
  });
});

describe("sortAnswers", () => {
  const list = [answer("a", 1, 2), answer("b", 2, 5), answer("c", 3, 5), answer("d", 4, 0)];

  it("orders by likes, then oldest first, without mutating the input", () => {
    expect(sortAnswers(list, "top").map((item) => item.id)).toEqual(["b", "c", "a", "d"]);
    expect(list.map((item) => item.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("orders by date", () => {
    expect(sortAnswers(list, "newest").map((item) => item.id)).toEqual(["d", "c", "b", "a"]);
    expect(sortAnswers(list, "oldest").map((item) => item.id)).toEqual(["a", "b", "c", "d"]);
  });
});

describe("pickTopAnswer", () => {
  it("returns the most liked answer, the older one on a tie", () => {
    expect(pickTopAnswer([answer("a", 1, 3), answer("b", 2, 3), answer("c", 3, 1)])?.id).toBe("a");
  });

  it("returns null when nobody liked anything or there are no answers", () => {
    expect(pickTopAnswer([answer("a", 1, 0), answer("b", 2, 0)])).toBeNull();
    expect(pickTopAnswer([])).toBeNull();
  });
});

describe("countReplies", () => {
  it("counts nested replies at every depth", () => {
    expect(countReplies({})).toBe(0);
    expect(countReplies({ replies: [{ replies: [{ replies: [] }, {}] }, {}] })).toBe(4);
  });
});

describe("authorBadges", () => {
  it("marks the asker and expert/admin roles", () => {
    expect(authorBadges({ authorId: "u1", questionOwnerId: "u1", role: "user" }).map((b) => b.kind)).toEqual(["op"]);
    expect(authorBadges({ authorId: "u2", questionOwnerId: "u1", role: "expert" }).map((b) => b.kind)).toEqual(["expert"]);
    expect(authorBadges({ authorId: "u1", questionOwnerId: "u1", role: "admin" }).map((b) => b.kind)).toEqual(["op", "admin"]);
    expect(authorBadges({ authorId: "u2", questionOwnerId: "u1", role: "user" })).toEqual([]);
    expect(authorBadges({ authorId: "u2", questionOwnerId: "u1" })).toEqual([]);
  });
});

describe("initialsOf", () => {
  it("takes up to two initials and survives empty names", () => {
    expect(initialsOf("דנה לוי")).toBe("דל");
    expect(initialsOf("  Noa  Perez  Cohen ")).toBe("NP");
    expect(initialsOf("Madonna")).toBe("M");
    expect(initialsOf("")).toBe("?");
    expect(initialsOf(null)).toBe("?");
  });
});
