import {test} from 'node:test';
import assert from 'node:assert/strict';
import {wallBoxes,worldFixture} from '../../web/src/studio/threeGeometry.js';
import {mixedUseBuilding} from '../../web/src/studio/mixedUse.js';
test('3D walls cut real door and window apertures and deduplicate shared room boundaries',()=>{
 const project={unit:'m',width:10,height:8},floor={storeyHeight:4,elements:[{kind:'room',x:0,y:0,width:5,height:8,wallThickness:.18},{kind:'room',x:5,y:0,width:5,height:8,wallThickness:.18}],openings:[{kind:'door',x:5,y:2,width:1,rotation:90},{kind:'window',x:2,y:0,width:2,rotation:0}]};
 const boxes=wallBoxes(project,floor);
 const door=boxes.filter(b=>b.x===5&&b.z===2.5);assert.equal(door.length,1);assert.equal(door[0].bottom,2.4);
 const window=boxes.filter(b=>b.z===0&&b.x===3);assert.equal(window.length,2);assert.equal(window[0].height,1);assert.equal(window[1].bottom,2.7);
 assert.equal(boxes.filter(b=>b.x===5&&b.z===1).length,1);
 assert.ok(boxes.every(b=>[b.x,b.z,b.width,b.depth,b.bottom,b.height].every(Number.isFinite)));
});
test('3D world preserves drawing size and fixture orientation across metre/feet conversion',()=>{
 const project=mixedUseBuilding('three'),floor=project.floors[0],ratio=1/.3048;
 const feet={...project,unit:'ft',width:project.width*ratio,height:project.height*ratio};
 const scale=e=>({...e,x:e.x*ratio,y:e.y*ratio,width:e.width*ratio,height:e.height*ratio,wallThickness:e.wallThickness*ratio});
 const converted={...floor,elements:floor.elements.map(scale),openings:floor.openings.map(scale)};
 const a=wallBoxes(project,floor),b=wallBoxes(feet,converted);assert.equal(a.length,b.length);
 for(let i=0;i<a.length;i++)for(const key of['x','z','width','depth','height','bottom'])assert.ok(Math.abs(a[i][key]-b[i][key])<1e-9);
 const fixture={x:2,y:4,width:3,height:1,rotation:90};assert.deepEqual(worldFixture(fixture,'m'),{x:3.5,z:4.5,width:1,depth:3,rotation:-Math.PI/2});
});

test('roof excludes overlapping outdoor areas without roof overlaps and preserves physical units',async()=>{
 const {ceilingPanels}=await import('../../web/src/studio/threeGeometry.js');
 const project={unit:'m',width:10,height:8},floor={elements:[{kind:'landscape',x:2,y:2,width:4,height:4},{kind:'landscape',x:4,y:2,width:4,height:4}]},before=JSON.stringify(floor),panels=ceilingPanels(project,floor);
 assert.ok(Math.abs(panels.reduce((n,p)=>n+p.width*p.depth,0)-56)<1e-8);
 for(let x=.5;x<10;x++)for(let z=.5;z<8;z++){
  const covered=panels.filter(p=>x>p.x-p.width/2&&x<p.x+p.width/2&&z>p.z-p.depth/2&&z<p.z+p.depth/2).length;
  assert.equal(covered,x>2&&x<8&&z>2&&z<6?0:1);
 }
 const feet={unit:'ft',width:10/.3048,height:8/.3048},converted={elements:floor.elements.map(e=>({...e,x:e.x/.3048,y:e.y/.3048,width:e.width/.3048,height:e.height/.3048}))};
 const convertedPanels=ceilingPanels(feet,converted);assert.equal(convertedPanels.length,panels.length);for(let i=0;i<panels.length;i++)for(const key of ['x','z','width','depth'])assert.ok(Math.abs(panels[i][key]-convertedPanels[i][key])<1e-8);
 assert.equal(JSON.stringify(floor),before);assert.deepEqual(ceilingPanels(project,{elements:[{kind:'landscape',x:0,y:0,width:10,height:8}]}),[]);assert.deepEqual(ceilingPanels(project,{elements:[]}),[{x:5,z:4,width:10,depth:8}]);
});
test('walkthrough locations include terraces and exclude water and parking',async()=>{
 const {walkthroughLocations}=await import('../../web/src/studio/walkthrough.js');
 const elements=[{id:'room',kind:'room'},{id:'terrace',kind:'landscape'},{id:'pool',kind:'water'},{id:'parking',kind:'parking'}];assert.deepEqual(walkthroughLocations({elements}).map(e=>e.id),['room','terrace']);
});

test('a higher full-footprint storey still covers a lower terrace',async()=>{
 const {ceilingPanels}=await import('../../web/src/studio/threeGeometry.js');
 const floor={id:'lower',elevation:4,elements:[{kind:'landscape',x:0,y:0,width:10,height:8}]},upper={id:'upper',elevation:8,elements:floor.elements},p={unit:'m',width:10,height:8,floors:[floor,upper]};
 assert.deepEqual(ceilingPanels(p,floor),[{x:5,z:4,width:10,depth:8}]);assert.deepEqual(ceilingPanels(p,upper),[]);
});
