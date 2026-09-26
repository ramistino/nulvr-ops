# C4 — Isolated load-test facility: T2 Product Blueprint + architecture (design + offline synthetic PoC, not activated)

**Purpose:** Build a reusable, offline/provisioned-on-demand load-testing tool for NULVR products that measures the precise conditions causing service liveness failures. The facility is a **company asset**, independent of ALPS Phase 4.18; ALPS becomes its first future target **only after separate approval**.

## Scope and boundaries

- Input: immutable test recipe, pinned build SHA, synthetic or expressly approved fixture dataset, fixed concurrency profile and a bounded duration.
- Output: machine-readable result with sampled RSS, heap, event-loop lag, request completion/timeout distributions, failures, workload identity, baseline reference and SHA-256 of raw output.
- Execution: **local and isolated** by default; no direct production endpoints, Docker/paid cloud provisioning or unattended GitHub Actions.
- Separate target adapter from harness. No ALPS ledger writes, no feature/evidence recipe modification, no source-of-truth duplication.
- Failure injection (local only): injected response latency, dependency unavailability, malformed payload, aborts, cooperative scheduling contention and child-process restart.
- Results are `OBSERVED` until PROVE independently re-runs source-bound fixture checks; they are not a GO/NO-GO verdict.

## Engineering budgets

All measured limits begin `PROVISIONAL` until an instrumented Spike supplies results:
- Workload identity: fixture version, record count, data cardinality, steady and peak concurrent requests.
- Latency: p50/p95/p99 from completed requests and **timeouts counted as failures**, never silently discarded.
- Event-loop delay: periodic histogram and maximum under overlapping requests.
- Memory: process RSS, heap used, arrayBuffers, residual RSS after multiple full cycles.
- Safety: process exit/restart signal, evidence-integrity result, no unapproved write or external network traffic.
- Time and spend: bounded local duration, explicit opt-in for remote targets; **incremental infrastructure budget = zero** for this design/PoC.

Never hardcode a passing latency, RSS or event-loop threshold without a workload-specific measured baseline and owner-approved budget. Previously observed ALPS production incidents may inform what to instrument, **not** become an approved performance threshold for NULVR as a whole.

## Adversarial preflight

- F1: a successful late HTTP 200 masks a 30 s liveness timeout; test independent watchdog and report both.
- F2: two requests consume the same CPU core and mask each other's stage timings; record request IDs and overlap windows.
- F3: retaining large fixture arrays creates rising RSS despite a low final heap; sample continuously and record post-cycle residency.
- F4: test harness itself generates costly concurrent production requests; prohibit production URLs by default and require a separate GUARD review and approved budget for any remote adapter.
- F5: outputs exist but do not match the pinned source; record fixture hash and tool version so PROVE can independently verify them.

## Planned acceptance gates (not yet satisfied)

1. Offline synthetic PoC demonstrates deterministic workload identity and machine-readable outputs across two repetitions.
2. A separate liveness probe detects a deliberately blocked event loop even when the work request ultimately succeeds.
3. Tampered results, changed fixture identity or an unpinned build are rejected or `UNVERIFIABLE`.
4. No outbound network, no cloud resource creation, no production writes; local run terminates at approved CPU/memory/time bounds.
5. PROVE re-runs independent tests and reviews failure handling. Owner approves T2 Architecture Lock **before operational activation**.

**Present status:** a localhost-only synthetic PoC is staged at `ops/load-tests/local-harness.mjs` with target `local-target.mjs` and 5 tests in `ops/tests/local-harness.test.mjs`. It detects independent liveness failures even when a blocked request later returns HTTP 200; an asynchronous control retains liveness. Three local test repetitions each yielded 17/17 when combined with C3's 12 tests. This is not the approved operational facility: no independent PROVE acceptance, measured Engineering Budget, or T2 Architecture Lock yet. No production probe, GitHub CI run or billed resource was created.
