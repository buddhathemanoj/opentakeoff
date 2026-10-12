import {createHash} from 'node:crypto';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {validateBuildInfo} from '../../web/src/studio/buildInfo.js';

async function files(directory,prefix){
 const entries=await readdir(directory,{withFileTypes:true}),result=[];
 for(const entry of entries){
  const path=join(directory,entry.name),name=prefix+'/'+entry.name;
  if(entry.isDirectory())result.push(...await files(path,name));
  else if(entry.isFile())result.push({path,name});
  else throw new Error('Build identity requires regular runtime files.');
 }
 return result;
}
export async function runtimeDigest({root,codexDirectory,version,platform,arch,electronVersion}){
 const inputs=[...await files(join(root,'web/dist'),'web/dist'),...await files(join(root,'studio'),'studio'),...await files(codexDirectory,'codex'),{path:join(root,'desktop/main.cjs'),name:'desktop/main.cjs'}];
 for(const entry of await readdir(join(root,'web/src/studio')))if(entry.endsWith('.js'))inputs.push({path:join(root,'web/src/studio',entry),name:'web/src/studio/'+entry});
 const hash=createHash('sha256').update(JSON.stringify({version,platform,arch,electronVersion}));
 for(const input of inputs.filter(file=>file.name!=='web/dist/build-info.json').sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){
  const bytes=await readFile(input.path);hash.update(JSON.stringify([input.name,bytes.length])).update(bytes);
 }
 return hash.digest('hex');
}
export async function writeBuildInfo({root,codexDirectory,platform,arch}){
 const {version}=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
 const {version:electronVersion}=JSON.parse(await readFile(join(root,'node_modules/electron/package.json'),'utf8'));
 const contentDigest=await runtimeDigest({root,codexDirectory,version,platform,arch,electronVersion});
 const info=validateBuildInfo({schema:'arcloom.build.v1',version,platform,arch,electronVersion,builtAt:new Date().toISOString(),contentDigest,buildId:contentDigest.slice(0,12)});
 await writeFile(join(root,'web/dist/build-info.json'),JSON.stringify(info,null,2)+'\n');return info;
}
