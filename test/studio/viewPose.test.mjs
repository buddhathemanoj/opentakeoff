import {test} from 'node:test';import assert from 'node:assert/strict';import {canRestoreView} from '../../web/src/studio/viewPose.js';import {canWalkTo} from '../../web/src/studio/walkthrough.js';
const context={projectId:'project',floorId:'f7',walk:true,scope:'all',cutaway:false,exploded:false,width:48,depth:36,height:4};
const pose=()=>({context:{...context},position:[23,1.65,20],target:[24,2,18],yaw:.4,pitch:-.1});
test('same-scene changes preserve physical camera pose across unit conversion rounding',()=>{
 const saved=pose(),snapshot=JSON.stringify(saved);assert.equal(canRestoreView(saved,{...context,width:48/.3048*.3048}),true);assert.equal(canWalkTo(saved.position[0],saved.position[2],[],{width:48,depth:36}),true);assert.equal(JSON.stringify(saved),snapshot);
});
test('camera restoration excludes other projects, floors, view modes, resized scenes and invalid poses',()=>{
 for(const [key,value] of Object.entries({projectId:'other',floorId:'f0',walk:false,scope:'selected',cutaway:true,exploded:true,width:49,depth:37,height:5}))assert.equal(canRestoreView(pose(),{...context,[key]:value}),false,key);
 assert.equal(canRestoreView(null,context),false);assert.equal(canRestoreView({...pose(),position:[NaN,1.65,20]},context),false);assert.equal(canRestoreView({...pose(),target:[1,2]},context),false);
});
test('a new wall covering a previously valid camera position prevents walkthrough restoration',()=>{
 const saved=pose(),walls=[{x:23,z:20,width:1,depth:1,bottom:0,height:4}];assert.equal(canRestoreView(saved,context),true);assert.equal(canWalkTo(saved.position[0],saved.position[2],walls,{width:48,depth:36}),false);
});
