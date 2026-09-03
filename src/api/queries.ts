import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { api } from './client';
import {
  isInFlight,
  type AddProblemInput,
  type CommitInput,
  type DeckCreateInput,
  type DrillSubmitInput,
  type ScoringThresholdsInput,
  type Submission,
  type SubmissionCreateInput,
} from './types';

export const keys = {
  health: ['health'] as const,
  // `deckId` widens the key so a scoped drill session caches separately from the
  // cross-deck draw; the bare prefix still matches both for invalidation.
  drillNext: (deckId?: number) => ['drill', 'next', ...(deckId ? [{ deckId }] : [])] as const,
  drillDueCount: (deckId?: number) =>
    ['drill', 'due-count', ...(deckId ? [{ deckId }] : [])] as const,
  decks: ['decks'] as const,
  deck: (deckId: number | string) => ['decks', String(deckId)] as const,
  submission: (submissionId: string) => ['submissions', submissionId] as const,
  problemSubmissions: (problemId: number | string) =>
    ['problems', String(problemId), 'submissions'] as const,
  reviewDueCount: ['review', 'due-count'] as const,
  reviewQueue: ['review', 'queue'] as const,
  scoringSettings: ['settings', 'scoring'] as const,
};

/* -- drill -------------------------------------------------------------- */

/** Pass `deckId` to scope the session to one deck; omit it for the cross-deck draw. */
export function useDrillNext(deckId?: number, enabled = true) {
  return useQuery({
    queryKey: keys.drillNext(deckId),
    queryFn: ({ signal }) => api.drill.next(deckId, signal),
    enabled,
    // A drill is a point-in-time draw; never serve a stale one.
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}

export function useDrillDueCount(deckId?: number, enabled = true) {
  return useQuery({
    queryKey: keys.drillDueCount(deckId),
    queryFn: ({ signal }) => api.drill.dueCount(deckId, signal),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}

export function useSubmitDrill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DrillSubmitInput) => api.drill.submit(input),
    onSuccess: () => {
      // Prefix match — clears both the scoped and unscoped due counts.
      void queryClient.invalidateQueries({ queryKey: keys.drillDueCount() });
      void queryClient.invalidateQueries({ queryKey: keys.reviewDueCount });
      void queryClient.invalidateQueries({ queryKey: keys.reviewQueue });
    },
  });
}

/* -- review ------------------------------------------------------------- */

export function useReviewDueCount() {
  return useQuery({
    queryKey: keys.reviewDueCount,
    queryFn: ({ signal }) => api.review.dueCount(signal),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useReviewQueue() {
  return useQuery({
    queryKey: keys.reviewQueue,
    queryFn: ({ signal }) => api.review.queue(signal),
    staleTime: 30_000,
  });
}

/* -- decks -------------------------------------------------------------- */

export function useDecks() {
  return useQuery({
    queryKey: keys.decks,
    queryFn: ({ signal }) => api.decks.list(signal),
  });
}

export function useDeck(deckId: string | undefined) {
  return useQuery({
    queryKey: keys.deck(deckId ?? ''),
    queryFn: ({ signal }) => api.decks.get(deckId!, signal),
    enabled: Boolean(deckId),
  });
}

export function useCreateDeck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeckCreateInput) => api.decks.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.decks });
    },
  });
}

export function useAddProblem(deckId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddProblemInput) => api.decks.addProblem(deckId, input),
    onSuccess: (result) => {
      queryClient.setQueryData(keys.submission(result.submission.id), result.submission);
      void queryClient.invalidateQueries({ queryKey: keys.deck(deckId) });
      void queryClient.invalidateQueries({ queryKey: keys.decks });
    },
  });
}

/* -- submissions -------------------------------------------------------- */

/**
 * Polls while the worker is still resolving the source or evaluating, then
 * settles once the submission reaches a terminal status.
 */
export function useSubmission(
  submissionId: string | undefined,
  options?: Partial<UseQueryOptions<Submission>>,
) {
  return useQuery({
    queryKey: keys.submission(submissionId ?? ''),
    queryFn: ({ signal }) => api.submissions.get(submissionId!, signal),
    enabled: Boolean(submissionId),
    refetchInterval: (query) => (query.state.data && isInFlight(query.state.data.status) ? 1500 : false),
    ...options,
  });
}

export function useCreateSubmission(problemId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmissionCreateInput) => api.submissions.createForProblem(problemId, input),
    onSuccess: (submission) => {
      queryClient.setQueryData(keys.submission(submission.id), submission);
      void queryClient.invalidateQueries({ queryKey: keys.problemSubmissions(problemId) });
    },
  });
}

export function useProblemSubmissions(problemId: number | string | undefined) {
  return useQuery({
    queryKey: keys.problemSubmissions(problemId ?? ''),
    queryFn: ({ signal }) => api.submissions.listForProblem(problemId!, signal),
    enabled: problemId !== undefined,
  });
}

export function useCommitSubmission(submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CommitInput) => api.submissions.commit(submissionId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.submission(submissionId) });
      void queryClient.invalidateQueries({ queryKey: keys.reviewDueCount });
      void queryClient.invalidateQueries({ queryKey: keys.reviewQueue });
      void queryClient.invalidateQueries({ queryKey: keys.decks });
    },
  });
}

/* -- settings ---------------------------------------------------------- */

export function useScoringSettings() {
  return useQuery({
    queryKey: keys.scoringSettings,
    queryFn: ({ signal }) => api.settings.scoring(signal),
    staleTime: 60_000,
  });
}

export function useUpdateScoringSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ScoringThresholdsInput) => api.settings.updateScoring(input),
    onSuccess: (result) => {
      queryClient.setQueryData(keys.scoringSettings, result);
    },
  });
}

export function useResetScoringSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.settings.resetScoring(),
    onSuccess: (result) => {
      queryClient.setQueryData(keys.scoringSettings, result);
    },
  });
}
