export const BUILDING_SCHEMA='kosal.studio.building.v1';
export const FIXTURE_TYPES=['desk','chair','table','sofa','counter','teller','atm','safe','kitchen','sink','toilet','stair','lift','plant','rack','cabinet'];
export const USES=['bank','cafe','office','mixed'];
export const BUILDING_KINDS=['room','building','landscape','water','parking'];
export const metresPerUnit=unit=>unit==='ft'?.3048:1;
const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
const text=(value,max=120)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
export function validateBuilding(value){
  if(!value||value.schema!==BUILDING_SCHEMA||!text(value.id,100)||!text(value.name)||value.mode!=='building'||!['m','ft'].includes(value.unit))throw new Error('Invalid building project.');
  if(!finite(value.width,1,2000)||!finite(value.height,1,2000))throw new Error('Invalid building dimensions.');
  if(!Array.isArray(value.floors)||value.floors.length<1||value.floors.length>12)throw new Error('A building needs between 1 and 12 floors.');
  const ids=new Set(),unique=id=>{if(!text(id,100)||ids.has(id))throw new Error('Building items need unique IDs.');ids.add(id);};
  const m=metresPerUnit(value.unit),physical=(n,min,max)=>finite(n*m,min-1e-8,max+1e-8);
  const bounds=item=>{if(!finite(item.x,0,value.width)||!finite(item.y,0,value.height)||!finite(item.width,.1,value.width)||!finite(item.height,.1,value.height)||item.x+item.width>value.width+.001||item.y+item.height>value.height+.001)throw new Error(`“${item.label||item.id}” extends outside the building.`);};
  const floors=value.floors.map(f=>{
    unique(f.id);if(!text(f.name)||!USES.includes(f.use)||!finite(f.elevation,0,200)||!finite(f.storeyHeight,2,10))throw new Error('Invalid floor details.');
    if(!Array.isArray(f.elements)||f.elements.length>150||!Array.isArray(f.openings)||f.openings.length>250||!Array.isArray(f.fixtures)||f.fixtures.length>400)throw new Error('Invalid floor geometry.');
    const elements=f.elements.map(e=>{unique(e.id);if(!BUILDING_KINDS.includes(e.kind)||!text(e.label)||!physical(e.wallThickness,.05,.8))throw new Error('Invalid space or wall thickness.');bounds(e);return{id:e.id,kind:e.kind,label:e.label,x:e.x,y:e.y,width:e.width,height:e.height,wallThickness:e.wallThickness};});
    const openings=f.openings.map(o=>{unique(o.id);if(!['door','window','opening'].includes(o.kind)||!finite(o.x,0,value.width)||!finite(o.y,0,value.height)||!physical(o.width,.3,12)||![0,90,180,270].includes(o.rotation)||![-1,1].includes(o.swing))throw new Error('Invalid door or window.');const angle=o.rotation*Math.PI/180,endX=o.x+o.width*Math.cos(angle),endY=o.y+o.width*Math.sin(angle);if(endX<-.001||endX>value.width+.001||endY<-.001||endY>value.height+.001)throw new Error(`Opening “${o.id}” ends outside the building (${endX.toFixed(3)}, ${endY.toFixed(3)} ${value.unit}); boundary is ${value.width} × ${value.height} ${value.unit}.`);return{id:o.id,kind:o.kind,x:o.x,y:o.y,width:o.width,rotation:o.rotation,swing:o.swing};});
    const fixtures=f.fixtures.map(item=>{unique(item.id);if(!FIXTURE_TYPES.includes(item.type)||!text(item.label)||![0,90,180,270].includes(item.rotation))throw new Error('Invalid furniture or fixture.');bounds(item);return{id:item.id,type:item.type,label:item.label,x:item.x,y:item.y,width:item.width,height:item.height,rotation:item.rotation};});
    return{id:f.id,name:f.name,use:f.use,elevation:f.elevation,storeyHeight:f.storeyHeight,elements,openings,fixtures};
  });
  if(new Set(floors.map(f=>f.elevation)).size!==floors.length)throw new Error('Each floor needs a distinct elevation.');
  if(!Array.isArray(value.notes)||value.notes.length>30||value.notes.some(n=>!text(n,1000)))throw new Error('Invalid building notes.');
  return{schema:BUILDING_SCHEMA,id:value.id,name:value.name.trim(),mode:'building',unit:value.unit,width:value.width,height:value.height,floors,notes:[...value.notes]};
}
export function projectView(project,floorId){
  if(project.schema!==BUILDING_SCHEMA)return project;
  const floor=project.floors.find(f=>f.id===floorId)||project.floors[0];
  return{schema:'kosal.studio.project.v1',id:project.id,name:project.name,mode:'floor',unit:project.unit,width:project.width,height:project.height,elements:floor.elements,floor};
}
export function applyView(project,view,floorId){
  if(project.schema!==BUILDING_SCHEMA||view.schema===BUILDING_SCHEMA)return view;
  const current=project.floors.find(f=>f.id===floorId)||project.floors[0];
  const scaled=view.unit!==project.unit;
  const ratio=scaled?(view.unit==='ft'?1/.3048:.3048):1;
  const scaleRect=e=>({...e,x:e.x*ratio,y:e.y*ratio,width:e.width*ratio,height:e.height*ratio,wallThickness:e.wallThickness*ratio});
  return{...project,name:view.name,width:view.width,height:view.height,unit:view.unit,floors:project.floors.map(f=>({...f,elements:f.id===current.id?view.elements.map(e=>({...e,wallThickness:e.wallThickness===undefined?.15/metresPerUnit(view.unit):e.wallThickness*(scaled?ratio:1)})):scaled?f.elements.map(scaleRect):f.elements,openings:scaled?f.openings.map(o=>({...o,x:o.x*ratio,y:o.y*ratio,width:o.width*ratio})):f.openings,fixtures:scaled?f.fixtures.map(i=>({...i,x:i.x*ratio,y:i.y*ratio,width:i.width*ratio,height:i.height*ratio})):f.fixtures}))};
}
export function allElementIds(project){return project.schema===BUILDING_SCHEMA?project.floors.flatMap(f=>[...f.elements,...f.fixtures,...f.openings].map(e=>e.id)):project.elements.map(e=>e.id);}
export function buildingStats(project){return{floors:project.floors.length,grossArea:project.width*project.height*project.floors.length,spaces:project.floors.reduce((sum,f)=>sum+f.elements.length,0),openings:project.floors.reduce((sum,f)=>sum+f.openings.length,0),fixtures:project.floors.reduce((sum,f)=>sum+f.fixtures.length,0)};}

