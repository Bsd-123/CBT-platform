import { assertAdminAccess } from "@/lib/auth";
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
  await assertAdminAccess();
  return listReports(filter);
}

export async function loadAdminUsers() {
  await assertAdminAccess();
  return listUsers();
}

export async function loadAdminUsersPage() {
  await assertAdminAccess();
  const [users, stats] = await Promise.all([
    listAdminUsersDirectory(),
    getAdminUsersPageStats(),
  ]);

  return { users, stats };
}

export async function loadAdminTags() {
  await assertAdminAccess();
  return listTags();
}

export async function loadAdminMaterialTypes() {
  await assertAdminAccess();
  return listMaterialTypes();
}

export async function loadAvailableMaterialTypeKeys() {
  await assertAdminAccess();
  return listAvailableMaterialTypeKeys();
}

export async function loadAdminMaterials({ limit = 50, offset = 0 } = {}) {
  await assertAdminAccess();
  return listMaterialsForAdmin({}, limit, offset);
}

export async function loadAdminExpertApprovals(filter: ListExpertApprovalsFilter = {}) {
  await assertAdminAccess();
  return listExpertApprovals(filter);
}

export async function loadAdminExpertDirectory() {
  await assertAdminAccess();
  return listExpertDirectory();
}
