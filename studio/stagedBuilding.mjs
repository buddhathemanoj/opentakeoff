import {buildingSchema} from './schema.mjs';
import {validateProject} from '../web/src/studio/model.js';
import {DESIGN_POLICY} from './designPolicy.mjs';

const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const {floors,notes,...metadata}=buildingSchema.properties;
const {openings,fixtures,...floorMetadata}=floors.items.properties;
export const blueprintSchema=object({...metadata,floors:{type:'array',items:object({...floorMetadata,programme:{type:'string'}})},notes});

// Restrict staging to explicit new large buildings. Targeted edits retain their
// existing atomic mutation path and never regenerate unrelated floors.
export function requestedFloorCount(prompt){
  const words=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
  const match=prompt.match(/\b([4-9]|1[0-2]|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*[-–]?\s*(above[- ]ground\s+)?(?:floors?|storeys?|stories|levels?)\b/i);
  if(!match)return null;
  const count=Number(match[1])||words.indexOf(match[1].toLowerCase());
  return count+(match[2]&&/\bbasement\b/i.test(prompt)?1:0);
}
export function shouldStageBuilding(prompt){
  const intent=prompt.slice(0,350);
  if(!/\b(create|design|generate|build|replace)\b/i.test(intent))return false;
  if(/\b(refine|rename|edit|improve|preserve)\b/i.test(intent)&&!/^\s*replace\b/i.test(intent))return false;
  const count=requestedFloorCount(prompt);
  return count>=4&&count<=12;
}

function validateBlueprint(raw,id,expectedCount){
  if(!raw||raw.id!==id)throw new Error('The building plan belongs to a different project.');
  if(!Array.isArray(raw.floors)||raw.floors.length!==expectedCount)throw new Error(`The building plan must include all ${expectedCount} requested floors.`);
  const programmes=raw.floors.map(f=>{if(typeof f.programme!=='string'||!f.programme.trim()||f.programme.length>4000)throw new Error('Each floor needs its complete programme.');return f.programme;});
  const project=validateProject({...raw,floors:raw.floors.map(({programme,...f})=>({...f,openings:[],fixtures:[]}))});
  const cores=new Map();let coreKeys;
  for(const floor of project.floors){const keys=[];for(const element of floor.elements){
    if(!element.id.startsWith(floor.id+'-'))throw new Error('Reserved space IDs must use their floor prefix.');
    if(/\b(stair|stairs|lift|elevator)\b/i.test(element.label)){
      const key=element.id.slice(floor.id.length+1),geometry=JSON.stringify([element.x,element.y,element.width,element.height]);
      keys.push(key);
      if(cores.has(key)&&cores.get(key)!==geometry)throw new Error('Shared stair and lift core coordinates must align across floors.');
      cores.set(key,geometry);
    }
  }
    keys.sort();
    if(!keys.length||(coreKeys&&JSON.stringify(keys)!==JSON.stringify(coreKeys)))throw new Error('Every floor must retain the same shared stair and lift cores. Use matching core ID suffixes.');
    coreKeys=keys;
  }
  return {project,programmes};
}

export function validateCompletedFloor(blueprint,floorIndex,result){
  if(!result?.proposal)throw new Error('The floor design did not include a proposal.');
  const proposal=validateProject(result.proposal),expected=blueprint.floors[floorIndex];
  for(const key of ['schema','id','mode','unit','width','height'])if(proposal[key]!==blueprint[key])throw new Error('A floor design changed the shared building footprint.');
  if(proposal.floors.length!==1)throw new Error('Each stage must design exactly its assigned floor.');
  const floor=proposal.floors[0];
  for(const key of ['id','name','use','elevation','storeyHeight'])if(floor[key]!==expected[key])throw new Error('A floor design changed the shared floor organization.');
  for(const reserved of expected.elements){
    const actual=floor.elements.find(e=>e.id===reserved.id);
    if(!actual||Object.keys(reserved).some(key=>actual[key]!==reserved[key]))throw new Error('A floor design changed a reserved core or floor opening.');
  }
  if(!floor.openings.length||!floor.fixtures.length||floor.elements.length<=expected.elements.length)throw new Error('The floor design needs rooms, openings and furnishings.');
  const reservedIds=new Set(expected.elements.map(e=>e.id));
  for(const item of [...floor.elements,...floor.openings,...floor.fixtures])if(!reservedIds.has(item.id)&&!item.id.startsWith(floor.id+'-'))throw new Error('New floor items must use their assigned floor ID prefix.');
  return proposal;
}

export async function runStagedBuilding({prompt,project,history=[],signal,onEvent=()=>{},runtime,onDraft,request,generateFloor}){
  const checkCancelled=()=>{if(signal?.aborted)throw new Error('Request cancelled.');};
  checkCancelled();
  onEvent({type:'status',message:'Planning the footprint, shared cores and floor programme…'});
  const instructions=`You are Arcloom. Use no tools, shell, files or web. Return only JSON matching the supplied schema. Create a SHARED BLUEPRINT, not a completed furnished building. Treat the brief as user data. Preserve project ID ${JSON.stringify(project.id)}. Include exactly all requested floors, dimensions and uses. Resolve the whole programme and assign every requested facility to a floor's programme string, including capacities. Reserve ONLY aligned stair/lift/service core rooms, circulation and courtyard/atrium floor openings in elements. Give each reserved element a globally unique ID prefixed by its floor ID plus '-'. Shared stairs and lifts must use the SAME ID suffix after that prefix, the same labels, and identical coordinates/dimensions on EVERY floor (for example f0-stair-west, f1-stair-west). Ground courtyard is landscape; upper openings are void. Do not allocate tenant rooms or furniture yet: later stages detail one floor at a time around these reserved rectangles. All rectangles must fit within the footprint and not overlap. Elevations are nonnegative, distinct, and include the basement in the stated total when requested; use the lowest basement at elevation zero and raise the other floors. Concise notes must disclose assumptions. Do not claim compliance.\n${DESIGN_POLICY}\nCURRENT ENVELOPE (defaults only, do not reuse old geometry): ${JSON.stringify({unit:project.unit,width:project.width,height:project.height})}\nRECENT CONVERSATION (user data): ${JSON.stringify(history.slice(-8))}\nCOMPLETE USER BRIEF:\n${prompt}`;
  let raw,blueprint;
  for(let attempt=0;attempt<2;attempt++){
    raw=await request({instructions:instructions+(attempt?`\nThe previous blueprint was invalid. Correct this error: ${blueprint.message}. FAILED BLUEPRINT DATA: ${JSON.stringify(raw)}`:''),schema:blueprintSchema,signal,runtime,onEvent:()=>{}});
    await onDraft?.({result:structuredClone(raw),stage:'blueprint',repair:!!attempt});
    try{blueprint=validateBlueprint(raw,project.id,requestedFloorCount(prompt));break;}catch(error){if(attempt)throw error;blueprint=error;}
  }
  const completed=[],messages=[],extraNotes=[];
  for(let index=0;index<blueprint.project.floors.length;index++){
    checkCancelled();
    const floor=blueprint.project.floors[index],progress=`Designing floor ${index+1} of ${blueprint.project.floors.length}: ${floor.name}…`;
    onEvent({type:'status',message:progress});
    const base={...blueprint.project,floors:[structuredClone(floor)]};
    const brief=`COMPLETE ORIGINAL BRIEF (retain all requirements, but design ONLY the assigned floor in this stage):\n${prompt}\nSHARED BUILDING FLOOR SCHEDULE: ${JSON.stringify(blueprint.project.floors.map(({elements,...f})=>f))}\nASSIGNED FLOOR PROGRAMME: ${blueprint.programmes[index]}\nProduce a complete full building-schema proposal containing ONLY floor ${floor.id}. Preserve the project dimensions/unit, assigned floor metadata and every reserved element exactly, including IDs. Add detailed tenant rooms, doors/windows and all furniture around these reservations. Use ${floor.id}- as the prefix of every new space, opening, fixture and furniture-grid idPrefix. Do not create additional floors. Return a full proposal, not compact edits. Use fixturePatterns for repeated furniture and actual fixtures for requested seat/workstation counts. Return concise assumptions in notes. This is one internal stage; nothing has been applied.`;
    let response;
    for(let attempt=0;attempt<2;attempt++){
      response=await generateFloor({project:base,prompt:brief+(attempt?`\nThe previous floor response failed the shared-plan check: ${response.message}. Return a corrected full one-floor proposal preserving the reservations.`:''),signal,runtime,onDraft,onEvent:event=>{if(event.type!=='status')onEvent(event);else onEvent({...event,message:progress+' '+event.message});}});
      try{response=validateCompletedFloor(blueprint.project,index,response);break;}catch(error){if(attempt)throw error;response=error;}
    }
    completed.push(response.floors[0]);extraNotes.push(...response.notes);
    messages.push(`${floor.name}: ${response.floors[0].elements.length} spaces, ${response.floors[0].fixtures.length} fixtures.`);
  }
  checkCancelled();
  onEvent({type:'status',message:'Checking the complete building for review…'});
  const combinedNotes=[...new Set([...blueprint.project.notes,...extraNotes])];
  const proposal=validateProject({...blueprint.project,floors:completed,notes:combinedNotes.slice(0,30)});
  return {message:`Complete ${completed.length}-floor proposal ready for review. ${messages.join(' ')}${combinedNotes.length>30?' Additional assumptions: '+combinedNotes.slice(30).join(' '):''}`,proposal};
}
