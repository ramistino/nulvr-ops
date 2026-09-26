import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {reserveReplayId} from './local-replay-registry.mjs';
import {verifyOfflineOwnerPin} from './offline-owner-pin-integration.mjs';

// Cross-module regression: a successful local replay reservation is not trusted provenance.
test('local replay reservation never unlocks operational Owner Pin',async()=>{
 const root=await mkdtemp(join(tmpdir(),'nulvr-c3-boundary-'));
 try{
  const verificationId=randomUUID();
  const reserved=await reserveReplayId({verificationId,registryRoot:root});
  assert.equal(reserved.status,'RESERVED_LOCAL_ONLY');
  assert.equal(reserved.ledgerWrite,false);
  assert.equal(reserved.releaseAuthority,false);
  const operational=verifyOfflineOwnerPin({verificationId,trustSourceReceipt:{...reserved,trustSourceAuthenticated:true,status:'OBSERVED'}});
  assert.equal(operational.status,'UNVERIFIABLE');
  assert.equal(operational.reason,'AUTHENTICATED_TRUST_SOURCE_NOT_IMPLEMENTED');
  assert.equal(operational.ledgerWrite,false);
  assert.equal(operational.releaseAuthority,false);
  const duplicate=await reserveReplayId({verificationId,registryRoot:root});
  assert.equal(duplicate.status,'UNVERIFIABLE');
  assert.equal(duplicate.reason,'REPLAY_DETECTED');
  assert.equal(duplicate.ledgerWrite,false);
  assert.equal(duplicate.releaseAuthority,false);
 }finally{await rm(root,{recursive:true,force:true})}
});

test('failed local reservation cannot authenticate operational Owner Pin',async()=>{
 const denied=await reserveReplayId({verificationId:randomUUID(),registryRoot:'relative/untrusted'});
 assert.equal(denied.status,'UNVERIFIABLE');
 const operational=verifyOfflineOwnerPin({trustSourceReceipt:{...denied,trustSourceAuthenticated:true,status:'OBSERVED'}});
 assert.equal(operational.status,'UNVERIFIABLE');
 assert.equal(operational.ledgerWrite,false);
 assert.equal(operational.releaseAuthority,false);
});
