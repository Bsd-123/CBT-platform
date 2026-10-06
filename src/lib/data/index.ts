import "server-only";

import type { CreateMaterialInput, ListMaterialsFilter } from "@/lib/models/material";
import type {
  CreateExpertApprovalInput,
  UpdateExpertApprovalStatusInput,
} from "@/lib/models/expert-approval";
import type {
  CreateMaterialRequestInput,
  CreateMaterialResponseInput,
} from "@/lib/models/material-request";
import type {
  CreateForumAnswerInput,
  CreateForumQuestionInput,
  SearchForumQuestionsFilter,
} from "@/lib/models/forum";
import type {
  CreateRecommendationCommentInput,
  CreateRecommendationInput,
} from "@/lib/models/recommendation";
import type {
  CreateEventCommentInput,
  CreateEventInput,
  ListEventsFilter,
  UpdateEventInput,
} from "@/lib/models/event";
import type {
  CreateProfessionalRequestCommentInput,
  CreateProfessionalRequestInput,
} from "@/lib/models/professional-request";
import type { AttachEntityTagInput, CreateTagInput } from "@/lib/models/tag";
import type { EntityType } from "@/lib/models/tag";
import type {
  CreateMaterialRatingInput,
  UpdateMaterialRatingInput,
} from "@/lib/models/material-rating";
import type { CreateNotificationInput } from "@/lib/models/notification";
import type {
  CreateReportInput,
  ListReportsFilter,
  UpdateReportStatusInput,
} from "@/lib/models/report";
import type { CreateUserInput, UpdateUserInput } from "@/lib/models/user";
import {
  attachEntityTag,
  countUnreadNotifications,
  createEvent,
  createEventComment,
  createExpertApproval,
  createForumAnswer,
  createForumQuestion,
  createMaterial,
  createMaterialRating,
  createMaterialRequest,
  createMaterialResponse,
  createNotification,
  createProfessionalRequest,
  createProfessionalRequestComment,
  createRecommendation,
  createRecommendationComment,
  createReport,
  createTag,
  createUser,
  deleteMaterialRating,
  detachEntityTag,
  getEventById,
  getExpertApprovalByExpertAndUser,
  getForumQuestionById,
  getMaterialAverageRating,
  getMaterialById,
  getMaterialRating,
  getMaterialRequestById,
  getProfessionalRequestById,
  getRecommendationById,
  getReportById,
  getTagById,
  getUserById,
  listEntityTags,
  listEntityTagsForEntities,
  listEventComments,
  listEvents,
  listForumAnswersByQuestion,
  listMaterialRatingsByMaterial,
  listMaterialRequests,
  listMaterialResponsesByRequest,
  listMaterialTypes,
  listMaterials,
  listNotificationsForUser,
  listPendingApprovalsForExpert,
  listProfessionalRequestComments,
  listProfessionalRequests,
  listRecommendationComments,
  listRecommendations,
  listRecommendationsFeed,
  listReports,
  listTags,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  searchForumQuestions,
  toggleForumLike as toggleForumLikeInRepo,
  updateEvent,
  updateExpertApprovalStatus,
  updateMaterialRating,
  updateReportStatus,
  updateUser,
} from "@/lib/repositories";

// Users
export async function fetchUserById(id: string) {
  return getUserById(id);
}

export async function registerUserProfile(input: CreateUserInput) {
  return createUser(input);
}

export async function editUserProfile(id: string, input: UpdateUserInput) {
  return updateUser(id, input);
}

// Materials
export async function fetchMaterialTypes() {
  return listMaterialTypes();
}

export async function fetchMaterials(filter: ListMaterialsFilter = {}) {
  return listMaterials(filter);
}

export async function fetchMaterialById(id: string) {
  return getMaterialById(id);
}

export async function uploadMaterial(input: CreateMaterialInput) {
  return createMaterial(input);
}

export async function rateMaterial(input: CreateMaterialRatingInput) {
  return createMaterialRating(input);
}

export async function editMaterialRating(
  material_id: string,
  user_id: string,
  input: UpdateMaterialRatingInput,
) {
  return updateMaterialRating(material_id, user_id, input);
}

export async function removeMaterialRating(material_id: string, user_id: string) {
  return deleteMaterialRating(material_id, user_id);
}

export async function fetchMaterialRatings(material_id: string) {
  return listMaterialRatingsByMaterial(material_id);
}

export async function fetchMaterialAverageRating(material_id: string) {
  return getMaterialAverageRating(material_id);
}

export async function fetchUserMaterialRating(material_id: string, user_id: string) {
  return getMaterialRating(material_id, user_id);
}

// Expert referral approvals
export async function fetchPendingReferralsForExpert(expert_id: string) {
  return listPendingApprovalsForExpert(expert_id);
}

export async function fetchReferralApproval(expert_id: string, user_id: string) {
  return getExpertApprovalByExpertAndUser(expert_id, user_id);
}

