# PROVE review — C3 v0.2a exact-source synthetic implementation

**Reviewed implementation commit:** `6d3178711dadf84d777be28b34f1c0d198a9bc56`.  
**Review mode:** source-bound re-fetch and fresh isolated local rerun. This is a technical PROVE review, **not a separately credentialed or automated trusted-verdict service**, and does not issue `VERIFIED` into any ledger.

## Primary sources re-fetched from GitHub

- `ops/checks/prove-fixture.mjs`: `272e38e40dd5b33446a33cd37c4143b73d78be18`
- `ops/checks/assertions-v02a.mjs`: `ecd2f3144c6da348081ef87904b751a98d70f3cb`
- `ops/tests/prove-fixture.test.mjs`: `2898affe3ef7058607b3e1c5591fdf4d6a28c1fc`
- `ops/tests/assertions-v02a.test.mjs`: `ca76b8f558f932539ec4e39540fafd92362ba11f`
- `ops/tests/local-harness.test.mjs`: `20e4c28b1c8c3932f2af70140ef1636b44d3baaf`
- `ops/load-tests/local-harness.mjs`: `36abf7f5aca442da6149a1b2bee94430fea08b72`
- `ops/load-tests/local-target.mjs`: `9d93e485e449ffccfbc262d5abf65aca55d08c24`

All seven isolated-workspace local copies matched the exact Git blob SHAs returned by GitHub on that implementation commit. The GitHub connector supplied source identity; the runtime had no DNS route to GitHub and used matching locally staged bytes. The test directory contained only these sources and execution output.

## Re-execution

Runtime: Node v22.16.0. Command:

```bash
node --test ops/tests/prove-fixture.test.mjs ops/tests/assertions-v02a.test.mjs ops/tests/local-harness.test.mjs
```

**Result: 42 passed, 0 failed, 0 skipped**, 1,443 ms. Local raw test-log SHA-256: `c05fa369b631f49aef2af159049655e854df0a99fa126eaea5d55e72c4f3cce5`. The log is a local execution artifact, not a hosted CI artifact or a separately protected approval record.

The test set includes 17 Layer-A integrity/closed-bundle cases, 20 bounded Layer-B assertion cases and 5 local synthetic liveness/watchdog cases. False propositions yield `ASSERTION_FAIL` and nonzero exit, even when pinned file bytes pass integrity; unauthorized `json_pointer_matches` is rejected; changed assertions with a stale raw manifest pin are rejected.

## Code review / scope boundary

- Source imports only Node built-ins `node:crypto`, `node:fs` and `node:path` in checker/evaluator; no fetch/HTTP, protected-ledger writer, subprocess spawn, external deployment, merge or billing action.
- No checker output path emits the protected status `VERIFIED`. Layer-A v0 remains OBSERVED. Layer-B v0.2a returns ASSERTION_PASS/ASSERTION_FAIL for local pre-pinned fixtures only.
- Assertions are included in the pinned manifest and evaluated only after bounded read, full bundle enumeration, size/hash/JSON validation and pinned source-commit equality.
- The no-follow file-descriptor check and before/after stat reduce some local races, but **mutable ancestor directories and enumeration-to-open TOCTOU are not a hardened hostile-filesystem boundary**.
- The synthetic tests supply the manifest SHA alongside the fixture; this recheck **does not prove independent owner approval of the pin**. Protected-anchor attestation and immutable evidence identity remain separate gates for any trusted verdict writer.

## Scope-limited result

**C3 synthetic v0.2a implementation: LOCAL SOURCE-BOUND TESTS PASS, eligible for offline synthetic use under the recorded Founder GO.**  
**Trusted PROVE service, protected VERIFIED writer, CI/main merge, production/ALPS qualification and Orchestrator: NOT AUTHORIZED / NOT PASS.**

This is not permission to open an Actions-triggering PR or consume additional paid runner minutes while NULVR OPS CI still shows a zero-job startup failure.
