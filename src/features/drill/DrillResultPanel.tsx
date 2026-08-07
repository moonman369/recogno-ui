import type { DrillResult } from '../../api/types';
import { ReviewSummary } from '../../components/ReviewSummary';
import { Badge, Button, Card, Kbd, SectionTitle } from '../../components/ui';
import { cx, percent } from '../../lib/format';
import type { PatternChoice } from '../../lib/patternCatalog';
import { SCORE_WEIGHTS, scoreTone } from '../../lib/scoring';
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
      <Card
        className={cx(
          'animate-rise',
          correct ? 'border-positive/40' : 'border-negative/40',
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* The verdict is the payoff of the whole loop — it lands with a
                slight overshoot rather than simply appearing. */}
            <span
              className="inline-block"
              style={{
                animation: 'verdict-pop 0.45s var(--ease-spring) both',
              }}
            >
              <Badge tone={correct ? 'positive' : 'negative'}>
                {correct ? 'Correct' : 'Missed'}
              </Badge>
            </span>
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
          <ScoreTile
            label="Correctness"
            value={scores.correctness}
            weight={SCORE_WEIGHTS.correctness}
            delay={0}
          />
          <ScoreTile
            label="Rationale"
            value={scores.rationale}
            weight={SCORE_WEIGHTS.rationale}
            delay={80}
          />
          <ScoreTile label="Speed" value={scores.speed} weight={SCORE_WEIGHTS.speed} delay={160} />
          <ScoreTile label="Composite" value={scores.composite} emphasis delay={260} />
        </div>
      </Card>

      <ReviewSummary review={review} />

      <GradationOverride result={result} problemId={problemId} problemTitle={problemTitle} />

      <Button onClick={onNext} disabled={advancing} className="w-full">
        {advancing ? 'Loading…' : 'Next problem'}
        <Kbd>N</Kbd>
      </Button>
    </div>
  );
}

const SCORE_FILL = {
  positive: 'bg-positive',
  caution: 'bg-caution',
  negative: 'bg-negative',
} as const;

function ScoreTile({
  label,
  value,
  weight,
  emphasis,
  delay,
}: {
  label: string;
  value: number;
  /** Share of the composite, as a fraction. Omitted on the composite itself. */
  weight?: number;
  emphasis?: boolean;
  delay: number;
}) {
  const tone = scoreTone(value);

  return (
    <div
      className={cx(
        'animate-rise rounded-lg border p-3',
        emphasis ? 'border-line-strong bg-surface-raised' : 'border-line bg-canvas',
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-ink-faint">{label}</span>
        {weight !== undefined ? (
          <span className="text-[10px] text-ink-faint">{percent(weight)}</span>
        ) : null}
      </div>

      <p
        className={cx(
          'mt-1 font-semibold tracking-tight',
          emphasis ? 'text-2xl text-ink' : 'text-xl text-ink-muted',
        )}
      >
        {percent(value)}
      </p>

      <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-raised">
        <div
          className={cx('animate-grow h-full origin-left rounded-full', SCORE_FILL[tone])}
          style={{ width: `${Math.round(value * 100)}%`, animationDelay: `${delay + 120}ms` }}
        />
      </div>
    </div>
  );
}
