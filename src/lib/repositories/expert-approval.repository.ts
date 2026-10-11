import "server-only";
import type {
  CreateExpertApprovalInput,
  ListExpertApprovalsFilter,
  PublicExpertApproval,
  UpdateExpertApprovalStatusInput,
} from "@/lib/models/expert-approval";
import {
  DEFAULT_EXPERT_APPROVAL_STATUS,
  pickPublicExpertApprovalFields,
} from "@/lib/models/expert-approval";
import { prisma } from "@/lib/db";

const expertApprovalInclude = {
  expert: true,
  user: true,
} as const;

export async function getExpertApprovalById(
  id: string,
): Promise<PublicExpertApproval | null> {
  const approval = await prisma.expertApproval.findUnique({
    where: { id },
    include: expertApprovalInclude,
  });

  return approval ? pickPublicExpertApprovalFields(approval) : null;
}

export async function getExpertApprovalByExpertAndUser(
  expert_id: string,
  user_id: string,
): Promise<PublicExpertApproval | null> {
  const approval = await prisma.expertApproval.findUnique({
    where: {
      expert_id_user_id: { expert_id, user_id },
    },
    include: expertApprovalInclude,
  });

  return approval ? pickPublicExpertApprovalFields(approval) : null;
}

export async function listPendingApprovalsForExpert(
  expert_id: string,
): Promise<PublicExpertApproval[]> {
  const approvals = await prisma.expertApproval.findMany({
    where: {
      expert_id,
      status: "pending",
    },
    include: expertApprovalInclude,
    orderBy: { created_at: "desc" },
  });

  return approvals.map(pickPublicExpertApprovalFields);
}

export async function listExpertApprovals(
  filter: ListExpertApprovalsFilter = {},
): Promise<PublicExpertApproval[]> {
  const search = filter.search?.trim();

  const approvals = await prisma.expertApproval.findMany({
    where: {
      ...(filter.status && { status: filter.status }),
      ...(search && {
        OR: [
          { user: { full_name: { contains: search, mode: "insensitive" } } },
          { user: { title: { contains: search, mode: "insensitive" } } },
          { expert: { full_name: { contains: search, mode: "insensitive" } } },
        ],
      }),
    },
    include: expertApprovalInclude,
    orderBy: { created_at: "desc" },
  });

  return approvals.map(pickPublicExpertApprovalFields);
}

export async function listExpertApprovalsForExpert(
  expert_id: string,
  filter: ListExpertApprovalsFilter = {},
): Promise<PublicExpertApproval[]> {
  const search = filter.search?.trim();

  const approvals = await prisma.expertApproval.findMany({
    where: {
      expert_id,
      ...(filter.status && { status: filter.status }),
      ...(search && {
        OR: [
          { user: { full_name: { contains: search, mode: "insensitive" } } },
          { user: { title: { contains: search, mode: "insensitive" } } },
        ],
      }),
    },
    include: expertApprovalInclude,
    orderBy: { created_at: "desc" },
  });

  return approvals.map(pickPublicExpertApprovalFields);
}

export async function createExpertApproval(
  input: CreateExpertApprovalInput,
): Promise<PublicExpertApproval> {
  const approval = await prisma.expertApproval.create({
    data: {
      expert_id: input.expert_id,
      user_id: input.user_id,
      status: input.status ?? DEFAULT_EXPERT_APPROVAL_STATUS,
    },
    include: expertApprovalInclude,
  });

  return pickPublicExpertApprovalFields(approval);
}

export async function updateExpertApprovalStatus(
  expert_id: string,
  user_id: string,
  input: UpdateExpertApprovalStatusInput,
): Promise<PublicExpertApproval> {
  const approval = await prisma.expertApproval.update({
    where: {
      expert_id_user_id: { expert_id, user_id },
    },
    data: { status: input.status },
    include: expertApprovalInclude,
  });

  return pickPublicExpertApprovalFields(approval);
}
