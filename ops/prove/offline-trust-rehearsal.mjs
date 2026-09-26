// C3 T2 local-only trust-boundary rehearsal. No production authority.
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const HEX=/^[a-f0-9]{64}$/;
export function evaluateOfflineTrust({verification,anchor,snapshot,seenIds}){
 const deny=reason=>({status:'UNVERIFIABLE',reason,ledgerWrite:false,releaseAuthority:false});
 if(!verification||verification.status!=='OBSERVED'||verification.signatureValid!==true||verification.snapshotMatches!==true)return deny('SIGNATURE_NOT_OBSERVED');
 if(!anchor||anchor.origin!=='INDEPENDENT_OFFLINE_READONLY'||!HEX.test(anchor.keySha256||'')||!HEX.test(anchor.snapshotSha256||''))return deny('PROTECTED_ANCHOR_REQUIRED');
 if(!snapshot||typeof snapshot.raw!=='string'||sha(Buffer.from(snapshot.raw,'utf8'))!==anchor.snapshotSha256)return deny('SNAPSHOT_ANCHOR_MISMATCH');
 if(!snapshot.verifiedSource||snapshot.verifiedSource!=='INDEPENDENT_OFFLINE_READONLY')return deny('INDEPENDENT_SNAPSHOT_REQUIRED');
 if(!verification.verificationId||!Array.isArray(seenIds)||seenIds.some(x=>typeof x!=='string'))return deny('REPLAY_REGISTRY_REQUIRED');
 if(seenIds.includes(verification.verificationId))return deny('REPLAY_DETECTED');
 // No write to seenIds: this rehearsal cannot claim atomic durable replay protection.
 return {status:'OBSERVED',localTrustChecksPassed:true,atomicReplayEnforced:false,ledgerWrite:false,releaseAuthority:false};
}
