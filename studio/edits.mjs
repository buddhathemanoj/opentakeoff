import { validateProject } from '../web/src/studio/model.js';
import { BUILDING_SCHEMA } from '../web/src/studio/building.js';
const FIELDS=['label','x','y','width','height','rotation'];
export function applyDesignEdits(project,edits){
 return applyDesignMutations(project,{edits});
}
function targetList(next,reference){
 if(!reference||typeof reference!=='object')throw new Error('Invalid design change.');
  let list;
  if(next.schema===BUILDING_SCHEMA){
   const floor=next.floors.find(f=>f.id===reference.floorId);
   if(!floor)throw new Error('The edited floor does not exist.');
   list=reference.collection==='spaces'?floor.elements:reference.collection==='fixtures'?floor.fixtures:reference.collection==='openings'?floor.openings:null;
  }else list=reference.collection==='spaces'&&reference.floorId===''?next.elements:null;
  if(!list)throw new Error('The edited collection does not exist.');
 return list;
}
export function applyDesignMutations(project,{edits=null,changes=null}={}){
 if(edits!==null&&(!Array.isArray(edits)||!edits.length||edits.length>100))throw new Error('Invalid design edits.');
 if(changes!==null&&(!Array.isArray(changes)||!changes.length||changes.length>100))throw new Error('Invalid item changes.');
 const total=(edits?.length||0)+(changes?.length||0);if(!total||total>100)throw new Error('A compact proposal supports up to 100 changes.');
 const next=structuredClone(validateProject(project));
 for(const edit of edits||[]){
  const list=targetList(next,edit);
  const target=list.find(item=>item.id===edit.targetId);
  if(!target)throw new Error('The edited item does not exist.');
  let fieldsChanged=0;
  for(const field of FIELDS){if(edit[field]!==null&&edit[field]!==undefined){if(!(field in target))throw new Error(`The edited item has no ${field}.`);target[field]=edit[field];fieldsChanged++;}}
  if(!fieldsChanged)throw new Error('An edit must change at least one field.');
 }
 for(const change of changes||[]){
  const list=targetList(next,change);
  if(change.operation==='add'){
   if(!change.item||typeof change.item!=='object'||Array.isArray(change.item)||change.item.id!==change.targetId)throw new Error('An added item must match its target ID.');
   list.push(structuredClone(change.item));
  }else if(change.operation==='remove'){
   if(change.item!=null)throw new Error('A removed item must have item:null.');
   const index=list.findIndex(item=>item.id===change.targetId);if(index<0)throw new Error('The removed item does not exist.');
   list.splice(index,1);
  }else throw new Error('Invalid item operation.');
 }
 return validateProject(next);
}
