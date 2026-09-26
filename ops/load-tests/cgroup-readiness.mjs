// C4 read-only cgroup v2 readiness. Does not create cgroups or grant authority.
import {readFileSync, statSync} from 'node:fs';
import {resolve} from 'node:path';
const ROOT='/sys/fs/cgroup';
const read=(p)=>{try{return readFileSync(p,'utf8').trim()}catch{return null}};
export function assessCgroup({root=ROOT,procCgroup='/proc/self/cgroup'}={}) {
  if(process.platform!=='linux')return {status:'BLOCKED',reason:'NOT_LINUX',operationalPass:false};
  const membership=read(procCgroup);
  const match=membership?.split('\n').find(x=>x.startsWith('0::'));
  if(!match)return {status:'BLOCKED',reason:'NO_CGROUP_V2_MEMBERSHIP',operationalPass:false};
  const path=match.slice(3);
  if(!path.startsWith('/')||path.includes('..'))return {status:'BLOCKED',reason:'INVALID_MEMBERSHIP',operationalPass:false};
  const dir=resolve(root,'.'+path);
  if(dir!==root&&!dir.startsWith(root+'/'))return {status:'BLOCKED',reason:'PATH_ESCAPE',operationalPass:false};
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
