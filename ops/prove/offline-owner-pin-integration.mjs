// Local-only integration: never accept caller-supplied "verified" status.
import {createHash,createPublicKey} from 'node:crypto';
import {verifyOwnerPin,canonical} from './owner-pin-local.mjs';
import {parseStrictJson} from './raw-json-preflight.mjs';
import {evaluateOfflineTrust} from './offline-trust-rehearsal.mjs';
const digest=b=>createHash('sha256').update(b).digest('hex');
const deny=reason=>({status:'UNVERIFIABLE',reason,ledgerWrite:false,releaseAuthority:false});
export function verifyOfflineOwnerPin({rawPayloadJson,payload,signatureBase64,publicKeyPem,anchor,snapshot,actual,seenIds,now}){
 try{
  if(!anchor||anchor.origin!=='INDEPENDENT_OFFLINE_READONLY')return deny('PROTECTED_ANCHOR_REQUIRED');
  if(!snapshot||snapshot.verifiedSource!=='INDEPENDENT_OFFLINE_READONLY')return deny('INDEPENDENT_SNAPSHOT_REQUIRED');
  // Bind checked identities to the exact anchored snapshot bytes, not caller-supplied claims.
  if(typeof snapshot.raw!=='string'||typeof anchor.snapshotSha256!=='string'||digest(Buffer.from(snapshot.raw,'utf8'))!==anchor.snapshotSha256)return deny('SNAPSHOT_ANCHOR_MISMATCH');
  const snapshotActual=parseStrictJson(snapshot.raw);
  if(canonical(snapshotActual)!==canonical(actual))return deny('SNAPSHOT_ACTUAL_MISMATCH');
  const observedKeySha256=digest(createPublicKey(publicKeyPem).export({type:'spki',format:'der'}));
  // The anchor and actual snapshot MUST originate outside this worktree. Their labels alone do not establish provenance.
  const verification=verifyOwnerPin({rawPayloadJson,payload,signatureBase64,publicKeyPem,trustedKeyFingerprint:anchor.keySha256,actual:snapshotActual,now});
  if(verification.status!=='OBSERVED')return deny(verification.reason||'SIGNATURE_NOT_OBSERVED');
  return evaluateOfflineTrust({verification,anchor,snapshot,seenIds,observedKeySha256});
 }catch{return deny('INTEGRATION_ERROR')}
}
