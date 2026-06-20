# ApexGrid QA & Bugfix — Design Spec

**Date:** 2026-06-20
**Status:** Approved
**Author:** QA + Backend engineering pass
**Goal:** Convert the ApexGrid F1 ticket-booking platform from "untested" to
"deep test coverage on BLOCKER/MAJOR areas, all such bugs fixed and verified
against a live system," with lighter smoke coverage elsewhere and an honest
sign-off report.

---

## 1. Context & starting point

ApexGrid is a Spring Boot 3.2 / Java 17 multi-module system:

- `api-gateway` (:8080) — Spring Cloud Gateway, JWT validation, identity header
  injection (`X-User-Id`, `X-User-Role`, `X-User-Name`, `X-User-FullName`,
  `X-User-Email`, `X-Internal-Secret`).
- `user-service` (:8082) — auth, registration, profile, email verification,
  password reset, refresh tokens.
- `race-service` (:8081) — races, circuits, bookings, tickets, statistics,
  auto-expire scheduler.
- Shared PostgreSQL `apexgrid_db` (:5432) — `trg_update_quota`,
  `trg_set_expiry`, `update_*_updated_at` triggers; `CHECK` constraints on
  races (`available_quota >= 0 AND <= total_quota`) and bookings
  (`quantity > 0`, `total_price >= 0`).
- `frontend-react` — React/Vite UI; one existing happy-path script
  `e2e-test.js` (requires `psql` on PATH).

**Critical starting-state finding: there are ZERO automated tests in the entire
project.** No `src/test/` directories in any module. The only test artifact is
the 110-line frontend script, which asserts ~6 happy-path steps and prints
"100% operational." This means the work is **building the suite from scratch**,
not running an existing one.

Environment confirmed available:
- Docker 29.5.3 + Docker Compose v5.1.4.
- `docker-compose.yml` brings up Postgres + all three services + frontend.

### 1.1 Suspected bugs found while reading (hypotheses to prove/disprove)

1. **OVERSELL (BLOCKER, flagged in the brief).** `BookingServiceImpl.confirmBooking`
   locks the race row with `PESSIMISTIC_WRITE` before changing status, then the
   `trg_update_quota` AFTER UPDATE trigger runs an unguarded
   `available_quota = available_quota - NEW.quantity`. The Java pre-check +
   pessimistic lock is *probably* sufficient under a single DB, but this has
   never been proven under concurrency, and the DB layer has no defensive guard.
   Must be proven; fixed if it leaks; guard added as defense-in-depth regardless.
2. **Refresh token is NOT rotated (MAJOR).** `AuthServiceImpl.refreshToken`
   returns a new access token but reuses the same refresh token, so it is valid
   until its 7-day expiry regardless of how many times it is used. Directly
   contradicts the spec requirement "old refreshToken unusable after refresh
   (anti-replay)." This is a definite bug.
3. **Confirm idempotency (verify).** A second confirm on an already-CONFIRMED
   booking throws "Only PENDING bookings can be confirmed." Retries must not
   double-apply quota and should be safe to retry. Verify and tighten if needed.
4. **State-machine completeness (verify).** Verify every illegal transition is
   rejected: USED→CONFIRMED, CANCELLED→USED, expired→CONFIRMED, scan of
   non-CONFIRMED, cancel of USED.
5. **Object-level authorization (verify).** `getBookingByCode`/`confirm`/`cancel`
   rely on a mix of `@PreAuthorize`, controller owner checks, and service owner
   checks. Verify USER A cannot read/confirm/cancel USER B's resources and that
   the checks have no bypass.

These are starting hypotheses; the test suite converts each into a green/red
fact, and reds become fixes.

---

## 2. Decisions (locked with the user)

| Decision | Choice | Rationale |
|---|---|---|
| Primary goal | **Fix BLOCKERs + deep test those**, lighter smoke elsewhere | Most demo-protective per hour; the brief's own exit criteria are dominated by BLOCKER/MAJOR items. |
| Execution env | **Docker available** — tests really run | "Verified" means green-passed, not compiles-and-confident. |
| DB test tool | **Testcontainers (real Postgres)** | Only a real Postgres exercises triggers, `CHECK` constraints, and pessimistic locks. H2 cannot test the quota engine. |
| Fix authority | **Fix anything, including behavioral**, each fix paired with a test | Full authority to reach demo-ready. |

---

## 3. Scope

### 3.1 Deep (real tests + fix on failure) — the demo-killers

| ID | Area | Why BLOCKER/MAJOR |
|---|---|---|
| D1 | Oversell / quota atomicity | Flagged #1 risk; unguarded trigger decrement. |
| D2 | Idempotency of confirm / cancel / scan | Double-apply = data corruption. |
| D3 | State-machine completeness | Illegal transitions must be rejected. |
| D4 | RBAC + object-level authz | USER→ADMIN endpoints 403; cross-user access 403/404. |
| D5 | Auth: JWT, refresh rotation, logout | Refresh token not rotated today (definite MAJOR). |

### 3.2 Smoke (happy path + 1–2 error cases each)

Registration validation, login failures, race list/get-by-id (incl. 404),
booking create + validation (zone ∈ {GA,GS,VIP}, quantity 1–10 bounds, past
race rejected, non-UPCOMING rejected), auto-expire scheduler, consistent
error-response shape across services.

### 3.3 Explicitly deferred (flagged in the report, not done in this pass)

