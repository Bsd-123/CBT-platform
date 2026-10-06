import "server-only";
import type {
  CreateProfessionalRequestCommentInput,
  CreateProfessionalRequestInput,
  PublicProfessionalRequest,
  PublicProfessionalRequestComment,
} from "@/lib/models/professional-request";
import {
  pickPublicProfessionalRequestCommentFields,
  pickPublicProfessionalRequestFields,
} from "@/lib/models/professional-request";
import { prisma } from "@/lib/db";
import { notifyContentComment } from "@/lib/services/notifications";
import { visibleContentWhere } from "@/lib/db/visibility";

const requestInclude = {
  user: true,
  comments: {
    where: { parent_comment_id: null },
    include: {
      user: true,
      replies: {
        include: {
          user: true,
          replies: { include: { user: true } },
        },
      },
    },
    orderBy: { created_at: "asc" as const },
  },
} as const;

export async function getProfessionalRequestById(
  id: string,
  include_hidden = false,
): Promise<PublicProfessionalRequest | null> {
  const request = await prisma.professionalRequest.findFirst({
    where: { id, ...visibleContentWhere(include_hidden) },
    include: requestInclude,
  });
  return request ? pickPublicProfessionalRequestFields(request) : null;
}

export async function listProfessionalRequests(
  include_hidden = false,
): Promise<PublicProfessionalRequest[]> {
  const requests = await prisma.professionalRequest.findMany({
    where: visibleContentWhere(include_hidden),
    include: { user: true },
    orderBy: { created_at: "desc" },
  });
  return requests.map(pickPublicProfessionalRequestFields);
}

export async function createProfessionalRequest(
  input: CreateProfessionalRequestInput,
): Promise<PublicProfessionalRequest> {
  const request = await prisma.professionalRequest.create({
    data: input,
    include: { user: true },
  });
  return pickPublicProfessionalRequestFields(request);
}

export async function createProfessionalRequestComment(
  input: CreateProfessionalRequestCommentInput,
): Promise<PublicProfessionalRequestComment> {
  const request = await prisma.professionalRequest.findFirst({
    where: { id: input.request_id, ...visibleContentWhere() },
  });

  if (!request) {
    throw new Error("Professional request not found.");
  }

  if (input.parent_comment_id) {
    const parent = await prisma.professionalRequestComment.findUnique({
      where: { id: input.parent_comment_id },
      include: { parent: { select: { parent_comment_id: true } } },
    });
    if (!parent || parent.request_id !== input.request_id) {
      throw new Error("Invalid parent comment.");
    }
    // Reads render three levels (comment, reply, reply-to-reply).
    if (parent.parent?.parent_comment_id) {
      throw new Error("Maximum reply depth reached.");
    }
  }

  const comment = await prisma.professionalRequestComment.create({
    data: input,
    include: { user: true },
  });

  await notifyContentComment(
    request.user_id,
    "professional_request",
    request.id,
    input.user_id,
  );

  return pickPublicProfessionalRequestCommentFields(comment);
}

export async function listProfessionalRequestComments(
  request_id: string,
): Promise<PublicProfessionalRequestComment[]> {
  const comments = await prisma.professionalRequestComment.findMany({
    where: { request_id, parent_comment_id: null },
    include: {
      user: true,
      replies: {
        include: {
          user: true,
          replies: { include: { user: true } },
        },
      },
    },
    orderBy: { created_at: "asc" },
  });
  return comments.map(pickPublicProfessionalRequestCommentFields);
}
