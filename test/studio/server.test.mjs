import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startStudioServer} from '../../studio/server.mjs';
test('packaged PDF module workers are served as executable JavaScript with nosniff',async()=>{
 const root=await mkdtemp(join(tmpdir(),'kosal-worker-'));let server;
 try{
  await writeFile(join(root,'pdf.worker.mjs'),'export const worker = true;');
  const running=await startStudioServer({root,port:0});server=running.server;
  const response=await fetch(running.url+'/pdf.worker.mjs');assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'text/javascript');assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.match(await response.text(),/export const worker/);
 }finally{if(server)await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}
});
