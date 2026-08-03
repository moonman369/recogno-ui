import type { paths } from './schema';

type Ok<T> = T extends { content: { 'application/json': infer B } } ? B : never;
type Body<T> = T extends { content: { 'application/json': infer B } } ? B : never;

/* -- system ------------------------------------------------------------- */

export type Health = Ok<paths['/health']['get']['responses'][200]>;

/* -- drill -------------------------------------------------------------- */

export type DrillNext = Ok<paths['/drill/next']['get']['responses'][200]>;
export type DrillProblem = DrillNext['problem'];
export type DrillSource = DrillNext['source'];
export type PatternOption = DrillNext['patternOptions'][number];

export type DrillSubmitInput = Body<paths['/drill/submit']['post']['requestBody']>;
export type DrillResult = Ok<paths['/drill/submit']['post']['responses'][200]>;
export type DrillScores = DrillResult['scores'];
/** Every pattern that counts as full credit, not just the canonical one. */
export type AcceptedPattern = DrillResult['acceptedPatterns'][number];

export type DrillDueCount = Ok<paths['/drill/due-count']['get']['responses'][200]>;

/* -- decks -------------------------------------------------------------- */

export type DeckList = Ok<paths['/decks']['get']['responses'][200]>;
export type Deck = DeckList['decks'][number];
export type DeckCreateInput = Body<paths['/decks']['post']['requestBody']>;

export type DeckDetail = Ok<paths['/decks/{deckId}']['get']['responses'][200]>;
export type DeckProblem = DeckDetail['problems'][number];
export type ProblemMode = DeckProblem['mode'];
export type Difficulty = NonNullable<DeckProblem['difficulty']>;
export type ProblemSource = DeckProblem['source'];

export type AddProblemInput = Body<paths['/decks/{deckId}/problems']['post']['requestBody']>;
export type AddProblemResult = Ok<paths['/decks/{deckId}/problems']['post']['responses'][202]>;

/* -- submissions -------------------------------------------------------- */

export type Submission = Ok<paths['/submissions/{submissionId}']['get']['responses'][200]>;
export type SubmissionStatus = Submission['status'];
export type SubmissionStage = Submission['stages'][number];
export type StageName = SubmissionStage['stage'];
export type StageStatus = SubmissionStage['status'];
export type Evaluation = NonNullable<Submission['evaluation']>;
export type Gradation = Evaluation['gradation'];

export type SubmissionCreateInput = Body<
  paths['/problems/{problemId}/submissions']['post']['requestBody']
>;
export type SubmissionList = Ok<
  paths['/problems/{problemId}/submissions']['get']['responses'][200]
>;

export type CommitInput = Body<paths['/submissions/{submissionId}/commit']['post']['requestBody']>;
export type CommitResult = Ok<paths['/submissions/{submissionId}/commit']['post']['responses'][200]>;

/* -- review ------------------------------------------------------------- */

export type ReviewDueCount = Ok<paths['/review/due-count']['get']['responses'][200]>;
export type ReviewQueue = Ok<paths['/review/queue']['get']['responses'][200]>;
export type ReviewQueueItem = ReviewQueue['items'][number];

/* -- shared ------------------------------------------------------------- */

/** The FSRS card state returned by both grading paths. */
export type ReviewCard = DrillResult['review'];
export type FsrsRating = ReviewCard['rating'];

export const GRADATIONS = [
  'try-again',
  'needs-work',
  'not-bad',
  'good-job',
  'excellent',
] as const satisfies readonly Gradation[];

/** Statuses where the worker is still doing something and we should keep polling. */
export const IN_FLIGHT_STATUSES = [
  'queued',
  'resolving-source',
  'evaluating',
] as const satisfies readonly SubmissionStatus[];

export function isInFlight(status: SubmissionStatus): boolean {
  return (IN_FLIGHT_STATUSES as readonly SubmissionStatus[]).includes(status);
}
