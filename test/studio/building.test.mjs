import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mixedUseBuilding} from '../../web/src/studio/mixedUse.js';
import {validateProject} from '../../web/src/studio/model.js';
import {projectView,applyView,buildingStats,convertBuildingUnit,editFloorItem,fixtureFrame} from '../../web/src/studio/building.js';
import {applyDesignEdits} from '../../studio/edits.mjs';
test('three tenants have distinct furnished plans and aligned circulation cores',()=>{
 const p=mixedUseBuilding('test-building');
 assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))),p);
 assert.deepEqual(p.floors.map(f=>f.use),['bank','cafe','office']);
 assert.deepEqual(buildingStats(p),{floors:3,grossArea:2160,spaces:66,openings:118,fixtures:278});
 for(const floor of p.floors){
  assert.ok(floor.openings.some(o=>o.kind==='door'));assert.ok(floor.openings.some(o=>o.kind==='window'));
  assert.deepEqual(floor.elements.filter(e=>/Stair [AB]|Lift lobby/.test(e.label)).map(({x,y,width,height})=>({x,y,width,height})),p.floors[0].elements.filter(e=>/Stair [AB]|Lift lobby/.test(e.label)).map(({x,y,width,height})=>({x,y,width,height})));
 }
 assert.ok(p.floors[0].fixtures.some(i=>i.type==='atm'));
 assert.ok(p.floors[1].fixtures.some(i=>i.type==='kitchen'));
 assert.ok(p.floors[2].fixtures.filter(i=>i.type==='desk').length>=24);
});
test('editing one floor preserves the other floors and architectural details',()=>{
 const p=mixedUseBuilding('test-building'),view=projectView(p,'f1');
 const next=validateProject(applyView(p,{...view,elements:view.elements.map((e,i)=>i===11?{...e,label:'Chef kitchen'}:e)},'f1'));
 assert.equal(next.floors[1].elements[11].label,'Chef kitchen');
 assert.deepEqual(next.floors[0],p.floors[0]);assert.deepEqual(next.floors[2],p.floors[2]);
 assert.deepEqual(next.floors[1].fixtures,p.floors[1].fixtures);assert.deepEqual(next.floors[1].openings,p.floors[1].openings);
});
test('rejects duplicate floor elevations, IDs and out-of-bound fixtures or openings',()=>{
 const p=mixedUseBuilding('test-building');
 const bad=structuredClone(p);bad.floors[1].elevation=0;assert.throws(()=>validateProject(bad),/distinct elevation/);
 const duplicate=structuredClone(p);duplicate.floors[1].fixtures[0].id=p.floors[0].fixtures[0].id;assert.throws(()=>validateProject(duplicate),/unique IDs/);
 const fixture=structuredClone(p);fixture.floors[1].fixtures[0].x=29.9;assert.throws(()=>validateProject(fixture),/outside/);
 const opening=structuredClone(p);opening.floors[0].openings[0].y=24;assert.throws(()=>validateProject(opening),/outside/);
});
test('AI edits produce a separate validated proposal without losing untouched details',()=>{
 const p=mixedUseBuilding('test-building'),item=p.floors[2].elements.find(e=>e.label==='Meeting room A');
 const edit={floorId:'f2',collection:'spaces',targetId:item.id,label:'Client meeting room',x:null,y:null,width:null,height:null,rotation:null};
 const next=applyDesignEdits(p,[edit]);
 assert.equal(next.floors[2].elements.find(e=>e.id===item.id).label,'Client meeting room');
 assert.equal(p.floors[2].elements.find(e=>e.id===item.id).label,'Meeting room A');
 assert.deepEqual(next.floors[0],p.floors[0]);assert.deepEqual(next.floors[1],p.floors[1]);
 assert.throws(()=>applyDesignEdits(p,[{...edit,x:29}]),/outside/);
 assert.throws(()=>applyDesignEdits(p,[{...edit,targetId:'missing'}]),/does not exist/);
});

test('review warnings accept a whole multi-floor proposal and keep floor context',async()=>{
 const {layoutWarnings}=await import('../../web/src/studio/model.js');
 const p=mixedUseBuilding('warnings-building');assert.deepEqual(layoutWarnings(p),[]);
 const a=p.floors[1].elements[0];p.floors[1].elements.push({...a,id:'overlap-test'});
 assert.ok(layoutWarnings(p).some(w=>w.includes('Level 1')&&w.includes('overlaps')));
});

