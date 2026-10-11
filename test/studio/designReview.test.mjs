import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mixedUseBuilding} from '../../web/src/studio/mixedUse.js';
import {layoutWarnings} from '../../web/src/studio/model.js';
import {convertBuildingUnit} from '../../web/src/studio/building.js';
import {openingOnBoundary} from '../../web/src/studio/designReview.js';
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
