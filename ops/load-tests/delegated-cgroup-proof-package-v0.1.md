# C4 delegated cgroup proof package v0.1

**Status:** PROOF PACKAGE CHECKLIST ONLY. NOT APPROVED. NO OPERATIONAL GO.

**Purpose:** define the bounded evidence package required before C4 may claim a dedicated writable cgroup v2 resource boundary. This document does not create, modify, or test cgroups. It authorizes no GitHub Actions, PR creation, merge to `main`, production probe, ALPS integration, deployment, spending, protected-ledger write, trusted `VERIFIED` output, or Orchestrator activation.

## Starting point

Current C4 state is `CGROUP_READINESS_DIAGNOSTIC_QUALIFIED_DEDICATED_QUOTA_BLOCKED`.

The latest snapshot states that C4 has read-only diagnostic evidence only:

- `per_child_quota_verified=false`
- `operational_pass=false`
- dedicated per-child OS quota boundary is not yet proven
- more load volume is not justified by current evidence

## Proof package objective

Prove, in a bounded zero-cost/local scope, that C4 can attach a child process to a dedicated resource boundary and observe fail-closed behavior under CPU/memory pressure.

This package is intentionally pre-operational. Passing it would only support a later independent PROVE/GUARD review and founder decision. It would not authorize ALPS integration or remote load.

## Required evidence artifacts

### A1 — environment identity

Record immutable environment facts before any child process runs:

- kernel version and cgroup version;
- current cgroup membership path;
- available controllers;
- `cgroup.subtree_control` state;
- write permission result for candidate delegated path;
- current user, effective uid/gid, and path ownership/mode for relevant cgroup files.

Fail closed if these facts cannot be read or if they indicate shared host-only limits.

### A2 — dedicated child boundary creation or acquisition

The package must prove that the child resource boundary is dedicated to C4.

Minimum evidence:

- dedicated cgroup path or reviewed equivalent scope;
- process attachment mechanism is writable only where expected;
- exact child PID appears in the intended cgroup membership after attachment;
- fallback to root/shared cgroup is rejected;
- cleanup removes or resets the boundary after test completion where permitted.

### A3 — per-child memory quota

Minimum evidence:

- configured `memory.max` for the child boundary;
- observed memory pressure signal when deliberately exceeded;
- `memory.events` delta bound to that child boundary;
- no `RLIMIT_AS` substitute accepted;
- RSS/heap/exit signal reported separately.

### A4 — per-child CPU quota

Minimum evidence:

- configured `cpu.max` for the child boundary;
- observed throttling or bounded runtime behavior under blocked CPU workload;
- CPU throttling evidence tied to the child boundary where available;
- wall-clock timeout remains authoritative if CPU telemetry is ambiguous.

### A5 — failure and cleanup matrix

Run only bounded local child workloads. Required cases:

| Case | Expected result |
|---|---|
| responsive child inside quota | diagnostic pass, no operational authority |
| memory pressure above quota | fail closed with memory event or explicit unverifiable result |
| blocked CPU above budget | fail closed or throttled with bounded cleanup |
| timeout | no orphan child; watchdog failure retained |
| parent interruption simulation | child cleanup or explicit quarantine |
| attachment failure | no degraded pass; operationalPass remains false |

### A6 — immutable evidence binding

Every proof run must bind:

- exact Git commit;
- source blob SHAs;
- test blob SHAs;
- run recipe digest;
- quota configuration digest;
- raw machine-readable output digest;
- report digest.

Caller-provided digests are claims until calculated from acquired bytes.

### A7 — independent review prerequisites

Before this package can support any status upgrade:

- PROVE re-fetches exact source/test/report bytes from immutable commit;
- GUARD verifies no remote target, production probe, paid CI, deployment, ledger write, or `VERIFIED` writer path exists;
- reviewer records whether the cgroup evidence proves per-child enforcement;
- founder approval remains separate and required before any operational use.

## Explicit non-goals

This proof package does not attempt to:

- increase load volume;
- target ALPS;
- validate ALPS Phase 4.18;
- create a remote adapter;
- open a PR;
- run CI;
- use paid infrastructure;
- grant release authority.

## Stop conditions

Stop and preserve evidence if any of the following occurs:

- child cannot be attached to a dedicated boundary;
- quota files cannot be written or verified;
- shared host quotas are mistaken for C4-specific quotas;
- memory or CPU failure is classified as healthy;
- timeout loses watchdog failure state;
- orphan child remains after cleanup;
- raw output or report cannot be digested;
- any step would require paid infrastructure, production target, or elevated authority not separately approved.

## Decision

Until this package is implemented and independently reviewed, C4 remains `OPERATIONAL_BLOCKED`.
