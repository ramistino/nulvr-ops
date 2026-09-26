# C4 offline localhost PoC — source-bound local checkpoint

Mode: synthetic-only OBSERVED; not VERIFIED and not activated. ALPS Phase 4.18 does not block company PoC development.

Run: `node --test ops/tests/prove-fixture.test.mjs ops/tests/local-harness.test.mjs`
Run: `node ops/load-tests/local-harness.mjs /path/to/local-config.json`

Config requires schema nulvr.load-local.v0; scenario responsive or blocked; bounded workMs, probeEveryMs, probeTimeoutMs and maxDurationMs; 40-hex pinnedCommit; local fixturePath; independently preapproved raw-byte fixtureSha256.

A child Node server binds to 127.0.0.1 on a random local port. The parent requests /live independently while /work runs. Both work modes eventually return HTTP 200; only the bounded synchronous stall produces liveness timeouts. The watchdog reports timeout failures separately from p95 for successful probes, plus measured child event-loop lag, CPU, RSS, peak RSS and raw fixture/config/tool/output hashes. All outputs remain OBSERVED and unsigned.

Measured locally on Node v22.16.0: three repeated invocations, each 17/17 passes (12 C3 tests plus 5 new C4 tests). Precommit Git blob SHA-1s match the exact tested source files. Earlier development runs failed from missing child IPC configuration and a histogram sampling race; both were fixed before staging.

Containment: Node stdlib, loopback only, 96 MiB child old-space cap, bounded synthetic work, parent watchdog and kill fallback; no CI, cloud resources, billed runners, live ALPS, production probes, protected-ledger writes or release authority.

Outstanding: independent PROVE re-run from exact committed SHA, adversarial restart and multi-cycle RSS tests, measured engineering budgets, written founder T2 Architecture Lock, and explicit separate approval before any remote adapter. This PoC cannot be used to approve a production release.
