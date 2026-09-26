# C4 synthetic load baseline — observation, NOT an approved engineering budget

**Date:** 2026-09-26. **Source:** `9fd1a8a67b9f5f976654173b47a5750d3bb926c9`, exact C4 local harness blob `5ae20aad76243799ff76f6893f22aa792a6be713` and target blob `9d93e485e449ffccfbc262d5abf65aca55d08c24`.

**Raw machine-readable result:** [`synthetic-baseline-2026-09-26.json`](./synthetic-baseline-2026-09-26.json). Exact Git blob `4cf2ed5783aa0e633d12d0c33fb4607539c94190`, raw SHA-256 `301046eea3e1a7f1b437b644e1a225bdd3a2d9e844302f264af1b5e5038173c1`.

Node v22.16.0 on one local environment (five logical CPUs). Three **responsive** and three **blocked** repetitions, each using a 500ms synthetic work duration, 55ms watchdog cadence, 110ms probe timeout and 4500ms overall limit. A fresh 0700 local staging directory was created per run and deleted after the run. The fixture is **not** used to drive the synthetic workload.

| Observed metric | Responsive (3 repetitions) | Blocked (3 repetitions) |
|---|---|---|
| Eventually completed work | HTTP 200 in every repetition | HTTP 200 in every repetition |
| Work latency | 502.3–502.5ms | 501.8–501.9ms |
| Watchdog 200s / timeouts per run | 9 / 0 | 1 / 3 |
| Child max event-loop delay | 10.7–12.3ms | 509.9–510.9ms |
| RSS after work | 32,784,384–32,989,184 bytes | 39,059,456–39,178,240 bytes |
| Work CPU | 7,718–9,887 microseconds | 508,775–510,113 microseconds |

These **six observations** demonstrate the intended distinction between an eventual HTTP 200 and failed liveness in a deliberately blocked Node process. They **do not establish operational performance, resource safety, a production workload, or ALPS Phase 4.18 readiness**. No passing threshold or NULVR-wide engineering budget is implied. Repeat with source-appropriate approved fixtures and OS-level isolation before deriving operational thresholds.

The local script was retained only as a session artifact (raw SHA-256 `f195f8c6d4bda4b348a303ceb6acd873ef8e73cde5a53c5be7459145cbfb3f4c`). This record is OBSERVED technical evidence, not an independently protected owner-signature or a trusted VERIFIED ledger entry. No remote probes or billed runners were used.
