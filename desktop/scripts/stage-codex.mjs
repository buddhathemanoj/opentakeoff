import {readFile,writeFile,mkdir,cp,rm,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {get} from 'node:https';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {join} from 'node:path';
const exec=promisify(execFile);
export const TARGETS={
 'darwin-arm64':{key:'mac',triple:'aarch64-apple-darwin'},
 'darwin-x64':{key:'mac',triple:'x86_64-apple-darwin'},
 'win32-x64':{key:'win',triple:'x86_64-pc-windows-msvc'},
 'win32-arm64':{key:'win',triple:'aarch64-pc-windows-msvc'},
};
export function runtimeTarget(platform,arch){
 const target=TARGETS[`${platform}-${arch}`];
 if(!target)throw new Error(`Unsupported Codex desktop target: ${platform}-${arch}`);
 return {...target,packageKey:`node_modules/@openai/codex-${platform}-${arch}`,binary:platform==='win32'?'codex.exe':'codex'};
}
export function verifyArchive(bytes,integrity){
 const [algorithm,expected]=integrity.split('-');
 if(algorithm!=='sha512'||!expected)throw new Error('Codex archive requires pinned SHA-512 integrity.');
 if(createHash(algorithm).update(bytes).digest('base64')!==expected)throw new Error('Codex runtime archive integrity check failed.');
}
async function downloadArchive(url){
 // Use IPv4 for registry downloads: some build hosts resolve an unreachable IPv6 route.
 return new Promise((resolve,reject)=>{
  const request=get(url,{family:4,signal:AbortSignal.timeout(180000)},response=>{
   if(response.statusCode!==200){response.resume();reject(new Error(`Codex runtime download failed: ${response.statusCode}`));return;}
   const chunks=[];let size=0;
   response.on('data',chunk=>{size+=chunk.length;if(size>300*1024*1024){request.destroy(new Error('Codex archive exceeds the build size limit.'));return;}chunks.push(chunk);});
   response.on('end',()=>resolve(Buffer.concat(chunks)));response.on('error',reject);
  });request.on('error',reject);
 });
}
export async function stageCodex({root,platform,arch}){
 const target=runtimeTarget(platform,arch),lock=JSON.parse(await readFile(join(root,'package-lock.json'),'utf8'));
 const entry=lock.packages[target.packageKey];
 if(!entry?.resolved?.startsWith('https://registry.npmjs.org/@openai/codex/')||!entry.integrity)throw new Error('Codex target is missing from the npm lockfile.');
 const base=join(root,'.desktop-build'),cache=join(base,'cache'),archive=join(cache,`${entry.version}.tgz`);
 const destination=join(base,`${target.key}-${arch}`,'codex'),unpack=join(base,`${target.key}-${arch}`,'unpack');
 let packageRoot=join(root,target.packageKey),installed=false;
 try{const metadata=JSON.parse(await readFile(join(packageRoot,'package.json'),'utf8'));if(metadata.version!==entry.version)throw new Error('Installed Codex runtime does not match the lockfile.');installed=true;}catch(error){if(error.code!=='ENOENT')throw error;}
 if(!installed){
  await mkdir(cache,{recursive:true});let bytes;
  try{bytes=await readFile(archive);}catch(error){
   if(error.code!=='ENOENT')throw error;
   try{bytes=await downloadArchive(entry.resolved);}catch(error){
    if(!['ABORT_ERR','ETIMEDOUT','ECONNRESET'].includes(error.code))throw error;
    const partial=archive+'.partial';
    try{await exec('curl',['--fail','--location','--ipv4','--silent','--show-error','--connect-timeout','15','--max-time','180','--output',partial,entry.resolved],{windowsHide:true});bytes=await readFile(partial);}finally{await rm(partial,{force:true});}
   }
   verifyArchive(bytes,entry.integrity);await writeFile(archive,bytes);
  }
  verifyArchive(bytes,entry.integrity);
  await rm(unpack,{recursive:true,force:true});await mkdir(unpack,{recursive:true});
  await exec('tar',['-xzf',archive,'-C',unpack],{windowsHide:true});packageRoot=join(unpack,'package');
 }
 const native=join(packageRoot,'vendor',target.triple,'bin',target.binary);
 if(!(await stat(native)).isFile())throw new Error('Codex target archive is missing its executable.');
 await rm(destination,{recursive:true,force:true});await mkdir(join(destination,'bin'),{recursive:true});
 await cp(join(root,'node_modules/@openai/codex/bin/codex.js'),join(destination,'bin/codex.js'));
 await cp(join(packageRoot,'vendor'),join(destination,'vendor'),{recursive:true});
 await writeFile(join(destination,'package.json'),JSON.stringify({name:'kosal-bundled-codex',type:'module',version:lock.packages['node_modules/@openai/codex'].version}));
 await writeFile(join(destination,'runtime.json'),JSON.stringify({platform,arch,triple:target.triple,version:entry.version,integrity:entry.integrity},null,2));
 await rm(unpack,{recursive:true,force:true});
 return destination;
}
