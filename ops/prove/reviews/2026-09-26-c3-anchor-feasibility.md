# GUARD — C3 protected-owner-pin anchor feasibility (read-only)

**Observed 2026-09-26** from the live GitHub repository API, not inferred from a policy document. Company source at review: `07d6c5b41e3ddd98672e53fcf20484d5e3242180`. The current C3 design candidate is `ops/prove/trust-boundary-v0.1.md`.

## Verified existing controls

The repository's active default-branch ruleset is [Protect main, ID 23890010](https://github.com/ramistino/nulvr-ops/rules/23890010). Its live GET response establishes:
- enforcement `active` on `~DEFAULT_BRANCH` (main);
- deletion and non-fast-forward changes forbidden on main;
- PR required, at least **one approving review**, dismissal of stale reviews on new pushes, last-push approval and thread resolution;
- no configured bypass actors; current connected app reports `current_user_can_bypass:never`.

The repository currently exposes `private:false` through the GitHub repository API. The existing rule does **not** establish trusted secrecy for proprietary ALPS evidence.

## Material gaps: do not declare an owner-only immutable approval anchor yet

1. `required_reviewers:[]` and `require_code_owner_review:false`. One unspecified reviewer is not proof the **founder/authorized owner** approved the specific pin. The rule does not require signed commits/approval records. Repository branch protection does not independently authenticate a separate approval signature.
2. Protection is for the default **branch**, not arbitrary company/review branches or Git tags. A blob in a work branch or a movable tag cannot be treated as a protected owner pin.
3. Git object IDs provide content addressing, not proof of who approved those bytes. If an evidence object is unavailable after garbage collection or repository access is revoked, the checker must return `UNVERIFIABLE`. Bind raw SHA-256 as well as object identity.
4. The existing main PR path currently has a zero-job `startup_failure` on PR #7; creating an approval PR or requiring new CI may trigger unresolved runner/billing behavior. Do not create that PR or configure paid workflows to test this option.
5. Branch-protection detail returned integration HTTP 403; the independent **ruleset detail** above was accessible and is the actual verified basis. Do not infer additional branch-protection or organization policies from the forbidden endpoint.

## Bounded, zero-new-service candidate (not activated)

An owner-signed **raw approval record** plus immutable Git object identity, recorded through protected main after its PR/CI gate is repaired, could avoid a new approval platform. The signature must be verified against an independently pinned founder public key, with private key always outside BUILD/PROVE/connected-app credentials. Owner-approved records should explicitly bind exact source commit, checker SHA256, raw manifest SHA256, immutable evidence Git tree/blob IDs and per-file SHA256s, policy version, verification ID and expiry. Enforce an exact owner signer or an owner-only approval policy in addition to the existing one-review main ruleset.

This candidate is **conditional** until GUARD verifies real owner-signature/key custody, strict record-publishing authority, evidence-object availability and zero additional runner/cloud costs. Public `nulvr-ops` must receive only nonsecret approval metadata; do not copy private ALPS raw evidence into it.

## Disposition and next gate

**Current verdict: PROTECTED ANCHOR NOT ESTABLISHED.** Keep C3 synthetic-only; no trusted VERIFIED writer or live approval record. Stage only an offline JSON approval schema/threat model until a separately approved T2 implementation and founder signing action. If no no-cost mechanism satisfies owner-only independent pinning, return `UNVERIFIABLE` rather than promoting BUILD-controlled data.

No settings changed, no PR/CI run, no tag created, no merge/deploy/paid resource and no production evidence accessed in this review.
