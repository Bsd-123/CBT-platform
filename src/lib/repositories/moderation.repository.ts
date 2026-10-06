import "server-only";
import type { Prisma, ReportTargetType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { deleteObjectFromR2 } from "@/lib/r2";

type Tx = Prisma.TransactionClient;

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

/** The answer and all of its nested replies, found level by level (no N+1 per row). */
async function collectAnswerTreeIds(tx: Tx, rootId: string): Promise<string[]> {
  const ids = [rootId];
  let frontier = [rootId];
  while (frontier.length > 0) {
    const children = await tx.forumAnswer.findMany({
      where: { parent_answer_id: { in: frontier } },
      select: { id: true },
    });
    frontier = children.map((child) => child.id);
    ids.push(...frontier);
  }
  return ids;
}

async function deleteAnswers(tx: Tx, answerIds: string[]): Promise<void> {
  if (answerIds.length === 0) return;
  await tx.forumLike.deleteMany({
    where: { target_type: "answer", target_id: { in: answerIds } },
  });
  // One statement: the self-referencing FK is checked at statement end.
  await tx.forumAnswer.deleteMany({ where: { id: { in: answerIds } } });
}

/**
 * Deletes reported content and its dependants atomically. Returns the storage
 * key of an attached file, which the caller removes after the transaction commits.
 */
async function deleteInTransaction(
  target_type: ReportTargetType,
  target_id: string,
): Promise<string | null> {
  return prisma.$transaction(async (tx) => {
    switch (target_type) {
      case "material": {
        const material = await tx.material.findUnique({
          where: { id: target_id },
          select: { file_url: true },
        });
        await tx.materialRating.deleteMany({ where: { material_id: target_id } });
        await tx.entityTag.deleteMany({
          where: { entity_type: "material", entity_id: target_id },
        });
        await tx.material.delete({ where: { id: target_id } });
        return material?.file_url ?? null;
      }
      case "forum_question": {
        const answers = await tx.forumAnswer.findMany({
          where: { question_id: target_id },
          select: { id: true },
        });
        await deleteAnswers(tx, answers.map((answer) => answer.id));
        await tx.forumLike.deleteMany({
          where: { target_type: "question", target_id },
        });
        await tx.entityTag.deleteMany({
          where: { entity_type: "forum", entity_id: target_id },
        });
        await tx.forumQuestion.delete({ where: { id: target_id } });
        return null;
      }
      case "forum_answer":
        await deleteAnswers(tx, await collectAnswerTreeIds(tx, target_id));
        return null;
      case "recommendation":
        await tx.recommendationComment.deleteMany({
          where: { recommendation_id: target_id },
        });
        await tx.entityTag.deleteMany({
          where: { entity_type: "recommendation", entity_id: target_id },
        });
        await tx.recommendation.delete({ where: { id: target_id } });
        return null;
      case "event":
        await tx.eventComment.deleteMany({ where: { event_id: target_id } });
        await tx.entityTag.deleteMany({
          where: { entity_type: "event", entity_id: target_id },
        });
        await tx.event.delete({ where: { id: target_id } });
        return null;
      case "professional_request":
        await tx.professionalRequestComment.deleteMany({
          where: { request_id: target_id },
        });
        await tx.entityTag.deleteMany({
          where: { entity_type: "professional_request", entity_id: target_id },
        });
        await tx.professionalRequest.delete({ where: { id: target_id } });
        return null;
      default:
        throw new Error("Unsupported report target type.");
    }
  });
}

export async function deleteReportedContent(
  target_type: ReportTargetType,
  target_id: string,
): Promise<void> {
  const fileKey = await deleteInTransaction(target_type, target_id);

  if (fileKey) {
    try {
      await deleteObjectFromR2(fileKey);
    } catch (error) {
      // The database is already consistent; an orphaned object is harmless to users.
      console.error("[moderation] failed to delete stored file", fileKey, error);
    }
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
