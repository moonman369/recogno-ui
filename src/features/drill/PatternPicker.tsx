import { useMemo, useState, type ReactNode } from 'react';
import { inputClass } from '../../components/ui';
import { normalizeSlug, type PatternChoice, type PatternGroup } from '../../lib/patternCatalog';
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

export function PatternPicker({
  groups,
  selected,
  primaryKey,
  onToggle,
  onSetPrimary,
  gradedOnly,
  onGradedOnlyChange,
  disabled,
}: PatternPickerProps) {
  const [filter, setFilter] = useState('');
  const [coreOnly, setCoreOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const choiceByKey = useMemo(() => {
    const map = new Map<string, PatternChoice>();
    for (const group of groups) {
      for (const choice of group.choices) map.set(choice.key, choice);
    }
    return map;
  }, [groups]);

  const visibleGroups = useMemo(() => {
    const needle = normalizeSlug(filter);
    return groups
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
  }, [groups, filter, coreOnly, gradedOnly]);

  const selectedChoices = selected
    .map((key) => choiceByKey.get(key))
    .filter((choice): choice is PatternChoice => choice !== undefined);

  const totalVisible = visibleGroups.reduce((sum, group) => sum + group.choices.length, 0);
  const searching = filter.trim().length > 0;

  function toggleCollapsed(name: string) {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

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
                  'inline-flex items-center gap-1.5 rounded-full border py-1 pl-2.5 pr-1.5 text-xs',
                  isPrimary ? 'border-accent bg-accent/15 text-ink' : 'border-line text-ink-muted',
                )}
              >
                {choice.id !== null ? (
                  <button
                    type="button"
                    disabled={disabled || isPrimary}
                    onClick={() => onSetPrimary(choice)}
                    title={isPrimary ? 'Graded pick' : 'Make this the graded pick'}
                    className={cx(
                      'leading-none',
                      isPrimary ? 'text-accent' : 'text-ink-faint hover:text-accent',
                    )}
                  >
                    {isPrimary ? '★' : '☆'}
                  </button>
                ) : (
                  <span title="Not in the worker's taxonomy — recorded as context" className="text-ink-faint">
                    ○
                  </span>
                )}
                {choice.name}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggle(choice)}
                  aria-label={`Remove ${choice.name}`}
                  className="rounded-full px-1 text-ink-faint hover:text-negative"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter patterns…"
          disabled={disabled}
          className={cx(inputClass, 'flex-1 min-w-48')}
        />
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

      <div className="max-h-[26rem] overflow-y-auto rounded-lg border border-line scrollbar-slim">
        {visibleGroups.map((group) => {
          const isCollapsed = collapsed.has(group.name) && !searching;
          return (
            <section key={group.name}>
              <button
                type="button"
                onClick={() => toggleCollapsed(group.name)}
                className="sticky top-0 z-10 flex w-full items-center justify-between gap-2 border-b border-line bg-surface-raised px-3 py-1.5 text-left"
              >
                <span className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
                  {group.name}
                </span>
                <span className="text-xs text-ink-faint">
                  {group.choices.length}
                  <span className="ml-2 inline-block w-2">{isCollapsed ? '+' : '−'}</span>
                </span>
              </button>

              {isCollapsed ? null : (
                <div className="grid grid-cols-1 gap-1.5 p-2 sm:grid-cols-2">
                  {group.choices.map((choice) => (
                    <ChoiceButton
                      key={`${group.name}:${choice.key}`}
                      choice={choice}
                      selected={selected.includes(choice.key)}
                      primary={choice.key === primaryKey}
                      disabled={disabled}
                      onClick={() => onToggle(choice)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {totalVisible === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">
            Nothing matches those filters.
          </p>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-ink-faint">
        Pick every pattern the problem combines. ★ marks the one that gets graded — it has to come
        from <strong className="font-medium text-ink-muted">Graded taxonomy</strong>. Dashed
        entries marked <span className="uppercase">tag</span> are context only and cannot be graded.
      </p>
    </div>
  );
}

function ChoiceButton({
  choice,
  selected,
  primary,
  disabled,
  onClick,
}: {
  choice: PatternChoice;
  selected: boolean;
  primary: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const gradeable = choice.id !== null;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      title={gradeable ? undefined : 'Not in the graded taxonomy — travels as context only'}
      className={cx(
        'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        primary
          ? 'border-accent bg-accent/15 text-ink'
          : selected
            ? 'border-accent/50 bg-accent/5 text-ink'
            : gradeable
              ? 'border-line bg-surface text-ink-muted hover:border-ink-faint hover:text-ink'
              : // Visibly secondary: these cannot carry the graded guess.
                'border-dashed border-line/70 bg-transparent text-ink-faint hover:border-ink-faint hover:text-ink-muted',
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
          ? 'border-accent bg-accent/15 text-ink'
          : 'border-line text-ink-muted hover:border-ink-faint hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
