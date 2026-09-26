// C4 read-only cgroup v2 readiness. Does not create cgroups or grant authority.
import {readFileSync, statSync, lstatSync} from 'node:fs';
import {resolve, isAbsolute, relative, sep} from 'node:path';
const ROOT='/sys/fs/cgroup';
const read=(p)=>{try{return readFileSync(p,'utf8').trim()}catch{return null}};
export function assessCgroup({root=ROOT,procCgroup='/proc/self/cgroup'}={}) {
  if(process.platform!=='linux')return {status:'BLOCKED',reason:'NOT_LINUX',operationalPass:false};
  const membership=read(procCgroup);
  if(!isAbsolute(root))return {status:'BLOCKED',reason:'INVALID_ROOT',operationalPass:false};
  const matches=membership?.split('\n').filter(x=>x.startsWith('0::'))||[];
  if(matches.length!==1)return {status:'BLOCKED',reason:'AMBIGUOUS_CGROUP_V2_MEMBERSHIP',operationalPass:false};
  const path=matches[0].slice(3);
  if(!path.startsWith('/')||path.includes('..')||/[\x00-\x1f\x7f]/.test(path))return {status:'BLOCKED',reason:'INVALID_MEMBERSHIP',operationalPass:false};
  const base=resolve(root);
  const dir=resolve(base,'.'+path);
  const rel=relative(base,dir);
  if(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))return {status:'BLOCKED',reason:'PATH_ESCAPE',operationalPass:false};
  // Do not follow symlinks in the caller-provided root or membership path.
  try {
    if(lstatSync(base).isSymbolicLink())throw Error('SYMLINK');
    let current=base;
    for(const part of rel.split(sep).filter(Boolean)){
      current=resolve(current,part);
      if(lstatSync(current).isSymbolicLink())throw Error('SYMLINK');
    }
  }catch{return {status:'BLOCKED',reason:'UNTRUSTED_CGROUP_PATH',operationalPass:false};}
  const controllers=(read(dir+'/cgroup.controllers')||'').split(/\s+/).filter(Boolean);
  const subtree=(read(dir+'/cgroup.subtree_control')||'').split(/\s+/).filter(Boolean);
  const events=read(dir+'/memory.events');
  const memoryMax=read(dir+'/memory.max');
  const cpuMax=read(dir+'/cpu.max');
  let ownershipCandidate=false;
  try {const s=statSync(dir);ownershipCandidate=Boolean(s.mode&0o200)&&s.uid===process.getuid()}catch{}
  const required=controllers.includes('memory')&&controllers.includes('cpu');
  return {status:'OBSERVED',membership:path,controllers,subtree,memoryMax,cpuMax,
    memoryEventsAvailable:events!==null,ownershipCandidate,
    perChildQuotaVerified:false,operationalPass:false,
    blocker:!required?'REQUIRED_CONTROLLERS_UNAVAILABLE':!ownershipCandidate?'NO_OWNED_WRITABLE_DELEGATION':'DEDICATED_CHILD_CGROUP_UNVERIFIED'};
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))console.log(JSON.stringify(assessCgroup(),null,2));
