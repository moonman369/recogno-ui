import { useState } from 'react';
import { useCommitSubmission } from '../../api/queries';
import type { Gradation, Submission } from '../../api/types';
import { GradationScale } from '../../components/GradationScale';
import { ReviewSummary } from '../../components/ReviewSummary';
import { Badge, Button, Card, ErrorState, SectionTitle } from '../../components/ui';
import { GRADATION_LABEL } from '../../lib/format';

/**
 * Commits the grade that advances the FSRS card. The AI's gradation is the
 * default; picking a different one overrides it. When the evaluation failed
 * the worker requires an explicit choice.
 */
export function CommitPanel({ submission }: { submission: Submission }) {
  const aiGradation = submission.evaluation?.gradation ?? null;
  const [override, setOverride] = useState<Gradation | null>(null);
  const commit = useCommitSubmission(submission.id);

  const selected = override ?? aiGradation;
  const mustChoose = aiGradation === null;

  if (commit.isSuccess) {
    return (
      <Card className="border-positive/40">
        <SectionTitle hint={commit.data.overridden ? 'Overridden' : 'AI grade kept'}>
          Committed
        </SectionTitle>
        <div className="mb-4 flex items-center gap-3">
          <Badge tone="positive">{GRADATION_LABEL[commit.data.finalGradation]}</Badge>
          <p className="text-sm text-ink-muted">{commit.data.label}</p>
        </div>
        <ReviewSummary review={commit.data.review} />
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle hint={mustChoose ? 'Required — the evaluation failed' : 'Optional override'}>
        Commit the grade
      </SectionTitle>

      <GradationScale
        value={selected}
        onChange={setOverride}
        disabled={commit.isPending}
        suggested={aiGradation}
      />

      {commit.isError ? <div className="mt-4"><ErrorState error={commit.error} /></div> : null}

      <Button
        className="mt-4"
        disabled={commit.isPending || (mustChoose && override === null)}
        onClick={() => commit.mutate(override ? { gradation: override } : {})}
      >
        {commit.isPending ? 'Committing…' : 'Commit and schedule'}
      </Button>
    </Card>
  );
}
