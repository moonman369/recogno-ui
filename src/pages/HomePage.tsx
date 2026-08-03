import { Link } from 'react-router-dom';
import { Brand, BrandMark } from '../components/Brand';
import { Badge, Button, Card } from '../components/ui';
import { useAuth } from '../auth/useAuth';

const STEPS = [
  {
    n: '01',
    title: 'Read the problem cold',
    body: 'A problem arrives stripped of its answer — statement and constraints only. The pattern and the tell stay hidden until you commit. A timer runs, because recognition you cannot do quickly is not recognition.',
  },
  {
    n: '02',
    title: 'Name the pattern, and say why',
    body: 'Pick from the graded taxonomy — more than one if the problem genuinely combines them. Then write the signal that gave it away. The reasoning is scored alongside the guess, so a lucky hit with no argument lands in the Hard band.',
  },
  {
    n: '03',
    title: 'Get graded and rescheduled',
    body: 'Correctness, speed and rationale combine into a composite, which maps onto an FSRS rating and sets the next interval. The tell is revealed. Problems you miss come back sooner.',
  },
];

const SCREENS = [
  {
    to: '/drill',
    title: 'Drill',
    body: 'The recognition loop. Draw a problem, name the pattern, argue the why, see the tell.',
  },
  {
    to: '/review',
    title: 'Review',
    body: 'What is due right now, across both the drill cards and the written notes, and what is coming.',
  },
  {
    to: '/decks',
    title: 'Decks',
    body: 'Your problem sets. Add a problem by link, slug or description; the worker resolves it and an AI grades your written solution.',
  },
];

export function HomePage() {
  const { status, user } = useAuth();
  const signedIn = status === 'authenticated';

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
        <Brand />
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link to="/drill">
              <Button size="sm">Continue drilling</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        {/* Hero */}
        <section className="animate-rise py-16 sm:py-24">
          <Badge tone="accent">Spaced repetition for pattern recognition</Badge>

          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            Stop solving problems.
            <br />
            Start <span className="text-accent">recognising</span> them.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            Recogno drills the twenty seconds that actually decide an interview: reading a problem
            you have never seen and knowing which shape it is. It is a spaced-repetition trainer for
            DSA and system-design patterns — not for writing the solution, but for seeing it.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {signedIn ? (
              <Link to="/drill">
                <Button>Continue drilling</Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button>Create an account</Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary">I already have one</Button>
                </Link>
              </>
            )}
            <a href="#guide" className="px-2 text-sm text-ink-faint hover:text-ink">
              How it works ↓
            </a>
          </div>

          {signedIn && user ? (
            <p className="mt-6 text-sm text-ink-faint">
              Signed in as {user.displayName?.trim() || user.email}.
            </p>
          ) : null}
        </section>

        {/* The loop */}
        <section id="guide" className="scroll-mt-8 border-t border-line py-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
            The drill loop
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-ink">
            One problem at a time, three steps, about a minute each.
          </p>

          <ol className="mt-10 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.n}>
                <Card className="h-full">
                  <span className="font-mono text-xs text-accent">{step.n}</span>
                  <h3 className="mt-3 font-medium text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        {/* Scoring explainer */}
        <section className="border-t border-line py-16">
          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
                How a guess is scored
              </h2>
              <p className="mt-3 text-lg text-ink">Three signals, one composite.</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                A wrong guess cannot exceed the Hard band however fast or well argued it was — and a
                correct guess with no real reasoning lands there too. The composite maps onto an FSRS
                rating, which sets when the problem comes back.
              </p>
            </div>

            <dl className="space-y-3">
              {[
                ['Correctness', '50%', 'Exact pattern match. A close family member is half credit.'],
                ['Rationale', '30%', 'Whether the reason you gave is the reason it is that pattern.'],
                ['Speed', '20%', 'Linear from full marks at 0s down to zero at 90s.'],
              ].map(([label, weight, body]) => (
                <div key={label} className="rounded-xl border border-line bg-surface px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="font-medium text-ink">{label}</dt>
                    <span className="font-mono text-xs text-accent">{weight}</span>
                  </div>
                  <dd className="mt-1 text-sm text-ink-muted">{body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Screens guide */}
        <section className="border-t border-line py-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
            Where things live
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-ink">Three screens, and that is the whole app.</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {SCREENS.map((screen) => (
              <Card key={screen.to} className="h-full">
                <h3 className="font-medium text-ink">{screen.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{screen.body}</p>
                {signedIn ? (
                  <Link
                    to={screen.to}
                    className="mt-3 inline-block text-sm text-accent hover:underline"
                  >
                    Open {screen.title} →
                  </Link>
                ) : null}
              </Card>
            ))}
          </div>
        </section>

        {/* Closing */}
        <section className="border-t border-line py-16">
          <Card className="flex flex-wrap items-center justify-between gap-6 bg-surface">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                {signedIn ? 'Your queue is waiting.' : 'It takes one problem to see the point.'}
              </h2>
              <p className="mt-1.5 text-sm text-ink-muted">
                {signedIn
                  ? 'Pick up wherever the scheduler left you.'
                  : 'Create an account and draw your first problem.'}
              </p>
            </div>
            <Link to={signedIn ? '/drill' : '/register'}>
              <Button>{signedIn ? 'Go to the drill' : 'Get started'}</Button>
            </Link>
          </Card>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-ink-faint">
          <span className="inline-flex items-center gap-2">
            <BrandMark className="size-4" /> Recogno
          </span>
          <span>Spaced-repetition pattern recognition for DSA and system design.</span>
        </div>
      </footer>
    </div>
  );
}
