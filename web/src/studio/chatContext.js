import {BUILDING_SCHEMA,floorSelection} from './building.js';

export function chatContext(project,selected,viewed,{walkthroughVisible=false,floorId}={}){
 const empty={ids:[],label:'',source:null};
 const manual=project.schema===BUILDING_SCHEMA?floorSelection(project,floorId,selected)?.item:project.elements.find(item=>item.id===selected);
 if(manual)return{ids:[manual.id],label:manual.label||manual.kind,source:'selected'};
 if(!walkthroughVisible||project.schema!==BUILDING_SCHEMA||viewed?.projectId!==project.id)return empty;
 const floor=project.floors.find(f=>f.id===(floorId||project.floors[0].id));
 if(!floor||viewed.floorId!==floor.id)return empty;
 const space=floor.elements.find(e=>e.id===viewed.elementId&&(e.kind==='room'||e.kind==='landscape'));
 return space?{ids:[space.id],label:space.label,source:'viewed'}:empty;
}
