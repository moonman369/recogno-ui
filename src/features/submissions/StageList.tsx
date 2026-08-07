import type { StageName, StageStatus, SubmissionStage } from '../../api/types';
import { cx, relativeTime } from '../../lib/format';
import { Spinner } from '../../components/ui';

const STAGE_LABEL: Record<StageName, string> = {
  'resolve-source': 'Resolving source',
  evaluate: 'Evaluating with AI',
};

const STATUS_TONE: Record<StageStatus, string> = {
  pending: 'text-ink-faint',
  running: 'text-accent',
  done: 'text-positive',
  failed: 'text-negative',
};

const MARK: Record<StageStatus, string> = {
  pending: '○',
  running: '',
  done: '●',
  failed: '✕',
};

export function StageList({ stages }: { stages: SubmissionStage[] }) {
  const ordered = [...stages].sort((a, b) => a.position - b.position);

  return (
    <ol className="space-y-3">
      {ordered.map((stage) => (
        <li key={`${stage.stage}-${stage.position}`} className="flex items-start gap-3">
          <span
            className={cx('mt-0.5 flex w-4 justify-center text-xs', STATUS_TONE[stage.status])}
            aria-hidden
          >
            {stage.status === 'running' ? <Spinner className="size-3" /> : MARK[stage.status]}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className={cx('text-sm', stage.status === 'pending' ? 'text-ink-faint' : 'text-ink')}>
                {STAGE_LABEL[stage.stage]}
              </p>
              {stage.finishedAt ? (
                <span className="text-xs text-ink-faint">{relativeTime(stage.finishedAt)}</span>
              ) : null}
            </div>
            {stage.detail ? (
              <p className={cx('mt-0.5 text-xs', STATUS_TONE[stage.status])}>{stage.detail}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
