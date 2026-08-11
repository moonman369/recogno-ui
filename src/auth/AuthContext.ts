import { createContext } from 'react';
import type { AuthProviders, AuthUser, LoginInput, RegisterInput } from '../api/authTypes';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  /** Which sign-in methods the server offers. Null until `/auth/providers` answers. */
  providers: AuthProviders | null;
  /**
   * Set when the session could not be confirmed for a reason that is not
   * "signed out" — a 503 or a dead connection. The app shows a retry rather
   * than bouncing the user to the login screen.
   */
  bootstrapError: unknown;
  retryBootstrap: () => void;
  signIn: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  /**
   * Replaces the cached user in place. Used when an endpoint returns an updated
   * user (email verification) so the UI settles without refetching. A no-op
   * when signed out — there is no session to attach it to.
   */
  applyUser: (user: AuthUser) => void;
  signOut: () => Promise<void>;
  signOutEverywhere: () => Promise<void>;
  startGoogleSignIn: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
