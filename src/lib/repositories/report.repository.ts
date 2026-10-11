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

/** What an admin sees of a reported item, even when it is hidden. `found` is false once it was deleted. */
export type ReportedContent = {
  found: boolean;
  title: string | null;
  excerpt: string;
  is_hidden: boolean;
  /** For forum answers: the question that contains them. */
  parent_id: string | null;
};

type TargetRow = {
  id: string;
  title?: string;
  description?: string;
  content?: string;
  is_hidden: boolean;
  question_id?: string;
};

const PREVIEW_COLUMNS: Record<ReportTargetType, string> = {
  material: "id, title, description, is_hidden",
  forum_question: "id, title, content, is_hidden",
  forum_answer: "id, content, is_hidden, question_id",
  recommendation: "id, content, is_hidden",
  event: "id, title, description, is_hidden",
  professional_request: "id, title, description, is_hidden",
};

const EXCERPT_LENGTH = 280;

export const reportContentKey = (target_type: ReportTargetType, target_id: string) =>
  `${target_type}:${target_id}`;

/**
 * Loads the reported items in one query per content type. Admins may read hidden rows
 * (Row Level Security), so hidden and pending content is included.
 */
export async function getReportedContent(
  targets: { target_type: ReportTargetType; target_id: string }[],
): Promise<Map<string, ReportedContent>> {
  const db = await getDb();
  const idsByType = new Map<ReportTargetType, string[]>();
  for (const { target_type, target_id } of targets) {
    idsByType.set(target_type, [...(idsByType.get(target_type) ?? []), target_id]);
  }

  const result = new Map<string, ReportedContent>();
  await Promise.all(
    [...idsByType].map(async ([type, ids]) => {
      const found = rows<TargetRow>(
        await db.from(TARGET_TABLES[type]).select(PREVIEW_COLUMNS[type]).in("id", [...new Set(ids)]),
      );
      for (const item of found) {
        const text = (item.description ?? item.content ?? "").trim();
        result.set(reportContentKey(type, item.id), {
          found: true,
          title: item.title ?? null,
          excerpt: text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH)}…` : text,
          is_hidden: item.is_hidden,
          parent_id: item.question_id ?? null,
        });
      }
    }),
  );
  return result;
}

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
