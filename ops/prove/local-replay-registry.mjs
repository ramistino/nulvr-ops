// C3 local-only durable replay prototype. Not a production authority or protected ledger.
// Root directory must be provisioned independently on a trusted filesystem by the operator.
import {open,lstat,realpath} from 'node:fs/promises';
import {constants as FS} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,resolve,dirname} from 'node:path';
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const deny=reason=>({status:'UNVERIFIABLE',reason,ledgerWrite:false,releaseAuthority:false});
export async function reserveReplayId({verificationId,registryRoot}={}){
 if(!ID.test(verificationId||''))return deny('INVALID_VERIFICATION_ID');
 if(typeof registryRoot!=='string'||!registryRoot.startsWith('/'))return deny('EXTERNAL_REGISTRY_ROOT_REQUIRED');
 const root=resolve(registryRoot);
 let fd;
 try{
  const meta=await lstat(root);
  if(!meta.isDirectory()||meta.isSymbolicLink()||(meta.mode&0o077)!==0||(typeof process.getuid==='function'&&meta.uid!==process.getuid()))return deny('REGISTRY_PERMISSIONS_INVALID');
  if(await realpath(root)!==root)return deny('REGISTRY_ROOT_NOT_CANONICAL');
  // A canonical root can still sit beneath a replaceable, attacker-controlled ancestor.
  // This check detects existing unsafe ancestors; it is not a TOCTOU-safe directory-fd walk.
  let ancestor=dirname(root);
  while(true){
   const parent=await lstat(ancestor);
   if(!parent.isDirectory()||parent.isSymbolicLink())return deny('REGISTRY_ANCESTOR_INVALID');
   const uid=typeof process.getuid==='function'?process.getuid():null;
   const ownedByOperator=uid!==null&&parent.uid===uid;
   const ownedByRoot=parent.uid===0;
   const writableByOthers=(parent.mode&0o022)!==0;
   const stickyRoot=(parent.mode&0o1000)!==0&&ownedByRoot;
   if((!ownedByOperator&&!ownedByRoot)||(writableByOthers&&!stickyRoot))return deny('REGISTRY_ANCESTOR_UNSAFE');
   if(ancestor==='/')break;
   ancestor=dirname(ancestor);
  }
  const name=createHash('sha256').update(verificationId).digest('hex')+'.reserved';
  // O_EXCL prevents two cooperating local processes from claiming the same ID.
  fd=await open(join(root,name),FS.O_WRONLY|FS.O_CREAT|FS.O_EXCL|FS.O_NOFOLLOW,0o600);
  const opened=await fd.stat();
  if(!opened.isFile()||opened.isSymbolicLink()||(opened.mode&0o077)!==0||(typeof process.getuid==='function'&&opened.uid!==process.getuid()))return deny('RESERVATION_FILE_INVALID');
  await fd.writeFile(verificationId+'\n','utf8');
  await fd.sync();
  await fd.close();fd=undefined;
  // Re-check the path after the exclusive create. This narrows replacement races but does not
  // claim full adversarial TOCTOU safety; production requires directory-fd/openat semantics.
  const after=await lstat(root);
  if(!after.isDirectory()||after.isSymbolicLink()||after.dev!==meta.dev||after.ino!==meta.ino||after.uid!==meta.uid||(after.mode&0o077)!==0||await realpath(root)!==root)return deny('REGISTRY_ROOT_CHANGED');
  const dir=await open(root,'r');
  try{await dir.sync()}finally{await dir.close()}
  return {status:'RESERVED_LOCAL_ONLY',replayReserved:true,atomicOnLocalFilesystem:true,ledgerWrite:false,releaseAuthority:false};
 }catch(e){
  if(e?.code==='EEXIST')return deny('REPLAY_DETECTED');
  // Fail closed: if fsync fails after O_EXCL, retain the reservation, never delete it.
  return deny('REGISTRY_IO_UNVERIFIABLE');
 }finally{if(fd)await fd.close().catch(()=>{})}
}
