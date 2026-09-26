# C4 telemetry patch — fresh technical qualification (2026-09-26)

**Scope:** source-bound local-only technical rerun on Node v22.16.0, same assistant/session. No independent organizational PROVE signoff, production activation, CI, merge, deploy, or paid infrastructure.

Exact Git blobs: `local-harness.mjs` `450ebeb5d99473ae9f60f3ae6ee30643e09f1af7`; `local-target.mjs` `75cd8361d7d7ffc1b961a9107d94c9a7b2ac41aa`; `local-harness.test.mjs` `15b1897a84f99eb309e001142efd43f125d9706d`.

Fresh complete suite: **18 passed, 0 failed, 0 skipped**. Local test log SHA-256: `1745f6961b40ab64a10b6b1a1c78e0f50c66271fe262052472583ab390da0495`.

Fresh three-scenario manual profile (one run each), local JSONL SHA-256 `16b9506476afff18281c37f8621efdc8e07095d69d4426ce33fd8279d10a4550`:

| Scenario | Work | Watchdog failures | Measurement source | Child RSS bytes | CPU μs |
|---|---|---:|---|---:|---:|
| responsive | HTTP 200 valid, 502.1 ms | 0/9 | WORK_COMPLETE | 32,755,712 final | 12,630 final |
| workTimeout | TIMEOUT, 2100.7 ms | 0/38 | PERIODIC_SAMPLE_NOT_FINAL | 33,083,392 sampled | 156,914 sampled |
| blocked | HTTP 200 valid, 502.1 ms | 3/4 | WORK_COMPLETE | 39,366,656 final | 510,356 final |

All three runs report `operationalPass=false`. The timeout sample age at report was 1.6 ms, **not** an end-of-work measurement. Event-loop stalls can delay periodic samples; abrupt child death can yield no sample. The V8 96 MiB old-space flag is **not** an OS RSS or CPU quota.

**Disposition:** source-bound technical rerun PASS and timeout telemetry observation PASS; independent reviewer signoff remains pending. GUARD must still qualify protected owner pin, immutable staging and ancestor race resistance, OS-enforced resource quotas, approved workload budgets, and separate operational T2 authorization. ALPS Phase 4.18 remains NOT PASS.