export function convertBuildingUnit(project,unit){
  if(!['m','ft'].includes(unit))throw new Error('Invalid drawing unit.');
  if(project.unit===unit)return project;
  const ratio=metresPerUnit(project.unit)/metresPerUnit(unit);
  const rect=item=>({...item,x:item.x*ratio,y:item.y*ratio,width:item.width*ratio,height:item.height*ratio,...(item.wallThickness===undefined?{}:{wallThickness:item.wallThickness*ratio})});
  return validateBuilding({...project,unit,width:project.width*ratio,height:project.height*ratio,floors:project.floors.map(f=>({...f,elements:f.elements.map(rect),fixtures:f.fixtures.map(rect),openings:f.openings.map(o=>({...o,x:o.x*ratio,y:o.y*ratio,width:o.width*ratio}))}))});
}
export function floorSelection(project,floorId,id){
  const floor=project.floors.find(f=>f.id===floorId)||project.floors[0];
  for(const collection of ['elements','openings','fixtures']){
    const item=floor[collection].find(item=>item.id===id);
    if(item)return{floorId:floor.id,collection,item};
  }
  return null;
}
export function editFloorItem(project,floorId,id,patch,{moveDetails=false}={}){
  const selected=floorSelection(project,floorId,id);
  if(!selected)throw new Error('The selected item is no longer on this floor.');
  return validateBuilding({...project,floors:project.floors.map(f=>{if(f.id!==selected.floorId)return f;const next={...f,[selected.collection]:patch===null?f[selected.collection].filter(i=>i.id!==id):f[selected.collection].map(i=>i.id===id?{...i,...patch}:i)};return moveDetails&&patch&&selected.collection==='elements'&&selected.item.kind==='room'?translateRoomDetails(f,selected.item,{...selected.item,...patch},next):next;})});
}
export function fixtureFrame(item){
  const turned=item.rotation===90||item.rotation===270;
  const width=turned?item.height:item.width,height=turned?item.width:item.height;
  const cx=item.x+item.width/2,cy=item.y+item.height/2,angle=item.rotation*Math.PI/180;
  return{width,height,transform:'translate('+cx+' '+cy+') rotate('+item.rotation+') translate('+(-width/2)+' '+(-height/2)+')',point:(x,y)=>({x:cx+(x-width/2)*Math.cos(angle)-(y-height/2)*Math.sin(angle),y:cy+(x-width/2)*Math.sin(angle)+(y-height/2)*Math.cos(angle)})};
}

export function translateRoomDetails(floor,room,moved,next={...floor,elements:floor.elements.map(e=>e.id===room.id?moved:e)}){
 const dx=moved.x-room.x,dy=moved.y-room.y,eps=1e-6;
 if(!dx&&!dy)return next;
 const inside=(x,y)=>x>=room.x-eps&&x<=room.x+room.width+eps&&y>=room.y-eps&&y<=room.y+room.height+eps;
 const boundary=o=>{const rad=o.rotation*Math.PI/180,ex=o.x+o.width*Math.cos(rad),ey=o.y+o.width*Math.sin(rad);if(!inside(o.x,o.y)||!inside(ex,ey))return false;return Math.abs(o.y-ey)<eps?(Math.abs(o.y-room.y)<eps||Math.abs(o.y-room.y-room.height)<eps):(Math.abs(o.x-room.x)<eps||Math.abs(o.x-room.x-room.width)<eps);};
 return{...next,fixtures:floor.fixtures.map(i=>inside(i.x,i.y)&&inside(i.x+i.width,i.y+i.height)?{...i,x:i.x+dx,y:i.y+dy}:i),openings:floor.openings.map(o=>boundary(o)?{...o,x:o.x+dx,y:o.y+dy}:o)};
}
