# C3 exact-source local test record — 2026-09-26

**Scope:** founder-authorized T2 local synthetic Owner Pin only. No CI, merge, deployment, protected ledger write, founder key creation or paid resource.

Five source files were fetched from `ops/company-track-v1` and reconstructed in a fresh local test directory. Each file's local Git blob SHA matched its fetched GitHub blob SHA exactly:

| File | Git blob SHA |
| --- | --- |
| `ops/prove/owner-pin-local.mjs` | `29f86f777bfd17c1a94a10f585710d66d0fc09ff` |
| `ops/prove/owner-pin-local.test.mjs` | `708905254b388fdb8910ded48e5bcbfcc22f2326` |
| `ops/prove/raw-json-preflight.mjs` | `99750820f3de09f2d8cc7e702461aed1cf336fe7` |
| `ops/prove/raw-json-preflight.test.mjs` | `ab61c916a19753b684a9dc3a511911cfac28a549` |
| `ops/prove/rfc8785-reference.test.mjs` | `daeab807b0c7c1ad19d4ce4ef3e3e808172be277` |

Command: `node --test *.test.mjs` on Node v22.16.0. Result: **55 tests, 55 pass, 0 fail**. The RFC 8785 expected-key test was corrected in commit `9f0bea21e8e336e7e559acefd651dd343f0c0fa5`; the canonicalizer was unchanged by that correction.

**Meaning:** source-bound local tests PASS, not independent organizational PROVE and not complete RFC 8785 conformance certification. The `trustedKeyFingerprint` and `actual` snapshot fields remain externally supplied and must be independently anchored. Protected founder identity, immutable evidence acquisition, one-shot replay registry, protected VERIFIED writer and production activation are absent. Successful synthetic verification returns OBSERVED only.
