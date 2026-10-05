import "server-only";
import type {
  CreateReportInput,
  ListReportsFilter,
  PublicReport,
  UpdateReportStatusInput,
} from "@/lib/models/report";
import { pickPublicReportFields } from "@/lib/models/report";
import { prisma } from "@/lib/db";

function buildReportsWhere(filter: ListReportsFilter) {
  return {
    ...(filter.status && { status: filter.status }),
  };
}

export async function getReportById(id: string): Promise<PublicReport | null> {
  const report = await prisma.report.findUnique({
    where: { id },
    include: { user: true },
  });
  return report ? pickPublicReportFields(report) : null;
}

export async function listReports(
  filter: ListReportsFilter = {},
): Promise<PublicReport[]> {
  const reports = await prisma.report.findMany({
    where: buildReportsWhere(filter),
    include: { user: true },
    orderBy: { created_at: "desc" },
  });
  return reports.map(pickPublicReportFields);
}

async function reportTargetExists(
  target_type: CreateReportInput["target_type"],
  id: string,
): Promise<boolean> {
  const where = { id };
  switch (target_type) {
    case "material":
      return (await prisma.material.count({ where })) > 0;
    case "forum_question":
      return (await prisma.forumQuestion.count({ where })) > 0;
    case "forum_answer":
      return (await prisma.forumAnswer.count({ where })) > 0;
    case "recommendation":
      return (await prisma.recommendation.count({ where })) > 0;
    case "event":
      return (await prisma.event.count({ where })) > 0;
    case "professional_request":
      return (await prisma.professionalRequest.count({ where })) > 0;
  }
}

export async function createReport(input: CreateReportInput): Promise<PublicReport> {
  if (!(await reportTargetExists(input.target_type, input.target_id))) {
    throw new Error("Report target not found.");
  }

  const existing = await prisma.report.findFirst({
    where: {
      user_id: input.user_id,
      target_type: input.target_type,
      target_id: input.target_id,
      status: { not: "resolved" },
    },
    include: { user: true },
  });
  if (existing) {
    return pickPublicReportFields(existing);
  }

  const report = await prisma.report.create({
    data: input,
    include: { user: true },
  });
  return pickPublicReportFields(report);
}

export async function updateReportStatus(
  id: string,
  input: UpdateReportStatusInput,
): Promise<PublicReport> {
  const report = await prisma.report.update({
    where: { id },
    data: { status: input.status },
    include: { user: true },
  });
  return pickPublicReportFields(report);
}
