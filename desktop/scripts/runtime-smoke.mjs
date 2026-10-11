import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile} from 'node:fs/promises';
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
  const html=await response.text();assert.ok(html.includes('Kosal Studio'));
  const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(match=>match[1]);assert.ok(assets.length>=2);
  for(const asset of assets)assert.equal((await fetch(url+asset)).status,200);
  const status=await fetch(url+'/api/studio/status');assert.equal(status.status,200);
  assert.equal((await status.json()).available,true);
  console.log(JSON.stringify({ok:true,platform:process.platform,arch:process.arch,codex:version.stdout.trim(),assets:assets.length}));
 }finally{await new Promise(resolve=>server.close(resolve));}
}
