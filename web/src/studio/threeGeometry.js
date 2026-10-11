// World coordinates are metres. Elevation/storeyHeight remain metres in either drawing unit.
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
