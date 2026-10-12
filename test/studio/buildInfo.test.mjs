import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {runtimeDigest,writeBuildInfo} from '../../desktop/scripts/build-info.mjs';
import {validateBuildInfo} from '../../web/src/studio/buildInfo.js';

test('build identity survives metadata rewrites and changes with actual shipped runtime content',async()=>{
 const root=await mkdtemp(join(tmpdir(),'arcloom-build-'));
 try{
  for(const dir of ['web/dist/assets','studio','desktop','web/src/studio','codex','node_modules/electron'])await mkdir(join(root,dir),{recursive:true});
  const rows={'package.json':JSON.stringify({version:'0.1.0-beta.1'}),'node_modules/electron/package.json':JSON.stringify({version:'44.7.0'}),'web/dist/index.html':'<html>Arcloom</html>','web/dist/assets/app.js':'initial UI','studio/server.mjs':'local server','desktop/main.cjs':'desktop runtime','web/src/studio/model.js':'model','codex/runtime.json':'verified target','codex/binary':'native bytes'};
  for(const [file,bytes] of Object.entries(rows))await writeFile(join(root,file),bytes);
  const options={root,codexDirectory:join(root,'codex'),platform:'darwin',arch:'arm64'};
  const first=await writeBuildInfo(options),second=await writeBuildInfo(options);
  assert.equal(first.contentDigest,second.contentDigest);assert.equal(first.buildId,second.buildId);
  assert.deepEqual(validateBuildInfo(JSON.parse(await readFile(join(root,'web/dist/build-info.json'),'utf8'))),second);
  assert.equal(await runtimeDigest({...options,...first}),first.contentDigest);
  for(const path of ['web/dist/assets/app.js','studio/server.mjs','desktop/main.cjs','web/src/studio/model.js','codex/binary']){
   const original=await readFile(join(root,path));await writeFile(join(root,path),'changed runtime');
   assert.notEqual(await runtimeDigest({...options,...first}),first.contentDigest,path);
   await writeFile(join(root,path),original);
  }
  assert.notEqual(await runtimeDigest({...options,...first,arch:'x64'}),first.contentDigest);
  assert.notEqual(await runtimeDigest({...options,...first,version:'0.1.0-beta.2'}),first.contentDigest);
  assert.throws(()=>validateBuildInfo({...first,buildId:'wrong'}));
  assert.throws(()=>validateBuildInfo({...first,builtAt:'invalid'}));
  assert.throws(()=>validateBuildInfo({...first,platform:'unknown'}));
 }finally{await rm(root,{recursive:true,force:true});}
});
