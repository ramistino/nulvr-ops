# C4 work/liveness outcome gate — acceptance matrix v0.1

**Status:** T1 read-only acceptance design, NOT implementation approval. C4 retains offline synthetic technical PROVE 50/50; operational activation remains BLOCKED. No GitHub Actions run, paid infrastructure, remote adapter, ALPS probe, protected verdict or merge is authorized here.

## Source and evidence boundary

- Reviewed company-branch `ops/load-tests/local-harness.mjs` blob `5ae20aad76243799ff76f6893f22aa792a6be713` and `ops/tests/local-harness.test.mjs` blob `45c97258eaabd90dff63365898aad4439e452707`.
- Six stored localhost baseline samples in `synthetic-baseline-2026-09-26.json`: three responsive and three blocked; all six `/work` responses were HTTP 200. Responsive liveness passed 3/3; blocked liveness failed 3/3. This is evidence of the two existing scenarios only, not of `/work` error handling.
- `status:OBSERVED` describes the **authority level of a measurement**, never success of the measured work. Existing source records `work.status` and liveness independently but does not compute a combined operational acceptance decision. Existing negative tests simulate /live 503 and error classification; they do not inject /work 503.

## Required independent result dimensions

| Dimension | Proposed evidence field | Fail-closed rule |
|---|---|---|
| Work request | `workSucceeded` | True only for HTTP 200 plus complete expected body; non-200, malformed body, reset and timeout are failures. Preserve exact HTTP/error category. |
| Concurrent liveness | `livenessFailed` | True for any HTTP non-200, timeout or transport error while work is in progress; a late work HTTP 200 cannot override it. |
| Resource containment | `resourceBudgetExceeded` | Unknown until an approved workload-specific budget and OS-enforced limits exist; unknown cannot authorize operational PASS. |
| Provenance | `ownerPinVerified` | Unknown/false until independently signed owner pin and protected staging are implemented; caller-provided SHA alone is insufficient. |

A separate `technicalOutcome` may report `WORK_FAILED`, `LIVENESS_FAILED`, `RESOURCE_UNKNOWN`, `PROVENANCE_UNVERIFIED`, or `SYNTHETIC_OBSERVED`. Keep multiple failure reasons if more than one dimension fails; do not make an ordered single reason hide the others. **Never emit protected `VERIFIED` or `RELEASED` from this harness.**

## Localhost-only negative test matrix for a future approved T2 implementation

| Case | /work | /live during work | Expected result |
|---|---|---|---|
| A | 200, valid body | all 200 | Work succeeds; liveness healthy; synthetic observation only |
| B | 200, valid body after CPU stall | timeout(s) | Work succeeds; liveness fails; overall operational PASS forbidden |
| C | 503 | all 200 | Work fails independently; healthy liveness cannot mask it |
| D | socket reset | all 200 | Work transport failure; no fabricated HTTP status |
| E | timeout | all 200 or unknown | Work timeout; watchdog completion and child cleanup verified |
| F | 200, invalid/truncated body | all 200 | Work fails body contract |
| G | 200, valid body | /live 503 | Liveness fails independently |
| H | 200, valid body | /live reset or timeout | Liveness fails independently |
| I | 200, valid body | all 200 | No operational PASS if owner pin or approved resource budgets are absent |

All cases must run with one unprivileged parent/child pair on 127.0.0.1 only, bounded deadlines, no network target configuration, no production evidence and no paid CI. Assert no orphan child on timeout/reset; keep exact source SHA, config/fixture hashes and raw outputs. PROVE must independently rerun committed code after T2 GO; GUARD must inspect scope and cost.

## Activation boundary

This matrix is a test contract, not a change to `local-harness.mjs`, the existing C4 architecture approval, or ALPS release criteria. Any implementation of new fault-injection modes, work-body validation or aggregate classification requires a separately scoped founder T2 GO. Operational use additionally requires independent owner-pin provenance, immutable staging, hostile-filesystem protections, OS resource containment and workload-specific thresholds.
