import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {expandFixturePatterns} from '../../studio/fixturePatterns.mjs';
import {mixedUseBuilding} from '../../web/src/studio/mixedUse.js';
import {convertBuildingUnit} from '../../web/src/studio/building.js';
import {runDesign} from '../../studio/codex.mjs';
const grid={floorId:'f0',spaceId:'auditorium',idPrefix:'seat',x:1,y:1,rows:10,columns:15,rowSpacing:.9,columnSpacing:.7,fixture:{type:'chair',label:'Auditorium seat',width:.5,height:.5,rotation:0}};
test('compact grids expand into all 150 individually editable seats with physical-unit parity',()=>{
 const p=mixedUseBuilding('grid');p.floors[0].fixtures=[];p.floors[0].elements=[{id:'auditorium',kind:'room',label:'Auditorium',x:0,y:0,width:30,height:24,wallThickness:.18}];const snapshot=JSON.stringify(p),result=expandFixturePatterns(p,[grid]);
 assert.equal(result.floors[0].fixtures.length,150);assert.equal(result.floors[0].fixtures[149].id,'seat-10-15');assert.equal(JSON.stringify(p),snapshot);
 const ft=convertBuildingUnit(p,'ft'),pattern={...grid,x:grid.x/.3048,y:grid.y/.3048,rowSpacing:grid.rowSpacing/.3048,columnSpacing:grid.columnSpacing/.3048,fixture:{...grid.fixture,width:grid.fixture.width/.3048,height:grid.fixture.height/.3048}};
 const converted=convertBuildingUnit(expandFixturePatterns(ft,[pattern]),'m');for(let i=0;i<150;i++)for(const k of ['x','y','width','height'])assert.ok(Math.abs(converted.floors[0].fixtures[i][k]-result.floors[0].fixtures[i][k])<1e-8);
});
test('grid expansion rejects collisions, unsupported spacing, oversized counts and invalid geometry atomically',()=>{
 const p=mixedUseBuilding('bad-grid');p.floors[0].fixtures=[];p.floors[0].elements=[{id:'auditorium',kind:'room',label:'Auditorium',x:0,y:0,width:30,height:24,wallThickness:.18}];const original=JSON.stringify(p);
 for(const patterns of [[grid,grid],[{...grid,rows:400,columns:400}],[{...grid,x:29}],[{...grid,rowSpacing:.1}],[{...grid,floorId:'missing'}],[{...grid,spaceId:'missing'}],[{...grid,x:0}],[{...grid,fixture:{...grid.fixture,type:'unknown'}}]])assert.throws(()=>expandFixturePatterns(p,patterns));
 assert.equal(JSON.stringify(p),original);
});
test('Codex expands generated grids before returning a normal review proposal and rejects mixed transports',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'arcloom-grid-')),script=join(dir,'fake.mjs'),p=mixedUseBuilding('runtime-grid');p.floors[0].fixtures=[];p.floors[0].elements=[{id:'auditorium',kind:'room',label:'Auditorium',x:0,y:0,width:30,height:24,wallThickness:.18}];
 try{
  const result={message:'Proposed auditorium seating',proposal:p,edits:null,changes:null,fixturePatterns:[grid]};
  const write=async value=>writeFile(script,`import fs from 'node:fs';for await(const c of process.stdin){}fs.writeFileSync(process.argv[process.argv.indexOf('--output-last-message')+1],${JSON.stringify(JSON.stringify(value))});`);
  await write(result);const proposal=await runDesign({project:p,prompt:'150 seats',runtime:{command:process.execPath,args:[script]}});assert.equal(proposal.proposal.floors[0].fixtures.length,150);assert.equal('fixturePatterns' in proposal,false);
  await write({...result,proposal:null});await assert.rejects(runDesign({project:p,prompt:'150 seats',runtime:{command:process.execPath,args:[script]}}),/full building proposal/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
