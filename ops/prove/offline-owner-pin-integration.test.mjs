import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {canonical,domainPrefix} from './owner-pin-local.mjs';
import {verifyOfflineOwnerPin,verifySyntheticOwnerPinFixture} from './offline-owner-pin-integration.mjs';
const h=b=>createHash('sha256').update(b).digest('hex');
const {publicKey,privateKey}=generateKeyPairSync('ed25519'); // ephemeral synthetic key, not founder key
const publicKeyPem=publicKey.export({type:'spki',format:'pem'});
const keySha256=h(publicKey.export({type:'spki',format:'der'}));
const payload={schemaVersion:'nulvr.owner-pin-design.v0.1a',verificationId:'12345678-1234-4234-8234-123456789abc',approvedScope:'SYNTHETIC_OFFLINE_ONLY',source:{repository:'example/synthetic',commit:'a'.repeat(40)},checkerFiles:[{path:'ops/checks/prove-fixture.mjs',rawSha256:'b'.repeat(64)},{path:'ops/checks/assertions-v02a.mjs',rawSha256:'c'.repeat(64)}],manifestPath:'manifest.json',manifestSha256:'d'.repeat(64),evidence:{provider:'GITHUB_GIT_TREE',repository:'example/evidence',commit:'e'.repeat(40),treeSha:'f'.repeat(40)},assertionPolicy:'C3_SYNTHETIC_V0_2A',approvedAt:'2026-09-26T00:00:00Z',expiresAt:'2026-09-27T00:00:00Z',signerKeySha256:keySha256};
const rawPayloadJson=JSON.stringify(payload);
const signatureBase64=sign(null,Buffer.concat([domainPrefix,Buffer.from(canonical(payload))]),privateKey).toString('base64');
const actual={sourceRepository:payload.source.repository,sourceCommit:payload.source.commit,checkerSha256:payload.checkerFiles.map(f=>f.rawSha256),manifestSha256:payload.manifestSha256,evidenceRepository:payload.evidence.repository,evidenceCommit:payload.evidence.commit,evidenceTreeSha:payload.evidence.treeSha};
const raw=JSON.stringify(actual);
const anchor={origin:'INDEPENDENT_OFFLINE_READONLY',keySha256,snapshotSha256:h(raw)};
const snapshot={raw,verifiedSource:'INDEPENDENT_OFFLINE_READONLY'};
const args={rawPayloadJson,payload,signatureBase64,publicKeyPem,anchor,snapshot,actual,seenIds:[],now:new Date('2026-09-26T12:00:00Z')};
test('integrated signed synthetic fixture is OBSERVED only',()=>{const r=verifySyntheticOwnerPinFixture(args);assert.equal(r.status,'OBSERVED');assert.equal(r.ledgerWrite,false);assert.equal(r.atomicReplayEnforced,false)});
test('forged signature is rejected by integrated verifier',()=>assert.equal(verifySyntheticOwnerPinFixture({...args,signatureBase64:(()=>{const b=Buffer.from(signatureBase64,'base64');b[0]^=1;return b.toString('base64')})()}).status,'UNVERIFIABLE'));
test('wrong independently supplied key pin is rejected',()=>assert.equal(verifySyntheticOwnerPinFixture({...args,anchor:{...anchor,keySha256:'0'.repeat(64)}}).status,'UNVERIFIABLE'));
test('tampered snapshot is rejected',()=>assert.equal(verifySyntheticOwnerPinFixture({...args,snapshot:{...snapshot,raw:'tampered'}}).reason,'SNAPSHOT_ANCHOR_MISMATCH'));
test('duplicate raw key is rejected before signature',()=>assert.equal(verifySyntheticOwnerPinFixture({...args,rawPayloadJson:rawPayloadJson.replace('"approvedScope":"SYNTHETIC_OFFLINE_ONLY"','"approvedScope":"PRODUCTION","approvedScope":"SYNTHETIC_OFFLINE_ONLY"')}).reason,'DUPLICATE_JSON_KEY'));
test('replayed verificationId is rejected',()=>assert.equal(verifySyntheticOwnerPinFixture({...args,seenIds:[payload.verificationId]}).reason,'REPLAY_DETECTED'));
test('untrusted anchor label is rejected',()=>assert.equal(verifySyntheticOwnerPinFixture({...args,anchor:{...anchor,origin:'WORKTREE'}}).reason,'PROTECTED_ANCHOR_REQUIRED'));
test('no caller supplied verification status is accepted',()=>{const r=verifySyntheticOwnerPinFixture({...args,signatureBase64:'invalid',verification:{status:'OBSERVED',signatureValid:true,snapshotMatches:true}});assert.equal(r.status,'UNVERIFIABLE')});

