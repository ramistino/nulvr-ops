# C3 integrated exact-source local verification — 2026-09-26

**Scope:** T2 local-only synthetic Owner Pin. No production authority, founder private key, CI, paid infrastructure, protected ledger write, merge, or deployment.

Nine source/test files were assembled in an isolated local directory. All nine local Git blob SHA-1 values matched the files fetched from `ops/company-track-v1`:

| File | Git blob SHA |
| --- | --- |
| `owner-pin-local.mjs` | `29f86f777bfd17c1a94a10f585710d66d0fc09ff` |
| `owner-pin-local.test.mjs` | `708905254b388fdb8910ded48e5bcbfcc22f2326` |
| `raw-json-preflight.mjs` | `99750820f3de09f2d8cc7e702461aed1cf336fe7` |
| `raw-json-preflight.test.mjs` | `ab61c916a19753b684a9dc3a511911cfac28a549` |
| `rfc8785-reference.test.mjs` | `daeab807b0c7c1ad19d4ce4ef3e3e808172be277` |
| `offline-trust-rehearsal.mjs` | `aa199091f137f8666f4d377b325f3203017004e3` |
| `offline-trust-rehearsal.test.mjs` | `cac29e0b4d2f0e839cda87bc40c23ef1cc53a609` |
| `offline-owner-pin-integration.mjs` | `d2a795f19f4e88d52c863be43248498b23e7aa41` |
| `offline-owner-pin-integration.test.mjs` | `451f2dc7fb4c6408998f976378e7734177789a32` |

Node v22.16.0, command `node --test *.test.mjs`: **72 tests, 72 pass, 0 fail**. No GitHub Actions was invoked.

**Limits:** This is local source-bound test evidence, not independent organizational PROVE. The `origin: INDEPENDENT_OFFLINE_READONLY` and `verifiedSource` fields are labels supplied by callers; neither proves protected provenance. `actual` digests remain externally supplied and are not derived by this integration from an independently acquired immutable Git snapshot. `seenIds` is a caller-supplied array; no atomic durable replay registry exists. These conditions prevent trusted activation. All successful paths return `OBSERVED`, never `VERIFIED`, with `ledgerWrite:false` and `releaseAuthority:false`.
