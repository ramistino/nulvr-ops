# C4 Architecture Lock candidate v0.3 — timeout telemetry and operational gate

**Status:** DESIGN CANDIDATE ONLY. NOT APPROVED. NO OPERATIONAL GO.

**Scope:** capture the latest C4 timeout-telemetry evidence as architecture requirements before any reusable load-testing capability, ALPS integration, remote adapter or operational run can be approved.

This document grants no authority for GitHub Actions, PR creation, merge to `main`, production probes, ALPS integration, deployment, spending, protected-ledger writes, trusted `VERIFIED` output or Orchestrator activation.

## Current evidence baseline

The C4 branch state has advanced beyond the earlier 12-run synthetic profile. The current C4 record describes a timeout telemetry patch that:

- adds 100 ms periodic IPC resource samples;
- preserves the last sample on synthetic work timeout;
- distinguishes sampled timeout values from final `workComplete` metrics;
- reports exact current source blobs for harness, target and tests;
- records two same-session local runs at 18/18 each on Node v22.16.0;
- records one fresh same-session technical rerun at 18/18;
- keeps independent reviewer signoff false;
- keeps C4 operationally blocked.

The earlier 12-run profile remains useful historical evidence only. Its own limitation says it predates the timeout telemetry patch and must not be treated as current-patch measurements.

## Lock objective

C4 v0.3 freezes the requirements for moving from local synthetic telemetry evidence to an operationally reusable load-test facility. It does not approve more load, remote testing, production testing, CI usage or any paid resource.

## Required gates before operational activation

### G1 — OS-enforced resource boundary

Periodic IPC samples are observations, not containment. Operational C4 must run inside a founder-approved local containment mechanism with hard limits.

Minimum evidence:

- explicit CPU, RSS, process-count and wall-clock limits;
- hard failure when a limit is exceeded;
- no orphan process after timeout, parent crash or reset;
- resource metrics for responsive, timeout, blocked CPU, non-200, reset and invalid-body cases;
- proof that V8 heap flags are not represented as RSS or CPU quotas.

### G2 — telemetry integrity and semantics

Timeout telemetry must be treated as sampled diagnostic evidence, not as final workload completion evidence.

Minimum evidence:

- schema fields that separate `sampledDuringWork`, `workComplete`, timeout and transport failure metrics;
- explicit null or absent final metrics when work did not complete;
- deterministic classification when event-loop blocking delays sampling;
- raw machine-readable telemetry retained with digest;
- negative tests proving late HTTP 200 cannot erase watchdog failure.

### G3 — immutable recipe, fixture and source identity

Caller-provided digests or pinned commits are claims until independently acquired and verified.

Minimum evidence:

- founder-approved run recipe outside BUILD/PROVE mutation control;
- immutable Git commit/tree and exact source blob binding;
- controlled read-only acquisition of fixture and report bytes;
- report digest calculated from acquired bytes;
- clear distinction between historical profile evidence and current telemetry-patch evidence.

### G4 — immutable staging and ancestor-race containment

Private local roots and final-file no-follow handling are not sufficient for trusted operational inputs.

Minimum evidence:

- descriptor-relative traversal or equivalent ancestor-safe input acquisition;
- rejection of symlinked, shared, world-writable or attacker-controlled ancestors;
- tests for directory replacement, symlink swap, fixture replacement, path escape and stale file handles;
- no fallback to unprotected temp directories for trusted inputs.

### G5 — independent PROVE/GUARD review boundary

Same-session BUILD, technical rerun and static inspection remain technical evidence only.

Minimum evidence:

- separate PROVE workspace or reviewer identity;
- exact source re-fetch from GitHub at immutable commit;
- independent rerun of C4 tests and telemetry qualification;
- raw log digest and review artifact outside BUILD mutation path;
- explicit statement that no protected `VERIFIED` or release authority is granted.

### G6 — workload budget and ALPS integration decision

Synthetic telemetry cannot be converted into ALPS capacity claims without a separate workload decision.

Minimum evidence:

- workload-specific latency, event-loop, CPU and RSS budgets;
- approved local-only budget for the first operational test;
- separate founder GO for ALPS integration or remote adapter;
- stop rules for instability, uncontrolled resource growth or non-deterministic classification;
- no paid infrastructure unless separately approved.

## Required negative tests before any operational GO

- CPU/RSS limit breach fails closed and leaves no orphan process.
- Timeout telemetry remains sampled-only and never becomes final success metrics.
- Late HTTP 200 after watchdog failure remains a failure.
- Reset, HTTP 503, timeout and invalid body remain independently failing cases.
- Symlink, ancestor replacement and path escape are rejected.
- Historical 12-run profile cannot qualify the current telemetry-patch source.
- Caller-provided fixture/report/source digests cannot authenticate owner approval.
- No network target, production URL, protected ledger write, CI trigger or paid resource path exists.

## Next authorized work

Allowed without additional spending or CI: documentation refinement, local design review, and preparing exact test requirements for future independent PROVE/GUARD review.

Not allowed without separate founder approval: operational activation, ALPS integration, remote adapter, production probe, CI rerun, PR creation, main merge, deployment, spending, trusted `VERIFIED` writer or Orchestrator pilot.

## Decision

C4 v0.3 keeps the correct conclusion:

**C4 has useful local synthetic telemetry evidence. It is not operationally approved.**
