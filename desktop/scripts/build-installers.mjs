import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

export function isDmgDetachBusy(output){return /Unable to detach device cleanly:[\s\S]{0,300}Resource busy/.test(output);}
export async function buildInstallers({platform,arch,prepackaged,output,run=runBuilder}={}){
 if(!['mac','win'].includes(platform)||!['arm64','x64'].includes(arch)||!prepackaged)throw new Error('Specify installer platform, architecture and verified app directory.');
 const args=[`--${platform}`,`--${arch}`,'--prepackaged',prepackaged,'--publish','never',...(output?[`--config.directories.output=${output}`]:[])];
 for(let attempt=0;attempt<2;attempt++){
  const result=await run(args);
  if(result.code===0)return;
  if(platform!=='mac'||attempt||!isDmgDetachBusy(result.output))throw new Error(`Installer build failed (exit ${result.code}).`);
  console.log('macOS could not eject its temporary installer disk. Retrying installer creation once.');
  // The completed builder has exited. Give macOS time to release its file handles.
  await new Promise(resolve=>setTimeout(resolve,1500));
 }
}
function runBuilder(args){
 const require=createRequire(import.meta.url),cli=require.resolve('electron-builder/cli.js');
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[cli,...args],{stdio:['ignore','pipe','pipe']});
  let output='';
  const capture=(stream,bytes)=>{stream.write(bytes);output=(output+bytes.toString()).slice(-30000);};
  child.stdout.on('data',bytes=>capture(process.stdout,bytes));child.stderr.on('data',bytes=>capture(process.stderr,bytes));
  child.once('error',reject);child.once('close',code=>resolve({code:code??1,output}));
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [platform,arch,prepackaged,output]=process.argv.slice(2);
 buildInstallers({platform,arch,prepackaged,output,run:runBuilder}).catch(error=>{console.error(error.message);process.exitCode=1;});
}
