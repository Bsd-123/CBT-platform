import { describe, expect, it } from "vitest";
import { revive, toDbDate, toDbTime } from "@/lib/db/convert";
import { ilikeAny } from "@/lib/db/search";
import { buildReplyTree } from "@/lib/db/tree";

describe("revive", () => {
  it("converts timestamps, dates and times like Prisma did", () => {
    const row = revive<{
      created_at: Date;
      event_date: Date;
      event_time: Date;
      user: { created_at: Date };
      comments: { created_at: Date }[];
    }>({
      created_at: "2026-10-06T10:00:00+00:00",
      event_date: "2026-11-02",
      event_time: "18:30:00",
      user: { created_at: "2026-01-01T00:00:00Z" },
      comments: [{ created_at: "2026-10-07T00:00:00Z" }],
    });
    expect(row.created_at.toISOString()).toBe("2026-10-06T10:00:00.000Z");
    expect(row.event_date.toISOString()).toBe("2026-11-02T00:00:00.000Z");
    expect(row.event_time.toISOString()).toBe("1970-01-01T18:30:00.000Z");
    expect(row.user.created_at).toBeInstanceOf(Date);
    expect(row.comments[0].created_at).toBeInstanceOf(Date);
  });

  it("leaves nulls, other strings and Dates alone", () => {
    const out = revive<{ reviewed_at: null; title: string; created_at: Date }>({
      reviewed_at: null,
      title: "2026-01-01",
      created_at: new Date("2026-01-01T00:00:00Z"),
    });
    expect(out.reviewed_at).toBeNull();
    expect(out.title).toBe("2026-01-01");
    expect(out.created_at.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("accepts HH:MM times", () => {
    expect(revive<{ event_time: Date }>({ event_time: "09:05" }).event_time.toISOString()).toBe(
      "1970-01-01T09:05:00.000Z",
    );
  });
});

describe("toDbDate / toDbTime", () => {
  it("round-trips with revive", () => {
    const date = new Date("2026-11-02T00:00:00Z");
    const time = new Date("1970-01-01T18:30:00Z");
    expect(toDbDate(date)).toBe("2026-11-02");
    expect(toDbTime(time)).toBe("18:30:00");
    expect(toDbDate(null)).toBeNull();
    expect(toDbTime(undefined)).toBeUndefined();
  });
});

describe("ilikeAny", () => {
  it("builds an or-filter over the columns", () => {
    expect(ilikeAny(["title", "content"], "anxiety")).toBe(
      'title.ilike."%anxiety%",content.ilike."%anxiety%"',
    );
  });

  it("cannot be broken out of by quotes, wildcards or commas in the search text", () => {
    const filter = ilikeAny(["title"], 'a",id.eq.1,"b%_\');
    expect(filter.startsWith('title.ilike."%')).toBe(true);
    expect(filter.endsWith('%"')).toBe(true);
    // Only the surrounding pair of quotes remains: no quote or wildcard survives in the text.
    expect(filter.slice(0, -2).split('"').length).toBe(2);
    expect(filter).not.toMatch(/[_\]/);
  });
});

describe("buildReplyTree", () => {
  const items = [
    { id: "a", parent: null },
    { id: "b", parent: "a" },
    { id: "c", parent: "b" },
    { id: "d", parent: null },
    { id: "orphan", parent: "hidden-parent" },
  ];

  it("nests replies under their parents", () => {
    const tree = buildReplyTree(items, (item) => item.parent);
    expect(tree.map((node) => node.id)).toEqual(["a", "d"]);
    expect(tree[0].replies[0].id).toBe("b");
    expect(tree[0].replies[0].replies[0].id).toBe("c");
    expect(tree[1].replies).toEqual([]);
  });

  it("drops replies whose parent is missing (for example hidden)", () => {
    const tree = buildReplyTree(items, (item) => item.parent);
    const ids = JSON.stringify(tree);
    expect(ids).not.toContain("orphan");
  });
});
