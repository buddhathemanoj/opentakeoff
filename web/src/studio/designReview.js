import {metresPerUnit} from './building.js';

// Geometry diagnostics only: a boundary opening does not prove a connected route.
export function openingOnBoundary(room,opening,unit='m'){
 const tolerance=.04/metresPerUnit(unit),horizontal=opening.rotation===0||opening.rotation===180;
 const end=horizontal?opening.x+opening.width*(opening.rotation===0?1:-1):opening.y+opening.width*(opening.rotation===90?1:-1);
 const start=horizontal?opening.x:opening.y,low=Math.min(start,end),high=Math.max(start,end);
 const side=horizontal?opening.y:opening.x,edges=horizontal?[room.y,room.y+room.height]:[room.x,room.x+room.width];
 const minimum=horizontal?room.x:room.y,maximum=minimum+(horizontal?room.width:room.height);
 return edges.some(edge=>Math.abs(side-edge)<=tolerance)&&low>=minimum-tolerance&&high<=maximum+tolerance;
}
export function floorAccessWarnings(project,floor){
 const rooms=floor.elements.filter(item=>item.kind==='room'),footprint={x:0,y:0,width:project.width,height:project.height},warnings=[];
 for(const room of rooms){
  if(!floor.openings.some(opening=>opening.kind!=='window'&&openingOnBoundary(room,opening,project.unit)))warnings.push(`${room.label} has no modelled door or open passage on its boundary.`);
 }
 for(const opening of floor.openings){
  if(opening.kind==='window'){
   if(!openingOnBoundary(footprint,opening,project.unit))warnings.push(`Window ${opening.id} is away from the building perimeter; check whether interior glazing is intended.`);
  }else if(!openingOnBoundary(footprint,opening,project.unit)&&!rooms.some(room=>openingOnBoundary(room,opening,project.unit))){
   warnings.push(`Opening ${opening.id} is not on a modelled room wall or the building perimeter.`);
  }
 }
 return warnings;
}
