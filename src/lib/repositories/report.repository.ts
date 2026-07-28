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

export async function createReport(input: CreateReportInput): Promise<PublicReport> {
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