export async function submitReferralApproval(input: CreateExpertApprovalInput) {
  return createExpertApproval(input);
}

export async function decideReferralApproval(
  expert_id: string,
  user_id: string,
  input: UpdateExpertApprovalStatusInput,
) {
  return updateExpertApprovalStatus(expert_id, user_id, input);
}

// Material requests
export async function fetchMaterialRequests() {
  return listMaterialRequests();
}

export async function fetchMaterialRequestById(id: string) {
  return getMaterialRequestById(id);
}

export async function postMaterialRequest(input: CreateMaterialRequestInput) {
  return createMaterialRequest(input);
}

export async function respondToMaterialRequest(input: CreateMaterialResponseInput) {
  return createMaterialResponse(input);
}

export async function fetchMaterialResponses(request_id: string) {
  return listMaterialResponsesByRequest(request_id);
}

// Forum
export async function fetchForumQuestionById(id: string) {
  return getForumQuestionById(id);
}

export async function searchForum(filter: SearchForumQuestionsFilter = {}) {
  return searchForumQuestions(filter);
}

export async function postForumQuestion(input: CreateForumQuestionInput) {
  return createForumQuestion(input);
}

export async function postForumAnswer(input: CreateForumAnswerInput) {
  return createForumAnswer(input);
}

export async function fetchForumAnswers(question_id: string) {
  return listForumAnswersByQuestion(question_id);
}

export async function toggleForumLike(
  user_id: string,
  target_type: import("@prisma/client").ForumLikeTargetType,
  target_id: string,
) {
  return toggleForumLikeInRepo(user_id, target_type, target_id);
}

// Recommendations
export async function fetchRecommendations() {
  return listRecommendations();
}

export async function fetchRecommendationsFeed() {
  return listRecommendationsFeed();
}

export async function fetchRecommendationById(id: string) {
  return getRecommendationById(id);
}

export async function postRecommendation(input: CreateRecommendationInput) {
  return createRecommendation(input);
}

export async function postRecommendationComment(input: CreateRecommendationCommentInput) {
  return createRecommendationComment(input);
}

export async function fetchRecommendationComments(recommendation_id: string) {
  return listRecommendationComments(recommendation_id);
}

// Events
export async function fetchEvents(filter: ListEventsFilter = {}) {
  return listEvents(filter);
}

export async function fetchEventById(id: string) {
  return getEventById(id);
}

export async function postEvent(input: CreateEventInput) {
  return createEvent(input);
}

export async function editEvent(id: string, input: UpdateEventInput) {
  return updateEvent(id, input);
}

export async function postEventComment(input: CreateEventCommentInput) {
  return createEventComment(input);
}

export async function fetchEventComments(event_id: string) {
  return listEventComments(event_id);
}

// Professional requests
export async function fetchProfessionalRequests() {
  return listProfessionalRequests();
}

export async function fetchProfessionalRequestById(id: string) {
  return getProfessionalRequestById(id);
}

export async function postProfessionalRequest(input: CreateProfessionalRequestInput) {
  return createProfessionalRequest(input);
}

export async function postProfessionalRequestComment(
  input: CreateProfessionalRequestCommentInput,
) {
  return createProfessionalRequestComment(input);
}

export async function fetchProfessionalRequestComments(request_id: string) {
  return listProfessionalRequestComments(request_id);
}

// Tags
export async function fetchTags() {
  return listTags();
}

export async function fetchTagById(id: string) {
  return getTagById(id);
}

export async function createNewTag(input: CreateTagInput) {
  return createTag(input);
}

export async function tagEntity(input: AttachEntityTagInput) {
  return attachEntityTag(input);
}

export async function untagEntity(id: string) {
  return detachEntityTag(id);
}

export async function fetchEntityTagsForEntities(
  entity_type: EntityType,
  entity_ids: string[],
) {
  return listEntityTagsForEntities(entity_type, entity_ids);
}

export async function fetchEntityTags(entity_type: EntityType, entity_id: string) {
  return listEntityTags(entity_type, entity_id);
}

// Notifications
export async function fetchNotifications(user_id: string, unreadOnly = false) {
  return listNotificationsForUser(user_id, unreadOnly);
}

export async function notifyUser(input: CreateNotificationInput) {
  return createNotification(input);
}

export async function readNotification(id: string, user_id: string) {
  return markNotificationAsRead(id, user_id);
}

export async function readAllNotifications(user_id: string) {
  return markAllNotificationsAsRead(user_id);
}

export async function fetchUnreadNotificationCount(user_id: string) {
  return countUnreadNotifications(user_id);
}

// Reports
export async function fetchReports(filter: ListReportsFilter = {}) {
  return listReports(filter);
}

export async function fetchReportById(id: string) {
  return getReportById(id);
}

export async function submitReport(input: CreateReportInput) {
  return createReport(input);
}

export async function resolveReport(id: string, input: UpdateReportStatusInput) {
  return updateReportStatus(id, input);
}
