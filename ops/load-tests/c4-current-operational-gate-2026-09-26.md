# C4 current operational gate — 2026-09-26

**Status:** CURRENT GATE SNAPSHOT ONLY. NOT APPROVED. NO OPERATIONAL GO.

This file links the current C4 state to the latest architecture-lock candidate without granting authority or changing `main`.

## Current state anchor

The current `ops/state.json` C4 record is:

- `status`: `CGROUP_READINESS_DIAGNOSTIC_QUALIFIED_DEDICATED_QUOTA_BLOCKED`
- latest diagnostic area: read-only cgroup readiness
- `per_child_quota_verified`: `false`
- `operational_pass`: `false`

This means C4 has useful diagnostic evidence, but it still does not have a dedicated per-child OS quota boundary.

## Latest lock candidate

Latest architecture lock candidate:

- `ops/load-tests/architecture-lock-v0.5.md`
- scope: cgroup readiness gate
- decision: C4 remains `OPERATIONAL_BLOCKED`

## Binding blockers

C4 cannot move to operational reusable load testing until all of the following are satisfied and separately approved:

1. Dedicated writable cgroup v2 sandbox or independently reviewed equivalent.
2. Verified per-child `memory.max` and `cpu.max` enforcement.
3. Proof that the C4 child process actually runs inside the intended quota boundary.
4. Observable OOM/throttle/failure signals tied to the child boundary.
5. Cleanup proof for timeout, parent crash, reset, blocked CPU, quota kill and non-200 cases.
6. Immutable source, recipe, fixture and quota configuration identity.
7. Independent PROVE/GUARD review using exact source and report bytes.
8. Separate founder approval for any ALPS integration, remote adapter, paid resource or operational run.

## Non-authorizations

This snapshot does not authorize:

- GitHub Actions or reruns;
- PR creation;
- merge to `main`;
- production probes;
- ALPS integration;
- remote adapters;
- paid infrastructure;
- protected ledger writes;
- trusted `VERIFIED` output;
- Orchestrator activation.

## Next valid step

Prepare a bounded proof package for delegated writable cgroup v2, or keep C4 synthetic/read-only diagnostic only. More load volume is not justified by the current evidence.
