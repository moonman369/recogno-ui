import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCreateDeck, useDecks } from '../api/queries';
import { PageHeader } from '../components/PageHeader';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Skeleton,
  SkeletonText,
  inputClass,
  textareaClass,
} from '../components/ui';

const NAME_MAX = 120;
const DESCRIPTION_MAX = 2000;

export function DecksPage() {
  const decks = useDecks();
  const create = useCreateDeck();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    create.mutate(
      { name: trimmed, ...(description.trim() ? { description: description.trim() } : {}) },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setOpen(false);
        },
      },
    );
  }

  const totalProblems = decks.data?.decks.reduce((sum, deck) => sum + deck.problemCount, 0) ?? 0;

  return (
    <div>
      <PageHeader
        title="Decks"
        description="Problem sets you own, plus the curated system decks. Adding a problem records your first attempt against it."
        meta={
          decks.data ? (
            <Badge>
              {totalProblems} problem{totalProblems === 1 ? '' : 's'}
            </Badge>
          ) : null
        }
        actions={
          <Button variant={open ? 'ghost' : 'primary'} size="sm" onClick={() => setOpen(!open)}>
            {open ? 'Cancel' : 'New deck'}
          </Button>
        }
      />

      {open ? (
        <Card className="animate-rise mb-8 space-y-4">
          <Field label="Name">
            <input
              autoFocus
              maxLength={NAME_MAX}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={create.isPending}
              placeholder="Graph traversals"
              className={inputClass}
            />
          </Field>

          <Field label="Description" hint="Optional.">
            <textarea
              rows={2}
              maxLength={DESCRIPTION_MAX}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={create.isPending}
              placeholder="Everything that comes down to BFS, DFS or a topological order."
              className={textareaClass}
            />
          </Field>

          {create.isError ? <ErrorState error={create.error} /> : null}

          <Button onClick={handleCreate} disabled={!name.trim() || create.isPending}>
            {create.isPending ? 'Creating…' : 'Create deck'}
          </Button>
        </Card>
      ) : null}

      {decks.isPending ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index} className="rounded-xl border border-line bg-surface p-5">
              <Skeleton className="h-4 w-1/2" />
              <SkeletonText lines={2} className="mt-4" />
              <Skeleton className="mt-5 h-3 w-20" />
            </li>
          ))}
        </ul>
      ) : null}
      {decks.isError ? <ErrorState error={decks.error} onRetry={() => void decks.refetch()} /> : null}

      {decks.data ? (
        decks.data.decks.length === 0 ? (
          <EmptyState
            title="No decks yet"
            body="Decks hold the problems you add. Create one, then paste in a link, a slug or just describe the problem."
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                Create your first deck
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {decks.data.decks.map((deck, index) => (
              <li
                key={deck.id}
                className="animate-rise"
                // Staggered so the grid resolves in reading order instead of
                // appearing as one block.
                style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
              >
                <Link
                  to={`/decks/${deck.id}`}
                  className="group flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition-all duration-300 ease-[var(--ease-quint)] hover:-translate-y-1 hover:border-line-strong hover:shadow-float"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium text-ink group-hover:text-accent">{deck.name}</span>
                    {deck.isSystem ? <Badge>System</Badge> : null}
                  </div>

                  {deck.description ? (
                    <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-ink-faint">
                      {deck.description}
                    </p>
                  ) : (
                    <p className="mt-2 flex-1 text-sm italic text-ink-faint">No description.</p>
                  )}

                  <p className="mt-4 text-xs text-ink-faint">
                    {deck.problemCount} problem{deck.problemCount === 1 ? '' : 's'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
