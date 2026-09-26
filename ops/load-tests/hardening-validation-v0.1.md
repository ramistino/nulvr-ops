# C4 offline hardening — source-bound BUILD checkpoint

**Scope:** branch-only synthetic PoC, following C4 v0.1 limited implementation authorization. This is not a trusted reusable operational load-testing facility.

## Source identity

- Existing target `ops/load-tests/local-target.mjs` unchanged, Git blob `9d93e485e449ffccfbc262d5abf65aca55d08c24`.
- Hardened `ops/load-tests/local-harness.mjs` Git blob `5ae20aad76243799ff76f6893f22aa792a6be713`; raw SHA-256 `1cbfdd25bc6ff69dc3312edcd30065cf5566292038870cbcfe51580759506e2f`.
- Expanded `ops/tests/local-harness.test.mjs` Git blob `45c97258eaabd90dff63365898aad4439e452707`; raw SHA-256 `11186ac83344e99b40ef0a811347b9dc9c2fc2c6f64ac77ef52c715f7b2ac06a`.

The changed files were produced and exercised locally on Node v22.16.0; `git hash-object` of both local files matches the staged GitHub blob hashes. The unchanged C3 test/checker and C4 target files retain the previously source-bound blobs.

## Changes implemented

1. Config and fixture are read through no-follow file descriptors, with a real `limit+1` byte ceiling (4 KiB/64 KiB) and before/after inode/device/size/mtime checks, rather than whole-file reads preceding size checks.
2. Config and fixture must reside directly in one canonical, locally owned, private (`0700`-equivalent) staging root. Symlinked files or roots, shared roots and fixture paths outside that directory are rejected before child startup.
3. Watchdog failures are separated into `TIMEOUT`, `TRANSPORT_ERROR` and `HTTP_NON_200`. Every category fails liveness; successful-sample p50/p95/p99 remain separate. `fixtureUsedAsWorkload:false` explicitly avoids claiming fixture replay.
4. Existing loopback-only child and bounded synthetic work retain the same parameters. No endpoint supplied by the user can be used as a target.

## Actual local test record

`node --test ops/tests/*.test.mjs` was run **twice** on Node v22.16.0 in an offline workspace:

- Run 1: **50 passed, 0 failed**, ~1.47s, raw local log SHA-256 `43c70141a77ac8d5d9337cf8f0c1e38be97d6b96c55363c3a15fc999559530e3`.
- Run 2: **50 passed, 0 failed**, ~1.46s, raw local log SHA-256 `ed74cefdf76803f04203a06512fece93d7e2f87451b9b11ff501c48c8936916e`.
- 42 original synthetic tests plus eight additional local-hardening tests. Added tests cover oversized config and fixture, symlinked config and fixture, fixture outside private root, shared root, separate timeout/transport classification, and non-200 aggregate accounting.

**Limits:** network transport classification and HTTP-503 accounting were tested as isolated pure-function inputs, not an end-to-end injected failed child socket. Workload-specific measured performance budgets, strong ancestor-directory containment, real fixture-driven replay and OS RSS/CPU quotas remain unimplemented and unapproved.

**Next gate:** independently re-fetch this exact company branch commit and re-run the committed files in a fresh PROVE workspace; inspect static no-network/no-verdict behavior. No CI run, PR, main merge, production probe, deployment, or paid resource was created.
