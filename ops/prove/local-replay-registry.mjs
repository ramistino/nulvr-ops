// C3 local-only durable replay prototype. Not a production authority or protected ledger.
// Root directory must be provisioned independently on a trusted filesystem by the operator.
import {open,lstat,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
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
  const name=createHash('sha256').update(verificationId).digest('hex')+'.reserved';
  // O_EXCL prevents two cooperating local processes from claiming the same ID.
  fd=await open(join(root,name),'wx',0o600);
  await fd.writeFile(verificationId+'\n','utf8');
  await fd.sync();
  await fd.close();fd=undefined;
  const dir=await open(root,'r');
  try{await dir.sync()}finally{await dir.close()}
  return {status:'RESERVED_LOCAL_ONLY',replayReserved:true,atomicOnLocalFilesystem:true,ledgerWrite:false,releaseAuthority:false};
 }catch(e){
  if(e?.code==='EEXIST')return deny('REPLAY_DETECTED');
  // Fail closed: if fsync fails after O_EXCL, retain the reservation, never delete it.
  return deny('REGISTRY_IO_UNVERIFIABLE');
 }finally{if(fd)await fd.close().catch(()=>{})}
}
