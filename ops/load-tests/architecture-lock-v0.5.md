# C4 Architecture Lock candidate v0.5 — cgroup readiness gate

**Status:** DESIGN CANDIDATE ONLY. NOT APPROVED. NO OPERATIONAL GO.

**Scope:** capture the latest read-only cgroup readiness qualification as explicit activation gates for C4. This document grants no authority for GitHub Actions, PR creation, merge to `main`, production probes, ALPS integration, deployment, spending, protected-ledger writes, trusted `VERIFIED` output or Orchestrator activation.

## Current evidence baseline

C4 has advanced beyond the OS-quota feasibility candidate. The current branch contains a committed read-only cgroup readiness assessor and test pair:

- `ops/load-tests/cgroup-readiness.mjs`
- `ops/tests/cgroup-readiness.test.mjs`

The readiness qualification records two complete local suite runs at 23/23 each on Node v22.16.0 and confirms that source/test blobs matched the tested bytes.

The observed environment exposes cgroup v2 with `cpu` and `memory` controllers and readable `memory.events`, but the assessment remains diagnostic only. Shared host limits are not dedicated C4 quotas. `cgroup.subtree_control` is empty. Prior write-permission checking found `cgroup.procs` not writable. No per-child limit was installed or verified.

## Decision

The read-only cgroup readiness assessor is qualified as a local diagnostic, not as an OS quota enforcer.

C4 remains **OPERATIONAL_BLOCKED** because `perChildQuotaVerified=false` and `operationalPass=false` remain binding.

## Required gates before operational activation

### G1 — Delegated writable resource boundary

Operational C4 must be able to attach each child process to a dedicated resource boundary.

Minimum evidence:

- dedicated cgroup v2 path or reviewed equivalent for C4 only;
- writable process attachment mechanism such as `cgroup.procs` in the delegated child cgroup;
- non-empty or explicitly configured delegation for required controllers where applicable;
- rejection when attachment fails or falls back to shared host limits;
- machine-readable proof that the child process actually ran inside the intended quota boundary.

### G2 — Per-child CPU and memory limits

Operational C4 needs enforced per-child limits, not just read-only host observations.

Minimum evidence:

- configured `memory.max` and `cpu.max` for each C4 child;
- observed failure, OOM or throttling when limits are deliberately exceeded;
- readable `memory.events` and CPU throttling evidence tied to the child boundary;
- separate RSS, heap, CPU and wall-clock observations;
- no representation of V8 heap flags or `RLIMIT_AS` as RSS/CPU quota substitutes.

### G3 — Fail-closed behavior

The readiness checker must remain unable to grant operational authority by observation alone.

Minimum evidence:

- `operationalPass=false` unless per-child quotas are installed and verified;
- `perChildQuotaVerified=false` for read-only assessments;
- invalid membership paths and missing controllers rejected;
- shared environment limits recorded as observations only;
- incomplete delegation blocks activation rather than producing a degraded pass.

### G4 — Cleanup under quota and failure paths

C4 must prove bounded cleanup under timeout, crash and quota violation.

Minimum evidence:

- no orphan child after timeout, parent crash, reset, non-200 response, blocked CPU and quota kill;
- deterministic classification for cleanup failure;
- retained raw log digest for every failure path;
- no late HTTP 200 can erase watchdog failure or quota violation;
- cleanup semantics reviewed independently by GUARD.

### G5 — Immutable evidence and independent review

Same-session local qualification remains useful but non-authoritative.

Minimum evidence:

- independent PROVE re-fetches exact source/test/report blobs from immutable commit;
- exact test logs and report digest are bound to the review artifact;
- GUARD confirms no remote target, paid CI, production probe, deployment or protected ledger write;
- founder-approved run recipe and quota configuration are outside BUILD/PROVE mutation control;
- explicit statement that no trusted `VERIFIED` or release authority is granted.

### G6 — Workload and ALPS integration decision

A working cgroup boundary would still not authorize ALPS load or remote adapters.

Minimum evidence:

- founder-approved workload class, request envelope and abort thresholds;
- zero-spend confirmation unless separately approved;
- local-only replay design before any remote adapter;
- separate ALPS integration review;
- confirmation that ALPS Phase 4.18 remains a separate PRODUCT gate.

## Non-authorizations

This candidate does not authorize:

- GitHub Actions or reruns;
- PR creation or merge;
- changes to `main`;
- production probes;
- ALPS integration;
- remote adapters;
- paid infrastructure;
- protected ledger writes;
- trusted `VERIFIED` output;
- Orchestrator activation.

## Next valid step

Prepare a bounded proof package for a delegated writable cgroup v2 sandbox, or keep C4 synthetic-only until such a sandbox is available. No additional load volume is justified by the current evidence.
