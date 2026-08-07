# recogno-ui

Front end for **Recogno**, a spaced-repetition trainer for DSA and system-design
pattern recognition. It talks to the Recogno worker API described in
[`prompts/worker_api_swagger.json`](prompts/worker_api_swagger.json).

## Getting started

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your worker
npm run dev
```

| Script              | What it does                                           |
| ------------------- | ------------------------------------------------------ |
| `npm run dev`       | Vite dev server on <http://localhost:5173>             |
| `npm run build`     | Typecheck, then production build into `dist/`          |
| `npm run preview`   | Serve the production build                             |
| `npm run typecheck` | Typecheck only                                         |
| `npm test`          | Run the unit tests once                                |
| `npm run api:types` | Regenerate `src/api/schema.d.ts` from the swagger file |

### Environment

| Variable            | Default                 | Notes                                                                                  |
| ------------------- | ----------------------- | -------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:8787` | Worker base URL, no trailing slash. Also the origin for `GET /auth/google`.             |
| `VITE_USER_ID`      | unset                   | Legacy `x-user-id` stub. Sent only when there is no access token; leave blank with auth. |

## Auth

Session handling lives in `src/auth/` and `src/api/http.ts`.

- **Storage** — access token in memory, refresh token in `localStorage`. The
  comment at the top of `tokenStore.ts` spells out the trade: the refresh token
  is XSS-exposed, and the hardening step is an httpOnly `SameSite=Strict` cookie
  scoped to `/auth/refresh`.
- **Rotation** — every `/auth/refresh` invalidates the token it was given, so the
  new one is always persisted and never the one that was sent.
- **Single-flight** — concurrent 401s share one refresh, deduplicated by an
  in-page promise and, where available, a `navigator.locks` lock that extends the
  guarantee across tabs. Without it the second caller sends an already-rotated
  token and signs a healthy session out.
- **Proactive renewal** — access tokens last 15 minutes; the transport renews
  inside a 60-second skew window before sending, and a timer in `AuthProvider`
  renews an idle tab on the same schedule.
- **401 policy** — refresh once, retry once, then sign out. A 503 or a dropped
  connection during refresh keeps the session and surfaces a retry instead.
- **Google** — `/auth/providers` is fetched on load and the button is only
  rendered when `google` is true, so `/auth/google` is never called on a server
  without credentials. The callback's `?accessToken=&refreshToken=` are consumed
  and scrubbed with `history.replaceState` before React renders.

`src/api/authTypes.ts` is hand-written, which is deliberate and temporary — see
the note at the top of that file and **Missing spec** below.

## Screens

| Route                          | What it does                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `/`                            | Public landing: what Recogno is, the drill loop, how a guess is scored, where things live. Adapts when signed in. |
| `/login`, `/register`          | Password sign-in and sign-up, plus Google when the server offers it.                             |
| `/drill`                       | The blind recognition loop: draw a problem, pick a pattern, argue why, get graded and scheduled. |
| `/review`                      | Due counts across both flows plus the queue of what is waiting.                                  |
| `/decks`                       | List and create decks.                                                                           |
| `/decks/:deckId`               | Deck contents, and adding a problem with the note and solution from your attempt.                |
| `/problems/:problemId/attempt` | Record a fresh attempt at a problem that came due, plus its history.                             |
| `/submissions/:submissionId`   | Ingest and evaluation progress, the AI's read, and committing the grade.                         |

## Layout

```
src/
  api/        schema.d.ts (generated), types.ts, client.ts, queries.ts
  components/ Layout, shared UI primitives, ReviewSummary
  features/   drill/ and submissions/ pieces
  lib/        formatting helpers, timer hook
  pages/      one file per route
```

`src/api/schema.d.ts` is generated — do not hand-edit it. Everything else types
against it, so a swagger change surfaces as a compile error:

```bash
npm run api:types && npm run typecheck
```

## Picking patterns

`src/lib/patternCatalog.ts` holds a curated taxonomy — 17 categories, 90 entries
— covering the patterns that actually show up in interviews and competitive
programming. The drill's picker is built from it: grouped and collapsible,
searchable, filterable to the "core 20" or to just the patterns the worker can
grade, with a rank badge on the core ones.

The worker owns the *graded* taxonomy — currently 13 patterns from
`recogno-server/packages/shared/src/domain/patterns.ts`. Those are what
`GET /drill/next` returns with an id, and the picker **leads with them** under
**Graded taxonomy**, because the catalog is seven times larger and burying the
submittable set behind a filter is how you build a selection that cannot be
graded.

Each worker pattern is also folded into its catalog category by slug or alias.
Matching is order-insensitive for the qualifier, so the worker's `dp-knapsack`
and the catalog's "Knapsack DP" resolve to each other without an alias entry —
`src/lib/patternCatalog.test.ts` pins all 13 canonical slugs against this. Where
a worker pattern matches, its label wins, since that is what the result panel
echoes back.

A problem can combine patterns, so the picker is multi-select:

- **★ primary** — leads `guessedPatternIds`, and is what the response echoes as
  `guessedPattern`.
- **✓ additional** — every other gradeable pick, sent in the same array. The
  worker scores them all: naming any one of `acceptedPatterns` is full credit.
- **○ tag** — dashed, marked `tag`, an entry the worker's taxonomy lacks. It has
  no id, so it is prepended to `rationaleText` as `Also reads as: …` instead.

The result panel reports which of your guesses counted, and which other patterns
would also have been accepted.

## Spec

Types come from `../recogno-server/openapi.json` — the server repo owns it, and
`npm run api:types` regenerates `src/api/schema.d.ts` in place. Nothing in
`src/api/` is a hand-written shape; `types.ts` and `authTypes.ts` only name
things out of the generated file, so a contract change surfaces as a compile
error.

The sibling checkout has to be present at that relative path for the script to
run. Regenerating is the first thing to try when something 400s unexpectedly.

## Worker changes this UI is waiting on

**Manual gradation on a drill** (`src/lib/drillOverrides.ts`). `POST
/drill/submit` grades and schedules the FSRS card in one call, and there is still
no endpoint to revise that grade. So the gradation you set on a result is stored
in `localStorage`, clearly labelled as not affecting the schedule, and
`pendingDrillOverrides()` will hand the unsent ones over once an endpoint exists.
Something like `POST /drill/attempts/{attemptId}/gradation` taking the five-value
gradation and returning a fresh `review` would close this.

Also, the review queue's note-mode rows link to `/problems/:id/attempt`, which
gets the problem title from the submissions list because there is no
`GET /problems/{id}`. A problem with no prior submissions shows `Problem 42`.

## Notes on the API

- **Auth** is the placeholder `x-user-id` header. The client sends it only when
  `VITE_USER_ID` is set.
- **Adding a problem is asynchronous.** `POST /decks/{id}/problems` returns a
  queued submission; the UI polls `GET /submissions/{id}` every 1.5 s while the
  status is `queued`, `resolving-source` or `evaluating`, and stops on a
  terminal status.
- **A failed evaluation is not a dead end.** `POST /submissions/{id}/commit`
  still works, but requires you to pick a gradation yourself.
- **System decks are read-only**, so the add-problem form is hidden for them
  rather than letting the request 403.
