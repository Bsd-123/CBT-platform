import "server-only";
import type {
  CreateMaterialRequestInput,
  CreateMaterialResponseInput,
  PublicMaterialRequest,
  PublicMaterialResponse,
} from "@/lib/models/material-request";
import {
  pickPublicMaterialRequestFields,
  pickPublicMaterialResponseFields,
} from "@/lib/models/material-request";
import { prisma } from "@/lib/db";
import { notifyMaterialRequestResponse } from "@/lib/services/notifications";

const requestInclude = {
  user: true,
  responses: { include: { user: true }, orderBy: { created_at: "asc" as const } },
} as const;

export async function getMaterialRequestById(
  id: string,
): Promise<PublicMaterialRequest | null> {
  const request = await prisma.materialRequest.findUnique({
    where: { id },
    include: requestInclude,
  });
  return request ? pickPublicMaterialRequestFields(request) : null;
}

export async function countMaterialRequests(): Promise<number> {
  return prisma.materialRequest.count();
}

export async function listMaterialRequests(
  options: { skip?: number; take?: number } = {},
): Promise<PublicMaterialRequest[]> {
  const requests = await prisma.materialRequest.findMany({
    include: requestInclude,
    orderBy: { created_at: "desc" },
    ...(options.take !== undefined && { skip: options.skip ?? 0, take: options.take }),
  });
  return requests.map(pickPublicMaterialRequestFields);
}

export async function createMaterialRequest(
  input: CreateMaterialRequestInput,
): Promise<PublicMaterialRequest> {
  const request = await prisma.materialRequest.create({
    data: input,
    include: requestInclude,
  });
  return pickPublicMaterialRequestFields(request);
}

export async function createMaterialResponse(
  input: CreateMaterialResponseInput,
): Promise<PublicMaterialResponse> {
  if (!input.text && !input.file_url) {
    throw new Error("Material response must include text, a file, or both.");
  }

  const request = await prisma.materialRequest.findUnique({
    where: { id: input.request_id },
  });

  if (!request) {
    throw new Error("Material request not found.");
  }

  const response = await prisma.materialResponse.create({
    data: {
      request_id: input.request_id,
      user_id: input.user_id,
      text: input.text ?? null,
      file_url: input.file_url ?? null,
    },
    include: { user: true },
  });

  if (request.user_id !== input.user_id) {
    await notifyMaterialRequestResponse(request.user_id, request.id);
  }

  return pickPublicMaterialResponseFields(response);
}

export async function listMaterialResponsesByRequest(
  request_id: string,
): Promise<PublicMaterialResponse[]> {
  const responses = await prisma.materialResponse.findMany({
    where: { request_id },
    include: { user: true },
    orderBy: { created_at: "asc" },
  });
  return responses.map(pickPublicMaterialResponseFields);
}
