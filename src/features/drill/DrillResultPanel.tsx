import type { DrillResult } from '../../api/types';
import { ReviewSummary } from '../../components/ReviewSummary';
import { Badge, Button, Card, SectionTitle } from '../../components/ui';
import { percent } from '../../lib/format';
import type { PatternChoice } from '../../lib/patternCatalog';
import { GradationOverride } from './GradationOverride';

const VERDICT_LABEL = {
  yes: 'Sound reasoning',
  partial: 'Partly there',
  no: 'Not the reason',
} as const;

export function DrillResultPanel({
  result,
  problemId,
  problemTitle,
  contextOnly,
  onNext,
  advancing,
}: {
  result: DrillResult;
  problemId: number;
  problemTitle: string;
  /** Catalog-only tags, which have no id and so were sent as text. */
  contextOnly: PatternChoice[];
  onNext: () => void;
  advancing: boolean;
}) {
  const {
    correct,
    guessedPattern,
    guessedPatterns,
    actualPattern,
    acceptedPatterns,
    tell,
    explanation,
    scores,
    rationale,
    review,
  } = result;

  const guesses = guessedPatterns?.length ? guessedPatterns : [guessedPattern];

  // Naming any accepted pattern is full credit, so show which of the guesses
  // landed rather than only comparing against the canonical one.
  const acceptedIds = new Set(acceptedPatterns.map((pattern) => pattern.id));
  const hits = guesses.filter((guess) => acceptedIds.has(guess.id));
  const misses = guesses.filter((guess) => !acceptedIds.has(guess.id));

  // Other patterns this problem would also have accepted.
  const alsoAccepted = acceptedPatterns.filter(
    (pattern) => pattern.id !== actualPattern.id && !guesses.some((g) => g.id === pattern.id),
  );

  return (
    <div className="space-y-4">
      <Card className={correct ? 'border-positive/40' : 'border-negative/40'}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge tone={correct ? 'positive' : 'negative'}>{correct ? 'Correct' : 'Missed'}</Badge>
            <p className="text-lg font-semibold">{actualPattern.name}</p>
          </div>
          {misses.length > 0 ? (
            <p className="text-sm text-ink-faint">
              {correct ? 'Also said' : 'You said'}{' '}
              <span className="text-ink-muted">
                {misses.map((guess) => guess.name).join(', ')}
              </span>
            </p>
          ) : null}
        </div>

        {guesses.length > 1 ? (
          <p className="mt-3 text-xs text-ink-faint">
            {hits.length > 0
              ? `${hits.length} of your ${guesses.length} patterns counted: ${hits
                  .map((guess) => guess.name)
                  .join(', ')}.`
              : `None of your ${guesses.length} patterns were accepted here.`}
          </p>
        ) : null}

        {alsoAccepted.length > 0 ? (
          <p className="mt-1 text-xs text-ink-faint">
            Would also have counted: {alsoAccepted.map((pattern) => pattern.name).join(', ')}
          </p>
        ) : null}

        {contextOnly.length > 0 ? (
          <p className="mt-1 text-xs text-ink-faint">
            Tagged as context: {contextOnly.map((choice) => choice.name).join(', ')}
          </p>
        ) : null}

        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{actualPattern.description}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink">{explanation}</p>
      </Card>

      {tell ? (
        <Card>
          <SectionTitle>The tell</SectionTitle>
          <p className="text-sm leading-relaxed text-ink-muted">{tell}</p>
        </Card>
      ) : null}

      <Card>
        <SectionTitle
          hint={
            rationale.judged
              ? VERDICT_LABEL[rationale.verdict]
              : 'Rationale scored neutrally — AI unreachable'
          }
        >
          Scores
        </SectionTitle>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ScoreTile label="Correctness" value={scores.correctness} weight="50%" />
          <ScoreTile label="Speed" value={scores.speed} weight="20%" />
          <ScoreTile label="Rationale" value={scores.rationale} weight="30%" />
          <ScoreTile label="Composite" value={scores.composite} emphasis />
        </div>
      </Card>

      <ReviewSummary review={review} />

      <GradationOverride result={result} problemId={problemId} problemTitle={problemTitle} />

      <Button onClick={onNext} disabled={advancing} className="w-full">
        {advancing ? 'Loading…' : 'Next problem'}
      </Button>
    </div>
  );
}

function ScoreTile({
  label,
  value,
  weight,
  emphasis,
}: {
  label: string;
  value: number;
  weight?: string;
  emphasis?: boolean;
}) {
  const tone = value >= 0.75 ? 'bg-positive' : value >= 0.4 ? 'bg-caution' : 'bg-negative';

  return (
    <div className="rounded-lg border border-line bg-canvas p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-ink-faint">{label}</span>
        {weight ? <span className="text-[10px] text-ink-faint">{weight}</span> : null}
      </div>
      <p className={emphasis ? 'mt-1 font-mono text-xl' : 'mt-1 font-mono text-lg'}>
        {percent(value)}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-raised">
        <div className={`h-full ${tone}`} style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}
