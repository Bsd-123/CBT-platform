import "server-only";
import type { ReportTargetType } from "@prisma/client";
import { prisma } from "@/lib/db";

async function deleteForumAnswerTree(answer_id: string): Promise<void> {
  const replies = await prisma.forumAnswer.findMany({
    where: { parent_answer_id: answer_id },
    select: { id: true },
  });

  for (const reply of replies) {
    await deleteForumAnswerTree(reply.id);
  }

  await prisma.forumLike.deleteMany({
    where: { target_type: "answer", target_id: answer_id },
  });
  await prisma.forumAnswer.delete({ where: { id: answer_id } });
}

async function deleteProfessionalRequestCommentTree(comment_id: string): Promise<void> {
  const replies = await prisma.professionalRequestComment.findMany({
    where: { parent_comment_id: comment_id },
    select: { id: true },
  });

  for (const reply of replies) {
    await deleteProfessionalRequestCommentTree(reply.id);
  }

  await prisma.professionalRequestComment.delete({ where: { id: comment_id } });
}

export async function setReportedContentHidden(
  target_type: ReportTargetType,
  target_id: string,
  is_hidden: boolean,
): Promise<void> {
  switch (target_type) {
    case "material":
      await prisma.material.update({ where: { id: target_id }, data: { is_hidden } });
      return;
    case "forum_question":
      await prisma.forumQuestion.update({ where: { id: target_id }, data: { is_hidden } });
      return;
    case "forum_answer":
      await prisma.forumAnswer.update({ where: { id: target_id }, data: { is_hidden } });
      return;
    case "recommendation":
      await prisma.recommendation.update({ where: { id: target_id }, data: { is_hidden } });
      return;
    case "event":
      await prisma.event.update({ where: { id: target_id }, data: { is_hidden } });
      return;
    case "professional_request":
      await prisma.professionalRequest.update({
        where: { id: target_id },
        data: { is_hidden },
      });
      return;
    default:
      throw new Error("Unsupported report target type.");
  }
}

export async function deleteReportedContent(
  target_type: ReportTargetType,
  target_id: string,
): Promise<void> {
  switch (target_type) {
    case "material":
      await prisma.materialRating.deleteMany({ where: { material_id: target_id } });
      await prisma.entityTag.deleteMany({
        where: { entity_type: "material", entity_id: target_id },
      });
      await prisma.material.delete({ where: { id: target_id } });
      return;
    case "forum_question": {
      const answers = await prisma.forumAnswer.findMany({
        where: { question_id: target_id },
        select: { id: true },
      });
      for (const answer of answers) {
        await deleteForumAnswerTree(answer.id);
      }
      await prisma.forumLike.deleteMany({
        where: { target_type: "question", target_id },
      });
      await prisma.entityTag.deleteMany({
        where: { entity_type: "forum", entity_id: target_id },
      });
      await prisma.forumQuestion.delete({ where: { id: target_id } });
      return;
    }
    case "forum_answer":
      await deleteForumAnswerTree(target_id);
      return;
    case "recommendation":
      await prisma.recommendationComment.deleteMany({
        where: { recommendation_id: target_id },
      });
      await prisma.entityTag.deleteMany({
        where: { entity_type: "recommendation", entity_id: target_id },
      });
      await prisma.recommendation.delete({ where: { id: target_id } });
      return;
    case "event":
      await prisma.eventComment.deleteMany({ where: { event_id: target_id } });
      await prisma.entityTag.deleteMany({
        where: { entity_type: "event", entity_id: target_id },
      });
      await prisma.event.delete({ where: { id: target_id } });
      return;
    case "professional_request": {
      const comments = await prisma.professionalRequestComment.findMany({
        where: { request_id: target_id, parent_comment_id: null },
        select: { id: true },
      });
      for (const comment of comments) {
        await deleteProfessionalRequestCommentTree(comment.id);
      }
      await prisma.entityTag.deleteMany({
        where: { entity_type: "professional_request", entity_id: target_id },
      });
      await prisma.professionalRequest.delete({ where: { id: target_id } });
      return;
    }
    default:
      throw new Error("Unsupported report target type.");
  }
}

export async function hideReportedContent(
  target_type: ReportTargetType,
  target_id: string,
): Promise<void> {
  return setReportedContentHidden(target_type, target_id, true);
}

export async function restoreReportedContent(
  target_type: ReportTargetType,
  target_id: string,
): Promise<void> {
  return setReportedContentHidden(target_type, target_id, false);
}
