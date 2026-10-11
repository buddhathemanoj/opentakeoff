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
