# C4 Architecture Lock candidate v0.2 — operational blockers after synthetic profile

**Status:** DESIGN CANDIDATE ONLY. NOT APPROVED. NO OPERATIONAL GO.  
**Scope:** convert the latest C4 synthetic evidence into explicit architecture gates before any reusable load-test facility can be activated.

This document does not authorize GitHub Actions, PR creation, production probes, ALPS integration, deployment, spending, protected-ledger writes, trusted VERIFIED output, or Orchestrator activation.

## Current evidence baseline

C4 has a bounded localhost-only synthetic harness and a later 12-run synthetic profile recorded on the company track. The latest state record says:

- exact-source test and 12-run synthetic profile are complete;
- profile scope is synthetic only;
- source blobs matched for the observed profile;
- late HTTP 200 under blocked CPU produced watchdog failures;
- work HTTP 503, reset, timeout and invalid-body cases fail work independently;
- there is no operational PASS.

The recorded limitation remains binding: two synthetic runs per scenario only, timeout child resource metrics are missing, no OS resource quotas or approved workload budgets exist, and the raw profile JSON remains local rather than independently immutable.

## Lock objective

C4 v0.2 does not approve more load. It freezes the conditions required before C4 can advance from synthetic technical qualification to a reusable operational load-testing capability.

A future implementation may proceed only after these gates are converted into testable evidence and separately approved by the founder.

## Required gates before operational activation

### G1 — OS-enforced resource quotas

V8 `--max-old-space-size=96` is a heap flag, not a process-level RSS/CPU quota. Operational C4 must run inside an approved local containment boundary with hard CPU, RSS, process-count and wall-clock limits.

Minimum evidence:

- documented quota mechanism and platform assumptions;
- hard failure when CPU or RSS budget is exceeded;
- no orphan child process after timeout or parent crash;
- resource metrics captured for success, timeout, transport error and blocked CPU scenarios;
- founder-approved maximum local resource budget with zero paid infrastructure unless separately approved.

### G2 — immutable run recipe and fixture identity

Caller-provided `fixtureDigest`, `pinnedCommit`, report path, or local JSON SHA are provenance claims only. They do not prove owner approval or immutable source identity.

Minimum evidence:

- founder-approved run recipe stored outside BUILD/PROVE mutation control;
- immutable source commit/tree and file-digest binding;
- fixture identity acquired through a controlled read-only path;
- report digest calculated from acquired bytes, not caller-provided metadata;
- replay of the same recipe is deterministic or explicitly marked non-deterministic with allowed timing bands.

### G3 — immutable staging and ancestor-race containment

Private root and final-file `O_NOFOLLOW` reduce risk but do not by themselves prove that ancestors, staging roots, or mounted paths cannot be replaced during acquisition.

Minimum evidence:

- descriptor-relative traversal or equivalent ancestor-safe acquisition;
- rejection of symlinked, shared, world-writable or attacker-controlled ancestors;
- stable inode/device/size checks where applicable;
- adversarial tests for directory replacement, symlink swap, fixture replacement and path escape;
- no fallback to unprotected temp directories for trusted inputs.

### G4 — independent review boundary

The current technical rerun and GUARD inspection were performed within the same assistant/session context. That is useful technical evidence, but not independent organizational signoff.

Minimum evidence:

- separate PROVE workspace or reviewer identity;
- exact source re-fetch from GitHub at immutable commit;
- independent rerun of C4 tests and profile validation;
- review artifact with raw log digest and no BUILD-controlled mutation path;
- explicit statement that no protected VERIFIED or release authority is granted.

### G5 — workload budget and ALPS integration decision

The synthetic fixture is not consumed as real workload. Therefore synthetic timing cannot be represented as ALPS service capacity or production readiness.

Minimum evidence:

- separate workload-specific design for any fixture-driven, remote-adapter or ALPS-integrated test;
- approved endpoint boundary and no production target without explicit founder GO;
- measured steady-state and peak budgets for CPU/RSS/event-loop/latency;
- stop rules for 5xx, event-loop stalls, memory growth and orphan processes;
- rollback plan and evidence-retention plan before any operational run.

## Required negative tests before C4 v0.2 can lock

- CPU block where work returns 200 late but watchdog fails: liveness must fail.
- HTTP 503, reset socket, invalid body and timeout: each must be distinct and must not count as healthy latency.
- Exceed CPU/RSS quota: hard stop and failure classification.
- Replace fixture after digest calculation: fail closed.
- Replace ancestor directory during acquisition: fail closed.
- Use symlink/shared/world-writable staging: fail closed.
- Attempt remote URL or production endpoint: fail closed.
- Attempt to write protected ledger or emit VERIFIED: fail closed.
- Retry same run recipe after partial failure: must preserve evidence and avoid double authority.

## Non-authorizations

This candidate explicitly does not authorize:

- GitHub Actions rerun or workflow trigger;
- PR creation or merge;
- writing to `main`;
- production probe;
- ALPS integration;
- paid cloud allocation;
- remote load test;
- protected VERIFIED writer;
- owner signature;
- Orchestrator activation.

## Decision state

C4 remains: **TECHNICALLY ADVANCED, OPERATIONALLY BLOCKED**.

Next admissible step is independent review of this v0.2 candidate and a founder decision on whether to authorize a zero-cost local hardening implementation. Until then, C4 cannot be used as a company operational load-testing facility.
