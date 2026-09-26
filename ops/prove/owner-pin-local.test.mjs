import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createHash,sign} from 'node:crypto';
import {canonical,validatePayload,verifyOwnerPin,domainPrefix} from './owner-pin-local.mjs';
const h=x=>createHash('sha256').update(x).digest('hex');
const {publicKey,privateKey}=generateKeyPairSync('ed25519'); // ephemeral test key only; NEVER founder identity
const pem=publicKey.export({format:'pem',type:'spki'});
const fingerprint=h(publicKey.export({format:'der',type:'spki'}));
const p={schemaVersion:'nulvr.owner-pin-design.v0.1a',verificationId:'12345678-1234-4234-8234-123456789abc',approvedScope:'SYNTHETIC_OFFLINE_ONLY',source:{repository:'example/synthetic',commit:'a'.repeat(40)},checkerFiles:[{path:'ops/checks/prove-fixture.mjs',rawSha256:'b'.repeat(64)},{path:'ops/checks/assertions-v02a.mjs',rawSha256:'c'.repeat(64)}],manifestPath:'manifest.json',manifestSha256:'d'.repeat(64),evidence:{provider:'GITHUB_GIT_TREE',repository:'example/evidence',commit:'e'.repeat(40),treeSha:'f'.repeat(40)},assertionPolicy:'C3_SYNTHETIC_V0_2A',approvedAt:'2026-09-26T00:00:00Z',expiresAt:'2026-09-27T00:00:00Z',signerKeySha256:fingerprint};
const actual={sourceRepository:p.source.repository,sourceCommit:p.source.commit,checkerSha256:p.checkerFiles.map(x=>x.rawSha256),manifestSha256:p.manifestSha256,evidenceRepository:p.evidence.repository,evidenceCommit:p.evidence.commit,evidenceTreeSha:p.evidence.treeSha};
const now=new Date('2026-09-26T12:00:00Z');
const signatureBase64=sign(null,Buffer.concat([domainPrefix,Buffer.from(canonical(p))]),privateKey).toString('base64');
const args={payload:p,rawPayloadJson:JSON.stringify(p),signatureBase64,publicKeyPem:pem,trustedKeyFingerprint:fingerprint,actual,now};
test('valid synthetic signature remains OBSERVED, not VERIFIED',()=>{const x=verifyOwnerPin(args);assert.equal(x.status,'OBSERVED');assert.equal(x.ledgerWrite,false);assert.equal(x.oneShotReplayEnforced,false)});
test('wrong independent fingerprint rejected',()=>assert.equal(verifyOwnerPin({...args,trustedKeyFingerprint:'0'.repeat(64)}).status,'UNVERIFIABLE'));
test('no independent fingerprint rejected',()=>assert.equal(verifyOwnerPin({...args,trustedKeyFingerprint:undefined}).reason,'INDEPENDENT_KEY_PIN_REQUIRED'));
test('forged signature rejected',()=>assert.equal(verifyOwnerPin({...args,signatureBase64:'A'+signatureBase64.slice(1)}).status,'UNVERIFIABLE'));
test('scope substitution rejected',()=>assert.equal(verifyOwnerPin({...args,payload:{...p,approvedScope:'PRODUCTION'}}).status,'UNVERIFIABLE'));
test('wrong evidence tree rejected',()=>assert.equal(verifyOwnerPin({...args,actual:{...actual,evidenceTreeSha:'a'.repeat(40)}}).reason,'SNAPSHOT_MISMATCH'));
test('wrong checker bytes rejected',()=>assert.equal(verifyOwnerPin({...args,actual:{...actual,checkerSha256:['a'.repeat(64),actual.checkerSha256[1]]}}).reason,'SNAPSHOT_MISMATCH'));
test('expiry rejected',()=>assert.equal(verifyOwnerPin({...args,now:new Date('2026-09-27T00:00:00Z')}).reason,'EXPIRED_OR_INVALID_WINDOW'));
test('future approval rejected',()=>assert.equal(verifyOwnerPin({...args,now:new Date('2026-09-25T00:00:00Z')}).reason,'EXPIRED_OR_INVALID_WINDOW'));
test('invalid path rejected',()=>assert.throws(()=>validatePayload({...p,manifestPath:'../manifest.json'},{now}),/DIGEST_INVALID/));
test('wrong ordered checker rejected',()=>assert.throws(()=>validatePayload({...p,checkerFiles:p.checkerFiles.toReversed()},{now}),/CHECKERS_INVALID/));
test('extra fields rejected',()=>assert.throws(()=>validatePayload({...p,admin:true},{now}),/PAYLOAD_SHAPE/));
test('wrong signature domain rejected',()=>{const bad=sign(null,Buffer.from(canonical(p)),privateKey).toString('base64');assert.equal(verifyOwnerPin({...args,signatureBase64:bad}).reason,'SIGNATURE_INVALID')});
test('canonical order stable',()=>assert.equal(canonical({b:2,a:1}),'{"a":1,"b":2}'));

