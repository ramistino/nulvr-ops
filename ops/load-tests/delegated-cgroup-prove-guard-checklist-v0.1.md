# C4 delegated cgroup PROVE/GUARD checklist v0.1

**Status:** REVIEW CHECKLIST ONLY. NOT APPROVED. NO OPERATIONAL GO.

**Scope:** define what an independent PROVE/GUARD review must check before the delegated cgroup proof package can support any status upgrade. This file does not run tests, create cgroups, trigger CI, open a PR, merge to `main`, probe production, integrate ALPS, spend money, write protected ledgers, emit trusted `VERIFIED`, or activate Orchestrator.

## Current source anchor

Latest observed company-branch source at time of this checklist:

- branch: `ops/company-track-v1`
- latest commit: `581a6f1d0604c7d33e7a8a38f49bdd785d11232c`
- latest change: four adversarial cgroup path and membership cases
- affected file: `ops/tests/cgroup-adversarial.test.mjs`

The new adversarial cases reject:

1. duplicated v2 membership entries;
2. symlinked cgroup member path;
3. control characters in membership;
4. relative root.

These cases improve diagnostic hardening, but they still do not prove a dedicated writable child quota boundary.

## Required PROVE checks

### P1 — exact source acquisition

PROVE must independently re-fetch and bind:

- `ops/load-tests/cgroup-readiness.mjs`;
- `ops/tests/cgroup-readiness.test.mjs`;
- `ops/tests/cgroup-adversarial.test.mjs`;
- `ops/load-tests/delegated-cgroup-proof-package-v0.1.md`;
- latest architecture lock candidate and operational gate snapshot.

Record exact blob SHAs, commit SHA, fetch timestamp and raw digest for each acquired artifact.

### P2 — adversarial path and membership behavior

PROVE must confirm that cgroup diagnostic logic fails closed for:

- duplicated `0::` membership entries;
- symlinked cgroup member path;
- control characters or malformed membership text;
- relative or non-absolute cgroup root;
- missing `cpu` or `memory` controller;
- shared host-only limits represented as observations only.

### P3 — no quota-authority inflation

PROVE must confirm that the diagnostic path cannot set:

- `operationalPass=true`;
- `perChildQuotaVerified=true`;
- release authority;
- protected `VERIFIED` authority;
- ALPS integration authority.

Any read-only or same-session evidence must remain diagnostic only.

### P4 — proof-package completeness

PROVE must verify that any future delegated-cgroup proof package includes:

- environment identity;
- dedicated child boundary creation/acquisition;
- per-child memory quota evidence;
- per-child CPU quota evidence;
- failure and cleanup matrix;
- immutable evidence binding;
- independent review prerequisites.

Missing one category keeps C4 blocked.

## Required GUARD checks

### G1 — non-authorized surfaces

GUARD must confirm no change introduces:

- GitHub Actions workflow changes or reruns;
- PR creation requirement;
- merge-to-main path;
- production target or remote adapter;
- ALPS endpoint access;
- paid cloud allocation;
- protected ledger write;
- trusted `VERIFIED` output;
- Orchestrator activation.

### G2 — resource-boundary semantics

GUARD must confirm the implementation distinguishes:

- read-only cgroup observation vs writable delegated boundary;
- shared host limits vs C4-specific per-child quotas;
- V8 heap flags / `RLIMIT_AS` vs OS RSS/CPU enforcement;
- telemetry sample vs final `workComplete` metric;
- diagnostic pass vs operational pass.

### G3 — cleanup and fail-closed policy

GUARD must require blocked status for:

- cgroup attachment failure;
- missing controller;
- malformed membership;
- ambiguous process boundary;
- quota event without cleanup proof;
- raw evidence unavailable or not immutable.

## Status decision rules

- If all read-only checks pass but no writable delegated cgroup is proven: keep `CGROUP_READINESS_DIAGNOSTIC_QUALIFIED_DEDICATED_QUOTA_BLOCKED`.
- If a writable delegated cgroup is proven locally but no independent review exists: keep `LOCAL_PROOF_ONLY_OPERATIONAL_BLOCKED`.
- If independent PROVE passes but GUARD finds an authority leak: keep `BLOCKED_GUARD_FAIL`.
- If PROVE and GUARD both pass: request separate founder T2 decision; do not self-activate.

## Non-authorizations

This checklist does not authorize:

- more load;
- CI;
- PR;
- merge;
- production probes;
- ALPS integration;
- paid infrastructure;
- protected verdict writing;
- Orchestrator activation.

## Next valid step

A future step may either run a bounded local proof in an already-approved dedicated writable cgroup environment, or keep C4 synthetic/read-only diagnostic until such an environment exists. No current evidence justifies operational activation.
