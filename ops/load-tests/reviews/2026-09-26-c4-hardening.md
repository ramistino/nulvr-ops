# PROVE/GUARD C4 — independent source-bound localhost review

**Date:** 2026-09-26. **Reviewed company commit:** `182174a243f1730ef124f22b1c3e01481d3288ff`. Separate review branch; no main merge, GitHub Actions run, paid resource, ALPS probe or production deployment.

## Exact source identities re-fetched from GitHub

- Hardened localhost runner `ops/load-tests/local-harness.mjs`: `5ae20aad76243799ff76f6893f22aa792a6be713`
- Unchanged localhost target `ops/load-tests/local-target.mjs`: `9d93e485e449ffccfbc262d5abf65aca55d08c24`
- Expanded local tests `ops/tests/local-harness.test.mjs`: `45c97258eaabd90dff63365898aad4439e452707`
- Existing C3 synthetic checker/evaluator: `272e38e40dd5b33446a33cd37c4143b73d78be18`, `ecd2f3144c6da348081ef87904b751a98d70f3cb`
- Existing C3 synthetic tests: `2898affe3ef7058607b3e1c5591fdf4d6a28c1fc`, `ca76b8f558f932539ec4e39540fafd92362ba11f`

All **seven** files in a fresh isolated review directory matched their independently re-fetched GitHub blob hashes via `git hash-object`. Runtime: Node v22.16.0.

## Fresh technical PROVE execution

`node --test ops/tests/*.test.mjs` on the exact source-bound isolated copies: **50 passed / 0 failed / 0 skipped**, approximately 1.44 s. Raw test-log SHA-256: `87ecbe7768f31a2f8765c1c787f37e78a65e69bb10ba737a9c13a6bc4a1bf95b`.

Additional independent **live loopback-only fault injection** used the committed reproduction script `prove-c4-injection.mjs` (Git blob `ccc2cb93542ded921a44306c4fb28cef1a0dd0d5`; raw SHA-256 `0e0df15a0bafc460ce6a6032d5e1c59b23ce861708c9a999ed3e16192c001868`), four real local HTTP fetches: HTTP 200, HTTP 503, deliberately reset connection, and delayed HTTP 200 beyond the 80ms timeout. The classification and aggregate checks passed: one success, one non-200, one transport error and one timeout. Raw log SHA-256: `cb21fc64568cc98fed8e4caf02bf81a472820e413b208021630160c95192b36d`. All sockets bound to 127.0.0.1.

## GUARD static boundaries

- The runner's only subprocess is the source-pinned `local-target.mjs`; it constructs only `http://127.0.0.1:<child port>`. The target's `node:http` server binds exclusively to `127.0.0.1` on an ephemeral port. No user-provided external HTTP target or remote adapter exists.
- Config/fixture are descriptor-read from a canonical locally owned, private staging directory; 4 KiB / 64 KiB bounds apply to **actual bytes**, not just pre-read stat. Symlinked config/fixture, out-of-root fixture and shared staging directory are refused in offline negative tests.
- Failed liveness samples are separated as TIMEOUT, TRANSPORT_ERROR and HTTP_NON_200, outside successful-only p50/p95/p99.
- Fixture SHA is explicitly a provenance marker (`fixtureUsedAsWorkload:false`), not a workload replay or an independently approved pin.
- The source contains no protected ledger VERIFIED writer, production ALPS request, cloud deployment, billing or orchestration authority.

## Remaining limits and gate disposition

**TECHNICAL PROVE: PASS for C4's founder-scoped, offline localhost hardening.** This is not a credentialed automated trusted PROVE service and does not attest owner-pin provenance.

**Operational reusable load-testing facility: NOT APPROVED / NOT ACTIVATED** until a separate owner decision and further containment: immutable independently approved recipe/fixture pin, hardened ancestor-directory race boundary, OS-enforced RSS/CPU quotas, deterministic workload tied to fixture (if replay claimed), measured workload-specific baselines and acceptance of more failure modes. The existing local smoke is limited to one synthetic parent-child pair and a <= 6s configured window.

No C4 check proves ALPS 4.18 has passed; ALPS remains research-only with an independent release gate. No PR or CI action was triggered in this review.