test('physical wall and opening limits survive metre/feet round trips on every floor',()=>{
 const p=mixedUseBuilding('units');
 p.floors[0].elements[0].wallThickness=.8;
 p.floors[1].openings[0].width=.3;
 const feet=convertBuildingUnit(p,'ft'),back=convertBuildingUnit(feet,'m');
 for(let f=0;f<p.floors.length;f++){
  assert.equal(feet.floors[f].elevation,p.floors[f].elevation);
  assert.equal(feet.floors[f].storeyHeight,p.floors[f].storeyHeight);
  for(const key of ['elements','fixtures','openings'])for(let i=0;i<p.floors[f][key].length;i++){
   const a=p.floors[f][key][i],b=back.floors[f][key][i];
   for(const field of ['x','y','width','height','wallThickness'])if(a[field]!==undefined)assert.ok(Math.abs(a[field]-b[field])<1e-8,field);
   assert.equal(a.id,b.id);
  }
 }
});
test('detail edits preserve unrelated floors, reject invalid geometry, and delete only their target',()=>{
 const p=mixedUseBuilding('detail-edit'),item=p.floors[1].fixtures[0];
 const next=editFloorItem(p,'f1',item.id,{rotation:90,x:item.x+.1});
 assert.equal(next.floors[1].fixtures[0].rotation,90);
 assert.deepEqual(next.floors[0],p.floors[0]);assert.deepEqual(next.floors[2],p.floors[2]);
 assert.deepEqual(next.floors[1].openings,p.floors[1].openings);
 assert.throws(()=>editFloorItem(p,'f1',item.id,{x:100}),/outside/);
 assert.deepEqual(p.floors[1].fixtures[0],item);
 const removed=editFloorItem(next,'f1',item.id,null);
 assert.equal(removed.floors[1].fixtures.length,next.floors[1].fixtures.length-1);
 assert.deepEqual(removed.floors[1].elements,next.floors[1].elements);
});
test('rotated fixture details stay inside the unchanged footprint at all quarter turns',()=>{
 for(const rotation of [0,90,180,270]){
  const item={x:3,y:4,width:2,height:.8,rotation},frame=fixtureFrame(item);
  const corners=[[0,0],[frame.width,0],[0,frame.height],[frame.width,frame.height]].map(([x,y])=>frame.point(x,y));
  assert.ok(Math.abs(Math.min(...corners.map(p=>p.x))-3)<1e-9);
  assert.ok(Math.abs(Math.max(...corners.map(p=>p.x))-5)<1e-9);
  assert.ok(Math.abs(Math.min(...corners.map(p=>p.y))-4)<1e-9);
  assert.ok(Math.abs(Math.max(...corners.map(p=>p.y))-4.8)<1e-9);
 }
});

test('room translation carries contained furniture and boundary openings without changing their sizes or unrelated floors',()=>{
 const p=mixedUseBuilding('room-move'),f=p.floors[0],room=f.elements.find(e=>e.label==='Branch manager'),inside=f.fixtures.filter(i=>i.x>=room.x&&i.y>=room.y&&i.x+i.width<=room.x+room.width&&i.y+i.height<=room.y+room.height);
 assert.ok(inside.length);const door=f.openings.find(o=>o.kind==='door'&&o.y===room.y+room.height&&o.x>=room.x&&o.x+o.width<=room.x+room.width);assert.ok(door);
 const next=editFloorItem(p,'f0',room.id,{x:room.x-1,y:room.y+1},{moveDetails:true});
 for(const item of inside){const moved=next.floors[0].fixtures.find(i=>i.id===item.id);assert.equal(moved.x,item.x-1);assert.equal(moved.y,item.y+1);assert.equal(moved.width,item.width);assert.equal(moved.height,item.height);}
 const movedDoor=next.floors[0].openings.find(o=>o.id===door.id);assert.equal(movedDoor.x,door.x-1);assert.equal(movedDoor.y,door.y+1);assert.equal(movedDoor.width,door.width);
 assert.deepEqual(next.floors[1],p.floors[1]);assert.deepEqual(next.floors[2],p.floors[2]);
 const alone=editFloorItem(p,'f0',room.id,{x:room.x-1,y:room.y+1},{moveDetails:false});assert.deepEqual(alone.floors[0].fixtures,f.fixtures);assert.deepEqual(alone.floors[0].openings,f.openings);
 const renamed=editFloorItem(p,'f0',room.id,{label:'Manager suite'},{moveDetails:true});assert.deepEqual(renamed.floors[0].fixtures,f.fixtures);assert.deepEqual(renamed.floors[0].openings,f.openings);
});
