import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,chmod,rm,readdir,readFile,symlink,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execFileAsync=promisify(execFile);
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

test('registry root symlink fails closed',()=>withRoot(async root=>{
 const link=root+'-link';
 await symlink(root,link);
 try{assert.equal((await reserveReplayId({verificationId:id,registryRoot:link})).reason,'REGISTRY_PERMISSIONS_INVALID')}
 finally{await rm(link,{force:true})}
}));
test('reservation stores the exact ID and a newline',()=>withRoot(async root=>{
 assert.equal((await reserveReplayId({verificationId:id,registryRoot:root})).status,'RESERVED_LOCAL_ONLY');
 const files=await readdir(root);
 assert.equal(await readFile(join(root,files[0]),'utf8'),id+'\n');
}));

test('separate processes cannot both reserve the same ID',()=>withRoot(async root=>{
 const code="import {reserveReplayId} from "+JSON.stringify(new URL('./local-replay-registry.mjs',import.meta.url).href)+";const r=await reserveReplayId({verificationId:process.argv[1],registryRoot:process.argv[2]});console.log(r.status+':'+(r.reason||''));";
 const outcomes=await Promise.all(Array.from({length:8},()=>execFileAsync(process.execPath,['--input-type=module','-e',code,id,root])));
 const statuses=outcomes.map(x=>x.stdout.trim());
 assert.equal(statuses.filter(x=>x==='RESERVED_LOCAL_ONLY:').length,1);
 assert.equal(statuses.filter(x=>x==='UNVERIFIABLE:REPLAY_DETECTED').length,7);
}));

test('rejects writable non-sticky ancestor',()=>withRoot(async base=>{
 const parent=join(base,'unsafe');
 const root=join(parent,'registry');
 await mkdir(parent,{mode:0o700});
 await mkdir(root,{mode:0o700});
 await chmod(parent,0o777);
 try{assert.equal((await reserveReplayId({verificationId:id,registryRoot:root})).reason,'REGISTRY_ANCESTOR_UNSAFE')}
 finally{await chmod(parent,0o700)}
}));
test('rejects symlinked ancestor even when root itself is a real directory',()=>withRoot(async base=>{
 const actual=join(base,'actual');const link=join(base,'alias');
 await mkdir(actual,{mode:0o700});await mkdir(join(actual,'registry'),{mode:0o700});
 await symlink(actual,link);
 try{assert.equal((await reserveReplayId({verificationId:id,registryRoot:join(link,'registry')})).reason,'REGISTRY_ROOT_NOT_CANONICAL')}
 finally{await rm(link,{force:true})}
}));
