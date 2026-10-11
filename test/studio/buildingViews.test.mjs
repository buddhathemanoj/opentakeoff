import test from 'node:test';import assert from 'node:assert/strict';
import {mixedUseBuilding} from '../../web/src/studio/mixedUse.js';
import {convertBuildingUnit} from '../../web/src/studio/building.js';
import {buildingEnvelope,southFacadeOpenings} from '../../web/src/studio/buildingViews.js';
test('building studies use actual physical envelope and only actual south facade openings',()=>{
 const p=mixedUseBuilding('facade'),f=p.floors[0];
 p.width=42;p.height=30;f.storeyHeight=4.5;p.floors[2].elevation=11;
 f.openings=[{id:'south-reverse',kind:'window',x:8,y:30,width:2,rotation:180,swing:1},{id:'east',kind:'window',x:42,y:5,width:2,rotation:90,swing:1},{id:'inside',kind:'door',x:8,y:24,width:1,rotation:0,swing:1}];
 assert.deepEqual(buildingEnvelope(p),{width:42,depth:30,height:15});
 const opening=southFacadeOpenings(p,f);assert.equal(opening.length,1);assert.equal(opening[0].x,6);assert.equal(opening[0].width,2);assert.equal(opening[0].bottom,1);assert.equal(opening[0].top,2.7);
 const ft=convertBuildingUnit(p,'ft'),footEnvelope=buildingEnvelope(ft),footOpenings=southFacadeOpenings(ft,ft.floors[0]);
 for(const key of ['width','depth','height'])assert.ok(Math.abs(footEnvelope[key]-buildingEnvelope(p)[key])<1e-8);
 for(const key of ['x','width','bottom','top'])assert.ok(Math.abs(footOpenings[0][key]-opening[0][key])<1e-8);
});
