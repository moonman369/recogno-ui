import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Kbd } from '../../components/ui';
import { normalizeSlug, type PatternChoice, type PatternGroup } from '../../lib/patternCatalog';
import { loadRecentPatterns } from '../../lib/recentPatterns';
import { cx } from '../../lib/format';

export type PatternPickerProps = {
  groups: PatternGroup[];
  /** Selected choice keys, in the order they were picked. */
  selected: string[];
  /** The pick that gets graded. Always one of `selected`, and always gradeable. */
  primaryKey: string | null;
  onToggle: (choice: PatternChoice) => void;
  onSetPrimary: (choice: PatternChoice) => void;
  /** Controlled by the page so a blocked submit can switch it on. */
  gradedOnly: boolean;
  onGradedOnlyChange: (value: boolean) => void;
  disabled?: boolean;
};

export type PatternPickerHandle = {
  focusFilter: () => void;
};

export function PatternPicker({
  groups,
  selected,
  primaryKey,
  onToggle,
  onSetPrimary,
  gradedOnly,
  onGradedOnlyChange,
  disabled,
  filterRef,
}: PatternPickerProps & { filterRef?: React.RefObject<HTMLInputElement | null> }) {
  const [filter, setFilter] = useState('');
  const [coreOnly, setCoreOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(0);

  const listRef = useRef<HTMLDivElement>(null);

  const choiceByKey = useMemo(() => {
    const map = new Map<string, PatternChoice>();
    for (const group of groups) {
      for (const choice of group.choices) map.set(choice.key, choice);
    }
    return map;
  }, [groups]);

  // Pinned above everything else: the handful this user actually reaches for.
  const recentGroup = useMemo<PatternGroup | null>(() => {
    const choices = loadRecentPatterns()
      .map((key) => choiceByKey.get(key))
      .filter((choice): choice is PatternChoice => choice !== undefined);
    return choices.length > 0 ? { name: 'Recent', choices } : null;
  }, [choiceByKey]);

  const allGroups = useMemo(
    () => (recentGroup ? [recentGroup, ...groups] : groups),
    [recentGroup, groups],
  );

  const visibleGroups = useMemo(() => {
    const needle = normalizeSlug(filter);
    return allGroups
      .map((group) => ({
        name: group.name,
        choices: group.choices.filter((choice) => {
          if (coreOnly && choice.core === undefined) return false;
          if (gradedOnly && choice.id === null) return false;
          if (!needle) return true;
          return (
            normalizeSlug(choice.name).includes(needle) ||
            normalizeSlug(choice.slug).includes(needle) ||
            normalizeSlug(group.name).includes(needle)
          );
        }),
      }))
      .filter((group) => group.choices.length > 0);
  }, [allGroups, filter, coreOnly, gradedOnly]);

  /** Flattened order the arrow keys walk. */
  const flat = useMemo(
    () => visibleGroups.flatMap((group) => group.choices),
    [visibleGroups],
  );

  // Keep the cursor inside the list as filters narrow it.
  useEffect(() => {
    setCursor((current) => (current >= flat.length ? 0 : current));
  }, [flat.length]);

  const selectedChoices = selected
    .map((key) => choiceByKey.get(key))
    .filter((choice): choice is PatternChoice => choice !== undefined);

  const searching = filter.trim().length > 0;

  function toggleCollapsed(name: string) {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function moveCursor(delta: number) {
    if (flat.length === 0) return;
    const next = (cursor + delta + flat.length) % flat.length;
    setCursor(next);
    listRef.current
      ?.querySelector(`[data-index="${next}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }

  /** Arrow keys walk the list, Enter picks — all without leaving the filter box. */
  function handleFilterKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveCursor(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveCursor(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const choice = flat[cursor];
      if (choice) onToggle(choice);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (filter) setFilter('');
      else event.currentTarget.blur();
    }
  }

  let runningIndex = -1;

  return (
    <div>
      {selectedChoices.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {selectedChoices.map((choice) => {
            const isPrimary = choice.key === primaryKey;
            return (
              <span
                key={choice.key}
                className={cx(
                  'animate-rise inline-flex items-center gap-1.5 rounded-full border py-1 pl-2.5 pr-1.5 text-xs',
                  isPrimary
                    ? 'border-accent bg-accent-soft text-ink'
                    : 'border-line bg-surface text-ink-muted',
                )}
              >
                {choice.id !== null ? (
                  <button
                    type="button"
                    disabled={disabled || isPrimary}
                    onClick={() => onSetPrimary(choice)}
                    title={isPrimary ? 'Graded pick' : 'Make this the graded pick'}
                    className={cx(
                      'leading-none transition-colors',
                      isPrimary ? 'text-accent' : 'text-ink-faint hover:text-accent',
                    )}
                  >
                    {isPrimary ? '★' : '☆'}
                  </button>
                ) : (
                  <span
                    title="Not in the worker's taxonomy — recorded as context"
                    className="text-ink-faint"
                  >
                    ○
                  </span>
                )}
                {choice.name}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggle(choice)}
                  aria-label={`Remove ${choice.name}`}
                  className="rounded-full px-1 text-ink-faint transition-colors hover:text-negative"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <input
            ref={filterRef}
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            onKeyDown={handleFilterKeyDown}
            placeholder="Filter patterns…"
            disabled={disabled}
            className="w-full rounded-lg border border-line bg-canvas py-2 pl-3 pr-9 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
            <Kbd>/</Kbd>
          </span>
        </div>

        <FilterChip active={coreOnly} onClick={() => setCoreOnly(!coreOnly)} disabled={disabled}>
          Core 20
        </FilterChip>
        <FilterChip
          active={gradedOnly}
          onClick={() => onGradedOnlyChange(!gradedOnly)}
          disabled={disabled}
        >
          Gradeable
        </FilterChip>
      </div>

      <div
        ref={listRef}
        className="max-h-[22rem] overflow-y-auto rounded-lg border border-line bg-canvas/40 scrollbar-slim"
      >
        {visibleGroups.map((group) => {
          const isCollapsed = collapsed.has(group.name) && !searching;
          const isRecent = group.name === 'Recent';

          return (
            <section key={group.name}>
              <button
                type="button"
                onClick={() => toggleCollapsed(group.name)}
                className="sticky top-0 z-10 flex w-full items-center justify-between gap-2 border-b border-line bg-surface-raised/95 px-3 py-1.5 text-left backdrop-blur-sm"
              >
                <span
                  className={cx(
                    'text-[11px] font-semibold uppercase tracking-widest',
                    isRecent ? 'text-accent' : 'text-ink-faint',
                  )}
                >
                  {group.name}
                </span>
                <span className="text-xs text-ink-faint">
                  {group.choices.length}
                  <span className="ml-2 inline-block w-2">{isCollapsed ? '+' : '−'}</span>
                </span>
              </button>

              {isCollapsed ? null : (
                <div className="grid grid-cols-1 gap-1.5 p-2 sm:grid-cols-2">
                  {group.choices.map((choice) => {
                    runningIndex += 1;
                    return (
                      <ChoiceButton
                        key={`${group.name}:${choice.key}`}
                        index={runningIndex}
                        choice={choice}
                        selected={selected.includes(choice.key)}
                        primary={choice.key === primaryKey}
                        active={runningIndex === cursor}
                        disabled={disabled}
                        onClick={() => onToggle(choice)}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {flat.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">Nothing matches those filters.</p>
        ) : null}
      </div>

      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
        <span>
          ★ is graded · dashed <span className="uppercase">tag</span> entries are context only
        </span>
        <span className="inline-flex items-center gap-1">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> move
          <Kbd>↵</Kbd> pick
        </span>
      </p>
    </div>
  );
}

function ChoiceButton({
  choice,
  selected,
  primary,
  active,
  index,
  disabled,
  onClick,
}: {
  choice: PatternChoice;
  selected: boolean;
  primary: boolean;
  active: boolean;
  index: number;
  disabled?: boolean;
  onClick: () => void;
}) {
  const gradeable = choice.id !== null;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      data-index={index}
      disabled={disabled}
      onClick={onClick}
      title={gradeable ? undefined : 'Not in the graded taxonomy — travels as context only'}
      className={cx(
        'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-all duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        primary
          ? 'border-accent bg-accent-soft text-ink'
          : selected
            ? 'border-accent/50 bg-accent/5 text-ink'
            : gradeable
              ? 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink'
              : 'border-dashed border-line/70 bg-transparent text-ink-faint hover:border-ink-faint hover:text-ink-muted',
        active && 'ring-1 ring-accent/60',
      )}
    >
      <span className={cx('text-xs leading-none', selected ? 'text-accent' : 'text-ink-faint')}>
        {primary ? '★' : selected ? '✓' : gradeable ? '·' : '○'}
      </span>
      <span className="min-w-0 flex-1 truncate">{choice.name}</span>
      {choice.core !== undefined ? (
        <span
          title={`Core pattern #${choice.core}`}
          className="shrink-0 rounded bg-surface-raised px-1 text-[10px] font-medium text-ink-faint"
        >
          {choice.core}
        </span>
      ) : null}
      {!gradeable ? (
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-ink-faint">tag</span>
      ) : choice.tag ? (
        <span className="shrink-0 text-[10px] uppercase text-ink-faint">{choice.tag}</span>
      ) : null}
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'rounded-lg border px-2.5 py-2 text-xs transition-colors disabled:opacity-50',
        active
          ? 'border-accent bg-accent-soft text-ink'
          : 'border-line text-ink-muted hover:border-line-strong hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
