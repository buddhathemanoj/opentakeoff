import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {codexLoginUrl,runLogin} from '../../studio/login.mjs';
test('sign-in only publishes official HTTPS OAuth URLs',()=>{
 assert.ok(codexLoginUrl('https://auth.openai.com/oauth/authorize?state=fixture'));
 for(const url of ['https://auth.openai.com.evil.example/oauth/authorize','http://auth.openai.com/oauth/authorize','https://auth.openai.com:444/oauth/authorize','https://user:secret@auth.openai.com/oauth/authorize','https://auth.openai.com/other','javascript:alert(1)'])assert.equal(codexLoginUrl(url),null);
});
test('bundled login stream handles split URLs, verifies completion, and cancels waiting subprocesses',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'arcloom-login-')),script=join(dir,'login.mjs');
 try{
  await writeFile(script,`let mode=process.argv[2];process.stdout.write('https://auth.openai.com/oauth/auth');setTimeout(()=>{process.stdout.write('orize?state=fixture\\n');if(mode==='wait')setTimeout(()=>process.exit(0),60000);else process.exit(0);},30);`);
  const runtime={command:process.execPath,args:[script,'ok'],env:{}},events=[];
  const result=await runLogin({runtime,status:async()=>({available:true,connected:true,method:'ChatGPT'}),onEvent:e=>events.push(e)});assert.equal(result.connected,true);assert.deepEqual(events,[{type:'auth',url:'https://auth.openai.com/oauth/authorize?state=fixture'}]);
  await assert.rejects(runLogin({runtime,status:async()=>({connected:false})}),/did not complete/);
  const controller=new AbortController();await assert.rejects(runLogin({runtime:{...runtime,args:[script,'wait']},signal:controller.signal,onEvent:()=>controller.abort(),status:async()=>({connected:true})}),/cancelled/);
  await assert.rejects(runLogin({runtime:{...runtime,args:[script,'wait']},timeoutMs:150,status:async()=>({connected:true})}),/expired/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
