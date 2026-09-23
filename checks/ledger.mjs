// nulvr ledger — merged r2 (base: hardened candidate; ports from r1 noted inline).
// Generic append NEVER records a verdict. VERIFIED and REFUTED require a trusted checker write path (not implemented).
import {readFileSync,writeFileSync,appendFileSync,existsSync,mkdirSync,rmdirSync,renameSync,openSync,fsyncSync,closeSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sha=s=>createHash('sha256').update(s).digest('hex');
const file=process.argv[3]||'ledger/ledger.jsonl';
const anchor=process.env.NULVR_ANCHOR_PATH;
// r2: REFUTED removed from generic append (was writable with no evidence). Verdicts are symmetric.
const statuses=new Set(['PENDING','UNVERIFIABLE','CHECK_ERROR','INFO']);
// r2: types extended to the ledger vocabulary of the advisory report.
const types=new Set(['CLAIM','CHECK_RESULT','STATE','CYCLE_START','CYCLE_END','CYCLE_ABANDONED','TASK_ASSIGNED','BLOCKER','OWNER_DECISION']);
function valid(o){
  if(!o||typeof o!=='object'||Array.isArray(o)||!types.has(o.type)||!statuses.has(o.status))throw Error('INVALID_TYPE_OR_STATUS');
  if(Object.hasOwn(o,'hash')||Object.hasOwn(o,'seq')||Object.hasOwn(o,'prevHash'))throw Error('RESERVED_FIELD');
  if(o.type==='CHECK_RESULT'&&(!o.checker||typeof o.checker!=='string'))throw Error('MISSING_CHECKER');
}
function requireAnchor(){ // r2: anchor is mandatory; an unset variable no longer disables truncation detection silently.
  if(!anchor)throw Error('ANCHOR_NOT_CONFIGURED');
}
function verify(){
  requireAnchor();
  let prev='GENESIS',n=0;const data=existsSync(file)?readFileSync(file,'utf8'):'';
  if(data&&!data.endsWith('\n'))throw Error('TRUNCATED_LINE');
  for(const line of data.split('\n').filter(Boolean)){
    let o;try{o=JSON.parse(line)}catch{throw Error('INVALID_JSON')}
    const {hash,seq,prevHash,...payload}=o;valid(payload);const entry={...payload,seq,prevHash};
    if(!/^[a-f0-9]{64}$/.test(hash||'')||o.seq!==++n||o.prevHash!==prev||hash!==sha(JSON.stringify(entry)))throw Error('LEDGER_INTEGRITY_FAILURE');
    prev=hash;
  }
  if(!existsSync(anchor)){if(n)throw Error('ANCHOR_MISSING')}
  else{let h;try{h=JSON.parse(readFileSync(anchor,'utf8'))}catch{throw Error('ANCHOR_INVALID')}if(h.seq!==n||h.hash!==prev)throw Error('ANCHOR_MISMATCH')}
  return {seq:n,prevHash:prev};
}
function acquire(lock){ // r2 (from r1): bounded retry instead of immediate LEDGER_BUSY; still fails closed.
  const deadline=Date.now()+Number(process.env.NULVR_LOCK_WAIT_MS||5000);
  for(;;){try{mkdirSync(lock);return}catch(e){if(e.code!=='EEXIST')throw e;if(Date.now()>deadline)throw Error('LEDGER_BUSY');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,25)}}
}
function append(){
  requireAnchor();
  let input;try{input=JSON.parse(readFileSync(0,'utf8'))}catch{throw Error('INVALID_JSON')}
  valid(input); // validate before taking the lock
  const lock=file+'.lock';acquire(lock);
  try{
    const state=verify();const entry={...input,seq:state.seq+1,prevHash:state.prevHash};const hash=sha(JSON.stringify(entry));
    appendFileSync(file,JSON.stringify({...entry,hash})+'\n',{flag:'a'});
    const fd=openSync(file,'r');fsyncSync(fd);closeSync(fd); // r2 (from r1)
    const tmp=anchor+'.tmp.'+process.pid;writeFileSync(tmp,JSON.stringify({seq:entry.seq,hash})+'\n',{flag:'wx'});renameSync(tmp,anchor);
    console.log(JSON.stringify({seq:entry.seq,hash}));
  }finally{rmdirSync(lock)}
}
try{if(process.argv[2]==='verify')console.log(JSON.stringify(verify()));else if(process.argv[2]==='append')append();else throw Error('usage: ledger.mjs verify|append [file]')}
catch(e){console.error(e.message);process.exitCode=1}
