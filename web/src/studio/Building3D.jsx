import {useEffect,useRef,useState} from 'react';
import {wallBoxes,worldFixture,ceilingPanels} from './threeGeometry.js';
import {canWalkTo,entryRoom,walkthroughLocations} from './walkthrough.js';
export default function Building3D({project,floorId,onLocationChange}){
 const mount=useRef(null),reset=useRef(null),enter=useRef(null),keys=useRef(new Set()),[walk,setWalk]=useState(false),[roomName,setRoomName]=useState(''),[locationId,setLocationId]=useState(''),[exploded,setExploded]=useState(false),[cutaway,setCutaway]=useState(false),[scope,setScope]=useState('all'),[error,setError]=useState(''),[ready,setReady]=useState(false);
 useEffect(()=>{
  const host=mount.current;let disposed=false,cleanup=()=>{};setReady(false);setError('');
  if(!walk)onLocationChange?.(null);
  async function load(){
   try{
    const THREE=await import('three'),{OrbitControls}=await import('three/addons/controls/OrbitControls.js');if(disposed)return;
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setClearColor('#e6e4df');renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
    renderer.domElement.setAttribute('aria-label','Interactive 3D building. Exterior orbit or interior walkthrough.');renderer.domElement.setAttribute('role','img');renderer.domElement.tabIndex=0;host.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(walk?72:38,1,.1,1200),controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;controls.minDistance=2;controls.maxDistance=400;controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI*.44;controls.enabled=!walk;camera.rotation.order='YXZ';
    const materials=[],geometries=[];
    const material=(color,extra={})=>{const v=new THREE.MeshStandardMaterial({color,roughness:.72,...extra});materials.push(v);return v;};
    const wall=material('#eeeae2'),edge=material('#707b7b'),glass=material('#8fb3bf',{transparent:true,opacity:.4,roughness:.2}),wood=material('#bda080'),fabric=material('#657f81'),leaf=material('#719768'),soil=material('#a58c72'),white=material('#f2f1eb'),metal=material('#56646c'),ground=material('#e2e4dc');
    const box=(parent,w,h,d,x,y,z,mat)=>{
     const geometry=new THREE.BoxGeometry(Math.max(.01,w),Math.max(.01,h),Math.max(.01,d));geometries.push(geometry);
     const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
    };
    const sphere=(parent,r,x,y,z,mat)=>{const geometry=new THREE.SphereGeometry(r,12,8);geometries.push(geometry);const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);};
    const m=project.unit==='ft'?.3048:1,w=project.width*m,d=project.height*m;
    const activeFloor=project.floors.find(f=>f.id===floorId)||project.floors[0];
    const floors=walk?[activeFloor]:scope==='selected'?[activeFloor]:project.floors;
    const showCutaway=!walk&&cutaway,showExploded=!walk&&exploded;
    let top=0;const landscape=material('#b2c2a3');
    floors.forEach((floor,index)=>{
     const group=new THREE.Group(),base=walk||scope==='selected'?0:floor.elevation+(showExploded?index*5:0);group.position.y=base;scene.add(group);top=Math.max(top,base+floor.storeyHeight);
     const floorMat=material(floor.use==='cafe'?'#d6c4ac':floor.use==='bank'?'#d7dfe0':'#e4e5df');
     box(group,w,.2,d,w/2,-.1,d/2,floorMat);
     for(const area of floor.elements.filter(e=>e.kind==='landscape'))box(group,area.width*m,.012,area.height*m,(area.x+area.width/2)*m,.006,(area.y+area.height/2)*m,landscape);
     for(const b of wallBoxes(project,floor)){
      if(showCutaway&&b.perimeter&&(b.x>w-.2||b.z>d-.2))continue;
      const height=showCutaway&&!b.perimeter?Math.min(b.height,1.1):b.height;
      if(showCutaway&&!b.perimeter&&b.bottom>1.1)continue;
      box(group,b.width,height,b.depth,b.x,b.bottom+height/2,b.z,wall);
     }
     for(const o of floor.openings){
      const length=o.width*m,angle=o.rotation*Math.PI/180,cx=(o.x+o.width*Math.cos(angle)/2)*m,cz=(o.y+o.width*Math.sin(angle)/2)*m;
      if(showCutaway&&(cx>w-.2||cz>d-.2))continue;
      const opening=new THREE.Group();opening.position.set(cx,0,cz);opening.rotation.y=-angle;group.add(opening);
      if(o.kind==='window'){
       const sill=Math.min(1,(floor.storeyHeight-.22)*.35),head=Math.min(2.7,(floor.storeyHeight-.22)*.85);
       box(opening,length,head-sill,.055,0,(sill+head)/2,0,glass);for(const x of[-length/2,length/2])box(opening,.04,head-sill,.08,x,(sill+head)/2,0,edge);
       for(const y of[sill,head])box(opening,length,.055,.08,0,y,0,edge);
      }else if(o.kind==='door'){
       // Open leaf makes door locations legible without hiding the interior.
       box(opening,.06,showCutaway?1:2.25,length, -length/2,(showCutaway?1:2.25)/2,-length/2*o.swing,wood);
      }
     }
     for(const item of floor.fixtures){
      const f=worldFixture(item,project.unit),g=new THREE.Group();g.position.set(f.x,0,f.z);g.rotation.y=f.rotation;group.add(g);
      const a=f.width,b=f.depth;
      if(item.type==='plant'){box(g,a*.6,.45,b*.6,0,.225,0,soil);sphere(g,Math.min(a,b)*.43,0,.75,0,leaf);}
      else if(item.type==='stair'){for(let i=0;i<13;i++)box(g,a,.12+i*.14,b/13,0,(.12+i*.14)/2,-b/2+b*(i+.5)/13,white);}
      else if(item.type==='lift'){box(g,a,2.6,b,0,1.3,0,metal);box(g,a*.8,2.2,.035,0,1.1,b/2+.02,edge);}
      else if(item.type==='chair'){box(g,a*.9,.12,b*.85,0,.45,0,fabric);box(g,a*.9,.5,.1,0,.7,-b*.4,fabric);box(g,.12,.42,.12,0,.21,0,metal);}
      else if(item.type==='desk'||item.type==='table'){
       box(g,a,.09,b,0,.75,0,wood);for(const x of[-a*.38,a*.38])for(const z of[-b*.35,b*.35])box(g,.045,.72,.045,x,.36,z,metal);
       if(item.type==='desk'){box(g,a*.36,.35,.045,0,1,-b*.23,metal);box(g,a*.15,.08,b*.2,0,.81,-b*.23,metal);}
      }else if(item.type==='sofa'){box(g,a,.42,b,0,.3,0,fabric);box(g,a,.48,b*.22,0,.62,-b*.39,fabric);}
      else if(item.type==='bed'){box(g,a,.28,b,0,.2,0,wood);box(g,a*.96,.22,b*.94,0,.45,0,white);box(g,a,.95,.08,0,.475,-b*.46,wood);for(const x of[-a*.23,a*.23])box(g,a*.36,.12,b*.18,x,.61,-b*.29,white);box(g,a*.97,.035,b*.28,0,.575,b*.27,fabric);}
      else if(item.type==='shower'){box(g,a,.08,b,0,.04,0,white);box(g,.035,2,b,-a*.48,1,0,glass);box(g,a,2,.035,0,1,-b*.48,glass);box(g,.035,1.6,.035,a*.25,.95,-b*.43,metal);box(g,a*.22,.04,b*.18,a*.25,1.8,-b*.32,metal);box(g,a*.08,.01,b*.08,0,.085,0,metal);}
      else if(item.type==='toilet'){box(g,a*.55,.7,b*.23,0,.35,-b*.36,white);sphere(g,Math.min(a,b)*.28,0,.38,b*.1,white);}
      else if(item.type==='sink'){box(g,a,.78,b,0,.39,0,white);box(g,a*.7,.025,b*.65,0,.79,0,metal);}
      else if(item.type==='rack'||item.type==='safe'||item.type==='cabinet'||item.type==='atm'){box(g,a,item.type==='rack'?1.8:1.2,b,0,item.type==='rack'?.9:.6,0,metal);}
      else {box(g,a,.9,b,0,.45,0,wood);box(g,a+.04,.06,b+.04,0,.93,0,white);}
     }
    });
    if(walk){for(const p of ceilingPanels(project,activeFloor))box(scene,p.width,.16,p.depth,p.x,activeFloor.storeyHeight-.08,p.z,white);}
    else if(!showCutaway&&!showExploded&&scope==='all'){const roofFloor=floors.reduce((a,b)=>a.elevation+a.storeyHeight>b.elevation+b.storeyHeight?a:b);for(const p of ceilingPanels(project,roofFloor))box(scene,p.width,.18,p.depth,p.x,top+.09,p.z,white);}
    box(scene,w+12,.12,d+12,w/2,-.3,d/2,ground);
    const grid=new THREE.GridHelper(Math.max(w,d)+12,Math.ceil(Math.max(w,d)+12),'#c7ccc6','#d7dbd4');grid.position.set(w/2,-.235,d/2);scene.add(grid);geometries.push(grid.geometry);materials.push(grid.material);
    scene.add(new THREE.HemisphereLight('#fff9ed','#8d9b98',2.6));
    const sun=new THREE.DirectionalLight('#fff5df',3.2);sun.position.set(-15,45,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-60;sun.shadow.camera.right=60;sun.shadow.camera.top=60;sun.shadow.camera.bottom=-60;sun.shadow.bias=-.0005;scene.add(sun);
    const walkingWalls=wallBoxes(project,activeFloor),frameTimer=new THREE.Timer();frameTimer.connect(document);
    let yaw=0,pitch=0,drag=null,lastRoomUpdate=0,lastReported;
    const reportLocation=(room,force=false)=>{const id=room?.id||null;if(force||id!==lastReported){lastReported=id;onLocationChange?.(id?{projectId:project.id,floorId:activeFloor.id,elementId:id}:null);}};
    const place=(id)=>{
     const room=activeFloor.elements.find(e=>e.id===id)||entryRoom(activeFloor);
     const px=room?(room.x+room.width/2)*m:w/2,pz=room?(room.y+room.height*.78)*m:d/2;
     camera.position.set(px,1.65,pz);yaw=0;pitch=-.12;camera.rotation.set(pitch,yaw,0);setRoomName(room?.label||activeFloor.name);setLocationId(room?.id||'');reportLocation(room,true);
    };
    enter.current=place;
    const home=()=>{
     if(walk){place();return;}
     const radius=Math.sqrt(w*w+d*d+top*top)/2,vertical=THREE.MathUtils.degToRad(camera.fov),horizontal=2*Math.atan(Math.tan(vertical/2)*camera.aspect),distance=radius/Math.sin(Math.min(vertical,horizontal)/2)*1.06;
     controls.target.set(w/2,top*.45,d/2);
     camera.position.copy(controls.target).add(new THREE.Vector3(1,.75,1).normalize().multiplyScalar(distance));controls.update();
    };
    reset.current=home;
    const resize=()=>{const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();};
    const observer=new ResizeObserver(resize);observer.observe(host);resize();home();
    const canvas=renderer.domElement;
    const keydown=e=>{if(!walk)return;if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Escape'].includes(e.key)){e.preventDefault();e.stopPropagation();if(e.key==='Escape'){setWalk(false);return;}keys.current.add(e.key.toLowerCase());}};
    const keyup=e=>keys.current.delete(e.key.toLowerCase());
    const clear=()=>keys.current.clear();
    const down=e=>{if(!walk)return;canvas.focus();canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY};};
    const move=e=>{if(!walk||!drag)return;yaw-=(e.clientX-drag.x)*.004;pitch=Math.max(-1.1,Math.min(1.1,pitch-(e.clientY-drag.y)*.004));drag={x:e.clientX,y:e.clientY};camera.rotation.set(pitch,yaw,0);};
    const up=()=>{drag=null;};
    canvas.addEventListener('keydown',keydown);canvas.addEventListener('keyup',keyup);canvas.addEventListener('blur',clear);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);window.addEventListener('blur',clear);
    let frame;const animate=timestamp=>{
     if(disposed)return;frame=requestAnimationFrame(animate);frameTimer.update(timestamp);const dt=Math.min(frameTimer.getDelta(),.05);
     if(document.visibilityState==='visible'){
      if(walk){
       const pressed=keys.current;let forward=(pressed.has('w')||pressed.has('arrowup')?1:0)-(pressed.has('s')||pressed.has('arrowdown')?1:0),side=(pressed.has('d')?1:0)-(pressed.has('a')?1:0);
       yaw+=((pressed.has('arrowleft')?1:0)-(pressed.has('arrowright')?1:0))*dt*1.5;camera.rotation.set(pitch,yaw,0);
       const norm=Math.hypot(forward,side)||1,speed=2.4*dt/norm,dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed,bounds={width:w,depth:d};
       if(canWalkTo(camera.position.x+dx,camera.position.z,walkingWalls,bounds))camera.position.x+=dx;
       if(canWalkTo(camera.position.x,camera.position.z+dz,walkingWalls,bounds))camera.position.z+=dz;
       if(frameTimer.getElapsed()-lastRoomUpdate>.5){lastRoomUpdate=frameTimer.getElapsed();const room=walkthroughLocations(activeFloor).find(e=>camera.position.x>=e.x*m&&camera.position.x<=(e.x+e.width)*m&&camera.position.z>=e.y*m&&camera.position.z<=(e.y+e.height)*m);setRoomName(room?.label||activeFloor.name);setLocationId(room?.id||'');reportLocation(room);}
      }else controls.update();
      renderer.render(scene,camera);
     }
    };animate();
    cleanup=()=>{clear();canvas.removeEventListener('keydown',keydown);canvas.removeEventListener('keyup',keyup);canvas.removeEventListener('blur',clear);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);window.removeEventListener('blur',clear);enter.current=null;cancelAnimationFrame(frame);observer.disconnect();frameTimer.dispose();controls.dispose();for(const g of geometries)g.dispose();for(const v of materials){if(Array.isArray(v))v.forEach(m=>m.dispose());else v.dispose();}renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();reset.current=null;};
    setReady(true);
   }catch(e){if(!disposed)setError(`3D rendering is unavailable on this device. ${e.message}`);}
  }
  load();return()=>{disposed=true;cleanup();};
 },[project,floorId,exploded,cutaway,scope,walk,onLocationChange]);
 const floor=project.floors.find(f=>f.id===floorId)||project.floors[0];
 const moveButton=(key,label,glyph)=><button aria-label={label} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);keys.current.add(key);}} onPointerUp={()=>keys.current.delete(key)} onPointerCancel={()=>keys.current.delete(key)}>{glyph}</button>;
 return <section className={'ks-three-view '+(walk?'is-walking':'')} aria-label="Interactive 3D building viewer"><div className="ks-three-controls">
  <button aria-pressed={walk} className="ks-enter-building" onClick={()=>setWalk(!walk)}>{walk?'Exit walkthrough':'Enter building'}</button>
  {!walk&&<><label>Show <select aria-label="3D floor visibility" value={scope} onChange={e=>setScope(e.target.value)}><option value="all">All floors</option><option value="selected">Selected floor</option></select></label><button aria-pressed={exploded} onClick={()=>setExploded(!exploded)} disabled={scope==='selected'}>Exploded</button><button aria-pressed={cutaway} onClick={()=>setCutaway(!cutaway)}>Cutaway</button></>}
  {walk&&<label>Go to <select aria-label="Walkthrough location" value={walkthroughLocations(floor).some(e=>e.id===locationId)?locationId:''} onChange={e=>enter.current?.(e.target.value)}><option value="" disabled>Choose a space</option>{walkthroughLocations(floor).map(e=><option key={e.id} value={e.id}>{e.label}</option>)}</select></label>}
  <button onClick={()=>reset.current?.()}>{walk?'Return to entry':'Reset view'}</button>
 </div><div className="ks-three-canvas" ref={mount}/>{error?<p className="ks-three-status" role="alert">{error}</p>:!ready&&<p className="ks-three-status" role="status">Loading 3D building…</p>}
 {walk&&<><div className="ks-walk-location">{floor.name}<strong>{roomName}</strong></div><div className="ks-walk-pad">{moveButton('arrowleft','Turn left','↶')}{moveButton('w','Move forward','↑')}{moveButton('arrowright','Turn right','↷')}{moveButton('a','Move left','←')}{moveButton('s','Move backward','↓')}{moveButton('d','Move right','→')}</div></>}
 <p className="ks-three-hint">{walk?'Click the scene · WASD to walk · Drag to look · Esc to exit':'Drag to orbit · Scroll to zoom · Right-drag to pan'}<br/>Concept model · Indicative architecture and furnishings</p></section>;
}
