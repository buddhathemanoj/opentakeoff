import {validateProject,SCHEMA} from '../web/src/studio/model.js';
import {BUILDING_SCHEMA} from '../web/src/studio/building.js';
const fields=['label','x','y','width','height','rotation'];

// A failed full draft is not the saved drawing. Patch only existing draft fields,
// then require complete validation before it can become a review proposal.
export function repairDraftProposal(draft,edits){
 if(!draft||![SCHEMA,BUILDING_SCHEMA].includes(draft.schema)||!Array.isArray(edits)||!edits.length||edits.length>100)throw new Error('Invalid draft repair.');
 const next=structuredClone(draft);
 for(const edit of edits){
  if(!edit||typeof edit!=='object'||!['spaces','fixtures','openings'].includes(edit.collection))throw new Error('Invalid draft edit.');
  const floor=next.schema===BUILDING_SCHEMA&&Array.isArray(next.floors)?next.floors.find(f=>f?.id===edit.floorId):null;
  const list=next.schema===BUILDING_SCHEMA?floor?.[edit.collection==='spaces'?'elements':edit.collection==='fixtures'?'fixtures':edit.collection==='openings'?'openings':'invalid']:edit.floorId===''&&edit.collection==='spaces'?next.elements:null;
  const item=Array.isArray(list)?list.find(e=>e?.id===edit.targetId):null;
  if(!item)throw new Error('The repaired item does not exist in the failed draft.');
  let count=0;
  for(const field of fields)if(edit[field]!=null){if(!Object.hasOwn(item,field))throw new Error('The repaired field does not exist in the draft.');item[field]=edit[field];count++;}
  if(!count)throw new Error('A draft repair must change an existing field.');
 }
 return validateProject(next);
}
