import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateProject} from '../../web/src/studio/model.js';
import {convertBuildingUnit,editFloorItem} from '../../web/src/studio/building.js';
import {estimateQuantities} from '../../web/src/studio/estimates.js';
const hotel=()=>({schema:'kosal.studio.building.v1',id:'hotel-test',name:'Hotel fixture test',mode:'building',unit:'m',width:10,height:8,floors:[{id:'guest',name:'Guest suite',use:'mixed',elevation:0,storeyHeight:3.5,elements:[{id:'suite',kind:'room',label:'Suite',x:0,y:0,width:10,height:8,wallThickness:.18}],openings:[],fixtures:[{id:'bed',type:'bed',label:'King bed',x:2,y:2,width:2,height:1.8,rotation:90},{id:'shower',type:'shower',label:'Shower',x:8,y:6,width:1.2,height:1.2,rotation:0}]}],notes:['Synthetic fixture regression, not an AI design.']});
test('hospitality fixtures survive project roundtrip, unit conversion and targeted edits with report counts',()=>{
 const original=validateProject(hotel());assert.deepEqual(validateProject(JSON.parse(JSON.stringify(original))),original);
 const feet=convertBuildingUnit(original,'ft'),edited=editFloorItem(feet,'guest','bed',{rotation:270});
 assert.deepEqual(edited.floors[0].fixtures[1],feet.floors[0].fixtures[1]);
 assert.equal(original.floors[0].fixtures[0].rotation,90);
 for(const project of [original,feet,edited]){const rows=estimateQuantities(project).rows;assert.equal(rows.find(r=>r.id==='fixture-bed').quantity,1);assert.equal(rows.find(r=>r.id==='fixture-shower').quantity,1);}
 const bad=hotel();bad.floors[0].fixtures[0].type='unsupported';assert.throws(()=>validateProject(bad),/fixture/i);
});
