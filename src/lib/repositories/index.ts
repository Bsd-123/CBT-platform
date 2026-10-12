import "server-only";
export {
  getUserById,
  updateUser,
  listUsers,
  listAdminUsersDirectory,
  getAdminUsersPageStats,
  listExpertDirectory,
} from "./user.repository";

export {
  listMaterialTypes,
  getMaterialTypeById,
  getMaterialTypeByKey,
  createMaterialType,
  updateMaterialType,
  deleteMaterialType,
  listAvailableMaterialTypeKeys,
} from "./material-type.repository";

export {
  getMaterialById,
  reviewMaterial,
  countPendingMaterials,
  countMaterialsByApprovalStatus,
  listMaterialsForReview,
  listMaterials,
  countMaterials,
  countMaterialsByType,
  createMaterial,
} from "./material.repository";

export {
  getExpertApprovalById,
  getExpertApprovalByExpertAndUser,
  listPendingApprovalsForExpert,
  listExpertApprovals,
  listExpertApprovalsForExpert,
  updateExpertApprovalStatus,
} from "./expert-approval.repository";

export {
  getMaterialRequestById,
  listMaterialRequests,
  countMaterialRequests,
  createMaterialRequest,
  createMaterialResponse,
  listMaterialResponsesByRequest,
} from "./material-request.repository";

export {
  getForumQuestionById,
  searchForumQuestions,
  countForumQuestions,
  createForumQuestion,
  createForumAnswer,
  listForumAnswersByQuestion,
} from "./forum.repository";

export {
  getForumLikeCounts,
  getUserForumLikes,
  getForumLikeSummaries,
  toggleForumLike,
} from "./forum-like.repository";

export {
  getRecommendationById,
  countRecommendations,
  listRecommendations,
  listRecommendationsFeed,
  createRecommendation,
  createRecommendationComment,
  listRecommendationComments,
} from "./recommendation.repository";

export {
  getEventById,
  listEvents,
  countEvents,
  createEvent,
  updateEvent,
  createEventComment,
  listEventComments,
} from "./event.repository";

export {
  addEventFavorite,
  isEventFavorited,
  removeEventFavorite,
} from "./event-favorite.repository";

export {
  getProfessionalRequestById,
  listProfessionalRequests,
  countProfessionalRequests,
  createProfessionalRequest,
  createProfessionalRequestComment,
  listProfessionalRequestComments,
} from "./professional-request.repository";

export {
  listTags,
  getTagById,
  getTagByName,
  createTag,
  deleteTag,
  attachEntityTag,
  detachEntityTag,
  listEntityTags,
  listEntityTagsForEntities,
} from "./tag.repository";

export {
  getMaterialRating,
  listMaterialRatingsByMaterial,
  getMaterialAverageRating,
  getMaterialAverageRatings,
  createMaterialRating,
  updateMaterialRating,
  deleteMaterialRating,
} from "./material-rating.repository";

export {
  listNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  countUnreadNotifications,
} from "./notification.repository";

export {
  getReportById,
  listReports,
  createReport,
  updateReportStatus,
} from "./report.repository";
