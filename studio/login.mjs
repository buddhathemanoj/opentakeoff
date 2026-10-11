import {spawn} from 'node:child_process';
import {codexCommand,codexStatus} from './codex.mjs';
export function codexLoginUrl(value){
 try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='auth.openai.com'&&!url.username&&!url.password&&(!url.port||url.port==='443')&&url.pathname==='/oauth/authorize'?url.href:null;}catch{return null;}
}
export async function runLogin({signal,onEvent=()=>{},runtime,status=codexStatus,timeoutMs=300000}={}){
 if(signal?.aborted)throw new Error('Sign-in cancelled.');
 const bin=runtime||codexCommand(),child=spawn(bin.command,[...bin.args,'login'],{env:{...process.env,...bin.env},stdio:['ignore','pipe','pipe'],windowsHide:true});
 let output='',lastUrl='',stopped=false;
 const cancel=()=>{stopped=true;child.kill();};signal?.addEventListener('abort',cancel,{once:true});
 const timer=setTimeout(cancel,timeoutMs);
 const receive=chunk=>{
  output=(output+chunk.toString()).slice(-16000);
  // Buffer across chunks: do not publish a partial OAuth URL before its delimiter.
  for(const match of output.matchAll(/https:\/\/auth\.openai\.com\/[^\s\x1b"'<>]+(?=\s|\x1b)/g)){
   const url=codexLoginUrl(match[0]);if(url&&url!==lastUrl){lastUrl=url;onEvent({type:'auth',url});}
  }
 };
 child.stdout.on('data',receive);child.stderr.on('data',receive);
 try{
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
  if(stopped)throw new Error(signal?.aborted?'Sign-in cancelled.':'Sign-in expired. Try again.');
  if(code!==0)throw new Error(/address already in use|port.*1455/i.test(output)?'Another Codex sign-in is open. Finish or close it, then try again.':'Codex could not complete sign-in. Try again.');
  const connected=await status();if(!connected.connected)throw new Error('Sign-in did not complete. Try again.');
  return connected;
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);if(child.exitCode===null)child.kill();}
}
