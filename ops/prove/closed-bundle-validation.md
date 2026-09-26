# C3 Layer-A closed-bundle synthetic hardening — unapproved PoC

This isolated BUILD branch adds one contained fix to the **existing** synthetic integrity checker. It does not implement C3 v0.2 assertion semantics, grant a trusted VERIFIED writer, or approve the pending T2 Architecture Lock. ALPS 4.18 is irrelevant to this synthetic work.

## Bug addressed

The original Layer-A checker verified only manifest-declared files. It accepted a fixture when the directory also contained additional untrusted files. A successful digest of a **subset** cannot establish a complete evidence-bundle identity.

The revised checker recursively enumerates regular files, includes hidden files, limits directory depth/count, rejects symlink and special-file nodes, compares all observed evidence paths against the exact declared set and requires every declared path to exist. If the manifest is inside the staging root, it excludes **only the precise canonical manifest path**. A symlink root is rejected. Existing error categories for missing declared evidence and declared symlinks are retained.

## Source-bound offline local run

Environment: Node.js v22.16.0; no CI runs and no production endpoints.

```bash
node --test ops/tests/prove-fixture.test.mjs ops/tests/local-harness.test.mjs
```

Local result: **22 passed, 0 failed** (original 17 tests, five new adversarial closed-bundle tests). The first candidate had two failures solely from changed legacy error-code strings; those codes were restored, then the full suite passed. The five added tests cover undeclared regular files, hidden files, symlink entries, nested extra files and symlink root.

Committed candidate file Git blob identities, independently comparable by `git hash-object`:
- `ops/checks/prove-fixture.mjs`: `9219de84e399779dca58dda7b0dfafa2fbaf1b78`; raw SHA-256 `c7a546d245a067f4918b1017dedb195be2650030e5ab00f6368b08f6c9e77d45`.
- `ops/tests/prove-fixture.test.mjs`: `2898affe3ef7058607b3e1c5591fdf4d6a28c1fc`; raw SHA-256 `ab78a6677e4193e442c715eb6a85b2335aaa2bd90e41adf5fcd118871e180c14`.

**Scope limitations:** the current checker still returns OBSERVED only for matching bytes and does not evaluate propositions. Shared mutable-filesystem races are not fully eliminated; separate private staging, an immutable independent manifest/source pin and stronger descriptor-based isolation remain requirements before any trusted use. No CI, deploy, network, cloud expense or self-authority was added.

## Next PROVE gate

A separate PROVE review must re-fetch this exact branch commit, execute the 22 tests independently, reproduce the undeclared-file rejection and check that the checker remains incapable of writing ledger verdicts. Founder GO for the bounded v0.2 assertion architecture is still pending.
