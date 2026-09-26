# C3 independent trust-root provisioning gate (not activated)

The local replay registry prototype is **not** a protected company registry. Its atomic reservation depends on a single trusted local filesystem, a directory independently provisioned outside the Git checkout with mode 0700, an operator-controlled identity, and durable fsync support. NFS, shared mounts, symlinked or attacker-writable ancestors, backups/restores and concurrent hosts require separate evaluation. A failed fsync leaves the reservation in place and returns UNVERIFIABLE; do not automatically delete or retry under a new ID.

## Founder-controlled trust source

The next positive authentication implementation requires all of the following before a protected receipt can exist:

1. Founder independently verifies and approves an Ed25519 public-key SPKI SHA-256 fingerprint out of band. No agent creates or claims a founder key.
2. The pinned fingerprint is installed by the founder in an access-controlled location outside the source checkout and outside BUILD/PROVE control, with an audited ownership/permissions boundary.
3. Evidence is fetched by immutable commit/tree identity through an independently controlled read-only acquisition path; file hashes are calculated from acquired bytes, not a caller-supplied `actual` object.
4. The trust-source module reads those protected bytes directly, checks file and ancestor ownership, rejects symlinks and replacement races, and issues a non-forgeable in-process result. A boolean receipt supplied as an API argument must never count.
5. A protected single-writer ledger binds the signed verification ID to the immutable snapshot and stores the replay decision transactionally before any future VERIFIED result. Crash/recovery, backups and multi-host semantics need adversarial testing.

**Current gate:** `trust-source-contract.mjs` deliberately has no positive authentication path. The replay prototype is isolated and returns `RESERVED_LOCAL_ONLY`, never `VERIFIED`. Neither module is wired to production or a protected ledger. This is not a request to provision secrets, paid infrastructure, CI, merge or deploy.