test('cannot bypass 24-hour maximum with caller-supplied policy',()=>assert.throws(()=>validatePayload(p,{now,maxValidityMs:48*3600*1000}),/TIME_POLICY_INVALID/));
test('invalid clock is rejected',()=>assert.throws(()=>validatePayload(p,{now:new Date(NaN)}),/TIME_POLICY_INVALID/));
test('negative validity policy is rejected',()=>assert.throws(()=>validatePayload(p,{now,maxValidityMs:-1}),/TIME_POLICY_INVALID/));
test('replay is not claimed enforced',()=>{const a=verifyOwnerPin(args),b=verifyOwnerPin(args);assert.equal(a.status,'OBSERVED');assert.equal(b.status,'OBSERVED');assert.equal(a.oneShotReplayEnforced,false)});
test('unicode key sorting follows UTF-16 order',()=>assert.equal(canonical({'\uE000':1,'\u{10000}':2}),'{"\u{10000}":2,"\uE000":1}'));
test('unpaired surrogate rejected',()=>assert.throws(()=>canonical('\uD800'),/INVALID_UNICODE/));

test('noncanonical Base64 alias of a valid signature is rejected',()=>{
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
 const idx=alphabet.indexOf(signatureBase64[85]);
 const alias=signatureBase64.slice(0,85)+alphabet[(idx&48)|((idx+1)&15)]+signatureBase64.slice(86);
 assert.notEqual(alias,signatureBase64);
 assert.deepEqual(Buffer.from(alias,'base64'),Buffer.from(signatureBase64,'base64'));
 assert.equal(verifyOwnerPin({...args,signatureBase64:alias}).reason,'SIGNATURE_FORMAT_INVALID');
});

test('sparse arrays fail closed instead of silently dropping holes',()=>{
 assert.throws(()=>canonical(Array(1)),/SPARSE_ARRAY/);
 assert.throws(()=>canonical([1,,3]),/SPARSE_ARRAY/);
});
test('canonical nested JSON has deterministic key order',()=>{
 assert.equal(canonical({z:[true,null,{b:2,a:'x'}],a:false}),'{"a":false,"z":[true,null,{"a":"x","b":2}]}');
});
test('canonical number formatting covers supported RFC 8785 values',()=>{
 assert.equal(canonical([4.5,0.002,1e-7,-0]),'[4.5,0.002,1e-7,0]');
});
test('array undefined elements cannot be silently dropped',()=>{
 assert.throws(()=>canonical([undefined]),/NON_JSON_OR_CYCLE/);
});

test('missing raw JSON fails closed',()=>assert.equal(verifyOwnerPin({...args,rawPayloadJson:undefined}).reason,'RAW_JSON_REQUIRED'));
test('duplicate signed JSON key fails closed before signature verification',()=>{const raw=args.rawPayloadJson.replace('"approvedScope":"SYNTHETIC_OFFLINE_ONLY"','"approvedScope":"PRODUCTION","approvedScope":"SYNTHETIC_OFFLINE_ONLY"');assert.equal(verifyOwnerPin({...args,rawPayloadJson:raw}).reason,'DUPLICATE_JSON_KEY')});
test('escaped duplicate signed JSON key fails closed',()=>{const raw=args.rawPayloadJson.replace('"approvedScope":"SYNTHETIC_OFFLINE_ONLY"','"approvedScope":"PRODUCTION","\\u0061pprovedScope":"SYNTHETIC_OFFLINE_ONLY"');assert.equal(verifyOwnerPin({...args,rawPayloadJson:raw}).reason,'DUPLICATE_JSON_KEY')});
test('raw signed payload mismatch fails closed',()=>{const raw=args.rawPayloadJson.replace('SYNTHETIC_OFFLINE_ONLY','PRODUCTION');assert.equal(verifyOwnerPin({...args,rawPayloadJson:raw}).reason,'RAW_PAYLOAD_MISMATCH')});
test('malformed raw JSON fails closed',()=>assert.equal(verifyOwnerPin({...args,rawPayloadJson:'{"a":1,}'}).reason,'RAW_JSON_INVALID'));

test('signed parsed JSON is authoritative even if caller object getter mutates after equivalence check',()=>{
 let reads=0;
 const mutable={...p};
 Object.defineProperty(mutable,'signerKeySha256',{enumerable:true,get(){return ++reads===1?fingerprint:'0'.repeat(64)}});
 const result=verifyOwnerPin({...args,payload:mutable});
 assert.equal(result.status,'OBSERVED');
 assert.equal(reads,1);
 assert.equal(result.ledgerWrite,false);
});
test('caller object cannot substitute snapshot identity after signed raw JSON equivalence',()=>{
 let reads=0;
 const source={...p.source};
 Object.defineProperty(source,'commit',{enumerable:true,get(){return ++reads===1?p.source.commit:'0'.repeat(40)}});
 const result=verifyOwnerPin({...args,payload:{...p,source}});
 assert.equal(result.status,'OBSERVED');
 assert.equal(reads,1);
});

test('RFC 8785 preserves IEEE-754 representation of large finite numbers',()=>{
 assert.equal(canonical(1e30),'1e+30');
 assert.equal(canonical(Number.MAX_SAFE_INTEGER+1),'9007199254740992');
 assert.throws(()=>canonical(Infinity),/INVALID_NUMBER/);
});
