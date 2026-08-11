import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
    applyUser: () => {},
    signIn: async () => {},
    register: async () => {},
    signOut: async () => {},
    signOutEverywhere: async () => {},
    startGoogleSignIn: () => {},
    ...overrides,
  };

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={value}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  it('leads with the product name, the headline and the value proposition', () => {
    const html = render();
    expect(html).toContain('Recogno');
    expect(html).toContain('Start recognising');
    expect(html).toContain('Spaced-repetition pattern recognition');
  });

  it('renders the focal pattern visual with an accessible description', () => {
    const html = render();
    // The scenes carry no visible labels by design — recognising them unaided
    // is the point — so the aria-label is the only thing naming them, and it
    // has to cover every scene.
    expect(html).toContain('role="img"');
    for (const pattern of [
      'sliding window',
      'two converging pointers',
      'breadth-first search',
      'binary search',
      'monotonic stack',
      'heap',
      'union-find',
      'dynamic-programming',
    ]) {
      expect(html).toContain(pattern);
    }
  });

  it('does not label the scenes on screen', () => {
    const html = render();
    // A <text> node inside the figure would turn recognition into reading.
    const figure = html.slice(html.indexOf('role="img"'), html.indexOf('</svg>'));
    expect(figure).not.toContain('<text');
  });

  it('animates eight distinct patterns', () => {
    const html = render();
    for (let scene = 0; scene < 8; scene += 1) {
      expect(html).toContain(`data-scene="${scene}"`);
    }
  });

  it('renders revealed content when IntersectionObserver is unavailable', () => {
    // The safety property: if the reveal machinery cannot run, sections must
    // still be visible rather than stuck at opacity 0.
    expect(typeof IntersectionObserver).toBe('undefined');
    const html = render();
    expect(html).not.toContain('reveal-hidden');
    expect(html).toContain('The drill loop');
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

  it('holds a splash while a stored token is still being checked', () => {
    const html = render({ status: 'loading' });

    // A returning visitor must not see "Sign in" flash before their own name.
    expect(html).toContain('Checking your session');
    expect(html).not.toContain('Start recognising');
    expect(html).not.toContain('href="/register"');
  });

  it('falls through to the page when the session check failed', () => {
    // The regression this guards: `status` stayed 'loading' after a non-401
    // failure, and this page keyed its splash off `status` alone, so a
    // returning visitor was stranded on "Checking your session" forever.
    const html = render({
      status: 'loading',
      bootstrapError: new Error('Could not reach the Recogno API.'),
    });

    expect(html).not.toContain('Checking your session');
    expect(html).toContain('Start recognising');
    expect(html).toContain('href="/login"');
  });

  it('offers sign-up and sign-in when signed out', () => {
    const html = render();
    expect(html).toContain('href="/register"');
    expect(html).toContain('href="/login"');
    expect(html).not.toContain('Go to dashboard');
    // No profile menu for a visitor who is not signed in.
    expect(html).not.toContain('aria-haspopup="menu"');
  });

  it('swaps to a dashboard action when signed in', () => {
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

    expect(html).toContain('Go to dashboard');
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('Signed in as Ada');
    // The profile affordance, so a signed-in visitor is recognised here too.
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('Ada');
    expect(html).not.toContain('href="/register"');
  });
});
