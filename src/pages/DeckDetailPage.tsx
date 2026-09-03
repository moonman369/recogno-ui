import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAddProblem, useDeck } from '../api/queries';
import type { AddProblemInput } from '../api/types';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Loading,
  inputClass,
  textareaClass,
} from '../components/ui';
import { PageHeader } from '../components/PageHeader';
import { NoteSolutionFields } from '../features/submissions/NoteSolutionFields';
import {
  DIFFICULTY_TONE,
  MODE_LABEL,
  absoluteTime,
  cx,
  isDue,
  relativeTime,
} from '../lib/format';

const INPUT_MAX = 20_000;
const TITLE_MAX = 200;

const SOURCE_CHOICES = [
  { value: '', label: 'Auto-detect' },
  { value: 'link', label: 'Link' },
  { value: 'slug', label: 'Slug' },
  { value: 'text', label: 'Free text' },
] as const;

export function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const deck = useDeck(deckId);
  const [adding, setAdding] = useState(false);

  if (deck.isPending) return <Loading />;
  if (deck.isError) return <ErrorState error={deck.error} onRetry={() => void deck.refetch()} />;

  const dueCount = deck.data.problems.filter((problem) => isDue(problem.dueAt)).length;
  const editable = !deck.data.isSystem;
  const hasProblems = deck.data.problems.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: '/decks', label: 'Decks' }}
        title={deck.data.name}
        description={deck.data.description ?? undefined}
        meta={
          <>
            {deck.data.isSystem ? <Badge>System · read-only</Badge> : null}
            {dueCount > 0 ? <Badge tone="accent">{dueCount} due</Badge> : null}
          </>
        }
        actions={
          <>
            {hasProblems ? (
              <Link to={`/drill?deckId=${deckId}`}>
                <Button variant="secondary" size="sm">
                  Drill this deck
                </Button>
              </Link>
            ) : null}
            {editable ? (
              <Button
                variant={adding ? 'ghost' : 'primary'}
                size="sm"
                onClick={() => setAdding(!adding)}
              >
                {adding ? 'Cancel' : 'Add a problem'}
              </Button>
            ) : null}
          </>
        }
      />

      {editable && adding ? (
        <AddProblemForm deckId={deckId!} onDone={() => setAdding(false)} />
      ) : null}

      {deck.data.problems.length === 0 ? (
        <EmptyState
          title="No problems in this deck"
          body={
            deck.data.isSystem
              ? 'This curated deck is empty.'
              : 'Add one above with the note and solution from your attempt.'
          }
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {deck.data.problems.map((problem) => (
            <li key={problem.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium">{problem.title}</span>
                  {problem.difficulty ? (
                    <span
                      className={cx(
                        'text-[10px] font-medium uppercase',
                        DIFFICULTY_TONE[problem.difficulty],
                      )}
                    >
                      {problem.difficulty}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {MODE_LABEL[problem.mode]}
                  {problem.dueAt ? (
                    <>
                      {' · '}
                      <span
                        className={isDue(problem.dueAt) ? 'text-accent' : undefined}
                        title={absoluteTime(problem.dueAt)}
                      >
                        due {relativeTime(problem.dueAt)}
                      </span>
                    </>
                  ) : (
                    ' · unscheduled'
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {problem.sourceUrl ? (
                  <a
                    href={problem.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-ink-faint hover:text-ink"
                  >
                    source ↗
                  </a>
                ) : null}
                <Link
                  to={`/problems/${problem.id}/attempt`}
                  className="text-xs text-accent hover:underline"
                >
                  Attempt
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddProblemForm({ deckId, onDone }: { deckId: string; onDone: () => void }) {
  const navigate = useNavigate();
  const addProblem = useAddProblem(deckId);

  const [input, setInput] = useState('');
  const [source, setSource] = useState<'' | 'link' | 'slug' | 'text'>('');
  const [title, setTitle] = useState('');
  const [noteText, setNoteText] = useState('');
  const [solutionText, setSolutionText] = useState('');

  const ready = input.trim() && noteText.trim() && solutionText.trim();

  function handleSubmit() {
    if (!ready) return;
    const payload: AddProblemInput = {
      input: input.trim(),
      noteText: noteText.trim(),
      solutionText: solutionText.trim(),
      ...(source ? { source } : {}),
      ...(title.trim() ? { title: title.trim() } : {}),
    };
    addProblem.mutate(payload, {
      onSuccess: (result) => navigate(`/submissions/${result.submission.id}`),
    });
  }

  return (
    <Card className="animate-rise space-y-4">
      <Field label="Problem" hint="A link, a slug, or a free-text description.">
        <textarea
          autoFocus
          rows={2}
          maxLength={INPUT_MAX}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={addProblem.isPending}
          placeholder="https://leetcode.com/problems/two-sum/"
          className={textareaClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Interpret as">
          <select
            value={source}
            onChange={(event) => setSource(event.target.value as typeof source)}
            disabled={addProblem.isPending}
            className={inputClass}
          >
            {SOURCE_CHOICES.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Title" hint="Optional. Overrides the derived title.">
          <input
            maxLength={TITLE_MAX}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={addProblem.isPending}
            className={inputClass}
          />
        </Field>
      </div>

      <NoteSolutionFields
        noteText={noteText}
        solutionText={solutionText}
        onNoteChange={setNoteText}
        onSolutionChange={setSolutionText}
        disabled={addProblem.isPending}
      />

      {addProblem.isError ? <ErrorState error={addProblem.error} /> : null}

      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={!ready || addProblem.isPending}>
          {addProblem.isPending ? 'Queueing…' : 'Add and evaluate'}
        </Button>
        <Button variant="ghost" onClick={onDone} disabled={addProblem.isPending}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
