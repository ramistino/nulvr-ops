# C4 synthetic profile — observational baseline, 2026-09-26

**Scope:** 12 local loopback-only runs, two per scenario, Node v22.16.0. No external target, CI, merge, deployment, paid resource, ledger write or operational authority. Synthetic fixture is a provenance marker and is not consumed as a real workload.

**Exact source Git blobs:** harness `3a902ff1735b9fb602b305ec37f1148d6d05ac09`; target `da8e47f1cfd776afa629a50ecfc05f83a44bf6cd`; tests `1f81374c7349195f7479e4b0ea2d1ae162a5a79a`. Existing exact-source suite: 18/18 passed twice in BUILD and once in a fresh same-session technical rerun. These are not independent organizational signoff.

**Local raw JSON report SHA-256:** `90bfc7591e687c4534af3930fa7d2ce13f31683e724a83aba0ad088f5efdafe0`. Raw JSON retained in the local execution workspace, not uploaded to this repository; this digest is a traceability marker, not independent verification.

| Scenario | Run 1 work latency ms | Run 2 ms | Work result | Liveness failures each run | Child RSS after work bytes (run 1 / run 2) | Child CPU μs (run 1 / run 2) |
|---|---:|---:|---|---:|---|---|
| responsive | 503.4 | 502.5 | HTTP 200, valid | 0 | 32694272 / 32731136 | 10863 / 11007 |
| blocked | 502.2 | 501.9 | HTTP 200, valid | 3 | 39149568 / 39804928 | 511313 / 509957 |
| work503 | 501.2 | 502.5 | HTTP 503 | 0 | 32669696 / 32874496 | 9028 / 10021 |
| workReset | 501.5 | 502.3 | TRANSPORT_ERROR | 0 | 33218560 / 33144832 | 10191 / 10579 |
| workTimeout | 2100.1 | 2100.8 | TIMEOUT | 0 | unavailable / unavailable | unavailable / unavailable |
| workInvalidBody | 501.8 | 502.7 | HTTP 200, invalid body | 0 | 32702464 / 32653312 | 10435 / 11535 |

**Result:** All 12 runs had `operationalPass=false` by design; healthy synthetic results cannot bypass unapproved owner pin or resource budget. Blocked work proves a late HTTP 200 cannot mask liveness failure. Timeout child metrics are unavailable because the child never emitted `workComplete`; missing values are NOT zero usage. These two runs per scenario are an initial observation, not an approved threshold or production-representative performance baseline.

**GUARD remaining:** independent reviewer signoff; externally protected owner pin; immutable staging and ancestor race hardening; OS-enforced RSS/CPU quotas and reliable timeout-path measurements; workload-specific approved budgets; separate operational T2 authorization. Keep C4 offline synthetic-only and ALPS 4.18 NOT PASS.
