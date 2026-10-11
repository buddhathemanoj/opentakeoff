import {test} from 'node:test';import assert from 'node:assert/strict';
import {chatContext} from '../../web/src/studio/chatContext.js';import {mixedUseBuilding} from '../../web/src/studio/mixedUse.js';
test('viewing a space supplies its ID without editing geometry, with manual selection taking priority',()=>{
 const p=mixedUseBuilding('context-test'),floor=p.floors[1],room=floor.elements[4],manual=floor.fixtures[0],viewed={projectId:p.id,floorId:floor.id,elementId:room.id},options={floorId:floor.id,walkthroughVisible:true},snapshot=JSON.stringify(p);
 assert.deepEqual(chatContext(p,null,viewed,options),{ids:[room.id],label:room.label,source:'viewed'});
 assert.deepEqual(chatContext(p,manual.id,viewed,options),{ids:[manual.id],label:manual.label,source:'selected'});assert.equal(JSON.stringify(p),snapshot);
});
test('stale, hidden and proposal-preview locations cannot become saved-project context',()=>{
 const p=mixedUseBuilding('context-test'),f=p.floors[1],viewed={projectId:p.id,floorId:f.id,elementId:f.elements[0].id},options={floorId:f.id,walkthroughVisible:true};
 for(const location of [{...viewed,projectId:'other'},{...viewed,floorId:'f0'},{...viewed,elementId:'unknown'},null])assert.deepEqual(chatContext(p,null,location,options).ids,[]);
 assert.deepEqual(chatContext(p,null,viewed,{...options,walkthroughVisible:false}).ids,[]);assert.deepEqual(chatContext(p,null,viewed,{...options,floorId:'f0'}).ids,[]);
});
test('site selection remains available independently of walkthrough context',()=>{
 const p={schema:'kosal.studio.project.v1',elements:[{id:'plot',kind:'plot',label:'Plot A'}]};assert.deepEqual(chatContext(p,'plot',null),{ids:['plot'],label:'Plot A',source:'selected'});assert.deepEqual(chatContext(p,null,{projectId:undefined},{walkthroughVisible:true}).ids,[]);
});
