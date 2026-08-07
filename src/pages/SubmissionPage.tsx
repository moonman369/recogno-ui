import { useParams } from 'react-router-dom';
import { useSubmission } from '../api/queries';
import { isInFlight } from '../api/types';
import { PageHeader } from '../components/PageHeader';
import { Badge, Card, ErrorState, Loading, SectionTitle } from '../components/ui';
import { CommitPanel } from '../features/submissions/CommitPanel';
import { EvaluationPanel } from '../features/submissions/EvaluationPanel';
import { StageList } from '../features/submissions/StageList';
import { GRADATION_LABEL, STATUS_LABEL, absoluteTime, relativeTime } from '../lib/format';

export function SubmissionPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const submission = useSubmission(submissionId);

  if (submission.isPending) return <Loading />;
  if (submission.isError) {
    return <ErrorState error={submission.error} onRetry={() => void submission.refetch()} />;
  }

  const data = submission.data;
  const working = isInFlight(data.status);
  const committed = data.status === 'committed';

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: `/problems/${data.problemId}/attempt`, label: data.problemTitle }}
        title="Submission"
        meta={<Badge tone={statusTone(data.status)}>{STATUS_LABEL[data.status]}</Badge>}
        actions={
          <span className="text-xs text-ink-faint" title={absoluteTime(data.createdAt)}>
            {relativeTime(data.createdAt)}
          </span>
        }
      />

      {data.stages.length > 0 ? (
        <Card>
          <SectionTitle hint={working ? 'Refreshing…' : undefined}>Progress</SectionTitle>
          <StageList stages={data.stages} />
        </Card>
      ) : null}

      {data.failureReason ? (
        <Card className="border-negative/40">
          <SectionTitle>Failure</SectionTitle>
          <p className="text-sm text-negative">{data.failureReason}</p>
          <p className="mt-2 text-sm text-ink-faint">
            You can still commit a grade yourself below.
          </p>
        </Card>
      ) : null}

      {data.evaluation ? <EvaluationPanel evaluation={data.evaluation} /> : null}

      {committed ? (
        <Card className="border-positive/40">
          <SectionTitle hint={data.overridden ? 'Overridden' : 'AI grade kept'}>Committed</SectionTitle>
          <div className="flex items-center gap-3">
            {data.finalGradation ? (
              <Badge tone="positive">{GRADATION_LABEL[data.finalGradation]}</Badge>
            ) : null}
            <span className="text-sm text-ink-faint" title={absoluteTime(data.committedAt)}>
              {relativeTime(data.committedAt)}
            </span>
          </div>
        </Card>
      ) : working ? null : (
        <CommitPanel submission={data} />
      )}

      <Card>
        <SectionTitle>Your note</SectionTitle>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">{data.noteText}</p>
      </Card>

      <Card>
        <SectionTitle>Your solution</SectionTitle>
        <pre className="max-h-96 overflow-auto rounded-lg bg-canvas p-3 font-mono text-xs leading-relaxed text-ink-muted scrollbar-slim">
          {data.solutionText}
        </pre>
      </Card>
    </div>
  );
}

function statusTone(status: string) {
  if (status === 'committed') return 'positive' as const;
  if (status === 'failed') return 'negative' as const;
  if (status === 'awaiting-review') return 'caution' as const;
  return 'accent' as const;
}
