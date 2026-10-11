import {metresPerUnit} from './building.js';
export function buildingEnvelope(project){
 const m=metresPerUnit(project.unit);
 return{width:project.width*m,depth:project.height*m,height:Math.max(...project.floors.map(f=>f.elevation+f.storeyHeight))};
}
export function southFacadeOpenings(project,floor){
 const m=metresPerUnit(project.unit),wallHeight=floor.storeyHeight-.22;
 return floor.openings.filter(o=>(o.rotation===0||o.rotation===180)&&Math.abs((o.y-project.height)*m)<.02).map(o=>{
  const end=o.x+o.width*(o.rotation===180?-1:1),x=Math.min(o.x,end)*m;
  const bottom=o.kind==='window'?Math.min(1,wallHeight*.35):0,top=o.kind==='window'?Math.min(2.7,wallHeight*.85):Math.min(2.4,wallHeight);
  return{id:o.id,kind:o.kind,x,width:o.width*m,bottom,top};
 });
}
