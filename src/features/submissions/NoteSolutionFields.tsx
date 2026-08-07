import { Field, textareaClass } from '../../components/ui';

export const NOTE_MAX = 20_000;
export const SOLUTION_MAX = 50_000;

export function NoteSolutionFields({
  noteText,
  solutionText,
  onNoteChange,
  onSolutionChange,
  disabled,
}: {
  noteText: string;
  solutionText: string;
  onNoteChange: (value: string) => void;
  onSolutionChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <Field label="Note" hint="The approach you took and anything that tripped you up.">
        <textarea
          rows={5}
          maxLength={NOTE_MAX}
          value={noteText}
          onChange={(event) => onNoteChange(event.target.value)}
          disabled={disabled}
          placeholder="I spotted the monotonic stack because…"
          className={textareaClass}
        />
      </Field>

      <Field label="Solution" hint="Code, pseudocode or prose. Stored opaquely and never parsed.">
        <textarea
          rows={10}
          maxLength={SOLUTION_MAX}
          value={solutionText}
          onChange={(event) => onSolutionChange(event.target.value)}
          disabled={disabled}
          spellCheck={false}
          placeholder="def solve(nums): …"
          className={`${textareaClass} font-mono text-xs`}
        />
      </Field>
    </>
  );
}
