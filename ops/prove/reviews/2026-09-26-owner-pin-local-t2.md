# C3 Owner Pin — fresh local source-bound review, 2026-09-26

Scope: founder-authorized T2 **local synthetic verifier only**. No founder key was generated or installed, no protected anchor or replay registry was created, and no trusted VERIFIED writer, CI run, deployment or paid resource was used.

## Reproduction

A fresh local workspace was extracted from the previous reviewed ZIP on Node v22.16.0. The original implementation and test files had exact Git blob identities `1d0c7de2d6e065d5a55030f1c7f515ea1dc16eba` and `21eea14995851d2af293aa5314462bb44c917238`, matching the staged GitHub branch. The original 20/20 tests passed.

Adversarial review identified a noncanonical Base64 alias: the low four unused bits in the 86th character of a 64-byte Ed25519 signature can be changed without changing decoded signature bytes. The previous verifier checked Base64 character shape and decoded length but did not reject such aliases. A local negative test constructed an alternate text encoding, asserted identical decoded bytes, and required rejection. The bounded fix requires `sig.toString('base64') === signatureBase64` after decoding.

## Exact patched source

- `ops/prove/owner-pin-local.mjs`: Git blob `0f995a62ee6d0e941afc1a0ef9fc016f38ef6ca2`.
- `ops/prove/owner-pin-local.test.mjs`: Git blob `63d7d4f6b3b2ad72b9b4daa1d958b352a2e1e0d5`.
- Fresh local Node v22.16.0 run after the patch: **21/21 pass, 0 fail**. Exact local `git hash-object` outputs match both patched GitHub content blobs.

## Trust and scope boundaries

This is a fresh local adversarial check, **not a separate organizational PROVE approval**. Canonicalization still needs independent RFC 8785 interoperability vectors and duplicate-key JSON handling at the raw-input boundary before accepting arbitrary signed JSON. `actual` snapshot identities and `trustedKeyFingerprint` must be acquired independently and immutably, not supplied by the same untrusted caller. A verified Ed25519 signature cannot establish founder identity without that protected external key pin. One-shot replay prevention, protected VERIFIED writer and operational activation remain **NOT IMPLEMENTED / BLOCKED**. The verifier returns OBSERVED for a valid synthetic test, never VERIFIED.
