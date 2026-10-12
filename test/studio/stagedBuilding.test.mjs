import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {shouldStageBuilding,requestedFloorCount,runStagedBuilding} from '../../studio/stagedBuilding.mjs';
import {runDesign} from '../../studio/codex.mjs';
import {mixedUseBuilding} from '../../web/src/studio/mixedUse.js';

const blueprint=()=>({schema:'kosal.studio.building.v1',id:'staged-test',name:'Four-floor centre',mode:'building',unit:'m',width:30,height:24,notes:['Concept only'],floors:Array.from({length:4},(_,i)=>({id:`f${i}`,name:`Level ${i}`,use:'mixed',elevation:i*4,storeyHeight:4,programme:i===0?'Auditorium with 150 seats':'Furnished offices',elements:[{id:`f${i}-core`,kind:'room',label:'Stair core',x:0,y:0,width:4,height:4,wallThickness:.18}]}))});
const completed=(base)=>({...base,notes:['Furniture allowance'],floors:base.floors.map(f=>({...f,elements:[...f.elements,{id:f.id+'-hall',kind:'room',label:'Hall',x:4,y:0,width:26,height:24,wallThickness:.18}],openings:[{id:f.id+'-door',kind:'door',x:4,y:1,width:1,rotation:90,swing:1}],fixtures:[{id:f.id+'-chair',type:'chair',label:'Chair',x:5,y:2,width:.5,height:.5,rotation:0}]}))});
test('staging selects new large buildings, counts basement, and leaves refinements alone',()=>{
 assert.equal(shouldStageBuilding('Create a six-floor university'),true);
 assert.equal(requestedFloorCount('Design a basement and five above-ground floors'),6);
 assert.equal(shouldStageBuilding('Rename a room in this six-floor university'),false);
 assert.equal(shouldStageBuilding('Improve this six-floor building design'),false);
 assert.equal(shouldStageBuilding('Create a three-floor bank'),false);
});
test('shared blueprint becomes one complete atomic proposal, with bounded one-floor contexts',async()=>{
 const original=mixedUseBuilding('staged-test'),snapshot=structuredClone(original),calls=[],events=[];
 const result=await runStagedBuilding({prompt:'Create a four-floor centre',project:original,onEvent:e=>events.push(e),request:async()=>blueprint(),generateFloor:async options=>{calls.push(options);return{message:'Review',proposal:completed(options.project)};}});
 assert.equal(result.proposal.floors.length,4);assert.equal(calls.length,4);assert.ok(calls.every(c=>c.project.floors.length===1));assert.equal(result.proposal.floors.reduce((n,f)=>n+f.fixtures.length,0),4);
 assert.deepEqual(original,snapshot);assert.equal(events.filter(e=>e.message.startsWith('Designing floor')).length,4);
});
test('cancellation between floors never returns or changes a partial building',async()=>{
 const original=mixedUseBuilding('staged-test'),snapshot=structuredClone(original),controller=new AbortController();let calls=0;
 await assert.rejects(runStagedBuilding({prompt:'Create four floors',project:original,signal:controller.signal,request:async()=>blueprint(),generateFloor:async options=>{calls++;controller.abort();return{proposal:completed(options.project)};}}),/cancelled/);
 assert.equal(calls,1);assert.deepEqual(original,snapshot);
});
test('missing floors and moved reserved cores are rejected after one correction attempt',async()=>{
 const original=mixedUseBuilding('staged-test');let calls=0;
 await assert.rejects(runStagedBuilding({prompt:'Create six floors',project:original,request:async()=>{calls++;return blueprint();},generateFloor:async()=>{throw Error('Must not run');}}),/all 6/);assert.equal(calls,2);
 calls=0;
 await assert.rejects(runStagedBuilding({prompt:'Create four floors',project:original,request:async()=>blueprint(),generateFloor:async options=>{calls++;const proposal=completed(options.project);proposal.floors[0].elements[0].x=1;return{proposal};}}),/reserved core/);assert.equal(calls,2);
});
test('actual subprocess pipeline expands 150 seats and assembles all four floors',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'arcloom-staged-test-')),script=join(dir,'fake.mjs'),plan=blueprint();
 try{
  await writeFile(script,`import fs from 'node:fs';let input='';for await(const c of process.stdin)input+=c;const schema=JSON.parse(fs.readFileSync(process.argv[process.argv.indexOf('--output-schema')+1],'utf8'));const plan=${JSON.stringify(plan)};let result;if(schema.properties.floors){result=plan;}else{const floorId=input.match(/containing ONLY floor (f\\d+)/)[1],f=plan.floors.find(f=>f.id===floorId);const base={...plan,floors:[{...f,openings:[],fixtures:[]}]};delete base.floors[0].programme;const make=${completed.toString()};result={message:'Review',proposal:make(base),edits:null,changes:null,fixturePatterns:floorId==='f0'?[{floorId,spaceId:'f0-hall',idPrefix:'f0-seat',x:6,y:4,rows:10,columns:15,rowSpacing:.9,columnSpacing:.7,fixture:{type:'chair',label:'Seat',width:.5,height:.5,rotation:0}}]:null};}fs.writeFileSync(process.argv[process.argv.indexOf('--output-last-message')+1],JSON.stringify(result));`);
  const original=mixedUseBuilding('staged-test'),result=await runDesign({prompt:'Create a four-floor centre with a 150-seat auditorium',project:original,runtime:{command:process.execPath,args:[script]}});
  assert.equal(result.proposal.floors.length,4);assert.equal(result.proposal.floors[0].fixtures.filter(f=>f.id.startsWith('f0-seat')).length,150);assert.deepEqual(original,mixedUseBuilding('staged-test'));
 }finally{await rm(dir,{recursive:true,force:true});}
});
