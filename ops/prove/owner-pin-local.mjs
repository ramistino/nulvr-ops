// C3 T2 local-only owner-pin signature verifier. No signer/key generation, network or ledger writes.
import {createHash, createPublicKey, verify as verifySignature} from 'node:crypto';
import {parseStrictJson} from './raw-json-preflight.mjs';
const SHA=/^[a-f0-9]{64}$/; const GIT=/^[a-f0-9]{40}$/;
const REPO=/^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}\/[A-Za-z0-9][A-Za-z0-9_.-]{0,79}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const paths=['ops/checks/prove-fixture.mjs','ops/checks/assertions-v02a.mjs'];
const PREFIX=Buffer.from('NULVR:OWNER-PIN:V0.1A\n');
const hash=b=>createHash('sha256').update(b).digest('hex');
const keys=(v,expected)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join('|')===expected.slice().sort().join('|');
const validDate=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().replace(/\.000Z$/,'Z')===s.replace(/\.0+Z$/,'Z');
function invalid(reason){throw new Error(reason)}
// RFC8785 JSON canonicalization for this schema's JSON-compatible primitives.
// Reject non-JSON values, unsafe integers, unpaired UTF-16 surrogates and cyclic objects.
function validString(s){if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(s))invalid('INVALID_UNICODE')}
export function canonical(value,seen=new Set()){
 if(value===null)return 'null';
 if(typeof value==='string'){validString(value);return JSON.stringify(value)}
 if(typeof value==='boolean')return value?'true':'false';
 if(typeof value==='number'){if(!Number.isFinite(value))invalid('INVALID_NUMBER');return JSON.stringify(value)}
 if(typeof value!=='object'||seen.has(value))invalid('NON_JSON_OR_CYCLE');
 seen.add(value);let result;
 if(Array.isArray(value)){if(Object.keys(value).filter(k=>/^(0|[1-9][0-9]*)$/.test(k)).length!==value.length)invalid('SPARSE_ARRAY');result='['+Array.from(value,v=>canonical(v,seen)).join(',')+']';}
 else {const k=Object.keys(value).sort((a,b)=>a<b?-1:a>b?1:0);result='{'+k.map(key=>{validString(key);return JSON.stringify(key)+':'+canonical(value[key],seen)}).join(',')+'}'}
 seen.delete(value);return result;
}
export function validatePayload(p,{now=new Date(),maxValidityMs=24*3600*1000}={}){
 if(!(now instanceof Date)||!Number.isFinite(now.getTime())||!Number.isSafeInteger(maxValidityMs)||maxValidityMs<1||maxValidityMs>24*3600*1000)invalid('TIME_POLICY_INVALID');
 if(!keys(p,['schemaVersion','verificationId','approvedScope','source','checkerFiles','manifestPath','manifestSha256','evidence','assertionPolicy','approvedAt','expiresAt','signerKeySha256']))invalid('PAYLOAD_SHAPE');
 if(p.schemaVersion!=='nulvr.owner-pin-design.v0.1a'||!UUID.test(p.verificationId)||p.approvedScope!=='SYNTHETIC_OFFLINE_ONLY'||p.assertionPolicy!=='C3_SYNTHETIC_V0_2A')invalid('SCOPE_INVALID');
 if(!keys(p.source,['repository','commit'])||!REPO.test(p.source.repository)||!GIT.test(p.source.commit))invalid('SOURCE_INVALID');
 if(!Array.isArray(p.checkerFiles)||p.checkerFiles.length!==2||p.checkerFiles.some((f,i)=>!keys(f,['path','rawSha256'])||f.path!==paths[i]||!SHA.test(f.rawSha256)))invalid('CHECKERS_INVALID');
 if(p.manifestPath!=='manifest.json'||!SHA.test(p.manifestSha256)||!SHA.test(p.signerKeySha256))invalid('DIGEST_INVALID');
 if(!keys(p.evidence,['provider','repository','commit','treeSha'])||p.evidence.provider!=='GITHUB_GIT_TREE'||!REPO.test(p.evidence.repository)||!GIT.test(p.evidence.commit)||!GIT.test(p.evidence.treeSha))invalid('EVIDENCE_INVALID');
 if(!validDate(p.approvedAt)||!validDate(p.expiresAt))invalid('DATE_INVALID');
 const start=Date.parse(p.approvedAt),end=Date.parse(p.expiresAt),current=now.getTime();
 if(end<=start||end-start>maxValidityMs||start>current||current>=end)invalid('EXPIRED_OR_INVALID_WINDOW');
 return true;
}
// `trustedKeyFingerprint` MUST be supplied independently of the payload and worktree.
// `actual` digests and Git identities MUST come from an independently acquired immutable snapshot.
export function verifyOwnerPin({payload,rawPayloadJson,signatureBase64,publicKeyPem,trustedKeyFingerprint,actual,now,maxValidityMs}){
 const denied=(reason)=>({status:'UNVERIFIABLE',reason,ledgerWrite:false,releaseAuthority:false});
 try{
  if(typeof rawPayloadJson!=='string')return denied('RAW_JSON_REQUIRED');
  const parsed=parseStrictJson(rawPayloadJson);
  if(canonical(parsed)!==canonical(payload))return denied('RAW_PAYLOAD_MISMATCH');
  validatePayload(parsed,{now,maxValidityMs});
  if(!SHA.test(trustedKeyFingerprint||''))return denied('INDEPENDENT_KEY_PIN_REQUIRED');
  const key=createPublicKey(publicKeyPem);
  if(key.asymmetricKeyType!=='ed25519')return denied('ED25519_KEY_REQUIRED');
  const der=key.export({type:'spki',format:'der'});
  if(hash(der)!==trustedKeyFingerprint||parsed.signerKeySha256!==trustedKeyFingerprint)return denied('KEY_PIN_MISMATCH');
  if(typeof signatureBase64!=='string'||!/^[-A-Za-z0-9+/]{86}==$/.test(signatureBase64))return denied('SIGNATURE_FORMAT_INVALID');
  const sig=Buffer.from(signatureBase64,'base64');if(sig.length!==64||sig.toString('base64')!==signatureBase64)return denied('SIGNATURE_FORMAT_INVALID');
  const message=Buffer.concat([PREFIX,Buffer.from(canonical(parsed),'utf8')]);
  if(!verifySignature(null,message,key,sig))return denied('SIGNATURE_INVALID');
  if(!keys(actual,['sourceRepository','sourceCommit','checkerSha256','manifestSha256','evidenceRepository','evidenceCommit','evidenceTreeSha'])||
    actual.sourceRepository!==parsed.source.repository||actual.sourceCommit!==parsed.source.commit||
    !Array.isArray(actual.checkerSha256)||actual.checkerSha256.length!==2||actual.checkerSha256.some((x,i)=>x!==parsed.checkerFiles[i].rawSha256)||
    actual.manifestSha256!==parsed.manifestSha256||actual.evidenceRepository!==parsed.evidence.repository||
    actual.evidenceCommit!==parsed.evidence.commit||actual.evidenceTreeSha!==parsed.evidence.treeSha)return denied('SNAPSHOT_MISMATCH');
  return {status:'OBSERVED',signatureValid:true,snapshotMatches:true,verificationId:parsed.verificationId,ledgerWrite:false,releaseAuthority:false,oneShotReplayEnforced:false};
 }catch(e){return denied(e.message||'CHECK_ERROR')}
}
export const domainPrefix=PREFIX;
