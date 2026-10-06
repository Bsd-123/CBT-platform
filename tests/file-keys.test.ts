import { describe, expect, it } from "vitest";
import {
  buildMaterialFileKey,
  isFileKeyOwnedBy,
  isValidFileKey,
} from "@/lib/r2/signed-url";

const user = "0b9f2b1e-7c1d-4c55-9c0a-5a1b2c3d4e5f";
const other = "1c0a3c2f-8d2e-4d66-8d1b-6b2c3d4e5f60";

describe("file keys", () => {
  it("accepts keys produced by the builder", () => {
    const key = buildMaterialFileKey(user, "דוח מסכם.pdf");
    expect(isValidFileKey(key)).toBe(true);
    expect(isFileKeyOwnedBy(key, user, "materials")).toBe(true);
  });

  it("collapses repeated dots in file names", () => {
    expect(isValidFileKey(buildMaterialFileKey(user, "a..b.pdf"))).toBe(true);
  });

  it("rejects another user's key, wrong prefix and traversal", () => {
    const key = buildMaterialFileKey(other, "a.pdf");
    expect(isFileKeyOwnedBy(key, user, "materials")).toBe(false);
    expect(
      isFileKeyOwnedBy(buildMaterialFileKey(user, "a.pdf"), user, "material-responses"),
    ).toBe(false);
    expect(isValidFileKey(`materials/${user}/../${other}/1-a.pdf`)).toBe(false);
    expect(isValidFileKey("materials/x")).toBe(false);
  });
});
