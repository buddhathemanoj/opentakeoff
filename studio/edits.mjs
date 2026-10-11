import { validateProject } from '../web/src/studio/model.js';
import { BUILDING_SCHEMA } from '../web/src/studio/building.js';
const FIELDS=['label','x','y','width','height','rotation'];
export function applyDesignEdits(project,edits){
 if(!Array.isArray(edits)||!edits.length||edits.length>100)throw new Error('Invalid design edits.');
 const next=structuredClone(validateProject(project));
 for(const edit of edits){
  let list;
  if(next.schema===BUILDING_SCHEMA){
   const floor=next.floors.find(f=>f.id===edit.floorId);
   if(!floor)throw new Error('The edited floor does not exist.');
   list=edit.collection==='spaces'?floor.elements:edit.collection==='fixtures'?floor.fixtures:edit.collection==='openings'?floor.openings:null;
  }else list=edit.collection==='spaces'&&edit.floorId===''?next.elements:null;
  if(!list)throw new Error('The edited collection does not exist.');
  const target=list.find(item=>item.id===edit.targetId);
  if(!target)throw new Error('The edited item does not exist.');
  let changes=0;
  for(const field of FIELDS){if(edit[field]!==null&&edit[field]!==undefined){if(!(field in target))throw new Error(`The edited item has no ${field}.`);target[field]=edit[field];changes++;}}
  if(!changes)throw new Error('An edit must change at least one field.');
 }
 return validateProject(next);
}