- Exhaustive OWASP SQLi/XSS fuzzing (JPA parameterization largely covers SQLi;
  spot-check only).
- k6/Gatling load runs (JVM `ExecutorService` gives deterministic correctness
  proofs; load tooling is additive, not required for correctness sign-off).
- Brute-force / rate-limit tuning (the gateway has a `RateLimitFilter`; verify
  it exists and is wired, do not tune thresholds).
- Frontend unit/component tests and visual PDF/QR correctness.

### 3.4 Non-goals

No architecture rewrites. No changes to the frontend app. No schema redesign —
trigger/constraint fixes only. No production dependency changes (test-only
deps added).

---

## 4. Test architecture (layered)

### Layer 1 — Unit (pure logic, no Spring)
Fast, dependency-free tests of pure decisions: state-machine validity, zone
multiplier / price calculation, input validation. Live in `user-service` and
`race-service` `src/test/java`.

### Layer 2 — Integration with Testcontainers (the heart)
`@SpringBootTest` + `PostgreSQLContainer` reused per test class for
`race-service`. Real triggers, real `CHECK` constraints, real row locks.
**All oversell, concurrency, quota, and idempotency tests live here.**
Concurrency is driven by JVM `ExecutorService` + `CountDownLatch` —
deterministic, repeatable, CI-friendly, no external load tool required for
correctness proofs.

### Layer 3 — Sliced web (`@WebMvcTest`)
Controller-level RBAC and owner checks with mocked services. Proves
`@PreAuthorize("hasRole('ADMIN')")` rules and the controller-side
owner/admin checks without booting the DB. Used for both `race-service`
controllers and `user-service` controllers.

### Layer 4 — E2E smoke (Docker Compose) — tagged, runs last
One small test class that `docker compose up`s the full stack and runs the
demo happy path: register → verify → login → browse race → book → confirm →
e-ticket → scan, plus an admin flow and a cancel/refund flow. This is the
"dry-run of the live demo." Tagged (`@Tag("e2e")`) so it can be excluded from
fast loops. If the environment can't sustain a full compose stack, this layer
gracefully degrades to "documented manual script" rather than blocking sign-off.

### New dependencies (test scope only)
- `org.springframework.boot:spring-boot-starter-test` (likely already
  transitive; ensure present).
- `org.testcontainers:postgresql` (+ `spring-boot-testcontainers` module) in
  the modules that run Layer 2.
- JUnit 5 ships with Spring Boot Test.

No production-scope dependency changes.

---

## 5. Bugfix targets

Each fix follows test-first: write a failing test, implement the fix, confirm
the test goes green, then run the full suite to confirm no regression.

1. **Refresh-token rotation (MAJOR, definite).** On `/api/auth/refresh`:
   issue a *new* refresh token, persist it, delete/expire the old one, return
   the new pair. Anti-replay test: old refresh token rejected after a refresh.
   Touches `AuthServiceImpl.refreshToken`, `RefreshToken` usage.
2. **Oversell guard (BLOCKER, conditional).** First *prove* under N concurrent
   confirms past quota whether the current Java pre-check + pessimistic lock
   holds. Regardless of the outcome, add a defensive guard inside
   `update_race_quota()` (`IF available_quota < NEW.quantity THEN RAISE ...`)
   so the DB itself rejects oversell, and map that exception to a clean
   4xx (conflict) in the service/exception handler.
3. **Confirm idempotency.** Confirming an already-CONFIRMED booking becomes a
   safe no-op that returns current state (mirroring cancel's idempotency),
   never double-decrementing quota.
4. **State-machine completeness.** Any illegal transition that slips through
   gets an explicit guard + test.
5. **Object-level authz gaps.** Close any hole where a non-owner, non-admin
   user can read/confirm/cancel another user's booking.

All fixes are small and surgical.

---

## 6. Execution & verification

1. Confirm Docker is up; baseline compile of all modules
   (`mvn -q -DskipTests package`) to establish a clean build.
2. Add test deps + tests module by module: `race-service` first (highest risk),
   then `user-service`, then gateway smoke + E2E.
3. `mvn test` per module → capture real PASS/FAIL; fix in tight loops.
4. Full `mvn verify` at root → confirm no regressions.
5. Generate the report (`docs/qa/2026-06-20-qa-report.md`) from *actual* run
   output — never from assumptions.

**Honesty commitment:** if Docker/Testcontainers cannot actually run when
reached, stop and report "compiles + tests written, not executed" rather than
fabricate a PASS. No false sign-off.

---

## 7. Deliverables

- New test sources under each module's `src/test/java/...` (Layers 1–4).
- Patched production code for the five bugfix targets, each tied to a
  failing→passing test.
- `docs/qa/2026-06-20-qa-report.md` — test-results table
  (ID / Area / Scenario / Expected / Actual / Status / Severity), bug reports
  with root cause + patch, concurrency evidence (numbers), and the sign-off
  checklist filled from real results.
- A documented one-line command to run the whole suite
  (`mvn verify`, E2E behind its tag).

---

## 8. Alternatives considered and rejected

- **k6/Gatling for concurrency** — heavier, external, harder to assert exact
  quota invariants. JVM `ExecutorService` gives deterministic correctness
  proofs; load tooling noted as future additive work.
- **H2 for DB tests** — cannot run PostgreSQL triggers; defeats the entire
  purpose of testing the quota engine.
- **Broad 13-area suite first** — user explicitly chose focus; broad-first
  would dilute BLOCKER work and push sign-off out.
