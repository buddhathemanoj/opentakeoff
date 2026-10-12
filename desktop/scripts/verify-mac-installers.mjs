import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readdir,mkdir,copyFile,stat} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
const exec=promisify(execFile),root=resolve(process.argv[2]||'release'),verified=join(root,'verified');
// Refuse old output rather than uploading a stale installer after a failed build.
await mkdir(verified);
let count=0,failures=0;
for(const entry of await readdir(root,{withFileTypes:true})){
 const extension=extname(entry.name);if(!entry.isFile()||!['.dmg','.zip'].includes(extension))continue;
 const file=join(root,entry.name);
 try{
  await exec(extension==='.dmg'?'hdiutil':'unzip',extension==='.dmg'?['verify',file]:['-t',file],{timeout:120000,maxBuffer:2*1024*1024});
  await copyFile(file,join(verified,entry.name));count++;console.log('Verified '+entry.name);
  try{const blockmap=file+'.blockmap';if((await stat(blockmap)).isFile())await copyFile(blockmap,join(verified,entry.name+'.blockmap'));}catch(error){if(error.code!=='ENOENT')throw error;}
 }catch(error){failures++;console.error('Installer verification failed: '+entry.name+' — '+error.message);}
}
if(!count||failures){console.error(`${count} valid installer(s) preserved; ${failures} failed verification.`);process.exitCode=1;}
