# C3 owner-pin v0.1a — reviewed design boundary and protocol errata

**DESIGN ONLY. NO OWNER APPROVAL OR SIGNATURE CREATED.** Versioned schema: `ops/prove/owner-pin-design-v0.1a.schema.json`, source Git blob `6874400d2f8576db4d91d110c87dbdb2a0f5f5d9`. Fresh independent [PROVE review](https://github.com/ramistino/nulvr-ops/blob/76f77d56e6750e31f906363fd1831bd245ff1277/ops/prove/reviews/2026-09-26-owner-pin-v01a.md) reconstructed and byte-matched this exact blob and ran **19/19 Draft 2020-12 structural cases**.

Normative clarification to the v0.1a design note: **v0.1a signatures, if separately approved in the future, must use their own domain-separated prefix `NULVR:OWNER-PIN:V0.1A\n` rather than reusing v0.1.** The authorized founder public key must be pinned independently and protected from BUILD and PROVE. A signature over an owner-pinned canonical payload must never be inferred from JSON validity or a mutable GitHub branch.

Do not treat the unmodified v0.1 placeholder example as a v0.1a approval. The isolated structural tests used a locally constructed mock with the v0.1a schemaVersion and fake public-key/evidence digests. There is **no real signing key, signature, approved record, owner-only protected anchor or replay registry** here.

C3 remains synthetic-only. The active GitHub main ruleset requires one approval but does not enforce a founder-only signer; GUARD must verify an actual no-new-cost owner-controlled signature/public-key and record-publishing model before a separate T2 GO for any implementation. Do not add a protected VERIFIED writer, CI/PR run, deployment or production access under this design-only checkpoint.
