import { describe, expect, it } from "vitest";
import { getTagBadgeStyle, isTagColorKey, resolveTagColor } from "@/lib/utils/tag-colors";

describe("tag colors", () => {
  it("keeps palette keys as-is", () => {
    expect(resolveTagColor("sage")).toBe("sage");
    expect(isTagColorKey("plum")).toBe(true);
  });

  it("maps legacy hex presets to the nearest palette key", () => {
    expect(resolveTagColor("#ec4899")).toBe("rose");
    expect(resolveTagColor("#14B8A6")).toBe("sage");
  });

  it("falls back to slate for empty or unknown values", () => {
    expect(resolveTagColor(null)).toBe("slate");
    expect(resolveTagColor("#123456")).toBe("slate");
    expect(isTagColorKey("#123456")).toBe(false);
  });

  it("renders soft background with same-hue text via tokens", () => {
    expect(getTagBadgeStyle("sea")).toEqual({
      backgroundColor: "var(--tag-sea-bg)",
      color: "var(--tag-sea-fg)",
    });
  });
});
