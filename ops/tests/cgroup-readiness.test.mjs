import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {assessCgroup} from '../load-tests/cgroup-readiness.mjs';
test('read-only cgroup assessment never grants quota approval',()=>{
 const r=assessCgroup();assert.equal(r.operationalPass,false);assert.equal(r.perChildQuotaVerified??false,false);
});
test('synthetic cgroup missing controller remains blocked',()=>{
 const dir=mkdtempSync(join(tmpdir(),'nulvr-cgroup-'));try{
 writeFileSync(join(dir,'membership'),'0::/\n');writeFileSync(join(dir,'cgroup.controllers'),'memory\n');
 const r=assessCgroup({root:dir,procCgroup:join(dir,'membership')});
 assert.equal(r.blocker,'REQUIRED_CONTROLLERS_UNAVAILABLE');assert.equal(r.operationalPass,false);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('invalid membership fails closed',()=>{
 const dir=mkdtempSync(join(tmpdir(),'nulvr-cgroup-'));try{
 writeFileSync(join(dir,'membership'),'0::/../../etc\n');
 const r=assessCgroup({root:dir,procCgroup:join(dir,'membership')});
 assert.equal(r.status,'BLOCKED');assert.equal(r.operationalPass,false);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
