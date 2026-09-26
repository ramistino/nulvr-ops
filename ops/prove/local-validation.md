# C3 local test evidence — 2026-09-26

**Scope:** offline synthetic fixture checker; does not prove a trusted production verifier.

- Repository: `ramistino/nulvr-ops`; company branch `ops/company-track-v1`.
- Committed C3 checker Git blob: `ca35376cde818b12588af64ebe614a9c3cc01a1b`.
- Committed C3 test Git blob: `2cb5fd5fe6aa8f68e667b5c63ee2f0fc0d4eabfb`.
- Local copies were compared against both exact Git blob hashes using `git hash-object` before running.
- Runtime: Node.js v22.16.0.
- Command: `node --test ops/tests/prove-fixture.test.mjs`.
- Result: **12 passed, 0 failed**, duration approximately **552 ms**.
- Covered: matching synthetic evidence returns only OBSERVED; missing independent pin, tampered manifest, wrong commit, altered evidence, missing evidence, malformed JSON, path traversal, symlink, oversize, unavailable root and duplicate path all fail closed.
- The checker never uses the protected ledger writer, does not issue a production VERIFIED judgment and has no external network/deployment actions.

**Independent acceptance still required:** a different PROVE session must re-fetch the committed SHA and test independently, inspect filesystem TOCTOU/race conditions and confirm a separately protected anchor. The T2 Architecture Lock is not approved. No GitHub CI was triggered by this local run.
