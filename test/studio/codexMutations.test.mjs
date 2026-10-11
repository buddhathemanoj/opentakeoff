import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {runDesign} from '../../studio/codex.mjs';import {mixedUseBuilding} from '../../web/src/studio/mixedUse.js';
test('Codex compact item changes expand into a review proposal and reject conflicting full replacements',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'arcloom-mutations-')),script=join(dir,'fake.mjs'),p=mixedUseBuilding('compact-runtime'),change={operation:'add',floorId:'f2',collection:'fixtures',targetId:'new-planter',item:{id:'new-planter',type:'plant',label:'Planter',x:5,y:5,width:.6,height:.6,rotation:0}};
 try{
  const response={message:'Proposed one planter',proposal:null,edits:null,changes:[change]};
  const writeFake=async result=>writeFile(script,`import fs from 'node:fs';for await(const chunk of process.stdin){}fs.writeFileSync(process.argv[process.argv.indexOf('--output-last-message')+1],${JSON.stringify(JSON.stringify(result))});`);
  await writeFake(response);const events=[],result=await runDesign({project:p,prompt:'Add one planter',runtime:{command:process.execPath,args:[script]},onEvent:e=>events.push(e)}),expected=structuredClone(p);expected.floors[2].fixtures.push(change.item);assert.deepEqual(result.proposal,expected);assert.equal('changes' in result,false);assert.equal('edits' in result,false);assert.ok(events.some(e=>e.message==='Checking 1 item change…'));assert.deepEqual(p,mixedUseBuilding('compact-runtime'));
  await writeFake({...response,proposal:p});await assert.rejects(runDesign({project:p,prompt:'Add one planter',runtime:{command:process.execPath,args:[script]}}),/conflicting design changes/);assert.deepEqual(p,mixedUseBuilding('compact-runtime'));
 }finally{await rm(dir,{recursive:true,force:true});}
});
