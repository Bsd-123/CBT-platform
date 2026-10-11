import "server-only";
import type {
  CreateReportInput,
  ListReportsFilter,
  PublicReport,
  UpdateReportStatusInput,
} from "@/lib/models/report";
import { pickPublicReportFields } from "@/lib/models/report";
import { countOf, getDb, row, rows } from "@/lib/db/client";
import type { Report, ReportTargetType, User } from "@/lib/db/types";

type ReportRow = Report & { user: User };

const REPORT_SELECT = "*, user:users!reports_user_id_fkey(*)";

const TARGET_TABLES: Record<ReportTargetType, string> = {
  material: "materials",
  forum_question: "forum_questions",
  forum_answer: "forum_answers",
  recommendation: "recommendations",
  event: "events",
  professional_request: "professional_requests",
};

export async function getReportById(id: string): Promise<PublicReport | null> {
  const db = await getDb();
  const report = row<ReportRow>(await db.from("reports").select(REPORT_SELECT).eq("id", id).maybeSingle());
  return report ? pickPublicReportFields(report) : null;
}

/** Admins see every report; other users only their own (Row Level Security). */
export async function listReports(filter: ListReportsFilter = {}): Promise<PublicReport[]> {
  const db = await getDb();
  let query = db.from("reports").select(REPORT_SELECT).order("created_at", { ascending: false });
  if (filter.status) query = query.eq("status", filter.status);
  return rows<ReportRow>(await query).map(pickPublicReportFields);
}

async function reportTargetExists(target_type: ReportTargetType, id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .from(TARGET_TABLES[target_type])
    .select("id", { count: "exact", head: true })
    .eq("id", id);
  return countOf(result) > 0;
}

export async function createReport(input: CreateReportInput): Promise<PublicReport> {
  if (!(await reportTargetExists(input.target_type, input.target_id))) {
    throw new Error("Report target not found.");
  }

  const db = await getDb();
  const existing = row<ReportRow>(
    await db
      .from("reports")
      .select(REPORT_SELECT)
      .eq("user_id", input.user_id)
      .eq("target_type", input.target_type)
      .eq("target_id", input.target_id)
      .neq("status", "resolved")
      .limit(1)
      .maybeSingle(),
  );
  if (existing) return pickPublicReportFields(existing);

  const report = row<ReportRow>(
    await db
      .from("reports")
      .insert({
        user_id: input.user_id,
        target_type: input.target_type,
        target_id: input.target_id,
        reason: input.reason,
      })
      .select(REPORT_SELECT)
      .single(),
  );
  return pickPublicReportFields(report!);
}

export async function updateReportStatus(
  id: string,
  input: UpdateReportStatusInput,
): Promise<PublicReport> {
  const db = await getDb();
  const report = row<ReportRow>(
    await db.from("reports").update({ status: input.status }).eq("id", id).select(REPORT_SELECT).maybeSingle(),
  );
  if (!report) throw new Error("Forbidden");
  return pickPublicReportFields(report);
}
