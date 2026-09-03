import { useEffect, useMemo, useState } from 'react';
import {
  useResetScoringSettings,
  useScoringSettings,
  useUpdateScoringSettings,
} from '../api/queries';
import type { ScoringThresholds } from '../api/types';
import { PageHeader } from '../components/PageHeader';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  SectionTitle,
  Skeleton,
  inputClass,
} from '../components/ui';
import { DEFAULT_THRESHOLDS, validateThresholds } from '../lib/scoringThresholds';

type Key = keyof ScoringThresholds;
type Draft = Record<Key, string>;

const ROWS: { key: Key; label: string; hint: string }[] = [
  { key: 'easy', label: 'Easy at or above', hint: 'Top band. Nailed it, fast and well argued.' },
  { key: 'good', label: 'Good at or above', hint: 'Solid — the steady-progress band.' },
  {
    key: 'hard',
    label: 'Hard at or above',
    hint: 'Scraped through. Score below this and the card lapses (Again).',
  },
];

const toNum = (raw: string): number => (raw.trim() === '' ? Number.NaN : Number(raw));

export function SettingsPage() {
  const settings = useScoringSettings();
  const update = useUpdateScoringSettings();
  const reset = useResetScoringSettings();

  const [draft, setDraft] = useState<Draft>({ easy: '', good: '', hard: '' });

  // Seed from the server once the real thresholds arrive, and re-seed after a
  // save or reset (both push fresh data into the cache).
  useEffect(() => {
    if (!settings.data) return;
    const { easy, good, hard } = settings.data.thresholds;
    setDraft({ easy: String(easy), good: String(good), hard: String(hard) });
  }, [settings.data]);

  const parsed = useMemo<ScoringThresholds>(
    () => ({ easy: toNum(draft.easy), good: toNum(draft.good), hard: toNum(draft.hard) }),
    [draft],
  );
  const validationError = validateThresholds(parsed);

  const dirty = useMemo(() => {
    if (!settings.data) return false;
    const { easy, good, hard } = settings.data.thresholds;
    return draft.easy !== String(easy) || draft.good !== String(good) || draft.hard !== String(hard);
  }, [draft, settings.data]);

  const busy = update.isPending || reset.isPending;

  function handleSave() {
    if (validationError || !dirty || busy) return;
    update.mutate(parsed);
  }

  return (
    <div>
      <PageHeader
        title="Scoring settings"
        description="How strict grading is. These thresholds decide which grade — Again, Hard, Good or Easy — each drill or note attempt earns from its score. They don’t change the scheduler’s own maths; the interval a grade produces is still FSRS’s call."
        meta={
          settings.data ? (
            <Badge tone={settings.data.isDefault ? 'neutral' : 'accent'}>
              {settings.data.isDefault ? 'Using defaults' : 'Customized'}
            </Badge>
          ) : null
        }
      />

      {settings.isPending ? (
        <Card className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </Card>
      ) : null}
      {settings.isError ? (
        <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />
      ) : null}

      {settings.data ? (
        <Card className="space-y-5">
          <SectionTitle
            hint={`Defaults: ${DEFAULT_THRESHOLDS.hard} / ${DEFAULT_THRESHOLDS.good} / ${DEFAULT_THRESHOLDS.easy}`}
          >
            Grade thresholds
          </SectionTitle>

          <div className="space-y-4">
            {ROWS.map((row) => (
              <Field key={row.key} label={row.label} hint={row.hint}>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={1}
                  step={0.05}
                  value={draft[row.key]}
                  onChange={(event) =>
                    setDraft((previous) => ({ ...previous, [row.key]: event.target.value }))
                  }
                  disabled={busy}
                  className={inputClass}
                />
              </Field>
            ))}
          </div>

          <p className="text-xs text-ink-faint">
            Each is a score between 0 and 1, and they must keep their order:{' '}
            <span className="font-mono">hard &lt; good &lt; easy</span>.
          </p>

          {dirty && validationError ? (
            <p className="rounded-lg border border-caution/40 bg-caution/10 px-3 py-2 text-xs text-caution">
              {validationError}
            </p>
          ) : null}

          {update.isError ? <ErrorState error={update.error} /> : null}
          {reset.isError ? <ErrorState error={reset.error} /> : null}

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <Button onClick={handleSave} disabled={!dirty || Boolean(validationError) || busy}>
              {update.isPending ? 'Saving…' : 'Save thresholds'}
            </Button>

            <Button
              variant="ghost"
              onClick={() => !busy && reset.mutate()}
              disabled={settings.data.isDefault || busy}
            >
              {reset.isPending ? 'Resetting…' : 'Reset to defaults'}
            </Button>

            {dirty ? (
              <span className="text-xs text-ink-faint">Unsaved changes</span>
            ) : reset.isSuccess ? (
              <span className="text-xs text-positive">Reset to defaults.</span>
            ) : update.isSuccess ? (
              <span className="text-xs text-positive">Saved.</span>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
