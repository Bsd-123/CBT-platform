import "server-only";
import { createNotification } from "@/lib/repositories/notification.repository";

export async function notifyMaterialRequestResponse(
  requestOwnerId: string,
  requestId: string,
) {
  await createNotification({
    user_id: requestOwnerId,
    type: "material_request_response",
    reference_type: "material_request",
    reference_id: requestId,
  });
}

export async function notifyForumAnswer(
  questionOwnerId: string,
  questionId: string,
  actorId: string,
) {
  if (questionOwnerId === actorId) return;

  await createNotification({
    user_id: questionOwnerId,
    type: "forum_answer",
    reference_type: "forum",
    reference_id: questionId,
  });
}

export async function notifyRecommendationComment(
  recommendationOwnerId: string,
  recommendationId: string,
  actorId: string,
) {
  if (recommendationOwnerId === actorId) return;

  await createNotification({
    user_id: recommendationOwnerId,
    type: "comment_on_recommendation",
    reference_type: "recommendation",
    reference_id: recommendationId,
  });
}

export async function notifyContentComment(
  contentOwnerId: string,
  referenceType: "event" | "professional_request",
  referenceId: string,
  actorId: string,
) {
  if (contentOwnerId === actorId) return;

  await createNotification({
    user_id: contentOwnerId,
    type: "comment_on_content",
    reference_type: referenceType,
    reference_id: referenceId,
  });
}

export async function notifyMaterialReviewed(
  uploaderId: string,
  materialId: string,
  decision: "approved" | "rejected",
  reviewerId: string,
) {
  if (uploaderId === reviewerId) return;

  await createNotification({
    user_id: uploaderId,
    type: decision === "approved" ? "material_approved" : "material_rejected",
    reference_type: "material",
    reference_id: materialId,
  });
}
