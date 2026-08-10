import { Link } from 'react-router-dom';
import { AccountMenu } from '../components/AccountMenu';
import { Brand, BrandMark } from '../components/Brand';
import { PatternLoop } from '../components/PatternLoop';
import { Reveal } from '../components/Reveal';
import { Badge, Button } from '../components/ui';
import { SCORE_WEIGHTS, SPEED_WINDOW_SECONDS } from '../lib/scoring';
import { percent } from '../lib/format';
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

const SCORE_ROWS = [
  ['Correctness', SCORE_WEIGHTS.correctness, 'Exact pattern match. A close family member is half credit.'],
  ['Rationale', SCORE_WEIGHTS.rationale, 'Whether the reason you gave is the reason it is that pattern.'],
  ['Speed', SCORE_WEIGHTS.speed, `Linear from full marks at 0s down to zero at ${SPEED_WINDOW_SECONDS}s.`],
] as const;

export function HomePage() {
  const { status, user } = useAuth();
  const signedIn = status === 'authenticated';

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      {/*
        Ambient light. Fixed and pointer-events-none so it never intercepts a
        click, and drifting slowly enough to read as depth rather than motion.
      */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-drift absolute -top-40 left-1/2 size-[46rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
        <div
          className="animate-drift absolute -right-40 top-1/3 size-[32rem] rounded-full bg-positive/5 blur-[120px]"
          style={{ animationDelay: '-11s' }}
        />
      </div>

      <header className="sticky top-0 z-30 glass-nav">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Brand />
          <div className="flex items-center gap-2">
            {signedIn ? (
              <>
                <Link to="/dashboard">
                  <Button size="sm">Go to dashboard</Button>
                </Link>
                <AccountMenu />
              </>
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
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-24">
        {/* -- hero ------------------------------------------------------ */}
        <section className="grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
          <div>
            <div className="animate-rise">
              <Badge tone="accent">Spaced repetition for pattern recognition</Badge>
            </div>

            <h1
              className="animate-rise mt-6 text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl"
              style={{ animationDelay: '80ms' }}
            >
              Stop solving DSA problems.
              <br />
              <span className="bg-gradient-to-br from-accent to-positive bg-clip-text text-transparent">
                Start recognising
              </span>{' '}
              them.
            </h1>

            <p
              className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-ink-muted"
              style={{ animationDelay: '160ms' }}
            >
              Recogno drills the twenty seconds that actually decide an interview: reading a problem
              you have never seen and knowing which shape it is. Not writing the solution — seeing
              it.
            </p>

            <div
              className="animate-rise mt-9 flex flex-wrap items-center gap-3"
              style={{ animationDelay: '240ms' }}
            >
              {signedIn ? (
                <Link to="/dashboard">
                  <Button className="px-5 py-2.5">Go to dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button className="px-5 py-2.5">Create an account</Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="secondary" className="px-5 py-2.5">
                      I already have one
                    </Button>
                  </Link>
                </>
              )}
              <a
                href="#guide"
                className="group px-2 text-sm text-ink-faint transition-colors hover:text-ink"
              >
                How it works{' '}
                <span className="inline-block transition-transform duration-300 group-hover:translate-y-0.5">
                  ↓
                </span>
              </a>
            </div>

            {signedIn && user ? (
              <p className="animate-rise mt-6 text-sm text-ink-faint" style={{ animationDelay: '320ms' }}>
                Signed in as {user.displayName?.trim() || user.email}.
              </p>
            ) : null}
          </div>

          {/* The focal visual: the patterns themselves, tracing. */}
          <div className="animate-rise" style={{ animationDelay: '200ms' }}>
            <div className="glass rounded-2xl p-6 sm:p-8">
              <PatternLoop />
            </div>
          </div>
        </section>

        {/* -- the loop -------------------------------------------------- */}
        <section id="guide" className="scroll-mt-20 border-t border-line py-20">
          <Reveal>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
              The drill loop
            </h2>
            <p className="mt-3 max-w-2xl text-2xl tracking-tight text-ink">
              One problem at a time, three steps, about a minute each.
            </p>
          </Reveal>

          <ol className="mt-10 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <Reveal as="li" key={step.n} delay={index * 110}>
                <div className="group h-full rounded-xl border border-line bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-float">
                  <span className="font-mono text-xs text-accent">{step.n}</span>
                  <h3 className="mt-3 font-medium text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* -- scoring --------------------------------------------------- */}
        <section className="border-t border-line py-20">
          <div className="grid gap-10 sm:grid-cols-2">
            <Reveal>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
                How a guess is scored
              </h2>
              <p className="mt-3 text-2xl tracking-tight text-ink">Three signals, one composite.</p>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
                A wrong guess cannot exceed the Hard band however fast or well argued it was — and a
                correct guess with no real reasoning lands there too. The composite maps onto an FSRS
                rating, which sets when the problem comes back.
              </p>
            </Reveal>

            <dl className="space-y-3">
              {SCORE_ROWS.map(([label, weight, body], index) => (
                <Reveal key={label} delay={index * 110}>
                  <div className="glass rounded-xl px-4 py-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="font-medium text-ink">{label}</dt>
                      <span className="font-mono text-xs text-accent">{percent(weight)}</span>
                    </div>
                    <dd className="mt-1.5 text-sm text-ink-muted">{body}</dd>
                    {/* The weight, drawn. Grows from the left as the row arrives. */}
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-raised">
                      <div
                        className="h-full origin-left rounded-full bg-accent/70 transition-transform duration-700"
                        style={{ width: `${weight * 100}%` }}
                      />
                    </div>
                  </div>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        {/* -- screens --------------------------------------------------- */}
        <section className="border-t border-line py-20">
          <Reveal>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
              Where things live
            </h2>
            <p className="mt-3 max-w-2xl text-2xl tracking-tight text-ink">
              Three screens, and that is the whole app.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {SCREENS.map((screen, index) => (
              <Reveal key={screen.to} delay={index * 110}>
                <div className="group h-full rounded-xl border border-line bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-float">
                  <h3 className="font-medium text-ink">{screen.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{screen.body}</p>
                  {signedIn ? (
                    <Link
                      to={screen.to}
                      className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline"
                    >
                      Open {screen.title}
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </Link>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* -- closing --------------------------------------------------- */}
        <section className="border-t border-line py-20">
          <Reveal>
            <div className="glass flex flex-wrap items-center justify-between gap-6 rounded-2xl p-8">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {signedIn ? 'Your queue is waiting.' : 'It takes one problem to see the point.'}
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  {signedIn
                    ? 'Pick up wherever the scheduler left you.'
                    : 'Create an account and draw your first problem.'}
                </p>
              </div>
              <Link to={signedIn ? '/dashboard' : '/register'}>
                <Button className="px-5 py-2.5">
                  {signedIn ? 'Open dashboard' : 'Get started'}
                </Button>
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="relative border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-ink-faint">
          <span className="inline-flex items-center gap-2">
            <BrandMark className="size-4" /> Recogno
          </span>
          <span>Spaced-repetition pattern recognition for DSA and system design.</span>
        </div>
      </footer>
    </div>
  );
}
