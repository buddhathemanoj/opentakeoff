import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

// One isolated, cancellable model request. No draft is written into user storage.
export async function requestDesignJSON({instructions,schema,signal,onEvent=()=>{},runtime}) {
  if(signal?.aborted)throw new Error('Request cancelled.');
  const dir=await mkdtemp(join(tmpdir(),'arcloom-design-'));
  const schemaFile=join(dir,'response.schema.json'),output=join(dir,'response.json');
  let child,timer,cancel;
  try {
    await writeFile(schemaFile,JSON.stringify(schema));
    const args=[...runtime.args,'exec','--ignore-user-config','--ephemeral','--skip-git-repo-check','--sandbox','read-only','-c','features.shell_tool=false','-c','web_search="disabled"','--json','--output-schema',schemaFile,'--output-last-message',output,'-'];
    child=spawn(runtime.command,args,{cwd:dir,env:{...process.env,...runtime.env},stdio:['pipe','pipe','pipe'],windowsHide:true});
    let stderr='',buffer='',stopped=false;
    cancel=()=>{stopped=true;child.kill();};
    signal?.addEventListener('abort',cancel,{once:true});
    if(signal?.aborted)cancel();
    timer=setTimeout(cancel,600000);
    child.stdout.on('data',chunk=>{
      buffer+=chunk.toString();let newline;
      while((newline=buffer.indexOf('\n'))>=0){
        const line=buffer.slice(0,newline);buffer=buffer.slice(newline+1);
        try{const event=JSON.parse(line);if(event.type==='turn.failed')stderr=event.error?.message||'Codex could not complete this request.';}catch{/* Ignore non-event startup output. */}
      }
    });
    child.stderr.on('data',chunk=>{stderr=(stderr+chunk.toString()).slice(-6000);});
    child.stdin.on('error',()=>{});
    onEvent({type:'status',message:'Codex is planning your drawing…'});
    const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);child.stdin.end(instructions);});
    if(stopped||signal?.aborted)throw new Error(signal?.aborted?'Request cancelled.':'Codex reached the generation time limit. Your drawing is unchanged. Please retry.');
    if(code!==0){
      if(/rate.limit|usage.limit/i.test(stderr))throw new Error('Your Codex usage limit was reached. Try again after it resets.');
      if(/login|unauthorized|authentication|401/i.test(stderr)){const error=new Error('Your Codex session needs signing in again. Use Sign in to Codex in Arcloom.');error.code='CODEX_AUTH_REQUIRED';throw error;}
      throw new Error('Codex could not finish this request. Check your connection and retry.');
    }
    return JSON.parse(await readFile(output,'utf8'));
  }finally{
    clearTimeout(timer);signal?.removeEventListener('abort',cancel);
    if(child&&child.exitCode===null)child.kill();
    await rm(dir,{recursive:true,force:true});
  }
}
