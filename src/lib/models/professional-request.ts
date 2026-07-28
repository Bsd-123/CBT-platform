import type {
  ProfessionalRequest,
  ProfessionalRequestComment,
} from "@prisma/client";
import { pickPublicUserFields } from "@/lib/models/user";

export type { ProfessionalRequest, ProfessionalRequestComment };

export type CreateProfessionalRequestInput = {
  user_id: string;
  title: string;
  description: string;
};

export type CreateProfessionalRequestCommentInput = {
  request_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string | null;
};

export function pickPublicProfessionalRequestFields(
  request: ProfessionalRequest & {
    user?: Parameters<typeof pickPublicUserFields>[0];
    comments?: Parameters<typeof pickPublicProfessionalRequestCommentFields>[0][];
  },
) {
  return {
    id: request.id,
    user_id: request.user_id,
    title: request.title,
    description: request.description,
    created_at: request.created_at,
    user: request.user ? pickPublicUserFields(request.user) : undefined,
    comments: request.comments?.map(pickPublicProfessionalRequestCommentFields),
  };
}

export type PublicProfessionalRequestComment = {
  id: string;
  request_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: Date;
  user?: ReturnType<typeof pickPublicUserFields>;
  replies?: PublicProfessionalRequestComment[];
};

export function pickPublicProfessionalRequestCommentFields(
  comment: ProfessionalRequestComment & {
    user?: Parameters<typeof pickPublicUserFields>[0];
    replies?: Parameters<typeof pickPublicProfessionalRequestCommentFields>[0][];
  },
): PublicProfessionalRequestComment {
  return {
    id: comment.id,
    request_id: comment.request_id,
    user_id: comment.user_id,
    content: comment.content,
    parent_comment_id: comment.parent_comment_id,
    created_at: comment.created_at,
    user: comment.user ? pickPublicUserFields(comment.user) : undefined,
    replies: comment.replies?.map(pickPublicProfessionalRequestCommentFields),
  };
}

export type PublicProfessionalRequest = ReturnType<
  typeof pickPublicProfessionalRequestFields
>;
