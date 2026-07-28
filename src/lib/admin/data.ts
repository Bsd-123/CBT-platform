import type { ListExpertApprovalsFilter } from "@/lib/models/expert-approval";
import type { ListReportsFilter } from "@/lib/models/report";
import { listExpertApprovals } from "@/lib/repositories/expert-approval.repository";
import { listReports } from "@/lib/repositories/report.repository";
import {
  getAdminUsersPageStats,
  listAdminUsersDirectory,
  listExpertDirectory,
  listUsers,
} from "@/lib/repositories/user.repository";
import { listTags } from "@/lib/repositories/tag.repository";
import {
  listAvailableMaterialTypeKeys,
  listMaterialTypes,
} from "@/lib/repositories/material-type.repository";
import { listMaterialsForAdmin } from "@/lib/repositories/material.repository";

export async function loadAdminReports(filter: ListReportsFilter = {}) {
  return listReports(filter);
}

export async function loadAdminUsers() {
  return listUsers();
}

export async function loadAdminUsersPage() {
  const [users, stats] = await Promise.all([
    listAdminUsersDirectory(),
    getAdminUsersPageStats(),
  ]);

  return { users, stats };
}

export async function loadAdminTags() {
  return listTags();
}

export async function loadAdminMaterialTypes() {
  return listMaterialTypes();
}

export async function loadAvailableMaterialTypeKeys() {
  return listAvailableMaterialTypeKeys();
}

export async function loadAdminMaterials({ limit = 50, offset = 0 } = {}) {
  return listMaterialsForAdmin({}, limit, offset);
}

export async function loadAdminExpertApprovals(filter: ListExpertApprovalsFilter = {}) {
  return listExpertApprovals(filter);
}

export async function loadAdminExpertDirectory() {
  return listExpertDirectory();
}
