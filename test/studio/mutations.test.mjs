import {test} from 'node:test';import assert from 'node:assert/strict';
import {applyDesignMutations} from '../../studio/edits.mjs';import {mixedUseBuilding} from '../../web/src/studio/mixedUse.js';import {estimateQuantities} from '../../web/src/studio/estimates.js';import {SCHEMA} from '../../web/src/studio/model.js';
const add=(floorId,id='new-plant')=>({operation:'add',floorId,collection:'fixtures',targetId:id,item:{id,type:'plant',label:'New planter',x:5,y:5,width:.6,height:.6,rotation:0}});
test('compound additions, removals and edits create one proposal and preserve untouched floors and items',()=>{
 const p=mixedUseBuilding('mutations'),floor=p.floors[2],target=floor.elements[11],removed=floor.fixtures.find(i=>i.type==='plant'),snapshot=JSON.stringify(p);assert.ok(removed);
 const proposal=applyDesignMutations(p,{edits:[{floorId:floor.id,collection:'spaces',targetId:target.id,label:'Updated room'}],changes:[{operation:'remove',floorId:floor.id,collection:'fixtures',targetId:removed.id,item:null},add(floor.id)]});
 const expected=structuredClone(p);expected.floors[2].elements[11].label='Updated room';expected.floors[2].fixtures=expected.floors[2].fixtures.filter(i=>i.id!==removed.id);expected.floors[2].fixtures.push(add(floor.id).item);assert.deepEqual(proposal,expected);assert.equal(JSON.stringify(p),snapshot);assert.equal(estimateQuantities(proposal).rows.find(r=>r.id==='fixture-plant').quantity,estimateQuantities(p).rows.find(r=>r.id==='fixture-plant').quantity);
});
test('invalid compound geometry, duplicate IDs and missing removals fail without mutating input',()=>{
 const p=mixedUseBuilding('mutations'),snapshot=JSON.stringify(p),bad=add('f2');bad.item.x=29.9;
 for(const change of [bad,add('unknown'),add('f2',p.floors[0].fixtures[0].id),{...add('f2'),targetId:'mismatch'},{operation:'remove',floorId:'f2',collection:'fixtures',targetId:'unknown',item:null},{...add('f2'),operation:'replace'}]){assert.throws(()=>applyDesignMutations(p,{changes:[add('f2','first-valid'),change]}));assert.equal(JSON.stringify(p),snapshot);}
 assert.throws(()=>applyDesignMutations(p,{changes:Array.from({length:101},(_,i)=>add('f2','p'+i))}),/Invalid item changes/);
});
test('site additions and removals preserve the original project format and reject building collections',()=>{
 const p={schema:SCHEMA,id:'site',name:'Site',mode:'site',unit:'m',width:20,height:15,elements:[{id:'old',kind:'plot',label:'Old plot',x:1,y:1,width:3,height:3}]},item={id:'new',kind:'plot',label:'New plot',x:5,y:1,width:3,height:3};
 const q=applyDesignMutations(p,{changes:[{operation:'remove',floorId:'',collection:'spaces',targetId:'old',item:null},{operation:'add',floorId:'',collection:'spaces',targetId:'new',item}]});assert.equal(q.schema,SCHEMA);assert.deepEqual(q.elements,[item]);assert.equal(p.elements[0].id,'old');assert.throws(()=>applyDesignMutations(p,{changes:[add('')]}),/collection/);
});
