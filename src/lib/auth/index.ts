export { AuthError, ForbiddenError } from "./errors";
export {
  assertAdminAccess,
  getAuthSession,
  getAuthenticatedProfile,
  requireAuthSession,
  requireAuthenticatedProfile,
  requireApprovedRegistration,
  requireRole,
  signOut,
  type AuthSession,
  type AuthenticatedProfile,
} from "./session";
export {
  registerProfile,
  isRegistrationApproved,
  getRegistrationStatus,
  getPendingApprovalState,
  type RegisterProfileInput,
  type RegisterProfileResult,
  type RegistrationStatus,
} from "./register";
export { resolvePostLoginPath } from "./post-login";
