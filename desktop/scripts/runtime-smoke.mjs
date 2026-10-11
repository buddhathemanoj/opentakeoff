import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {startStudioServer} from '../../studio/server.mjs';
import {codexCommand} from '../../studio/codex.mjs';
const exec=promisify(execFile);
export async function smoke(){
 const resources=process.resourcesPath,root=join(resources,'app.asar');
 const runtime=JSON.parse(await readFile(join(resources,'codex/runtime.json'),'utf8'));
 assert.equal(runtime.platform,process.platform);assert.equal(runtime.arch,process.arch);
 const binary=codexCommand();assert.equal(binary.args[0],join(resources,'codex/bin/codex.js'));
 const version=await exec(binary.command,[...binary.args,'--version'],{env:{...process.env,...binary.env},timeout:15000,windowsHide:true});
 assert.ok(version.stdout.includes(runtime.version.split('-')[0]));
 const {server,url}=await startStudioServer({root:join(root,'web/dist'),port:0});
 try{
  const response=await fetch(url);assert.equal(response.status,200);
  const html=await response.text();assert.ok(html.includes('Arcloom'));
  const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(match=>match[1]);assert.ok(assets.length>=2);
  for(const asset of assets)assert.equal((await fetch(url+asset)).status,200);
  const worker=(await readdir(join(root,'web/dist/assets'))).find(name=>/^pdf\.worker.*\.mjs$/.test(name));assert.ok(worker,'Compiled PDF module worker is missing');
  const workerResponse=await fetch(url+'/assets/'+worker);assert.equal(workerResponse.status,200);assert.equal(workerResponse.headers.get('content-type'),'text/javascript');assert.equal(workerResponse.headers.get('x-content-type-options'),'nosniff');
  for(const license of ['remocn-MIT.txt','codex-Apache-2.0.txt','three-MIT.txt','dm-sans-OFL.txt','paper-shaders-Apache-2.0.txt','lucide-ISC.txt'])assert.ok((await readFile(join(resources,'licenses',license),'utf8')).length>100);
  const status=await fetch(url+'/api/studio/status');assert.equal(status.status,200);
  assert.equal((await status.json()).available,true);
  console.log(JSON.stringify({ok:true,platform:process.platform,arch:process.arch,codex:version.stdout.trim(),assets:assets.length,pdfWorker:true,licenses:6}));
 }finally{await new Promise(resolve=>server.close(resolve));}
}
