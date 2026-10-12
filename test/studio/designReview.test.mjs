import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mixedUseBuilding} from '../../web/src/studio/mixedUse.js';
import {layoutWarnings} from '../../web/src/studio/model.js';
import {convertBuildingUnit} from '../../web/src/studio/building.js';
import {openingOnBoundary,reviewLayout} from '../../web/src/studio/designReview.js';
test('review catches sealed rooms and orphaned openings while preserving geometry and unit parity',()=>{
 const p=mixedUseBuilding('review');assert.deepEqual(layoutWarnings(p),[]);
 const room=p.floors[0].elements.find(e=>e.label==='Secure vault');assert.ok(room);
 p.floors[0].openings=p.floors[0].openings.filter(o=>o.kind==='window'||!openingOnBoundary(room,o,p.unit));
 p.floors[0].openings.push({id:'floating-door',kind:'door',x:room.x+1,y:room.y+1,width:.8,rotation:180,swing:1});
 p.floors[0].openings.push({id:'interior-window',kind:'window',x:room.x,y:room.y+1,width:.8,rotation:90,swing:1});
 const snapshot=JSON.stringify(p),warnings=layoutWarnings(p);
 assert.ok(warnings.some(w=>w.includes('Secure vault has no modelled door')));
 assert.ok(warnings.some(w=>w.includes('floating-door')&&w.includes('not on')));
 assert.ok(warnings.some(w=>w.includes('interior-window')&&w.includes('interior glazing')));
 assert.deepEqual(layoutWarnings(convertBuildingUnit(p,'ft')),warnings);assert.equal(JSON.stringify(p),snapshot);
});
test('reverse-hinge passages count as room access but partial wall overlap and windows do not',()=>{
 const room={x:2,y:3,width:5,height:4};
 assert.equal(openingOnBoundary(room,{x:5,y:3,width:1,rotation:180}),true);
 assert.equal(openingOnBoundary(room,{x:7,y:6,width:1,rotation:270}),true);
 assert.equal(openingOnBoundary(room,{x:1.5,y:3,width:1,rotation:0}),false);
});

test('review counts all floors and pages beyond warning limits without losing inspectable targets',()=>{
 const p=mixedUseBuilding('paged-review');
 for(const floor of p.floors)floor.openings=[];
 const snapshot=JSON.stringify(p),expected=p.floors.reduce((n,f)=>n+f.elements.filter(e=>e.kind==='room').length,0);
 assert.ok(expected>25);
 const first=reviewLayout(p),second=reviewLayout(p,{offset:25}),all=reviewLayout(p,{limit:1000});
 assert.equal(first.total,expected);assert.equal(first.issues.length,25);assert.equal(second.total,expected);
 assert.deepEqual([...first.issues,...second.issues],all.issues.slice(0,50));
 const floor=p.floors[2],filtered=reviewLayout(p,{floorId:floor.id,limit:1000});
 assert.equal(filtered.total,floor.elements.filter(e=>e.kind==='room').length);
 for(const issue of filtered.issues){assert.equal(issue.floorId,floor.id);assert.equal(issue.floorName,floor.name);assert.equal(issue.kind,'access');assert.ok(floor.elements.some(e=>e.id===issue.itemIds[0]));}
 assert.match(layoutWarnings(p).at(-1),new RegExp(`${expected-15} additional geometry issues`));
 assert.deepEqual(reviewLayout(convertBuildingUnit(p,'ft'),{limit:1000}).issues,all.issues);
 assert.equal(JSON.stringify(p),snapshot);
 assert.throws(()=>reviewLayout(p,{limit:0}),/Invalid/);assert.throws(()=>reviewLayout(p,{offset:-1}),/Invalid/);
});

test('overlap and opening findings identify their exact items even with duplicate room labels',()=>{
 const p=mixedUseBuilding('issue-targets'),floor=p.floors[0],room=floor.elements[0];
 floor.elements.push({...room,id:'duplicate-room'});
 floor.openings.push({id:'orphan-door',kind:'door',x:room.x+1,y:room.y+1,width:.8,rotation:0,swing:1});
 const review=reviewLayout(p,{floorId:floor.id});
 assert.deepEqual(review.issues.find(i=>i.kind==='overlap').itemIds,[room.id,'duplicate-room']);
 assert.deepEqual(review.issues.find(i=>i.kind==='opening'&&i.itemIds[0]==='orphan-door').itemIds,['orphan-door']);
});
