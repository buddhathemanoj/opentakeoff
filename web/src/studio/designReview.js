import {BUILDING_SCHEMA,metresPerUnit} from './building.js';

// Geometry diagnostics only: a boundary opening does not prove a connected route.
export function openingOnBoundary(room,opening,unit='m'){
 const tolerance=.04/metresPerUnit(unit),horizontal=opening.rotation===0||opening.rotation===180;
 const end=horizontal?opening.x+opening.width*(opening.rotation===0?1:-1):opening.y+opening.width*(opening.rotation===90?1:-1);
 const start=horizontal?opening.x:opening.y,low=Math.min(start,end),high=Math.max(start,end);
 const side=horizontal?opening.y:opening.x,edges=horizontal?[room.y,room.y+room.height]:[room.x,room.x+room.width];
 const minimum=horizontal?room.x:room.y,maximum=minimum+(horizontal?room.width:room.height);
 return edges.some(edge=>Math.abs(side-edge)<=tolerance)&&low>=minimum-tolerance&&high<=maximum+tolerance;
}
export function floorAccessIssues(project,floor){
 const rooms=floor.elements.filter(item=>item.kind==='room'),footprint={x:0,y:0,width:project.width,height:project.height},issues=[];
 for(const room of rooms){
  if(!floor.openings.some(opening=>opening.kind!=='window'&&openingOnBoundary(room,opening,project.unit)))issues.push({kind:'access',itemIds:[room.id],message:`${room.label} has no modelled door or open passage on its boundary.`});
 }
 for(const opening of floor.openings){
  if(opening.kind==='window'){
   if(!openingOnBoundary(footprint,opening,project.unit))issues.push({kind:'window',itemIds:[opening.id],message:`Window ${opening.id} is away from the building perimeter; check whether interior glazing is intended.`});
  }else if(!openingOnBoundary(footprint,opening,project.unit)&&!rooms.some(room=>openingOnBoundary(room,opening,project.unit))){
   issues.push({kind:'opening',itemIds:[opening.id],message:`Opening ${opening.id} is not on a modelled room wall or the building perimeter.`});
  }
 }
 return issues;
}

export function floorAccessWarnings(project,floor){return floorAccessIssues(project,floor).map(issue=>issue.message);}

// Count every finding, but retain only the requested page for bounded UI/report output.
export function reviewLayout(project,{floorId=null,offset=0,limit=25}={}){
 if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>1000)throw new Error('Invalid design check page.');
 const building=project.schema===BUILDING_SCHEMA,issues=[];
 const floors=building?project.floors.filter(f=>!floorId||f.id===floorId):[{id:null,name:project.name,elements:project.elements}];
 let total=0;
 for(const floor of floors){
  const add=issue=>{if(total>=offset&&issues.length<limit)issues.push({...issue,floorId:floor.id,floorName:floor.name});total++;};
  const solid=floor.elements.filter(e=>['building','plot','room'].includes(e.kind));
  for(let i=0;i<solid.length;i++)for(let j=i+1;j<solid.length;j++){
   const a=solid[i],b=solid[j];if(a.kind!==b.kind)continue;
   if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>.01&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>.01)add({kind:'overlap',itemIds:[a.id,b.id],message:`${a.label} overlaps ${b.label}.`});
  }
  if(building)for(const issue of floorAccessIssues(project,floor))add(issue);
 }
 return{issues,total,offset,limit};
}
