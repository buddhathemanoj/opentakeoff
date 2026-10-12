import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateProject,newProject} from '../../web/src/studio/model.js';
import {BUILDING_SCHEMA,convertBuildingUnit,buildingStats} from '../../web/src/studio/building.js';
import {floorPanels,ceilingPanels,ceilingHeight,roofPanels,floorVoids} from '../../web/src/studio/threeGeometry.js';
import {canWalkTo,walkPoint,walkthroughLocations} from '../../web/src/studio/walkthrough.js';
import {estimateQuantities} from '../../web/src/studio/estimates.js';
import {reviewLayout} from '../../web/src/studio/designReview.js';
import {buildingSchema,projectSchema} from '../../studio/schema.mjs';

export function courtyardFixture(){
 const area=(id,kind)=>({id,kind,label:kind==='void'?'Atrium opening':'Courtyard garden',x:6,y:4,width:8,height:8,wallThickness:.18});
 return{schema:BUILDING_SCHEMA,id:'courtyard-qa',name:'Courtyard geometry QA',mode:'building',unit:'m',width:20,height:16,notes:['Authored geometry verification fixture; not an AI-generated design.'],floors:[{id:'ground',name:'Ground · Courtyard',use:'mixed',elevation:0,storeyHeight:4,elements:[area('garden','landscape')],openings:[],fixtures:[]},{id:'upper',name:'Level 1 · Gallery',use:'mixed',elevation:4,storeyHeight:4,elements:[area('atrium','void')],openings:[],fixtures:[]}]};
}
const panelArea=panels=>panels.reduce((n,p)=>n+p.width*p.depth,0);
test('explicit floor openings survive building exports without extending the original site schema',()=>{
 const p=courtyardFixture();assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))),p);
 assert.ok(buildingSchema.properties.floors.items.properties.elements.items.properties.kind.enum.includes('void'));
 assert.ok(!projectSchema.properties.elements.items.properties.kind.enum.includes('void'));
 const site=newProject();site.elements=[{...p.floors[1].elements[0]}];assert.throws(()=>validateProject(site));
 assert.equal(buildingStats(p).spaces,1);
});
test('slabs and ceilings use opening unions, nearest upper storey and physical units without mutating drawings',()=>{
 const p=courtyardFixture(),upper=p.floors[1],snapshot=JSON.stringify(p);
 assert.equal(panelArea(floorPanels(p,p.floors[0])),320);
 assert.equal(panelArea(floorPanels(p,upper)),256);
 assert.equal(panelArea(ceilingPanels(p,p.floors[0])),256);
 assert.equal(panelArea(ceilingPanels(p,upper)),256);
 const overlap={...upper,elements:[...upper.elements,{...upper.elements[0],id:'nested',x:8,y:6,width:4,height:4}]};
 assert.equal(panelArea(floorPanels(p,overlap)),256);
 const ft=convertBuildingUnit(p,'ft');assert.ok(Math.abs(panelArea(floorPanels(ft,ft.floors[1]))-256)<1e-8);
 const higher={...upper,id:'top',elevation:8,elements:[]};assert.equal(panelArea(ceilingPanels({...p,floors:[higher,...p.floors]},p.floors[0])),256);assert.equal(panelArea(ceilingPanels({...p,floors:[higher,...p.floors]},upper)),320);
 assert.equal(ceilingHeight({...p,floors:[p.floors[0],{...upper,elevation:6}]},p.floors[0]),6);assert.equal(ceilingHeight(p,upper),4);assert.equal(panelArea(roofPanels(p,p.floors[0])),256);
 assert.equal(JSON.stringify(p),snapshot);
});
test('walkthroughs reject opening edges and choose supported viewpoints instead of teleporting into holes',()=>{
 const p=courtyardFixture(),floor=p.floors[1],bounds={width:20,depth:16,voids:floorVoids(p,floor)};
 assert.equal(canWalkTo(10,8,[],bounds),false);assert.equal(canWalkTo(5.9,8,[],bounds),false);assert.equal(canWalkTo(5.7,8,[],bounds),true);
 assert.deepEqual(walkthroughLocations(floor),[]);
 const room={x:0,y:0,width:20,height:16};const point=walkPoint(room,[],bounds);assert.ok(point);assert.equal(canWalkTo(point.x,point.z,[],bounds),true);
 assert.equal(walkPoint({x:6,y:4,width:8,height:8},[],bounds),null);
 const ft=convertBuildingUnit(p,'ft');for(const key of ['x','z','width','depth'])assert.ok(Math.abs(floorVoids(ft,ft.floors[1])[0][key]-bounds.voids[0][key])<1e-8);
});
test('quantities deduct floor opening unions once while retaining gross footprints and explicit bases',()=>{
 const p=courtyardFixture();p.floors[1].elements.push({...p.floors[1].elements[0],id:'nested',x:8,y:6,width:4,height:4});
 const quantities=estimateQuantities(p);assert.equal(quantities.grossArea,640);assert.match(quantities.areaLabel,/including openings/);
 assert.ok(Math.abs(quantities.rows.find(r=>r.id==='slabs').quantity-115.2)<1e-8);assert.equal(quantities.rows.find(r=>r.id==='area-void').quantity,64);assert.match(quantities.rows.find(r=>r.id==='slabs').basis,/576 m².*0.2 m/);
 const ft=estimateQuantities(convertBuildingUnit(p,'ft'));for(const row of quantities.rows)assert.ok(Math.abs(row.quantity-ft.rows.find(r=>r.id===row.id).quantity)<1e-8);
});
test('review distinguishes courtyard glazing and flags furniture or passages over unsupported openings',()=>{
 const p=courtyardFixture(),floor=p.floors[1];floor.fixtures.push({id:'floating-plant',type:'plant',label:'Floating plant',x:9,y:7,width:1,height:1,rotation:0});
 floor.openings.push({id:'court-window',kind:'window',x:6,y:5,width:2,rotation:90,swing:1},{id:'court-door',kind:'door',x:6,y:8,width:1,rotation:90,swing:1});
 const issues=reviewLayout(p).issues;assert.ok(!issues.some(i=>i.kind==='window'));assert.ok(issues.some(i=>i.kind==='void-overlap'&&i.itemIds[0]==='floating-plant'));assert.ok(issues.some(i=>i.kind==='void-door'&&i.itemIds[0]==='court-door'));
});
