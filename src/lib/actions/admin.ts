"use server";

import { UserFacingError } from "@/lib/errors";
import { runAction } from "@/lib/actions/result";
import type { ReportTargetType, UserRole } from "@prisma/client";
import type { UpdateReportStatusInput } from "@/lib/models/report";
import type { CreateTagInput } from "@/lib/models/tag";
import { isUserRole, type UpdateUserInput } from "@/lib/models/user";
import { prisma } from "@/lib/db";
import {
  approvalDecisionSchema,
  parseInput,
  reportStatusSchema,
} from "@/lib/validation/schemas";
import { updateReportStatus } from "@/lib/repositories/report.repository";
import {
  deleteReportedContent,
  hideReportedContent,
  restoreReportedContent,
} from "@/lib/repositories/moderation.repository";
import { updateUser } from "@/lib/repositories/user.repository";
import { createTag, deleteTag } from "@/lib/repositories/tag.repository";
import {
  createMaterialType,
  deleteMaterialType,
  updateMaterialType,
} from "@/lib/repositories/material-type.repository";
import type {
  CreateMaterialTypeInput,
  UpdateMaterialTypeInput,
} from "@/lib/models/material-type";
import type { UpdateExpertApprovalStatusInput } from "@/lib/models/expert-approval";
import { updateExpertApprovalStatus } from "@/lib/repositories/expert-approval.repository";
import { requireRole } from "@/lib/auth";

export async function resolveReport(id: string, input: UpdateReportStatusInput) {
  return runAction(async () => {
    await requireRole("admin");
    return updateReportStatus(id, parseInput(reportStatusSchema, input));

  });
}

export async function adminHideReportedContent(
  target_type: ReportTargetType,
  target_id: string,
) {
  return runAction(async () => {
    await requireRole("admin");
    await hideReportedContent(target_type, target_id);

  });
}

export async function adminRestoreReportedContent(
  target_type: ReportTargetType,
  target_id: string,
) {
  return runAction(async () => {
    await requireRole("admin");
    await restoreReportedContent(target_type, target_id);

  });
}

export async function adminDeleteReportedContent(
  target_type: ReportTargetType,
  target_id: string,
) {
  return runAction(async () => {
    await requireRole("admin");
    await deleteReportedContent(target_type, target_id);

  });
}

export async function adminUpdateUserRole(user_id: string, role: UserRole) {
  return runAction(async () => {
    await requireRole("admin");

    if (typeof role !== "string" || !isUserRole(role)) {
      throw new Error("Invalid role.");
    }

    if (role !== "admin") {
      const target = await prisma.user.findUnique({
        where: { id: user_id },
        select: { role: true },
      });
      if (target?.role === "admin") {
        const otherAdmins = await prisma.user.count({
          where: { role: "admin", id: { not: user_id } },
        });
        if (otherAdmins === 0) {
          throw new UserFacingError("לא ניתן להסיר את מנהל המערכת האחרון.");
        }
      }
    }

    const input: UpdateUserInput = { role };
    return updateUser(user_id, input);

  });
}

export async function adminCreateTag(input: CreateTagInput) {
  return runAction(async () => {
    await requireRole("admin");
    return createTag(input);

  });
}

export async function adminDeleteTag(tag_id: string) {
  return runAction(async () => {
    await requireRole("admin");
    await deleteTag(tag_id);

  });
}

export async function adminCreateMaterialType(input: CreateMaterialTypeInput) {
  return runAction(async () => {
    await requireRole("admin");
    if (!input.label.trim()) {
      throw new Error("Label is required.");
    }
    return createMaterialType(input);

  });
}

export async function adminUpdateMaterialType(id: string, input: UpdateMaterialTypeInput) {
  return runAction(async () => {
    await requireRole("admin");
    if (input.label !== undefined && !input.label.trim()) {
      throw new Error("Label is required.");
    }
    return updateMaterialType(id, input);

  });
}

export async function adminDeleteMaterialType(id: string) {
  return runAction(async () => {
    await requireRole("admin");
    await deleteMaterialType(id);

  });
}

export async function adminDecideExpertApproval(
  expert_id: string,
  user_id: string,
  input: UpdateExpertApprovalStatusInput,
) {
  return runAction(async () => {
    await requireRole("admin");
    return updateExpertApprovalStatus(
      expert_id,
      user_id,
      parseInput(approvalDecisionSchema, input),
    );

  });
}
