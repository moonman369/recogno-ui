import { useMemo, useRef, useState } from 'react';
import { useDrillNext, useSubmitDrill } from '../api/queries';
import { ApiError } from '../api/client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Kbd,
  Skeleton,
  SkeletonText,
  textareaClass,
} from '../components/ui';
import { DrillResultPanel } from '../features/drill/DrillResultPanel';
import { CountdownOverlay } from '../features/drill/CountdownOverlay';
import { PatternPicker } from '../features/drill/PatternPicker';
import { SpeedMeter } from '../features/drill/SpeedMeter';
import { DIFFICULTY_TONE, DRILL_SOURCE_LABEL, absoluteTime, cx, relativeTime } from '../lib/format';
import { buildPatternGroups, type PatternChoice } from '../lib/patternCatalog';
import { rememberPatterns } from '../lib/recentPatterns';
import { useCountdown } from '../lib/useCountdown';
import { useElapsedSeconds } from '../lib/useElapsedSeconds';
import { useHotkeys } from '../lib/useHotkeys';

const RATIONALE_MAX = 4000;
/** The worker rejects anything above an hour, so clamp before sending. */
const TIME_MAX_SECONDS = 3600;

export function DrillPage() {
  const drill = useDrillNext();
  const submit = useSubmitDrill();

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [primaryKey, setPrimaryKey] = useState<string | null>(null);
  const [rationaleText, setRationaleText] = useState('');
  const [gradedOnly, setGradedOnly] = useState(false);
  /** Drills completed in this sitting, for a sense of momentum. */
  const [session, setSession] = useState({ done: 0, hits: 0 });

  const filterRef = useRef<HTMLInputElement>(null);
  const rationaleRef = useRef<HTMLTextAreaElement>(null);

  const problem = drill.data?.problem;
  const answered = submit.isSuccess;

  // Count in before each problem, and hold the clock until it clears — those
  // three seconds are preparation, not thinking time, and charging them would
  // quietly cost speed score.
  const countdown = useCountdown(problem?.id, 3, Boolean(problem) && !answered);
  const armed = Boolean(problem) && !answered && countdown.done;
  const elapsed = useElapsedSeconds(problem?.id, armed);

  const groups = useMemo(
    () => buildPatternGroups(drill.data?.patternOptions ?? []),
    [drill.data?.patternOptions],
  );

  const choiceByKey = useMemo(() => {
    const map = new Map<string, PatternChoice>();
    for (const group of groups) {
      for (const choice of group.choices) map.set(choice.key, choice);
    }
    return map;
  }, [groups]);

  const selectedChoices = selectedKeys
    .map((key) => choiceByKey.get(key))
    .filter((choice): choice is PatternChoice => choice !== undefined);
  const primary = primaryKey ? choiceByKey.get(primaryKey) : undefined;
  const gradeableCount = drill.data?.patternOptions.length ?? 0;

  // Gradeable picks go to the worker as real guesses. Catalog-only picks have
  // no id, so those still travel as text — but only those.
  const gradedSelections = selectedChoices.filter(
    (choice): choice is PatternChoice & { id: number } => choice.id !== null,
  );
  const contextOnly = selectedChoices.filter((choice) => choice.id === null);

  const preamble =
    contextOnly.length > 0
      ? `Also reads as: ${contextOnly.map((c) => c.name).join(', ')}.\n\n`
      : '';
  const rationaleBudget = Math.max(0, RATIONALE_MAX - preamble.length);
  const canSubmit = Boolean(primary) && rationaleText.trim().length > 0 && !submit.isPending;

  function toggleChoice(choice: PatternChoice) {
    if (!selectedKeys.includes(choice.key)) {
      setSelectedKeys([...selectedKeys, choice.key]);
      // The first gradeable pick becomes the one that counts.
      if (primaryKey === null && choice.id !== null) setPrimaryKey(choice.key);
      return;
    }

    const next = selectedKeys.filter((key) => key !== choice.key);
    setSelectedKeys(next);
    if (primaryKey === choice.key) {
      setPrimaryKey(next.find((key) => choiceByKey.get(key)?.id != null) ?? null);
    }
  }

  function setPrimary(choice: PatternChoice) {
    if (choice.id === null) return;
    setPrimaryKey(choice.key);
  }

  function nextProblem() {
    setSelectedKeys([]);
    setPrimaryKey(null);
    setRationaleText('');
    submit.reset();
    void drill.refetch();
  }

  function handleSubmit() {
    if (!problem || !primary || primary.id === null || submit.isPending) return;

    // The primary leads, because the response echoes `guessedPattern` as the
    // first of them; the rest are scored too — naming any accepted pattern is
    // full credit.
    const ids = [primary.id, ...gradedSelections.map((c) => c.id).filter((id) => id !== primary.id)];

    submit.mutate(
      {
        problemId: problem.id,
        guessedPatternIds: ids,
        rationaleText: `${preamble}${rationaleText.trim()}`.slice(0, RATIONALE_MAX),
        timeTakenSeconds: Math.min(elapsed, TIME_MAX_SECONDS),
      },
      {
        onSuccess: (result) => {
          rememberPatterns(selectedKeys);
          setSession((previous) => ({
            done: previous.done + 1,
            hits: previous.hits + (result.correct ? 1 : 0),
          }));
        },
      },
    );
  }

  useHotkeys(
    useMemo(
      () => [
        { key: '/', handler: () => filterRef.current?.focus() },
        { key: 'r', handler: () => rationaleRef.current?.focus() },
        { key: 'enter', meta: true, whileTyping: true, handler: handleSubmit },
        { key: 'n', handler: () => answered && nextProblem() },
      ],
      // Rebound whenever the submit inputs change, so the handlers close over
      // current state rather than the values from first render.
      [answered, canSubmit, selectedKeys, primaryKey, rationaleText, elapsed, problem?.id],
    ),
    Boolean(problem),
  );

  if (drill.isPending) return <DrillSkeleton />;

  if (drill.isError) {
    const notFound = drill.error instanceof ApiError && drill.error.status === 404;
    return notFound ? (
      <EmptyState
        title="Nothing to drill"
        body="No problem was available. Add problems to a deck and they will start showing up here."
        action={
          <Button variant="secondary" size="sm" onClick={() => void drill.refetch()}>
            Check again
          </Button>
        }
      />
    ) : (
      <ErrorState error={drill.error} onRetry={() => void drill.refetch()} />
    );
  }

  const { source, dueAt } = drill.data;

  return (
    <div className="space-y-5">
      {/* Session bar — context and clock, above both panes. */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={source === 'due' ? 'accent' : 'neutral'}>{DRILL_SOURCE_LABEL[source]}</Badge>
          {dueAt ? (
            <span className="text-xs text-ink-faint" title={absoluteTime(dueAt)}>
              due {relativeTime(dueAt)}
            </span>
          ) : null}
          {session.done > 0 ? (
            <span className="text-xs text-ink-faint">
              · {session.done} this session
              <span className="text-ink-muted">
                {' '}
                ({session.hits}/{session.done} correct)
              </span>
            </span>
          ) : null}
        </div>

        <SpeedMeter elapsed={elapsed} frozen={answered} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        {/* The problem stays put while you work the answer beside it. */}
        <Card className="relative lg:sticky lg:top-20">
          {countdown.value !== null ? <CountdownOverlay value={countdown.value} /> : null}
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight">{drill.data.problem.title}</h1>
            {drill.data.problem.difficulty ? (
              <span
                className={cx(
                  'text-[11px] font-semibold uppercase tracking-wider',
                  DIFFICULTY_TONE[drill.data.problem.difficulty],
                )}
              >
                {drill.data.problem.difficulty}
              </span>
            ) : null}
          </div>

          <div className="mt-4 max-h-[46vh] overflow-y-auto pr-1 scrollbar-slim lg:max-h-[52vh]">
            {drill.data.problem.statement ? (
              <p className="whitespace-pre-wrap text-[15px] leading-7 text-ink-muted">
                {drill.data.problem.statement}
              </p>
            ) : (
              <p className="text-sm italic text-ink-faint">No statement stored for this problem.</p>
            )}

            {drill.data.problem.constraints ? (
              <div className="mt-4 rounded-lg border border-line bg-canvas p-3">
                <p className="mb-1.5 text-[10px] uppercase tracking-widest text-ink-faint">
                  Constraints
                </p>
                <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-ink-muted">
                  {drill.data.problem.constraints}
                </p>
              </div>
            ) : null}
          </div>

          {drill.data.problem.sourceUrl ? (
            <a
              href={drill.data.problem.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-xs text-accent hover:underline"
            >
              Open the original ↗
            </a>
          ) : null}
        </Card>

        {answered ? (
          <DrillResultPanel
            result={submit.data}
            problemId={drill.data.problem.id}
            problemTitle={drill.data.problem.title}
            contextOnly={contextOnly}
            onNext={nextProblem}
            advancing={drill.isFetching}
          />
        ) : (
          <Card className="space-y-5">
            <div>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium">Which patterns does this combine?</p>
                <span className="text-xs text-ink-faint">{gradeableCount} gradeable</span>
              </div>
              <PatternPicker
                groups={groups}
                selected={selectedKeys}
                primaryKey={primaryKey}
                onToggle={toggleChoice}
                onSetPrimary={setPrimary}
                gradedOnly={gradedOnly}
                onGradedOnlyChange={setGradedOnly}
                disabled={submit.isPending || !countdown.done}
                filterRef={filterRef}
              />
            </div>

            <label className="block">
              <span className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-ink">
                  Why? <Kbd>R</Kbd>
                </span>
                <span className="text-xs text-ink-faint">
                  {rationaleText.length}/{rationaleBudget}
                </span>
              </span>
              <textarea
                ref={rationaleRef}
                rows={3}
                maxLength={rationaleBudget}
                value={rationaleText}
                onChange={(event) => setRationaleText(event.target.value)}
                disabled={submit.isPending || !countdown.done}
                placeholder="The signal that gave it away…"
                className={textareaClass}
              />
              <span className="mt-1.5 block text-xs text-ink-faint">
                Worth 30% — a correct guess with no real reasoning still lands in the Hard band.
                {preamble ? ' Your context-only tags are prepended automatically.' : ''}
              </span>
            </label>

            {selectedKeys.length > 0 && !primary ? (
              <div className="animate-rise rounded-lg border border-caution/40 bg-caution/10 px-3 py-2.5">
                <p className="text-xs text-caution">
                  Everything you have picked is context-only, so there is nothing to grade. Add one
                  pattern from <strong className="font-medium">Graded taxonomy</strong> — the worker
                  scores {gradeableCount} of them.
                </p>
                {!gradedOnly ? (
                  <button
                    type="button"
                    onClick={() => setGradedOnly(true)}
                    className="mt-2 text-xs font-medium text-accent hover:underline"
                  >
                    Show me the gradeable patterns
                  </button>
                ) : null}
              </div>
            ) : null}

            {submit.isError ? <ErrorState error={submit.error} /> : null}

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {submit.isPending ? 'Grading…' : 'Submit guess'}
              </Button>
              <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
                <Kbd>⌘</Kbd>
                <Kbd>↵</Kbd>
              </span>
              <Button
                variant="ghost"
                className="ml-auto"
                onClick={nextProblem}
                disabled={submit.isPending}
              >
                Skip
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/** Holds the two-pane shape while the first problem loads, so nothing jumps. */
function DrillSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-5">
          <Skeleton className="h-6 w-2/3" />
          <SkeletonText lines={7} className="mt-5" />
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <Skeleton className="h-4 w-48" />
          <div className="mt-4 grid grid-cols-2 gap-1.5">
            {Array.from({ length: 10 }, (_, index) => (
              <Skeleton key={index} className="h-8" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
