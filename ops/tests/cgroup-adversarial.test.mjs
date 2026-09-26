import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,mkdirSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {assessCgroup} from '../load-tests/cgroup-readiness.mjs';
function run(membership,setup=()=>{}){const dir=mkdtempSync(join(tmpdir(),'c4-adv-'));try{writeFileSync(join(dir,'membership'),membership);setup(dir);return assessCgroup({root:dir,procCgroup:join(dir,'membership')});}finally{rmSync(dir,{recursive:true,force:true});}}
test('reject duplicated v2 membership entries',()=>{const r=run('0::/a\n0::/b\n');assert.equal(r.status,'BLOCKED');});
test('reject symlinked cgroup member path',()=>{const r=run('0::/alias\n',d=>{mkdirSync(join(d,'real'));symlinkSync('real',join(d,'alias'));});assert.equal(r.status,'BLOCKED');});
test('reject control characters in membership',()=>{const r=run('0::/foo\u0000bar\n');assert.equal(r.status,'BLOCKED');});
test('reject relative root',()=>{const r=assessCgroup({root:'.',procCgroup:'/proc/self/cgroup'});assert.equal(r.status,'BLOCKED');});
