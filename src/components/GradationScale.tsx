import { GRADATIONS, type Gradation } from '../api/types';
import { GRADATION_LABEL, cx } from '../lib/format';

/** The five-point gradation scale, shared by the drill and commit flows. */
export function GradationScale({
  value,
  onChange,
  disabled,
  /** Marks whichever value the grader arrived at on its own. */
  suggested,
  suggestedLabel = 'AI',
}: {
  value: Gradation | null;
  onChange: (gradation: Gradation) => void;
  disabled?: boolean;
  suggested?: Gradation | null;
  suggestedLabel?: string;
}) {
  return (
    <div role="radiogroup" aria-label="Gradation" className="flex flex-wrap gap-2">
      {GRADATIONS.map((gradation) => {
        const selected = value === gradation;
        return (
          <button
            key={gradation}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(gradation)}
            className={cx(
              'rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-50',
              selected
                ? 'border-accent bg-accent/15 text-ink'
                : 'border-line text-ink-muted hover:border-ink-faint hover:text-ink',
            )}
          >
            {GRADATION_LABEL[gradation]}
            {gradation === suggested ? (
              <span className="ml-1.5 text-[10px] uppercase text-ink-faint">{suggestedLabel}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
