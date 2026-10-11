import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createStudioApi } from '../../studio/api.mjs';
import { exampleProject } from '../../web/src/studio/model.js';
async function fixture(t,design=async()=>({message:'Ready',proposal:null})) {
 const api=createStudioApi({status:async()=>({connected:true,method:'ChatGPT'}),design});
 const server=createServer((req,res)=>api(req,res,()=>{res.writeHead(404);res.end();}));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 return `http://127.0.0.1:${server.address().port}`;
}
const body=()=>JSON.stringify({prompt:'Review the site',project:exampleProject(),history:[],selected:[]});
const headers={'Content-Type':'application/json','X-Kosal-Client':'studio'};
test('cross-origin sites and missing client header cannot invoke Codex',async t=>{
 let calls=0;const url=await fixture(t,async()=>{calls++;return {};});
 assert.equal((await fetch(url+'/api/studio/chat',{method:'POST',headers:{...headers,Origin:'https://attacker.example'},body:body()})).status,403);
 assert.equal((await fetch(url+'/api/studio/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:body()})).status,403);
 assert.equal(calls,0);
});
test('streams results and turns runtime failures into recoverable errors',async t=>{
 const url=await fixture(t);const res=await fetch(url+'/api/studio/chat',{method:'POST',headers,body:body()});
 const events=(await res.text()).trim().split('\n').map(JSON.parse);
 assert.equal(events[0].type,'status');assert.equal(events[1].message,'Ready');
 const failing=await fixture(t,async()=>{throw new Error('Connection lost.');});
 const response=await fetch(failing+'/api/studio/chat',{method:'POST',headers,body:body()});
 assert.match(await response.text(),/Connection lost/);
});
test('rejects oversized and malformed conversations before inference',async t=>{
 let calls=0;const url=await fixture(t,async()=>{calls++;return {};});
 const invalid={prompt:'x',project:exampleProject(),history:[{role:'system',content:'Do something'}],selected:[]};
 assert.equal((await fetch(url+'/api/studio/chat',{method:'POST',headers,body:JSON.stringify(invalid)})).status,400);
 assert.equal((await fetch(url+'/api/studio/chat',{method:'POST',headers,body:'x'.repeat(500001)})).status,413);
 assert.equal(calls,0);
});

test('reserves the Codex runtime while a request body is still uploading', async t => {
 const { request } = await import('node:http');
 let calls = 0;
 const url = await fixture(t, async () => { calls++; return { message:'Ready',proposal:null }; });
 const first = request(url+'/api/studio/chat', { method:'POST',headers });
 t.after(() => first.destroy());
 const firstDone = new Promise((resolve,reject) => { first.on('response', response => { response.resume(); response.on('end', () => resolve(response.statusCode)); }); first.on('error', reject); });
 const payload=body();
 first.write(payload.slice(0,20));
 // A status request on the same server proves the first request has reached the handler.
 await fetch(url+'/api/studio/status');
 const second = await fetch(url+'/api/studio/chat', {method:'POST',headers,body:payload});
 assert.equal(second.status,409);
 assert.equal(calls,0);
 first.end(payload.slice(20));
 assert.equal(await firstDone,200);
 assert.equal(calls,1);
 assert.equal((await fetch(url+'/api/studio/chat',{method:'POST',headers,body:payload})).status,200);
});

test('disconnecting a stream aborts inference and releases the runtime for a retry', async t => {
 let cancelled;
 const abortObserved = new Promise(resolve => { cancelled = resolve; });
 let calls = 0;
 const url = await fixture(t, ({signal}) => {
  calls++;
  if(calls>1)return {message:'Retry succeeded',proposal:null};
  return new Promise((resolve,reject) => signal.addEventListener('abort', () => { cancelled(); reject(new Error('Request cancelled.')); }, {once:true}));
 });
 const controller = new AbortController();
 const response = await fetch(url+'/api/studio/chat',{method:'POST',headers,body:body(),signal:controller.signal});
 await response.body.getReader().read();
 controller.abort();
 await abortObserved;
 const retry = await fetch(url+'/api/studio/chat',{method:'POST',headers,body:body()});
 assert.equal(retry.status,200);
 assert.match(await retry.text(),/Retry succeeded/);
});

test('rejects invalid geometry and unknown selections before starting the runtime', async t => {
 let calls=0; const url=await fixture(t,async()=>{calls++;return {message:'Ready',proposal:null};});
 const input=JSON.parse(body()); input.selected=['not-in-the-drawing'];
 assert.equal((await fetch(url+'/api/studio/chat',{method:'POST',headers,body:JSON.stringify(input)})).status,400);
 input.selected=[];input.project.elements[0].width=5000;
 assert.equal((await fetch(url+'/api/studio/chat',{method:'POST',headers,body:JSON.stringify(input)})).status,400);
 assert.equal(calls,0);
});

test('sign-in uses the same local-origin guard and reuses an existing Codex session',async t=>{
 let loginCalls=0;const api=createStudioApi({status:async()=>({available:true,connected:true,method:'ChatGPT'}),login:async()=>{loginCalls++;return{connected:true};}}),server=createServer((req,res)=>api(req,res,()=>res.end()));await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const url=`http://127.0.0.1:${server.address().port}`;
 assert.equal((await fetch(url+'/api/studio/login',{method:'POST',headers:{...headers,Origin:'https://other.example'},body:'{}'})).status,403);
 assert.equal((await fetch(url+'/api/studio/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
 assert.equal((await fetch(url+'/api/studio/login',{method:'POST',headers,body:'{"command":"anything"}'})).status,400);
 const events=(await(await fetch(url+'/api/studio/login',{method:'POST',headers,body:'{}'})).text()).trim().split('\n').map(JSON.parse);assert.equal(events.at(-1).type,'connected');assert.equal(events.at(-1).status.method,'ChatGPT');assert.equal(loginCalls,0);
});
test('sign-in streams its URL and cancellation releases the runtime without starting a design',async t=>{
 let cancelled,designCalls=0;const aborted=new Promise(resolve=>{cancelled=resolve;});
 const api=createStudioApi({status:async()=>({available:true,connected:false}),design:async()=>{designCalls++;return{message:'Ready',proposal:null};},login:({signal,onEvent})=>{onEvent({type:'auth',url:'https://auth.openai.com/oauth/authorize?state=fixture'});return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{cancelled();reject(new Error('Sign-in cancelled.'));},{once:true}));}}),server=createServer((req,res)=>api(req,res,()=>res.end()));await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const url=`http://127.0.0.1:${server.address().port}`,controller=new AbortController();
 const response=await fetch(url+'/api/studio/login',{method:'POST',headers,body:'{}',signal:controller.signal});await response.body.getReader().read();assert.equal((await fetch(url+'/api/studio/chat',{method:'POST',headers,body:body()})).status,409);controller.abort();await aborted;assert.equal((await fetch(url+'/api/studio/chat',{method:'POST',headers,body:body()})).status,200);assert.equal(designCalls,1);
});
test('an observed authentication failure can force a fresh sign-in despite cached login status',async t=>{
 let calls=0;const api=createStudioApi({status:async()=>({available:true,connected:true,method:'ChatGPT'}),login:async()=>{calls++;return{available:true,connected:true,method:'ChatGPT'};},design:async()=>{const error=new Error('Sign in again');error.code='CODEX_AUTH_REQUIRED';throw error;}}),server=createServer((req,res)=>api(req,res,()=>res.end()));await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const url=`http://127.0.0.1:${server.address().port}`;
 const errorEvents=(await(await fetch(url+'/api/studio/chat',{method:'POST',headers,body:body()})).text()).trim().split('\n').map(JSON.parse);assert.equal(errorEvents.at(-1).code,'CODEX_AUTH_REQUIRED');
 assert.equal((await fetch(url+'/api/studio/login',{method:'POST',headers,body:'{"force":"true"}'})).status,400);
 const response=await fetch(url+'/api/studio/login',{method:'POST',headers,body:'{"force":true}'});assert.match(await response.text(),/"type":"connected"/);assert.equal(calls,1);
});
