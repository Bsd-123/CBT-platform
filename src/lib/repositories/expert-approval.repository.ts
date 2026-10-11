import "server-only";
import type {
  ListExpertApprovalsFilter,
  PublicExpertApproval,
  UpdateExpertApprovalStatusInput,
} from "@/lib/models/expert-approval";
import { pickPublicExpertApprovalFields } from "@/lib/models/expert-approval";
import { getDb, row, rows } from "@/lib/db/client";
import type { ExpertApproval, User } from "@/lib/db/types";

type ApprovalRow = ExpertApproval & { expert: User; user: User };

// Two foreign keys point at users, so each embed names its constraint.
const APPROVAL_SELECT =
  "*, expert:users!expert_approvals_expert_id_fkey(*), user:users!expert_approvals_user_id_fkey(*)";

function matchesSearch(approval: ApprovalRow, search: string, includeExpert: boolean): boolean {
  const needle = search.toLowerCase();
  const haystack = [approval.user?.full_name, approval.user?.title, includeExpert ? approval.expert?.full_name : null];
  return haystack.some((value) => value?.toLowerCase().includes(needle));
}

export async function getExpertApprovalById(id: string): Promise<PublicExpertApproval | null> {
  const db = await getDb();
  const approval = row<ApprovalRow>(
    await db.from("expert_approvals").select(APPROVAL_SELECT).eq("id", id).maybeSingle(),
  );
  return approval ? pickPublicExpertApprovalFields(approval) : null;
}

export async function getExpertApprovalByExpertAndUser(
  expert_id: string,
  user_id: string,
): Promise<PublicExpertApproval | null> {
  const db = await getDb();
  const approval = row<ApprovalRow>(
    await db
      .from("expert_approvals")
      .select(APPROVAL_SELECT)
      .eq("expert_id", expert_id)
      .eq("user_id", user_id)
      .maybeSingle(),
  );
  return approval ? pickPublicExpertApprovalFields(approval) : null;
}

export async function listPendingApprovalsForExpert(
  expert_id: string,
): Promise<PublicExpertApproval[]> {
  const db = await getDb();
  const approvals = rows<ApprovalRow>(
    await db
      .from("expert_approvals")
      .select(APPROVAL_SELECT)
      .eq("expert_id", expert_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  );
  return approvals.map(pickPublicExpertApprovalFields);
}

/** Free-text search runs in memory: the approval list is small and spans two joined tables. */
async function listApprovals(
  filter: ListExpertApprovalsFilter,
  options: { expert_id?: string; includeExpertInSearch: boolean },
): Promise<PublicExpertApproval[]> {
  const db = await getDb();
  let query = db.from("expert_approvals").select(APPROVAL_SELECT).order("created_at", { ascending: false });
  if (options.expert_id) query = query.eq("expert_id", options.expert_id);
  if (filter.status) query = query.eq("status", filter.status);

  const search = filter.search?.trim();
  return rows<ApprovalRow>(await query)
    .filter((approval) => !search || matchesSearch(approval, search, options.includeExpertInSearch))
    .map(pickPublicExpertApprovalFields);
}

export async function listExpertApprovals(
  filter: ListExpertApprovalsFilter = {},
): Promise<PublicExpertApproval[]> {
  return listApprovals(filter, { includeExpertInSearch: true });
}

export async function listExpertApprovalsForExpert(
  expert_id: string,
  filter: ListExpertApprovalsFilter = {},
): Promise<PublicExpertApproval[]> {
  return listApprovals(filter, { expert_id, includeExpertInSearch: false });
}

/** The referring expert (or an admin) decides; Row Level Security enforces who may. */
export async function updateExpertApprovalStatus(
  expert_id: string,
  user_id: string,
  input: UpdateExpertApprovalStatusInput,
): Promise<PublicExpertApproval> {
  const db = await getDb();
  const approval = row<ApprovalRow>(
    await db
      .from("expert_approvals")
      .update({ status: input.status })
      .eq("expert_id", expert_id)
      .eq("user_id", user_id)
      .select(APPROVAL_SELECT)
      .maybeSingle(),
  );
  if (!approval) throw new Error("Forbidden");
  return pickPublicExpertApprovalFields(approval);
}
