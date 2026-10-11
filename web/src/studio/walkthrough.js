export function canWalkTo(x,z,walls,{width,depth,eyeHeight=1.65,radius=.18}){
  if(x<radius||z<radius||x>width-radius||z>depth-radius)return false;
  return !walls.some(b=>b.bottom<eyeHeight+.12&&b.bottom+b.height>.25&&x>b.x-b.width/2-radius&&x<b.x+b.width/2+radius&&z>b.z-b.depth/2-radius&&z<b.z+b.depth/2+radius);
}
export function entryRoom(floor){
  return floor.elements.find(e=>/public entrance|reception/i.test(e.label))||floor.elements.find(e=>/entry lobby|entrance/i.test(e.label))||floor.elements.find(e=>/circulation|lobby/i.test(e.label))||floor.elements[0];
}
export function walkthroughLocations(floor){return floor.elements.filter(e=>e.kind==='room'||e.kind==='landscape');}
