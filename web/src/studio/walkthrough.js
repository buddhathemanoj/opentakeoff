export function canWalkTo(x,z,walls,{width,depth,eyeHeight=1.65,radius=.18,voids=[]}){
  if(x<radius||z<radius||x>width-radius||z>depth-radius)return false;
  if(voids.some(v=>x>v.x-radius&&x<v.x+v.width+radius&&z>v.z-radius&&z<v.z+v.depth+radius))return false;
  return !walls.some(b=>b.bottom<eyeHeight+.12&&b.bottom+b.height>.25&&x>b.x-b.width/2-radius&&x<b.x+b.width/2+radius&&z>b.z-b.depth/2-radius&&z<b.z+b.depth/2+radius);
}
export function entryRoom(floor){
  return floor.elements.find(e=>/public entrance|reception/i.test(e.label))||floor.elements.find(e=>/entry lobby|entrance/i.test(e.label))||floor.elements.find(e=>/circulation|lobby/i.test(e.label))||walkthroughLocations(floor)[0];
}
export function walkthroughLocations(floor){return floor.elements.filter(e=>e.kind==='room'||e.kind==='landscape');}

export function walkPoint(room,walls,bounds,unit='m'){
 const m=unit==='ft'?.3048:1;
 for(const y of [.78,.5,.25,.9,.1])for(const x of [.5,.25,.75,.1,.9]){
  const point=room?{x:(room.x+room.width*x)*m,z:(room.y+room.height*y)*m}:{x:bounds.width*x,z:bounds.depth*y};
  if(canWalkTo(point.x,point.z,walls,bounds))return point;
 }
 return null;
}
