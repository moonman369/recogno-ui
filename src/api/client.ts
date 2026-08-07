import { request } from './http';
import type {
  AuthProviders,
  AuthSession,
  LoginInput,
  MeResponse,
  RegisterInput,
} from './authTypes';
import type {
  AddProblemInput,
  AddProblemResult,
  CommitInput,
  CommitResult,
  DeckCreateInput,
  DeckDetail,
  DeckList,
  DrillDueCount,
  DrillNext,
  DrillResult,
  DrillSubmitInput,
  Health,
  ReviewDueCount,
  ReviewQueue,
  Submission,
  SubmissionCreateInput,
  SubmissionList,
} from './types';

export { ApiError, BASE_URL, SessionExpiredError, isUnauthenticated, isUnavailable } from './http';

/** `POST /decks` returns the deck without its problems. */
type Deck201 = DeckList['decks'][number];

export const api = {
  health: (signal?: AbortSignal) => request<Health>('/health', { signal }),

  auth: {
    /** Public. Drives which sign-in buttons are offered — asking for a provider the server has no credentials for 501s. */
    providers: (signal?: AbortSignal) => request<AuthProviders>('/auth/providers', { signal }),

    register: (input: RegisterInput) =>
      request<AuthSession>('/auth/register', { method: 'POST', body: input }),

    login: (input: LoginInput) =>
      request<AuthSession>('/auth/login', { method: 'POST', body: input }),

    /** Revokes one refresh token. The access token expires on its own. */
    logout: (refreshToken: string) =>
      request<void>('/auth/logout', { method: 'POST', body: { refreshToken } }),

    /** Revokes every refresh token for the user, across all devices. */
    logoutAll: () => request<void>('/auth/logout-all', { method: 'POST' }),

    me: (signal?: AbortSignal) => request<MeResponse>('/auth/me', { signal }),
  },

  drill: {
    next: (signal?: AbortSignal) => request<DrillNext>('/drill/next', { signal }),
    submit: (input: DrillSubmitInput) =>
      request<DrillResult>('/drill/submit', { method: 'POST', body: input }),
    dueCount: (signal?: AbortSignal) => request<DrillDueCount>('/drill/due-count', { signal }),
  },

  decks: {
    list: (signal?: AbortSignal) => request<DeckList>('/decks', { signal }),
    create: (input: DeckCreateInput) => request<Deck201>('/decks', { method: 'POST', body: input }),
    get: (deckId: number | string, signal?: AbortSignal) =>
      request<DeckDetail>(`/decks/${deckId}`, { signal }),
    addProblem: (deckId: number | string, input: AddProblemInput) =>
      request<AddProblemResult>(`/decks/${deckId}/problems`, { method: 'POST', body: input }),
  },

  submissions: {
    get: (submissionId: string, signal?: AbortSignal) =>
      request<Submission>(`/submissions/${submissionId}`, { signal }),
    commit: (submissionId: string, input: CommitInput = {}) =>
      request<CommitResult>(`/submissions/${submissionId}/commit`, { method: 'POST', body: input }),
    listForProblem: (problemId: number | string, signal?: AbortSignal) =>
      request<SubmissionList>(`/problems/${problemId}/submissions`, { signal }),
    createForProblem: (problemId: number | string, input: SubmissionCreateInput) =>
      request<Submission>(`/problems/${problemId}/submissions`, { method: 'POST', body: input }),
  },

  review: {
    dueCount: (signal?: AbortSignal) => request<ReviewDueCount>('/review/due-count', { signal }),
    queue: (signal?: AbortSignal) => request<ReviewQueue>('/review/queue', { signal }),
  },
};
