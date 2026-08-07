import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCreateSubmission, useProblemSubmissions } from '../api/queries';
import { PageHeader } from '../components/PageHeader';
import { Badge, Button, Card, ErrorState, Loading, SectionTitle } from '../components/ui';
import { NoteSolutionFields } from '../features/submissions/NoteSolutionFields';
import { GRADATION_LABEL, STATUS_LABEL, absoluteTime, relativeTime } from '../lib/format';

/**
 * The repeat-encounter path: a problem came due, you worked it again, and this
 * records a fresh submission rather than editing the last one.
 */
export function AttemptPage() {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const history = useProblemSubmissions(problemId);
  const create = useCreateSubmission(problemId!);

  const [noteText, setNoteText] = useState('');
  const [solutionText, setSolutionText] = useState('');

  const ready = noteText.trim() && solutionText.trim();
  const title = history.data?.submissions[0]?.problemTitle ?? `Problem ${problemId}`;

  function handleSubmit() {
    if (!ready) return;
    create.mutate(
      { noteText: noteText.trim(), solutionText: solutionText.trim() },
      { onSuccess: (submission) => navigate(`/submissions/${submission.id}`) },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: '/review', label: 'Review' }}
        title={title}
        description="This problem came due. Work it again, then record what you did — the AI grades the write-up and the grade you commit sets the next interval."
      />

      <Card className="space-y-4">
        <SectionTitle>New attempt</SectionTitle>

        <NoteSolutionFields
          noteText={noteText}
          solutionText={solutionText}
          onNoteChange={setNoteText}
          onSolutionChange={setSolutionText}
          disabled={create.isPending}
        />

        {create.isError ? <ErrorState error={create.error} /> : null}

        <Button onClick={handleSubmit} disabled={!ready || create.isPending}>
          {create.isPending ? 'Queueing…' : 'Submit for evaluation'}
        </Button>
      </Card>

      <div>
        <SectionTitle>Past attempts</SectionTitle>

        {history.isPending ? <Loading /> : null}
        {history.isError ? (
          <ErrorState error={history.error} onRetry={() => void history.refetch()} />
        ) : null}

        {history.data ? (
          history.data.submissions.length === 0 ? (
            <p className="text-sm text-ink-faint">Nothing recorded for this problem yet.</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {history.data.submissions.map((submission) => (
                <li key={submission.id}>
                  <Link
                    to={`/submissions/${submission.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-raised"
                  >
                    <div className="flex items-center gap-3">
                      <Badge tone={submission.status === 'failed' ? 'negative' : 'neutral'}>
                        {STATUS_LABEL[submission.status]}
                      </Badge>
                      {submission.finalGradation ? (
                        <span className="text-sm text-ink-muted">
                          {GRADATION_LABEL[submission.finalGradation]}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-ink-faint" title={absoluteTime(submission.createdAt)}>
                      {relativeTime(submission.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>
    </div>
  );
}