test('caller-supplied actual cannot disagree with anchored snapshot',()=>assert.equal(verifySyntheticOwnerPinFixture({...args,actual:{...actual,sourceCommit:'0'.repeat(40)}}).reason,'SNAPSHOT_ACTUAL_MISMATCH'));
test('duplicate keys inside snapshot are rejected',()=>{const forged='{"sourceCommit":"0",'+raw.slice(1);const result=verifySyntheticOwnerPinFixture({...args,snapshot:{...snapshot,raw:forged},anchor:{...anchor,snapshotSha256:h(forged)}});assert.equal(result.status,'UNVERIFIABLE')});

test('integration fails closed without authenticated trust source',()=>{
 const r=verifyOfflineOwnerPin(args);
 assert.equal(r.status,'UNVERIFIABLE');
 assert.equal(r.reason,'AUTHENTICATED_TRUST_SOURCE_REQUIRED');
});
test('caller-crafted trust receipt cannot unlock integration',()=>{
 const r=verifyOfflineOwnerPin({...args,trustSourceReceipt:{trustSourceAuthenticated:true}});
 assert.equal(r.status,'UNVERIFIABLE');
 assert.equal(r.reason,'AUTHENTICATED_TRUST_SOURCE_NOT_IMPLEMENTED');
});

test('synthetic result cannot authenticate operational verifier',()=>{
 const synthetic=verifySyntheticOwnerPinFixture(args);
 assert.equal(synthetic.syntheticOnly,true);
 assert.equal(synthetic.ledgerWrite,false);
 assert.equal(synthetic.releaseAuthority,false);
 const operational=verifyOfflineOwnerPin({...args,trustSourceReceipt:synthetic});
 assert.equal(operational.status,'UNVERIFIABLE');
});

test('operational verifier fails closed on null, arrays and primitives',()=>{
 for(const input of [null,[],42,'synthetic',false]){
  const r=verifyOfflineOwnerPin(input);
  assert.equal(r.status,'UNVERIFIABLE');
  assert.equal(r.reason,'INVALID_INTEGRATION_INPUT');
  assert.equal(r.ledgerWrite,false);
  assert.equal(r.releaseAuthority,false);
 }
});
test('operational verifier rejects caller-crafted provenance even with valid synthetic signature',()=>{
 const receipt={status:'OBSERVED',trustSourceAuthenticated:true,origin:'INDEPENDENT_OFFLINE_READONLY',signatureValid:true};
 const r=verifyOfflineOwnerPin({...args,trustSourceReceipt:receipt});
 assert.equal(r.reason,'AUTHENTICATED_TRUST_SOURCE_NOT_IMPLEMENTED');
 assert.equal(r.ledgerWrite,false);
 assert.equal(r.releaseAuthority,false);
});

test('throwing trust getter cannot escape operational boundary',()=>{
 const r=verifyOfflineOwnerPin({get trustSourceReceipt(){throw new Error('hostile getter')}});
 assert.equal(r.status,'UNVERIFIABLE');
 assert.equal(r.reason,'INTEGRATION_INPUT_ERROR');
 assert.equal(r.ledgerWrite,false);
 assert.equal(r.releaseAuthority,false);
});
test('hostile Proxy cannot escape operational boundary',()=>{
 const r=verifyOfflineOwnerPin(new Proxy({}, {get(){throw new Error('hostile proxy')}}));
 assert.equal(r.status,'UNVERIFIABLE');
 assert.equal(r.reason,'INTEGRATION_INPUT_ERROR');
});

test('synthetic fixture malformed input fails closed without authority',()=>{
 for(const input of [null,[],false,7]){
  const r=verifySyntheticOwnerPinFixture(input);
  assert.equal(r.status,'UNVERIFIABLE');
  assert.equal(r.reason,'INVALID_SYNTHETIC_INPUT');
  assert.equal(r.ledgerWrite,false);
  assert.equal(r.releaseAuthority,false);
 }
 const r=verifySyntheticOwnerPinFixture(new Proxy({}, {get(){throw new Error('hostile')}}));
 assert.equal(r.status,'UNVERIFIABLE');
 assert.equal(r.reason,'INTEGRATION_ERROR');
});
