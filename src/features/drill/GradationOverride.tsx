import { useState } from 'react';
import type { DrillResult, Gradation } from '../../api/types';
import { GradationScale } from '../../components/GradationScale';
import { Card, SectionTitle } from '../../components/ui';
import { findDrillOverride, saveDrillOverride, suggestGradation } from '../../lib/drillOverrides';

/**
 * Lets the learner set their own gradation on a drill result before moving on.
 *
 * The worker already scheduled the card inside `POST /drill/submit` and offers
 * no endpoint to revise it, so this is kept locally — see `drillOverrides.ts`.
 */
export function GradationOverride({
  result,
  problemId,
  problemTitle,
}: {
  result: DrillResult;
  problemId: number;
  problemTitle: string;
}) {
  const suggested = suggestGradation(result.scores.composite);
  const [value, setValue] = useState<Gradation>(
    () => findDrillOverride(result.attemptId, problemId)?.gradation ?? suggested,
  );
  const [saved, setSaved] = useState(false);

  function handleChange(gradation: Gradation) {
    setValue(gradation);
    saveDrillOverride({
      attemptId: result.attemptId ?? null,
      problemId,
      problemTitle,
      gradation,
      workerRating: result.review.rating,
    });
    setSaved(true);
  }

  return (
    <Card>
      <SectionTitle hint={value === suggested ? 'Matches the score' : 'Your call'}>
        Your gradation
      </SectionTitle>

      <GradationScale
        value={value}
        onChange={handleChange}
        suggested={suggested}
        suggestedLabel="scored"
      />

      <p className="mt-3 text-xs text-ink-faint">
        {saved ? 'Saved on this device. ' : ''}
        The worker grades and schedules in one step and has no endpoint to revise a drill grade, so
        this is recorded locally rather than changing the FSRS card above.
      </p>
    </Card>
  );
}
