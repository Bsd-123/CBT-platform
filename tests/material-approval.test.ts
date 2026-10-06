import { describe, expect, it } from "vitest";
import {
  canReviewMaterials,
  canViewMaterial,
  initialApprovalFor,
} from "@/lib/materials/approval";

const owner = "0b9f2b1e-7c1d-4c55-9c0a-5a1b2c3d4e5f";
const other = "1c0a3c2f-8d2e-4d66-8d1b-6b2c3d4e5f60";

describe("material approval rules", () => {
  it("only experts and admins can review", () => {
    expect(canReviewMaterials("expert")).toBe(true);
    expect(canReviewMaterials("admin")).toBe(true);
    expect(canReviewMaterials("user")).toBe(false);
    expect(canReviewMaterials(null)).toBe(false);
  });

  it("regular uploads are pending; expert and admin uploads are auto-approved", () => {
    expect(initialApprovalFor("user")).toEqual({ approval_status: "pending", autoApproved: false });
    expect(initialApprovalFor("expert").approval_status).toBe("approved");
    expect(initialApprovalFor("admin").approval_status).toBe("approved");
  });

  it("approved materials are visible to everyone, even anonymous", () => {
    expect(canViewMaterial({ user_id: owner, approval_status: "approved" }, null)).toBe(true);
  });

  it("pending and rejected materials are visible only to the owner and reviewers", () => {
    for (const status of ["pending", "rejected"] as const) {
      const material = { user_id: owner, approval_status: status };
      expect(canViewMaterial(material, null)).toBe(false);
      expect(canViewMaterial(material, { userId: other, role: "user" })).toBe(false);
      expect(canViewMaterial(material, { userId: owner, role: "user" })).toBe(true);
      expect(canViewMaterial(material, { userId: other, role: "expert" })).toBe(true);
      expect(canViewMaterial(material, { userId: other, role: "admin" })).toBe(true);
    }
  });
});
