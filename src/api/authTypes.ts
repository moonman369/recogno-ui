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
