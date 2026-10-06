import { describe, expect, it } from "vitest";
import {
  buildPageHref,
  pageWindow,
  parsePage,
  totalPages,
} from "@/lib/utils/pagination";

describe("pagination helpers", () => {
  it("parses page numbers defensively", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("3")).toBe(3);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-4")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage(["2", "5"])).toBe(2);
    expect(parsePage("99999999")).toBe(10_000);
  });

  it("computes the query window and page count", () => {
    expect(pageWindow(1, 20)).toEqual({ skip: 0, take: 20 });
    expect(pageWindow(3, 20)).toEqual({ skip: 40, take: 20 });
    expect(totalPages(0, 20)).toBe(1);
    expect(totalPages(20, 20)).toBe(1);
    expect(totalPages(21, 20)).toBe(2);
  });

  it("keeps other params and omits page 1", () => {
    expect(buildPageHref("/forum", { q: "חרדה" }, 1)).toBe(
      `/forum?q=${encodeURIComponent("חרדה")}`,
    );
    expect(buildPageHref("/forum", {}, 1)).toBe("/forum");
    expect(buildPageHref("/materials", { type: "game", q: undefined }, 2)).toBe(
      "/materials?type=game&page=2",
    );
  });
});
