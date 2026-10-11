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
import { countOf, getDb, row, rows } from "@/lib/db/client";
import type { MaterialRequest, MaterialResponse, User } from "@/lib/db/types";

type RequestRow = MaterialRequest & { user: User; responses: (MaterialResponse & { user: User })[] };

const REQUEST_SELECT = "*, user:users(*), responses:material_responses(*, user:users(*))";

function sortResponses(request: RequestRow): RequestRow {
  return {
    ...request,
    responses: [...request.responses].sort((a, b) => a.created_at.getTime() - b.created_at.getTime()),
  };
}

export async function getMaterialRequestById(id: string): Promise<PublicMaterialRequest | null> {
  const db = await getDb();
  const request = row<RequestRow>(await db.from("material_requests").select(REQUEST_SELECT).eq("id", id).maybeSingle());
  return request ? pickPublicMaterialRequestFields(sortResponses(request)) : null;
}

export async function countMaterialRequests(): Promise<number> {
  const db = await getDb();
  return countOf(await db.from("material_requests").select("id", { count: "exact", head: true }));
}

export async function listMaterialRequests(
  options: { skip?: number; take?: number } = {},
): Promise<PublicMaterialRequest[]> {
  const db = await getDb();
  let query = db.from("material_requests").select(REQUEST_SELECT).order("created_at", { ascending: false });
  if (options.take !== undefined) {
    const skip = options.skip ?? 0;
    query = query.range(skip, skip + options.take - 1);
  }
  return rows<RequestRow>(await query).map((request) => pickPublicMaterialRequestFields(sortResponses(request)));
}

export async function createMaterialRequest(
  input: CreateMaterialRequestInput,
): Promise<PublicMaterialRequest> {
  const db = await getDb();
  const request = row<RequestRow>(
    await db
      .from("material_requests")
      .insert({ user_id: input.user_id, title: input.title, description: input.description })
      .select(REQUEST_SELECT)
      .single(),
  );
  return pickPublicMaterialRequestFields(request!);
}

/** The request owner is notified by a database trigger. */
export async function createMaterialResponse(
  input: CreateMaterialResponseInput,
): Promise<PublicMaterialResponse> {
  if (!input.text && !input.file_url) {
    throw new Error("Material response must include text, a file, or both.");
  }

  const db = await getDb();
  const exists = countOf(
    await db.from("material_requests").select("id", { count: "exact", head: true }).eq("id", input.request_id),
  );
  if (exists === 0) throw new Error("Material request not found.");

  const response = row<MaterialResponse & { user: User }>(
    await db
      .from("material_responses")
      .insert({
        request_id: input.request_id,
        user_id: input.user_id,
        text: input.text ?? null,
        file_url: input.file_url ?? null,
      })
      .select("*, user:users(*)")
      .single(),
  );
  return pickPublicMaterialResponseFields(response!);
}

export async function listMaterialResponsesByRequest(
  request_id: string,
): Promise<PublicMaterialResponse[]> {
  const db = await getDb();
  const responses = rows<MaterialResponse & { user: User }>(
    await db
      .from("material_responses")
      .select("*, user:users(*)")
      .eq("request_id", request_id)
      .order("created_at", { ascending: true }),
  );
  return responses.map(pickPublicMaterialResponseFields);
}
