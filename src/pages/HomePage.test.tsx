import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { AuthContext, type AuthContextValue } from '../auth/AuthContext';

/**
 * A render smoke test. The build only proves the types line up; this proves the
 * screen actually mounts — a bad import or an undefined component throws here.
 */
function render(overrides: Partial<AuthContextValue> = {}): string {
  const value: AuthContextValue = {
    status: 'unauthenticated',
    user: null,
    providers: { password: true, google: false },
    bootstrapError: null,
    retryBootstrap: () => {},
    signIn: async () => {},
    register: async () => {},
    signOut: async () => {},
    signOutEverywhere: async () => {},
    startGoogleSignIn: () => {},
    ...overrides,
  };

  return renderToStaticMarkup(
    <AuthContext.Provider value={value}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('HomePage', () => {
  it('leads with the product name and a one-line intro', () => {
    const html = render();
    expect(html).toContain('Recogno');
    expect(html).toContain('spaced-repetition trainer');
  });

  it('includes the user guide: the loop, the scoring, and where things live', () => {
    const html = render();

    expect(html).toContain('The drill loop');
    expect(html).toContain('Read the problem cold');
    expect(html).toContain('Name the pattern, and say why');
    expect(html).toContain('Get graded and rescheduled');

    expect(html).toContain('How a guess is scored');
    expect(html).toContain('Correctness');
    expect(html).toContain('Rationale');
    expect(html).toContain('Speed');

    expect(html).toContain('Where things live');
    for (const screen of ['Drill', 'Review', 'Decks']) {
      expect(html).toContain(screen);
    }
  });

  it('offers sign-up and sign-in when signed out', () => {
    const html = render();
    expect(html).toContain('href="/register"');
    expect(html).toContain('href="/login"');
    expect(html).not.toContain('Continue drilling');
  });

  it('swaps to a continue action when signed in', () => {
    const html = render({
      status: 'authenticated',
      user: {
        id: 'u1',
        email: 'a@b.c',
        displayName: 'Ada',
        avatarUrl: null,
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
    });

    expect(html).toContain('Continue drilling');
    expect(html).toContain('Signed in as Ada');
    expect(html).not.toContain('href="/register"');
  });
});
