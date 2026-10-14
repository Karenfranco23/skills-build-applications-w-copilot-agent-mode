# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Implement from the data tier upward, keeping persistence, business rules, and UI rendering in their respective tiers. Preserve the unauthenticated exercise scope and the configured ports.

- Presentation tier decision: Use the shared API client and relative `/api` paths through the Vite proxy. Each capability page owns its loading, empty, and error states and renders API failures accessibly; keep presentation components separate from API and business logic.
- Logic tier decision: Implement the `/api/*` contract in Express routes/services. Validate request shape and identifier syntax before database lookups, return deliberate 4xx responses for invalid or missing resources, and avoid exposing Mongoose cast errors as 500 responses.
- Data tier decision: Use Mongoose models for persistence and validation, with required fields and sensible defaults matching the API contract. Keep seed data representative and idempotent; update only the fixtures owned by the seed and preserve unrelated records.
- Activity tracking approach: List persisted activities; on creation, validate the user and team IDs and confirm both records exist. Persist their references, activity type, and minutes, and compute points and `occurredAt` on the server.
- Team management approach: List and create teams while preserving submitted names and mascots. Require a non-empty name, default members to an empty array, and validate supplied member references before persisting.
- Leaderboard approach: Aggregate activity points by team, sort from highest to lowest total, and assign ranks starting at 1. Return each result with `teamName`, `totalPoints`, and `rank`.
- Workout suggestions approach: Resolve the user by email, use their fitness goal and recent activities to select the best matching available workout first, and include a human-readable reason. Return a deliberate 4xx response when the user does not exist.

## Test plan

Run the targeted contract suites in dependency order, then build both applications. A failing contract suite indicates the corresponding tier does not yet meet its documented behavior; a build failure indicates a compile-time or bundling regression. Re-run the affected suite after each tier is implemented and the full set before considering the work complete.

- Data tier: `npm run test:data --prefix octofit-tracker/backend` — checks schema validation and idempotent seed behavior. Baseline: 4 of 5 tests failed (required User, Team, Activity, and Workout fields were not enforced); seed test passed.
- Logic tier: `npm run test:api --prefix octofit-tracker/backend` — checks activity/team validation and CRUD, leaderboard totals/ranks, and personalized workout suggestions. Baseline: all 4 tests failed (501 responses for invalid activity/team input, empty leaderboard, and a suggestion missing the expected reason).
- Presentation tier: `npm test --prefix octofit-tracker/frontend -- --watch=false` — checks API rendering, loading/empty/error states, and workout suggestion requests. Baseline: all 15 tests failed; capability pages still showed the pending state rather than the expected UI behavior.
- Backend build: `npm run build --prefix octofit-tracker/backend` — run after the backend changes to catch TypeScript/build errors. Not run for the baseline.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` — run after the frontend changes to catch compile/bundling errors. Not run for the baseline.
