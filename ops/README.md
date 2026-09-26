# NULVR Company Operating Track v1

**Purpose:** make NULVR operate as a company while ALPS continues as an independent product workstream.

This operating scaffold does **not** modify the frozen Constitution v1.0. It implements the distinction between **company capability** and **product readiness**.

## Two parallel tracks

### COMPANY — NULVR OPS
Can advance without ALPS Phase 4.18 PASS:
1. Repair/diagnose NULVR OPS CI startup failure without paid retries.
2. Establish BUILD / PROVE / GUARD handoff records and context boundaries.
3. Build task/evidence ledger and a trusted PROVE checker against synthetic fixtures.
4. Build reusable isolated load-test tooling.
5. Add minimal governance CI only after its own T2 approval.
6. Qualify the trusted checker on real ALPS evidence when available.
7. Qualify the read-only Orchestrator only after the checker gate.

### PRODUCT — ALPS
Runs independently:
1. Diagnose and close Phase 4.18.
2. Preserve Evidence, fail-closed behavior and research-only scope.
3. Prove liveness and evidence integrity under overlap.
4. Release only through ALPS's own authority gates.

**ALPS 4.18 may block ALPS release and the final ALPS-based qualification of PROVE. It does not block construction of NULVR OPS.**

## Operating roles

| Lane | Current operating meaning | Authority |
|---|---|---|
| Founder | Strategy, budget, T2 lock and T3 GO/NO-GO/release | Final approval at defined gates |
| BUILD | Separate implementation session/work lane | Propose changes; no self-approval |
| PROVE | Separate evidence-first verification session/work lane | Verify from primary evidence; no code modification |
| GUARD | Separate read-only governance/operations lane | Observe risk/cost/health; no autonomous deploy/spend |
| Orchestrator | Not activated | No runtime authority |

## Required handoff record

Every meaningful work item should carry:
- `work_id`, `track`, `tier`, `owner_lane`
- pinned repository and base commit
- acceptance criteria fixed before verification
- inputs visible to the lane
- outputs/evidence references
- status (untrusted handoff v1.1): `PROPOSED | ACTIVE | BLOCKED | OBSERVED | UNVERIFIABLE | CHECK_ERROR`
- next gate and explicit `authority_required` (descriptive; grants no permission)

Use [`handoff-v1.1.schema.json`](./handoff-v1.1.schema.json) for new handoffs; the original v1 schema is historical and *format-only*. Source-bound [PROVE schema review](https://github.com/ramistino/nulvr-ops/blob/0fd2759717015c5d298295fe5abb50f46fb5475b/ops/prove/reviews/2026-09-26-c2-v11.md) validated 17/17 structural cases. `VERIFIED`, `REFUTED`, and `RELEASED` require separately protected verdict/release records, not author-supplied status. A narrative model answer is never a protected `VERIFIED` verdict.

## Immediate company backlog

| Priority | Work item | Dependency | Current gate |
|---:|---|---|---|
| C1 | Diagnose PR #7 zero-job CI startup failure | None / read-only first | ACTIVE |
| C2 | Implement machine-readable handoff/state contract | None | ACTIVE on this branch |
| C3 | Trusted PROVE checker on synthetic fixtures | C2 | READY FOR DESIGN |
| C4 | Reusable isolated load-test harness | C2 | READY FOR DESIGN (T2 before activation) |
| C5 | Minimal governance CI | C3 + T2 Architecture Lock | BLOCKED FROM ACTIVATION |
| C6 | ALPS qualification of PROVE | trusted checker + suitable ALPS evidence | FUTURE GATE |
| C7 | Read-only Orchestrator pilot | 14-day qualification | NOT ACTIVATED |

The company track is therefore **active now**, even while ALPS Phase 4.18 remains NOT PASS.
