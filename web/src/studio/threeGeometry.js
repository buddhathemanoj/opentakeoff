// World coordinates are metres. Elevation/storeyHeight remain metres in either drawing unit.
function panelsWithout(project,areas){
 const m=project.unit==='ft'?.3048:1;
 let panels=[{x:0,z:0,width:project.width*m,depth:project.height*m}];
 for(const area of areas){
  const cut={x:area.x*m,z:area.y*m,width:area.width*m,depth:area.height*m};
  panels=panels.flatMap(p=>{
   const left=Math.max(p.x,cut.x),right=Math.min(p.x+p.width,cut.x+cut.width),near=Math.max(p.z,cut.z),far=Math.min(p.z+p.depth,cut.z+cut.depth);
   if(right<=left||far<=near)return[p];
   return[{x:p.x,z:p.z,width:left-p.x,depth:p.depth},{x:right,z:p.z,width:p.x+p.width-right,depth:p.depth},{x:left,z:p.z,width:right-left,depth:near-p.z},{x:left,z:far,width:right-left,depth:p.z+p.depth-far}].filter(r=>r.width>1e-8&&r.depth>1e-8);
  });
 }
 return panels.map(p=>({...p,x:p.x+p.width/2,z:p.z+p.depth/2}));
}
export function floorVoids(project,floor){const m=project.unit==='ft'?.3048:1;return floor.elements.filter(e=>e.kind==='void').map(e=>({x:e.x*m,z:e.y*m,width:e.width*m,depth:e.height*m}));}
export function floorPanels(project,floor){return panelsWithout(project,floor.elements.filter(e=>e.kind==='void'));}
const nextFloor=(project,floor)=>project.floors?.filter(f=>f.elevation>floor.elevation).sort((a,b)=>a.elevation-b.elevation)[0];
export function roofPanels(project,floor){return panelsWithout(project,floor.elements.filter(e=>e.kind==='landscape'||e.kind==='void'));}
export function ceilingHeight(project,floor){const above=nextFloor(project,floor);return above?above.elevation-floor.elevation:floor.storeyHeight;}
export function ceilingPanels(project,floor){
 const above=nextFloor(project,floor);
 // Follow the actual nearest upper slab; the top roof uses its own outdoor areas.
 return above?floorPanels(project,above):roofPanels(project,floor);
}
export function wallBoxes(project,floor){
 const m=project.unit==='ft'?.3048:1,height=floor.storeyHeight-.22,raw=[];
 const edge=(axis,at,start,end,thickness)=>raw.push({axis,at:at*m,start:start*m,end:end*m,thickness:thickness*m});
 for(const e of floor.elements.filter(e=>e.kind==='room')){
  edge('x',e.y,e.x,e.x+e.width,e.wallThickness);edge('x',e.y+e.height,e.x,e.x+e.width,e.wallThickness);
  edge('z',e.x,e.y,e.y+e.height,e.wallThickness);edge('z',e.x+e.width,e.y,e.y+e.height,e.wallThickness);
 }
 edge('x',0,0,project.width,.28/m);edge('x',project.height,0,project.width,.28/m);
 edge('z',0,0,project.height,.28/m);edge('z',project.width,0,project.height,.28/m);
 const groups=new Map();
 for(const edge of raw){const key=`${edge.axis}:${edge.at.toFixed(4)}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(edge);}
 const boxes=[];
 for(const edges of groups.values()){
  const {axis,at}=edges[0],openings=floor.openings.filter(o=>{
   const alongX=o.rotation===0||o.rotation===180;
   return (axis==='x')===alongX&&Math.abs((axis==='x'?o.y:o.x)*m-at)<.02;
  }).map(o=>{
   const p=(axis==='x'?o.x:o.y)*m,d=o.width*m*((o.rotation===180||o.rotation===270)?-1:1);
   return{start:Math.min(p,p+d),end:Math.max(p,p+d),bottom:o.kind==='window'?Math.min(1,height*.35):0,top:o.kind==='window'?Math.min(2.7,height*.85):Math.min(2.4,height),kind:o.kind};
  });
  const cuts=[...new Set([...edges.flatMap(e=>[e.start,e.end]),...openings.flatMap(o=>[o.start,o.end])])].sort((a,b)=>a-b);
  for(let i=0;i<cuts.length-1;i++){
   const start=cuts[i],end=cuts[i+1],mid=(start+end)/2,cover=edges.filter(e=>mid>e.start&&mid<e.end);
   if(!cover.length||end-start<.001)continue;
   const thickness=Math.max(...cover.map(e=>e.thickness)),opening=openings.find(o=>mid>o.start&&mid<o.end);
   const bands=opening?[[0,opening.bottom],[opening.top,height]]:[[0,height]];
   for(const [low,high] of bands)if(high-low>.001)boxes.push({axis,x:axis==='x'?mid:at,z:axis==='x'?at:mid,width:axis==='x'?end-start:thickness,depth:axis==='x'?thickness:end-start,bottom:low,height:high-low,perimeter:axis==='x'?(Math.abs(at)<.001||Math.abs(at-project.height*m)<.001):(Math.abs(at)<.001||Math.abs(at-project.width*m)<.001)});
  }
 }
 return boxes;
}
export function worldFixture(item,unit){
 const m=unit==='ft'?.3048:1,quarter=item.rotation===90||item.rotation===270;
 return{x:(item.x+item.width/2)*m,z:(item.y+item.height/2)*m,width:(quarter?item.height:item.width)*m,depth:(quarter?item.width:item.height)*m,rotation:-item.rotation*Math.PI/180};
}
