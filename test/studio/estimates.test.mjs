import {test} from 'node:test';
import assert from 'node:assert/strict';
import {estimateQuantities,priceEstimate,estimateCsv} from '../../web/src/studio/estimates.js';
import {mixedUseBuilding} from '../../web/src/studio/mixedUse.js';
import {convertBuildingUnit} from '../../web/src/studio/building.js';
import {restoreLayout,DEFAULT_LAYOUT} from '../../web/src/studio/layoutPreferences.js';
import {canWalkTo} from '../../web/src/studio/walkthrough.js';
import {wallBoxes} from '../../web/src/studio/threeGeometry.js';
test('estimate quantities are physical units and preserve all floors across unit changes',()=>{
 const p=mixedUseBuilding('estimate'),metres=estimateQuantities(p),feet=estimateQuantities(convertBuildingUnit(p,'ft'));
 assert.equal(metres.grossArea,2160);
 for(const row of metres.rows)assert.ok(Math.abs(row.quantity-feet.rows.find(r=>r.id===row.id).quantity)<1e-7,row.id);
 assert.equal(metres.rows.find(r=>r.id==='slabs').quantity,432);
 assert.equal(metres.rows.find(r=>r.id==='doors').quantity,p.floors.reduce((n,f)=>n+f.openings.filter(o=>o.kind==='door').length,0));
 assert.equal(estimateQuantities(p,{slabThickness:.3}).rows.find(r=>r.id==='slabs').quantity,648);
 assert.throws(()=>estimateQuantities(p,{slabThickness:-1}),/thickness/);
 assert.deepEqual(p,mixedUseBuilding('estimate'));
});
test('blank and invalid rates stay unpriced while entered rates produce a reproducible subtotal',()=>{
 const rows=[{id:'a',label:'Wall',quantity:10,unit:'m²',basis:'Model'},{id:'b',label:'Door',quantity:2,unit:'each',basis:'Objects'}];
 const p=priceEstimate(rows,{a:125,b:null});assert.equal(p.total,1250);assert.equal(p.unpriced,1);
 assert.equal(priceEstimate(rows,{a:NaN,b:-1}).unpriced,2);
 assert.equal(priceEstimate(rows,{a:0,b:300}).total,600);
 assert.ok(estimateCsv(p.rows,'INR').includes('"10.000","m²","125","1250.00"'));
});
test('walkthrough blocks walls and low window sills but permits an actual door aperture',()=>{
 const p={unit:'m',width:4,height:4},f={storeyHeight:3,elements:[],openings:[{x:1.5,y:4,width:1,rotation:0,kind:'door'},{x:1.5,y:0,width:1,rotation:0,kind:'window'}]},walls=wallBoxes(p,f),bounds={width:4,depth:4};
 assert.equal(canWalkTo(2,3.8,walls,bounds),true);
 assert.equal(canWalkTo(1,3.8,walls,bounds),false);
 assert.equal(canWalkTo(2,.2,walls,bounds),false);
 assert.equal(canWalkTo(-1,2,walls,bounds),false);
});
test('layout preferences recover from corrupted storage and clamp saved panel sizes',()=>{
 assert.deepEqual(restoreLayout({getItem:()=>'{broken'}),DEFAULT_LAYOUT);
 const value=restoreLayout({getItem:()=>JSON.stringify({sidebar:900,projects:10,layers:330,chat:90})});
 assert.deepEqual(value,{sidebar:440,projects:80,layers:330,chat:76});
});
test('site reports include building and water areas and distinguish boundary area from floor area',async()=>{
 const {newProject}=await import('../../web/src/studio/model.js');const p=newProject('site');
 p.elements=[{id:'a',kind:'building',label:'Farmhouse',x:0,y:0,width:20,height:10},{id:'b',kind:'building',label:'Shed',x:30,y:0,width:10,height:10},{id:'c',kind:'water',label:'Pond',x:0,y:20,width:15,height:12}];
 const quantities=estimateQuantities(p);assert.equal(quantities.areaLabel,'Site boundary area');assert.equal(quantities.summary,'Site layout');assert.equal(quantities.hasSlabs,false);assert.equal(quantities.rows.find(r=>r.id==='area-building').quantity,300);assert.equal(quantities.rows.find(r=>r.id==='area-water').quantity,180);assert.ok(!quantities.rows.some(r=>r.id==='slabs'));
 const ft={...p,unit:'ft',width:p.width/.3048,height:p.height/.3048,elements:p.elements.map(e=>({...e,x:e.x/.3048,y:e.y/.3048,width:e.width/.3048,height:e.height/.3048}))};
 for(const row of quantities.rows)assert.ok(Math.abs(estimateQuantities(ft).rows.find(r=>r.id===row.id).quantity-row.quantity)<1e-8);
});
