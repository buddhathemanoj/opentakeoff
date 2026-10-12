import { validateProject } from './model.js';
import {allElementIds,BUILDING_SCHEMA} from './building.js';
export const RECOVERY_STORAGE = 'kosal.studio.recovery.v1';
export const EMPTY_RECOVERY = Object.freeze({ draft: '', proposal: null, base: '', pending: false });

// Recovery is separate from drawings: restoring a proposal never applies it.
export function validateRecovery(value, projectId) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid saved conversation.');
  const draft = typeof value.draft === 'string' ? value.draft.slice(0, 12000) : '';
  const proposal = value.proposal ? validateProject(value.proposal) : null;
  const base = typeof value.base === 'string' ? value.base : '';
  if (proposal) {
    if (proposal.id !== projectId) throw new Error('Saved proposal belongs to a different project.');
    const original = validateProject(JSON.parse(base));
    if (original.id !== projectId) throw new Error('Saved proposal context belongs to a different project.');
  }
  const record={ draft, proposal, base, pending: value.pending === true };
  if(value.selection!==undefined){
    if(!Array.isArray(value.selection)||value.selection.length>250||value.selection.some(id=>typeof id!=='string'))throw new Error('Invalid saved request selection.');
    if(value.selection.length){const original=validateProject(JSON.parse(base)),ids=new Set(allElementIds(original));if(original.id!==projectId||value.selection.some(id=>!ids.has(id)))throw new Error('Saved request selection belongs to a different drawing.');}
    record.selection=[...new Set(value.selection)];
  }
  return record;
}
export function retryContext(record,project){
 const empty={ids:[],label:'',source:null,status:'none'};
 if(!record.selection?.length||!record.draft?.trim())return empty;
 try{
  const original=validateProject(JSON.parse(record.base)),current=validateProject(project),ids=new Set(allElementIds(original));
  if(original.id!==current.id||record.selection.some(id=>!ids.has(id)))return{...empty,status:'stale'};
  const items=original.schema===BUILDING_SCHEMA?original.floors.flatMap(f=>[...f.elements,...f.fixtures,...f.openings].map(item=>({...item,floorName:f.name}))):original.elements;
  const first=items.find(item=>item.id===record.selection[0]),label=[first?.floorName,first?.label||first?.kind].filter(Boolean).join(' · ')+(record.selection.length>1?` +${record.selection.length-1} more`:'');
  if(JSON.stringify(original)!==JSON.stringify(current))return{...empty,label,status:'stale'};
  return{ids:[...record.selection],label,source:'retry',status:'ready'};
 }catch{return{...empty,status:'stale'};}
}
export function restoreRecovery(storage) {
  const records = Object.create(null);
  let error = '';
  try {
    const raw = storage.getItem(RECOVERY_STORAGE);
    if (!raw) return { records, error };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    for (const [id, value] of Object.entries(parsed)) {
      try { records[id] = validateRecovery(value, id); }
      catch { error = 'Some saved conversation details could not be opened. The original saved data is preserved.'; }
    }
  } catch { error = 'Saved conversation details could not be opened. The original saved data is preserved.'; }
  return { records, error };
}
export function validateChats(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid saved chats.');
  const records = Object.create(null);
  for (const [id, messages] of Object.entries(value)) {
    if (!Array.isArray(messages) || messages.some(message => !message || !['user', 'assistant', 'error'].includes(message.role) || typeof message.content !== 'string')) throw new Error('Invalid saved chat messages.');
    records[id] = messages.map(({ role, content }) => ({ role, content: content.slice(0, 30000) }));
  }
  return records;
}
