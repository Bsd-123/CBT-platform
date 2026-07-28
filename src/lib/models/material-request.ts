import type { MaterialRequest, MaterialResponse } from "@prisma/client";
import { pickPublicUserFields } from "@/lib/models/user";

export type { MaterialRequest, MaterialResponse };

export type CreateMaterialRequestInput = {
  user_id: string;
  title: string;
  description: string;
};

export type CreateMaterialResponseInput = {
  request_id: string;
  user_id: string;
  text?: string | null;
  file_url?: string | null;
};

export function pickPublicMaterialRequestFields(
  request: MaterialRequest & {
    user?: Parameters<typeof pickPublicUserFields>[0];
    responses?: Parameters<typeof pickPublicMaterialResponseFields>[0][];
  },
) {
  return {
    id: request.id,
    user_id: request.user_id,
    title: request.title,
    description: request.description,
    created_at: request.created_at,
    user: request.user ? pickPublicUserFields(request.user) : undefined,
    responses: request.responses?.map(pickPublicMaterialResponseFields),
  };
}

export function pickPublicMaterialResponseFields(
  response: MaterialResponse & {
    user?: Parameters<typeof pickPublicUserFields>[0];
  },
) {
  return {
    id: response.id,
    request_id: response.request_id,
    user_id: response.user_id,
    text: response.text,
    file_url: response.file_url,
    created_at: response.created_at,
    user: response.user ? pickPublicUserFields(response.user) : undefined,
  };
}

export type PublicMaterialRequest = ReturnType<typeof pickPublicMaterialRequestFields>;
export type PublicMaterialResponse = ReturnType<typeof pickPublicMaterialResponseFields>;
