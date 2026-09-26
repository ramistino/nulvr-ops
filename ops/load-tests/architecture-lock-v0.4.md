# C4 Architecture Lock candidate v0.4 — OS quota feasibility gate

**Status:** DESIGN CANDIDATE ONLY. NOT APPROVED. NO OPERATIONAL GO.

**Scope:** convert the latest local OS-quota feasibility findings into explicit C4 activation gates. This document does not authorize CI, PR creation, merge to `main`, ALPS integration, production probes, deployment, spending, protected-ledger writes, trusted `VERIFIED` output, or Orchestrator activation.

## Current evidence baseline

C4 has advanced beyond the timeout-telemetry architecture candidate. The current company state now records a local OS-quota feasibility experiment and the report `ops/load-tests/os-quota-feasibility-2026-09-26.md`.

The report preserves the published C4 harness baseline and states that the standalone quota probe was local only. It records two complete local runs of 20/20 each, combining the existing 18 checks with two new experimental probe checks.

Important findings:

- cgroup v2 is available and exposes `cpu` and `memory` controllers;
- the current execution environment does not allow writing `/sys/fs/cgroup/cgroup.procs`;
- the observed shared environment limits are not dedicated C4 quotas;
- `RLIMIT_AS=96 MiB` caused an idle Node child to exit with `SIGSEGV`;
- `RLIMIT_AS` limits virtual address space, not RSS, and is rejected as a substitute for a measured Node RSS quota;
- the feasibility probe remained local, bounded, and `operationalPass=false`.

## Lock objective

C4 v0.4 freezes the operational resource-boundary decision: C4 cannot become a reusable operational load-test facility until it has a dedicated, writable and independently reviewed process containment mechanism.

The prior telemetry samples are diagnostic evidence. The OS-quota experiment shows that the naive local substitutes are insufficient.

## Required gates before operational activation

### G1 — Dedicated writable cgroup v2 sandbox or reviewed equivalent

Operational C4 must use a containment boundary that can apply per-child CPU and memory limits, not merely observe them.

Minimum evidence:

- dedicated cgroup path or equivalent isolation scope created for C4 only;
- writable `cgroup.procs` or equivalent process attachment mechanism;
- configured `memory.max` and `cpu.max` values per C4 child process;
- rejection if the process cannot be attached to the protected resource boundary;
- proof that shared host-level limits are not misrepresented as C4-specific quotas.

### G2 — Measured Node memory and CPU behavior

The 96 MiB `RLIMIT_AS` route is rejected. Future limits must be derived from measured Node process behavior under the actual C4 workload.

Minimum evidence:

- responsive, timeout, blocked CPU, non-200, reset and invalid-body runs under the proposed limits;
- observed OOM, throttle or timeout signals when limits are deliberately exceeded;
- no `SIGSEGV`-based false success path;
- separate RSS, heap, CPU and wall-clock reporting;
- documented steady-state, peak and failure thresholds.

### G3 — Child cleanup and crash containment

Operational C4 must prove that resource limits and failures do not leave orphan work.

Minimum evidence:

- process cleanup after timeout, parent crash, socket reset and quota violation;
- no leaked child after SIGTERM/SIGKILL fallback;
- deterministic failure classification when cleanup is incomplete;
- retained machine-readable event log and digest for every failure path.

### G4 — Immutable source, recipe and quota configuration

A quota result is not authoritative unless the exact source, recipe, fixture and quota configuration are independently acquired and pinned.

Minimum evidence:

- immutable Git commit/tree and source blob binding;
- founder-approved run recipe outside BUILD/PROVE mutation control;
- quota configuration digest calculated from acquired bytes;
- fixture and report bytes acquired through a read-only controlled path;
- explicit separation between committed source, local-only probe artifacts and historical observations.

### G5 — Independent PROVE/GUARD signoff

Same-session local tests and feasibility probes are engineering evidence only.

Minimum evidence:

- separate reviewer or workspace re-fetches the exact source and report;
- exact local-only probe artifacts are either committed for review or deliberately excluded with a clear limitation;
- independent rerun or source review confirms the quota boundary semantics;
- GUARD verifies no remote target, paid CI, deployment, production probe or protected ledger write was introduced;
- review states explicitly that no operational PASS or `VERIFIED` authority is granted.

### G6 — Workload budget and ALPS integration decision

Even after resource limits are technically available, C4 still cannot target ALPS or any remote service without a separate founder-approved workload budget and integration design.

Minimum evidence:

- approved workload class and request envelope;
- local-only replay recipe before remote adapter design;
- defined abort thresholds for latency, CPU, memory and error rate;
- zero-spend confirmation unless founder separately approves infrastructure;
- explicit decision that ALPS Phase 4.18 remains a separate PRODUCT gate.

## Non-authorizations

This lock candidate does not authorize:

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

## Decision

C4 remains **OPERATIONAL_BLOCKED**.

The next valid step is not more load. The next valid step is a bounded design/proof package for a dedicated resource sandbox, or a founder decision to keep C4 synthetic-only until such a sandbox is available.
