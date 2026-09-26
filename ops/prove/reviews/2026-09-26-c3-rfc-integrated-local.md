# C3 local integrated source-bound rerun — 2026-09-26

Scope: founder T2 local-only; no CI, production, founder key, protected ledger, merge, or paid resource.

- Node.js: v22.16.0.
- Exact tested verifier Git blob: `29f86f777bfd17c1a94a10f585710d66d0fc09ff`, matching `ops/prove/owner-pin-local.mjs` on the company branch after commit `712dcb1104a9abd6986a51afdc907a4cbbe9056b`.
- Fresh local workspace combined the existing integrated synthetic test suite and four published-RFC-8785-oriented local tests.
- Local test command: `node --test *.test.mjs`.
- Result: **55 tests passed, 0 failed**.
- The verifier file was byte-identical to GitHub by Git blob SHA. The local test files and local raw JSON preflight were functionally similar but **not all byte-identical to their GitHub counterparts**. This is NOT an exact-all-files repository test or separate organizational PROVE signoff.

Remaining blockers: exact-source rerun of all committed test/preflight files; independent immutable snapshot provenance; external founder public-key fingerprint pin; protected one-shot replay registry; independent RFC 8785 interoperability review; protected VERIFIED writer. A synthetic success still returns `OBSERVED`, not `VERIFIED`.
