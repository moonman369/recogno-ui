/**
 * Auth contract types, derived from the generated schema.
 *
 * `npm run api:types` regenerates `schema.d.ts` from
 * `../recogno-server/openapi.json` — the server repo owns that file, so this
 * one only names things. Nothing here should ever be a hand-written shape.
 */
import type { paths } from './schema';

type Ok<T> = T extends { content: { 'application/json': infer B } } ? B : never;
type Body<T> = T extends { content: { 'application/json': infer B } } ? B : never;

/** Returned identically by register, login and refresh. */
export type AuthSession = Ok<paths['/auth/login']['post']['responses'][200]>;
export type AuthUser = AuthSession['user'];

/** `GET /auth/providers` — which sign-in methods the server has credentials for. */
export type AuthProviders = Ok<paths['/auth/providers']['get']['responses'][200]>;

export type RegisterInput = Body<paths['/auth/register']['post']['requestBody']>;
export type LoginInput = Body<paths['/auth/login']['post']['requestBody']>;
export type RefreshInput = Body<paths['/auth/refresh']['post']['requestBody']>;
export type LogoutInput = Body<paths['/auth/logout']['post']['requestBody']>;

export type MeResponse = Ok<paths['/auth/me']['get']['responses'][200]>;

/* -- email verification and password reset ------------------------------- */

/** Both request endpoints always 202 with a deliberately vague message. */
export type VerifyEmailRequestInput = Body<
  paths['/auth/verify-email/request']['post']['requestBody']
>;
export type VerifyEmailRequestResult = Ok<
  paths['/auth/verify-email/request']['post']['responses'][202]
>;

export type VerifyEmailConfirmInput = Body<
  paths['/auth/verify-email/confirm']['post']['requestBody']
>;
export type VerifyEmailConfirmResult = Ok<
  paths['/auth/verify-email/confirm']['post']['responses'][200]
>;

export type ForgotPasswordInput = Body<paths['/auth/forgot-password']['post']['requestBody']>;
export type ForgotPasswordResult = Ok<paths['/auth/forgot-password']['post']['responses'][202]>;

export type ResetPasswordInput = Body<paths['/auth/reset-password']['post']['requestBody']>;

/** How long the emailed links stay valid, for the copy that sets expectations. */
export const VERIFY_LINK_HOURS = 24;
export const RESET_LINK_HOURS = 1;

/**
 * Password bounds the server enforces, mirrored client-side to fail fast.
 * OpenAPI carries these as `minLength`/`maxLength`, which openapi-typescript
 * does not emit as values — hence the literals.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 200;

/** Machine-readable `code` values the API pairs with an error message. */
export const ERROR_CODES = {
  unauthenticated: 'UNAUTHENTICATED',
  validation: 'VALIDATION_ERROR',
} as const;
