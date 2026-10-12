import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {runDesign} from '../../studio/codex.mjs';import {mixedUseBuilding} from '../../web/src/studio/mixedUse.js';
test('invalid AI geometry gets one minimal repair attempt and repeated failure is bounded',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'arcloom-repair-test-')),script=join(dir,'fake-codex.mjs'),fixture=join(dir,'fixture.json'),counter=join(dir,'counter');
 const p=mixedUseBuilding('repair-case');
 try{
  await writeFile(fixture,JSON.stringify(p));
  await writeFile(script,`#!/usr/bin/env node\nimport fs from 'node:fs';let input='';for await(const chunk of process.stdin)input+=chunk;const n=Number(fs.existsSync(${JSON.stringify(counter)})?fs.readFileSync(${JSON.stringify(counter)},'utf8'):0)+1;fs.writeFileSync(${JSON.stringify(counter)},String(n));if(n>1&&!input.includes('MINIMAL REPAIR'))process.exit(3);let p=JSON.parse(fs.readFileSync(${JSON.stringify(fixture)},'utf8'));if(n===1||process.argv.includes('--always-invalid'))p.floors[0].openings[0]={...p.floors[0].openings[0],x:29.5,y:10,width:1,rotation:0};fs.writeFileSync(process.argv[process.argv.indexOf('--output-last-message')+1],JSON.stringify({message:'Draft for review',proposal:p,edits:null}));console.log(JSON.stringify({type:'thread.started'}));`,{mode:0o755});
  const runtime={command:process.execPath,args:[script],env:{}},events=[];
  const result=await runDesign({project:p,prompt:'Refine this building',onEvent:e=>events.push(e),runtime});
  assert.deepEqual(result.proposal,p);assert.equal(await readFile(counter,'utf8'),'2');assert.equal(events.filter(e=>e.message.includes('Refining')).length,1);assert.deepEqual(p,mixedUseBuilding('repair-case'));
  await writeFile(counter,'0');
  await assert.rejects(runDesign({project:p,prompt:'Refine this building',runtime:{...runtime,args:[script,'--always-invalid']}}),/Opening.*ends outside/);assert.equal(await readFile(counter,'utf8'),'2');
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('compact repair targets the failed new draft and retains its repeated furniture grids',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'arcloom-draft-repair-')),script=join(dir,'fake.mjs'),counter=join(dir,'counter'),current=mixedUseBuilding('draft-repair'),draft=structuredClone(current);
 draft.floors=draft.floors.map(f=>({...f,id:'new-'+f.id}));draft.floors[0].fixtures=[];draft.floors[0].elements=[{id:'auditorium',kind:'room',label:'Auditorium',x:0,y:0,width:30,height:24,wallThickness:.18}];draft.floors[0].openings[0].width=.2;
 const patterns=[{floorId:'new-f0',spaceId:'auditorium',idPrefix:'aud-seat',x:1,y:1,rows:10,columns:15,rowSpacing:.9,columnSpacing:.7,fixture:{type:'chair',label:'Seat',width:.5,height:.5,rotation:0}}];
 const edit={floorId:'new-f0',collection:'openings',targetId:draft.floors[0].openings[0].id,label:null,x:null,y:null,width:.8,height:null,rotation:null};
 try{
  const first={message:'New draft',proposal:draft,edits:null,changes:null,fixturePatterns:patterns},second={message:'Corrected opening for review',proposal:null,edits:[edit],changes:null,fixturePatterns:null};
  await writeFile(script,`import fs from 'node:fs';for await(const c of process.stdin){}const n=fs.existsSync(${JSON.stringify(counter)})?1:0;fs.writeFileSync(${JSON.stringify(counter)},'1');fs.writeFileSync(process.argv[process.argv.indexOf('--output-last-message')+1],JSON.stringify(n?${JSON.stringify(second)}:${JSON.stringify(first)}));`);
  const snapshots=[],result=await runDesign({project:current,prompt:'New auditorium',runtime:{command:process.execPath,args:[script]},onDraft:value=>snapshots.push(value)});
  assert.equal(result.proposal.floors[0].id,'new-f0');assert.equal(result.proposal.floors[0].openings[0].width,.8);assert.equal(result.proposal.floors[0].fixtures.length,150);assert.equal(snapshots.length,2);assert.equal(snapshots[1].repair,true);assert.deepEqual(current,mixedUseBuilding('draft-repair'));
 }finally{await rm(dir,{recursive:true,force:true});}
});
