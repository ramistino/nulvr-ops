# C4 Architecture Lock candidate v0.1 — offline load-harness hardening

**Gate:** T2 founder GO is **PENDING**. Company-owned reusable load-test capability, independent of ALPS 4.18. This lock would authorize only hardening the existing **localhost synthetic PoC**, not operational deployment or production traffic.

**Pinned design baseline:** `6d3178711dadf84d777be28b34f1c0d198a9bc56`. **Independent source-review input:** [PROVE/GUARD C4 review](https://github.com/ramistino/nulvr-ops/blob/9d3ea435faf1fb15a16383ca0ef36eb8d76e42fd/ops/load-tests/reviews/2026-09-26-c4-source.md).

## In scope upon founder GO

1. Replace both pre-check whole-file reads with bounded no-follow descriptor reads: raw config <= 4 KiB; fixture <= 64 KiB. Fail closed on oversized, symlink, changed inode/size/mtime and JSON/config/schema errors. Read at most `limit + 1` actual bytes. Keep fixture within a caller-approved private local fixture root; a self-reported hash does not authenticate owner approval.
2. Preserve **loopback-only** target binding, bounded local synthetic work (200–1500 ms), independent watchdog and parent hard-stop. Explicitly classify probe results as `HTTP_200`, `HTTP_NON_200`, `TIMEOUT`, or `TRANSPORT_ERROR`. Any non-200 condition is a liveness failure; successful-probe percentiles remain separate from failed probe counts.
3. Freeze fixture semantics: in this iteration fixture SHA is a **provenance marker**, not an input consumed by the synthetic work function. A later fixture-driven load adapter is a separate design review and workload-specific budget.
4. Keep exactly one parent/child loopback pair per invocation. No remote HTTP adapter, production endpoints, external data ingestion, Docker/cloud provisioning, GitHub Actions changes or protected-ledger writes.
5. Record separately: config raw-byte digest, independently approved fixture digest/reference, pinned source-build claim, source tool digest, local-only run recipe and outcome digest. Self-reported hashes are OBSERVATIONS until independently checked by PROVE.
6. Preserve parent deadline and SIGKILL fallback; report RSS/heap/event-loop/CPU observations. V8 `--max-old-space-size=96` is **not** an OS RSS/CPU cap. The local fixture-only pilot stays inside the existing <= 6 s config range; enforce stronger OS-level resource isolation before any operational workload.

## Engineering budget status

| Resource | Current PoC bound or measurement | Status / approval |
|---|---|---|
| Config input | <= 4 KiB, bounded-read change required | PROVISIONAL (design limit) |
| Fixture input | <= 64 KiB, private local root required | PROVISIONAL (design limit) |
| Synthetic CPU stall | 200–1500 ms per invocation | PROVISIONAL, not an ALPS service limit |
| Parent total deadline | 2500–6000 ms configured | PROVISIONAL containment only |
| V8 old-space | 96 MiB child cap | OBSERVED source flag, not RSS quota |
| Memory/RSS/CPU pass thresholds | Not derived; collect two repeated baseline profiles | UNMEASURED |
| Probe p50/p95/p99 and failures | p95 successes + timeout count implemented; classifications and p50/p99 pending | PARTIAL |
| New paid infrastructure | 0 USD / 0 additional AED | HARD CONSTRAINT |

Do not represent any provisional budget as measured or approved ALPS performance. Derive workload-specific steady/peak thresholds only after an instrumented local Spike and founder decision.

## Adversarial preflight and kill conditions

- Prove a late `/work` HTTP 200 **cannot** mask watchdog failure.
- Use independent negative tests for 4097-byte config, 65537-byte fixture, fixture symlink and path outside private root, wrong fixture digest, changed source claim, closed child socket, non-200 liveness reply and unresponsive child cleanup.
- Run responsive and blocked scenarios at least twice; retain complete machine-readable output and raw digest. Report nondeterministic timing ranges, not fabricated exact thresholds.
- Reject unauthorized URL, network import, production target, fixture-driven claims without fixture use, protected-ledger write, new paid resource and missed process deadline.
- If any synthetic case creates uncontrolled CPU/RSS growth, persists an orphan process, or misclassifies a transport failure as a healthy liveness sample: STOP, retain evidence and revert candidate.

## Gates

**Current stage:** design + existing offline synthetic PoC; prior source-bound PROVE test record includes five C4 tests in a 42/42 combined run. Independent C4-specific review identified material gaps. The PoC must not be represented as an operationally approved load facility.

**Approval requested:** founder T2 GO for the small bounded hardening listed above. After code change, PROVE independently re-fetches the exact Git commit, re-runs adversarial tests and reviews the private-file/timeout/error boundaries. GUARD checks that no network, paid CI, deployment or external production target was introduced. A separate explicit GO will be required for operational/remote adapters, OS-enforced resource quotas and ALPS integration.
