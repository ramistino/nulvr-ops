# C3 replay registry exact-source verification

Date: 2026-09-26. Scope: T2 local-only synthetic replay registry; no trusted activation.

Source on `ops/company-track-v1`:
- `ops/prove/local-replay-registry.mjs` Git blob `102c074460152c3a3db3a8008d7f47f36db43a2f`
- `ops/prove/local-replay-registry.test.mjs` Git blob `59545c43aae00ea4d5262f70f0b31aa367ee148f`

Both reconstructed local files were checked with `git hash-object` against the GitHub-fetched blob IDs. On Node.js v22.16.0, `node --test *.test.mjs`: **15 tests, 15 pass, 0 fail, 0 skipped**. Coverage includes duplicate and parallel reservations, eight independent processes, private file permissions, symlink and writable-ancestor rejection, and post-create directory identity verification.

This is source-bound local test evidence only. `O_EXCL` gives one winner on the tested local filesystem, but the pathname-based checks remain susceptible to adversarial TOCTOU replacement; `openat`/directory-handle semantics or a protected transactional store remain prerequisites for production. The trust source is not independently authenticated, no protected founder pin or protected VERIFIED writer exists, and the local registry returns `RESERVED_LOCAL_ONLY`, never `VERIFIED`. No CI, merge, deployment or paid infrastructure was used.
