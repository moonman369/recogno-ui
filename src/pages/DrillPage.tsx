import { useMemo, useState } from 'react';
import { useDrillNext, useSubmitDrill } from '../api/queries';
import { ApiError } from '../api/client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Loading,
  textareaClass,
} from '../components/ui';
import { DrillResultPanel } from '../features/drill/DrillResultPanel';
import { PatternPicker } from '../features/drill/PatternPicker';
import {
  DIFFICULTY_TONE,
  DRILL_SOURCE_LABEL,
  absoluteTime,
  cx,
  formatSeconds,
  relativeTime,
} from '../lib/format';
import { buildPatternGroups, type PatternChoice } from '../lib/patternCatalog';
import { useElapsedSeconds } from '../lib/useElapsedSeconds';

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

  const problem = drill.data?.problem;
  const answered = submit.isSuccess;
  const elapsed = useElapsedSeconds(problem?.id, Boolean(problem) && !answered);

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

  function reset() {
    setSelectedKeys([]);
    setPrimaryKey(null);
    setRationaleText('');
    submit.reset();
  }

  function nextProblem() {
    reset();
    void drill.refetch();
  }

  function handleSubmit() {
    if (!problem || !primary || primary.id === null) return;

    // The primary leads, because the response echoes `guessedPattern` as the
    // first of them; the rest are scored too — naming any accepted pattern is
    // full credit.
    const ids = [primary.id, ...gradedSelections.map((c) => c.id).filter((id) => id !== primary.id)];

    submit.mutate({
      problemId: problem.id,
      guessedPatternIds: ids,
      rationaleText: `${preamble}${rationaleText.trim()}`.slice(0, RATIONALE_MAX),
      timeTakenSeconds: Math.min(elapsed, TIME_MAX_SECONDS),
    });
  }

  if (drill.isPending) return <Loading label="Drawing a problem…" />;

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
  const canSubmit = Boolean(primary) && rationaleText.trim().length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <Badge tone={source === 'due' ? 'accent' : 'neutral'}>{DRILL_SOURCE_LABEL[source]}</Badge>
          {dueAt ? (
            <span className="text-xs text-ink-faint" title={absoluteTime(dueAt)}>
              due {relativeTime(dueAt)}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className={cx(
              'size-1.5 rounded-full',
              answered ? 'bg-ink-faint' : 'animate-pulse bg-accent',
            )}
          />
          <span
            className={cx(
              'font-mono text-sm tabular-nums',
              answered ? 'text-ink-faint' : 'text-ink-muted',
            )}
            aria-label="Time on this problem"
          >
            {formatSeconds(elapsed)}
          </span>
        </div>
      </div>

      <Card className="shadow-raised">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{drill.data.problem.title}</h1>
          {drill.data.problem.difficulty ? (
            <span
              className={cx(
                'text-xs font-medium uppercase',
                DIFFICULTY_TONE[drill.data.problem.difficulty],
              )}
            >
              {drill.data.problem.difficulty}
            </span>
          ) : null}
        </div>

        {drill.data.problem.statement ? (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
            {drill.data.problem.statement}
          </p>
        ) : (
          <p className="mt-4 text-sm italic text-ink-faint">No statement stored for this problem.</p>
        )}

        {drill.data.problem.constraints ? (
          <div className="mt-4 rounded-lg border border-line bg-canvas p-3">
            <p className="mb-1 text-xs uppercase tracking-widest text-ink-faint">Constraints</p>
            <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-ink-muted">
              {drill.data.problem.constraints}
            </p>
          </div>
        ) : null}

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
            <p className="mb-3 text-sm font-medium">Which patterns does this combine?</p>
            <PatternPicker
              groups={groups}
              selected={selectedKeys}
              primaryKey={primaryKey}
              onToggle={toggleChoice}
              onSetPrimary={setPrimary}
              gradedOnly={gradedOnly}
              onGradedOnlyChange={setGradedOnly}
              disabled={submit.isPending}
            />
          </div>

          <Field
            label="Why?"
            hint={`Graded alongside the guess. ${rationaleText.length}/${rationaleBudget}${
              preamble ? ' — your context-only tags are prepended automatically' : ''
            }`}
          >
            <textarea
              rows={4}
              maxLength={rationaleBudget}
              value={rationaleText}
              onChange={(event) => setRationaleText(event.target.value)}
              disabled={submit.isPending}
              placeholder="The signal that gave it away…"
              className={textareaClass}
            />
          </Field>

          {selectedKeys.length > 0 && !primary ? (
            <div className="rounded-lg border border-caution/40 bg-caution/10 px-3 py-2.5">
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

          <div className="flex items-center gap-3">
            <Button onClick={handleSubmit} disabled={!canSubmit || submit.isPending}>
              {submit.isPending ? 'Grading…' : 'Submit guess'}
            </Button>
            <Button variant="ghost" onClick={nextProblem} disabled={submit.isPending}>
              Skip
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
