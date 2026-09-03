import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsPage } from './SettingsPage';
import { keys } from '../api/queries';
import type { ScoringSettings } from '../api/types';

/** Render smoke test — proves the screen mounts and reads the cached settings. */
function render(settings: ScoringSettings): string {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(keys.scoringSettings, settings);

  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SettingsPage', () => {
  it('names the three thresholds and frames this as grading strictness, not scheduling', () => {
    const html = render({ thresholds: { easy: 0.8, good: 0.55, hard: 0.3 }, isDefault: true });

    expect(html).toContain('Easy at or above');
    expect(html).toContain('Good at or above');
    expect(html).toContain('Hard at or above');
    expect(html).toContain('hard &lt; good &lt; easy');
    // The copy must not promise control over intervals.
    expect(html).toContain('FSRS');
  });

  it('flags whether the user is on defaults or a custom override', () => {
    expect(render({ thresholds: { easy: 0.8, good: 0.55, hard: 0.3 }, isDefault: true })).toContain(
      'Using defaults',
    );
    expect(render({ thresholds: { easy: 0.9, good: 0.6, hard: 0.4 }, isDefault: false })).toContain(
      'Customized',
    );
  });
});
