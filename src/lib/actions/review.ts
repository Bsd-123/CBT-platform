"use server";

import { runAction } from "@/lib/actions/result";
import { requireRole } from "@/lib/auth";
import { UserFacingError } from "@/lib/errors";
import { decideMaterial } from "@/lib/data";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { notifyMaterialReviewed } from "@/lib/services/notifications";
import { materialReviewSchema, parseInput } from "@/lib/validation/schemas";

/** Experts and admins approve or reject a pending material; the first decision wins. */
export async function reviewMaterialUpload(raw: {
  material_id: string;
  decision: "approved" | "rejected";
  rejection_reason?: string;
}) {
  return runAction(async () => {
    const auth = await requireRole("expert", "admin");
    enforceRateLimit("write", auth.userId);
    const input = parseInput(materialReviewSchema, raw);

    let result: { owner_id: string; title: string };
    try {
      result = await decideMaterial({
        material_id: input.material_id,
        reviewer_id: auth.userId,
        decision: input.decision,
        rejection_reason: input.rejection_reason,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Material already reviewed.") {
        throw new UserFacingError("מומחה אחר כבר סיים את בדיקת החומר הזה.");
      }
      throw error;
    }

    await notifyMaterialReviewed(
      result.owner_id,
      input.material_id,
      input.decision,
      auth.userId,
    );
    return { decision: input.decision };
  });
}
