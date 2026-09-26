import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,chmod,rm,readdir,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {reserveReplayId} from './local-replay-registry.mjs';
const id='12345678-1234-4234-8234-123456789abc';
async function withRoot(fn){const root=await mkdtemp(join(tmpdir(),'nulvr-replay-'));await chmod(root,0o700);try{await fn(root)}finally{await rm(root,{recursive:true,force:true})}}
test('first local reservation succeeds but grants no authority',()=>withRoot(async root=>{const r=await reserveReplayId({verificationId:id,registryRoot:root});assert.equal(r.status,'RESERVED_LOCAL_ONLY');assert.equal(r.ledgerWrite,false);assert.equal((await readdir(root)).length,1)}));
test('second use of same ID fails closed',()=>withRoot(async root=>{await reserveReplayId({verificationId:id,registryRoot:root});assert.equal((await reserveReplayId({verificationId:id,registryRoot:root})).reason,'REPLAY_DETECTED')}));
test('parallel reservations admit exactly one claimant',()=>withRoot(async root=>{const results=await Promise.all(Array.from({length:16},()=>reserveReplayId({verificationId:id,registryRoot:root})));assert.equal(results.filter(x=>x.status==='RESERVED_LOCAL_ONLY').length,1);assert.equal(results.filter(x=>x.reason==='REPLAY_DETECTED').length,15)}));
test('reservation survives a fresh invocation',()=>withRoot(async root=>{await reserveReplayId({verificationId:id,registryRoot:root});assert.equal((await reserveReplayId({verificationId:id,registryRoot:root})).reason,'REPLAY_DETECTED')}));
test('missing externally provisioned root fails closed',async()=>assert.equal((await reserveReplayId({verificationId:id,registryRoot:'/nonexistent/nulvr-replay-root'})).status,'UNVERIFIABLE'));
test('relative root is rejected',async()=>assert.equal((await reserveReplayId({verificationId:id,registryRoot:'./registry'})).reason,'EXTERNAL_REGISTRY_ROOT_REQUIRED'));
test('invalid verification ID is rejected',()=>withRoot(async root=>assert.equal((await reserveReplayId({verificationId:'../../etc/passwd',registryRoot:root})).reason,'INVALID_VERIFICATION_ID')));
test('group-accessible registry is rejected',()=>withRoot(async root=>{await chmod(root,0o750);assert.equal((await reserveReplayId({verificationId:id,registryRoot:root})).reason,'REGISTRY_PERMISSIONS_INVALID')}));
