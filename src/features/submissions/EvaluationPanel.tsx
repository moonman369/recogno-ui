import type { Evaluation } from '../../api/types';
import { Badge, Card, SectionTitle } from '../../components/ui';
import { GRADATION_LABEL } from '../../lib/format';

export function EvaluationPanel({ evaluation }: { evaluation: Evaluation }) {
  const sections: [string, string][] = [
    ['Approach', evaluation.approachSummary],
    ['Missed', evaluation.missed],
    ['Optimisations', evaluation.optimizations],
  ];

  return (
    <Card>
      <SectionTitle hint={evaluation.model ?? undefined}>AI evaluation</SectionTitle>

      <div className="mb-4 flex items-center gap-3">
        <Badge tone={toneFor(evaluation.gradation)}>{GRADATION_LABEL[evaluation.gradation]}</Badge>
        <p className="text-sm text-ink-muted">{evaluation.label}</p>
      </div>

      <dl className="space-y-4">
        {sections.map(([label, body]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-widest text-ink-faint">{label}</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
              {body || '—'}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function toneFor(gradation: Evaluation['gradation']) {
  if (gradation === 'excellent' || gradation === 'good-job') return 'positive' as const;
  if (gradation === 'not-bad') return 'caution' as const;
  return 'negative' as const;
}
