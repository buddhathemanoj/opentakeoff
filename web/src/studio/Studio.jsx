import { useEffect, useRef, useState } from 'react';
import { KINDS, KIND_LABELS, PAINT, exampleProject, newProject, validateProject, metrics, layoutWarnings } from './model.js';
import {drawingSvg} from './drawingSvg.jsx';
import { RECOVERY_STORAGE, EMPTY_RECOVERY, restoreRecovery, validateChats } from './recovery.js';
import { BUILDING_SCHEMA, BUILDING_KINDS, FIXTURE_TYPES, projectView, applyView, buildingStats, floorSelection, editFloorItem, convertBuildingUnit, metresPerUnit } from './building.js';
import { createPlanPdf } from './planPdf.js';
import { localStore } from '../lib/store.js';
import { mixedUseBuilding } from './mixedUse.js';
import FloorDetails from './FloorDetails.jsx';
import Building3D from './Building3D.jsx';
import ResizeHandle from './ResizeHandle.jsx';
import NumberField from './NumberField.jsx';
import EstimatePanel from './EstimatePanel.jsx';
import CodexConnection from './CodexConnection.jsx';
import {restoreLayout,LAYOUT_STORAGE} from './layoutPreferences.js';
import { BuildingStack, BuildingElevation } from './BuildingViews.jsx';
import TitlebarAura from './TitlebarAura.jsx';
import arcloomLogo from '../brand/arcloom-logo.png';
import '@fontsource-variable/dm-sans';
import { MousePointer2, Plus, Layers, Sparkles, ArrowUp, Undo2, Redo2, Upload, Grid2X2, Folder, Maximize, Trash2, X, Check, ChevronRight, Square, FileText, MessageSquare, CircleHelp } from 'lucide-react';
import {WorkspaceIdentity} from '../brand/WorkspaceIdentity.jsx';
import './studio.css';
import './takeoffTheme.css';

const EMPTY_MESSAGES=[];
const CHAT_STORAGE = 'kosal.studio.chats.v1';
function restoreChats(){try{return {records:validateChats(JSON.parse(localStorage.getItem(CHAT_STORAGE)||'{}')),error:''};}catch{return {records:{},error:'Saved chat messages could not be opened. The original saved data is preserved.'};}}
const STORAGE = 'kosal.studio.projects.v1';
function restore() {
  try {
    const raw=localStorage.getItem(STORAGE);
    if(!raw)return {projects:[exampleProject()],error:''};
    const rows=JSON.parse(raw);
    if(!Array.isArray(rows)||!rows.length)throw new Error('No drawings found.');
    return {projects:rows.map(validateProject),error:''};
  } catch {return {projects:[exampleProject()],error:'Saved drawings could not be opened. Your stored data has not been overwritten. Export your current drawing before clearing storage.'};}
}
function download(name,text,type) {
  const url=URL.createObjectURL(new Blob([text],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const GLYPHS={cursor:MousePointer2,plus:Plus,layers:Layers,sparkle:Sparkles,arrow:ArrowUp,undo:Undo2,redo:Redo2,export:Upload,grid:Grid2X2,folder:Folder,fit:Maximize,delete:Trash2,close:X,check:Check,chevron:ChevronRight,stop:Square,file:FileText,chat:MessageSquare,help:CircleHelp};
function Glyph({name,size=18}) {
  const Icon=GLYPHS[name]||Grid2X2;
  return <Icon size={size} strokeWidth={2} aria-hidden="true"/>;
}
function Brand(){return <span className="ks-brand"><img src={arcloomLogo} width="32" height="32" alt="" aria-hidden="true"/><span>Arcloom</span></span>;}

const round=n=>Math.round(n*10)/10;
const format=n=>new Intl.NumberFormat(undefined,{maximumFractionDigits:1}).format(n);

function Drawing({project,selected,onSelect,onMove,tool,onDraw,zoom,setZoom,showGrid,showLabels,readOnly=false}) {
  const svg=useRef(null),gesture=useRef(null);
  const [preview,setPreview]=useState(null);
  const pad=Math.max(project.width*.08,project.height*.08,2);
  const font=Math.max(project.width/65,.18);
  const point=e=>{const p=svg.current.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.current.getScreenCTM().inverse());};
  const start=(e,element)=>{
    if(readOnly||e.button!==0)return;
    if(tool==='select'&&!element){onSelect(null);return;}
    e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);
    const p=point(e);
    if(tool==='select'&&element){onSelect(element.id);gesture.current={kind:'move',start:p,element};}
    else if(tool!=='select')gesture.current={kind:'draw',start:p};
  };
  const move=e=>{
    const g=gesture.current;if(!g)return;const p=point(e);
    if(g.kind==='move')setPreview({...g.element,x:round(Math.max(0,Math.min(project.width-g.element.width,g.element.x+p.x-g.start.x))),y:round(Math.max(0,Math.min(project.height-g.element.height,g.element.y+p.y-g.start.y)))});
    else {
      const x=Math.max(0,Math.min(project.width,g.start.x,p.x)), y=Math.max(0,Math.min(project.height,g.start.y,p.y));
      setPreview({id:'new',kind:tool,label:KIND_LABELS[tool],x:round(x),y:round(y),width:round(Math.min(project.width-x,Math.abs(p.x-g.start.x))),height:round(Math.min(project.height-y,Math.abs(p.y-g.start.y)))});
    }
  };
  const finish=()=>{if(preview&&gesture.current){if(gesture.current.kind==='move')onMove(preview);else if(preview.width>=.1&&preview.height>=.1)onDraw(preview);}gesture.current=null;setPreview(null);};
  const shapes=project.elements.map(e=>preview?.id===e.id?preview:e);
  if(preview?.id==='new')shapes.push(preview);
  return <div className={`ks-drawing ${tool!=='select'?'is-drawing':''}`} onWheel={e=>{if(e.ctrlKey||e.metaKey)setZoom(z=>Math.max(.5,Math.min(3,z-e.deltaY*.002)));}}>
    <div className="ks-sheet-surround" style={{width:`${zoom*100}%`,minWidth:`${zoom*100}%`}}>
      <svg ref={svg} className="ks-sheet" viewBox={`${-pad} ${-pad} ${project.width+pad*2} ${project.height+pad*2}`} onPointerDown={e=>start(e,null)} onPointerMove={move} onPointerUp={finish} onPointerCancel={()=>{gesture.current=null;setPreview(null);}} aria-label={`${project.name}, ${project.width} by ${project.height} ${project.unit}`}>
        <defs><pattern id="ks-grid" width={project.mode==='floor'?1:5} height={project.mode==='floor'?1:5} patternUnits="userSpaceOnUse"><path d={`M ${project.mode==='floor'?1:5} 0 L 0 0 0 ${project.mode==='floor'?1:5}`} fill="none" stroke="#e4e6df" strokeWidth=".07"/></pattern></defs>
        <rect x={-pad} y={-pad} width={project.width+2*pad} height={project.height+2*pad} fill="#fafaf7"/>
        <rect width={project.width} height={project.height} fill={showGrid?'url(#ks-grid)':'#fafaf7'} stroke="#98a191" strokeWidth=".15"/>
        <g fill="#818779" fontFamily="monospace" fontSize={font*.75}>
          <text x={project.width/2} y={-pad*.35} textAnchor="middle">{format(project.width)} {project.unit}</text>
          <text transform={`translate(${-pad*.4},${project.height/2}) rotate(-90)`} textAnchor="middle">{format(project.height)} {project.unit}</text>
          <text x={project.width+pad*.55} y={-pad*.35} textAnchor="middle">N</text>
          <path d={`m${project.width+pad*.55},${pad*.3} v${-pad*.45} m${-pad*.12},${pad*.15} l${pad*.12},${-pad*.15} ${pad*.12},${pad*.15}`} stroke="#818779" strokeWidth=".16" fill="none"/>
        </g>
        {shapes.map(e=><g key={e.id} className={`ks-geometry ${selected===e.id?'is-selected':''}`} onPointerDown={event=>start(event,e)} tabIndex={readOnly?-1:0} role="button" aria-label={`${e.label}, ${format(e.width*e.height)} square ${project.unit}`} onKeyDown={event=>{if(event.key==='Enter'||event.key===' ')onSelect(e.id);}}>
          <rect x={e.x} y={e.y} width={e.width} height={e.height} fill={project.floor?(e.kind==='landscape'?'#e1eadb':project.floor.use==='bank'?'#edf1f3':project.floor.use==='cafe'?'#f5f0e8':'#f0f2ef'):PAINT[e.kind]?.fill} stroke={selected===e.id?'#bd6c40':PAINT[e.kind]?.stroke} strokeWidth={selected===e.id ? .35 : .12}/>
          {e.kind==='road'&&<path d={e.width>e.height?`M${e.x+.6} ${e.y+e.height/2}h${Math.max(0,e.width-1.2)}`:`M${e.x+e.width/2} ${e.y+.6}v${Math.max(0,e.height-1.2)}`} stroke="#fbfbf7" strokeWidth=".2" strokeDasharray="1 1"/>}
          {e.kind==='landscape'&&e.width>4&&e.height>3&&Array.from({length:Math.min(8,Math.floor(e.width/4))},(_,i)=><circle key={i} cx={e.x+2+i*(e.width-4)/Math.max(1,Math.min(8,Math.floor(e.width/4))-1)} cy={e.y+e.height/2} r={Math.min(e.height/3,1.4)} fill="none" stroke="#a7b69a" strokeWidth=".12"/>)}
          {!project.floor&&showLabels&&e.width>1&&e.height>1&&<g fill="#51574b" fontFamily="sans-serif" textAnchor="middle" pointerEvents="none"><text x={e.x+e.width/2} y={e.y+e.height/2} fontSize={Math.min(font,e.width/Math.max(e.label.length*.58,5))}>{e.label}</text>{e.height>font*4&&<text x={e.x+e.width/2} y={e.y+e.height/2+font*1.4} fontSize={font*.64} fill="#828777">{format(e.width*e.height)} {project.unit}²</text>}</g>}
          {selected===e.id&&[[e.x,e.y],[e.x+e.width,e.y],[e.x,e.y+e.height],[e.x+e.width,e.y+e.height]].map(([x,y],i)=><rect key={i} x={x-.3} y={y-.3} width=".6" height=".6" fill="#fff" stroke="#bd6c40" strokeWidth=".14"/>)}
        </g>)}
        {project.floor&&<FloorDetails floor={{...project.floor,elements:shapes}} width={project.width} height={project.height} unit={project.unit} showLabels={showLabels} selected={selected} onSelect={readOnly?undefined:onSelect}/>}
        {!shapes.length&&<g fill="#a0a498" textAnchor="middle" fontFamily="sans-serif"><text x={project.width/2} y={project.height/2} fontSize={font*1.6}>Your next idea starts here.</text><text x={project.width/2} y={project.height/2+font*2.5} fontSize={font}>Draw an element, or describe a layout to Arcloom.</text></g>}
        <text x="0" y={project.height+pad*.7} fill="#9da294" fontSize={font*.65} fontFamily="monospace">ARCLOOM / CONCEPT DRAWING</text>
        <text x={project.width} y={project.height+pad*.7} textAnchor="end" fill="#9da294" fontSize={font*.65} fontFamily="monospace">{project.floor?`ELEV. +${project.floor.elevation.toFixed(1)} m`:project.mode==='site'?'SITE — 01':'FLOOR — 01'}</text>
      </svg>
    </div>
  </div>;
}

export default function Studio({takeoffWorkspace}) {
  const [boot]=useState(restore);
  const root=useRef(null),splitGesture=useRef(null),[layout,setLayout]=useState(()=>restoreLayout(localStorage));
  const resizeLayout=(key,value)=>setLayout(current=>({...current,[key]:value}));
  useEffect(()=>{try{localStorage.setItem(LAYOUT_STORAGE,JSON.stringify(layout));}catch{/* Layout preferences are optional. */}},[layout]);
  const [projects,setProjects]=useState(boot.projects), [active,setActive]=useState(boot.projects[0].id);
  const storedProject=projects.find(p=>p.id===active)||projects[0];
  const [activeFloor,setActiveFloor]=useState('f0'),[buildingView,setBuildingView]=useState('plan'),[workspace,setWorkspace]=useState('design');
  const project=projectView(storedProject,activeFloor);
  const isBuilding=storedProject.schema===BUILDING_SCHEMA;
  const [moveRoomDetails,setMoveRoomDetails]=useState(true);
  const [selected,setSelected]=useState(null),[tool,setTool]=useState('select'),[zoom,setZoom]=useState(1);
  const [showGrid,setShowGrid]=useState(true),[showLabels,setShowLabels]=useState(true),[panel,setPanel]=useState('layers');
  const [past,setPast]=useState([]),[future,setFuture]=useState([]),[notice,setNotice]=useState(boot.error),[saved,setSaved]=useState(false);
  const [chatBoot]=useState(restoreChats),[recoveryBoot]=useState(()=>restoreRecovery(localStorage));
  const [chats,setChats]=useState(chatBoot.records),[recovery,setRecovery]=useState(recoveryBoot.records);
  const [status,setStatus]=useState(null),[running,setRunning]=useState(false),[activity,setActivity]=useState('');
  const [previewProposal,setPreviewProposal]=useState(true);
  const session=recovery[active]||EMPTY_RECOVERY;
  const prompt=running?'':session.draft,proposal=session.proposal,proposalBase=session.base;
  const recoveryRef=useRef(recovery);
  const updateRecovery=patch=>{const rows=recoveryRef.current,next={...rows,[active]:{...(rows[active]||EMPTY_RECOVERY),...patch}};recoveryRef.current=next;setRecovery(next);if(!recoveryBoot.error){try{localStorage.setItem(RECOVERY_STORAGE,JSON.stringify(next));}catch{setNotice('Conversation storage is full. Export your drawing to keep a backup.');}}};
  const setPrompt=draft=>updateRecovery({draft});
  const setProposal=proposal=>updateRecovery({proposal});
  const [exportOpen,setExportOpen]=useState(false),[newOpen,setNewOpen]=useState(false),[helpOpen,setHelpOpen]=useState(false);
  const [exporting,setExporting]=useState(false),[estimateOpen,setEstimateOpen]=useState(false);
  const [previewOpen,setPreviewOpen]=useState(false),[sidebarOpen,setSidebarOpen]=useState(()=>window.innerWidth>760);
  const messages=Array.isArray(chats[active])?chats[active]:EMPTY_MESSAGES;
  const setMessages=fn=>setChats(rows=>({...rows,[active]:fn(Array.isArray(rows[active])?rows[active]:[])}));
  useEffect(()=>{if(chatBoot.error)return;try{localStorage.setItem(CHAT_STORAGE,JSON.stringify(chats));}catch{setNotice('Conversation storage is full. Export your drawing to keep a backup.');}},[chats,chatBoot.error]);
  const request=useRef(null),fileInput=useRef(null),chatBottom=useRef(null),chatScroll=useRef(null);
  const selection=isBuilding?floorSelection(storedProject,activeFloor,selected):null;
  const element=selection?.item||project.elements.find(e=>e.id===selected), stats=metrics(project), warnings=layoutWarnings(proposal||project);
  const collection=selection?.collection||'elements';
  const stale=proposal&&proposalBase!==JSON.stringify(storedProject);
  useEffect(()=>{if(boot.error)return;try{localStorage.setItem(STORAGE,JSON.stringify(projects));setSaved(true);}catch{setSaved(false);setNotice('Browser storage is full. Export a project backup to keep your work.');}},[projects,boot.error]);
  useEffect(()=>{let live=true;fetch('/api/studio/status').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(s=>{if(live)setStatus(s);}).catch(()=>{if(live)setStatus({available:false,connected:false});});return()=>{live=false;};},[]);
  useEffect(()=>{if(messages.length||running||activity)chatBottom.current?.scrollIntoView({block:'nearest'});else chatScroll.current?.scrollTo({top:0});},[active,messages,running,activity,status?.connected]);
  useEffect(()=>()=>request.current?.abort(),[]);
  const update=next=>{try{const valid=validateProject(applyView(storedProject,next,activeFloor));setPast(p=>[...p.slice(-39),storedProject]);setFuture([]);setProjects(rows=>rows.map(p=>p.id===active?valid:p));setNotice('');}catch(e){setNotice(e.message);}};
  const undo=()=>{if(!past.length)return;setFuture(f=>[storedProject,...f]);setProjects(rows=>rows.map(p=>p.id===active?past[past.length-1]:p));setPast(p=>p.slice(0,-1));setSelected(null);};
  const redo=()=>{if(!future.length)return;setPast(p=>[...p,storedProject]);setProjects(rows=>rows.map(p=>p.id===active?future[0]:p));setFuture(f=>f.slice(1));setSelected(null);};
  const selectProject=id=>{if(running)return;setActive(id);setPast([]);setFuture([]);setSelected(null);setZoom(1);setPreviewProposal(true);if(window.innerWidth<=760)setSidebarOpen(false);};
  const addProject=mode=>{if(projects.length>=30){setNotice('Export a backup before adding more than 30 local projects.');return;}const next=mode==='building'?mixedUseBuilding():newProject(mode);setProjects(p=>[next,...p]);selectProject(next.id);setNewOpen(false);setWorkspace('design');if(mode==='building'){setActiveFloor('f0');setPreviewOpen(true);setBuildingView('plan');}};
  const editElement=patch=>{if(element){try{update(isBuilding?editFloorItem(storedProject,activeFloor,selected,patch,{moveDetails:moveRoomDetails}):{...project,elements:project.elements.map(e=>e.id===selected?{...e,...patch}:e)});}catch(error){setNotice(error.message);}}};
  const remove=()=>{if(element){update(isBuilding?editFloorItem(storedProject,activeFloor,selected,null):{...project,elements:project.elements.filter(e=>e.id!==selected)});setSelected(null);}};
  const addDetail=(type,collection)=>{
    if(!type||!isBuilding)return;
    const m=metresPerUnit(project.unit),room=collection==='fixtures'&&element?.kind==='room'?element:null;
    const [fixtureWidth,fixtureHeight]=type==='bed'?[1.8,2]:type==='shower'?[1.2,1.2]:[.8,.6];
    const item=collection==='fixtures'?{id:crypto.randomUUID(),type,label:type[0].toUpperCase()+type.slice(1),x:(room?room.x+room.width/2:project.width/2)-fixtureWidth/2/m,y:(room?room.y+room.height/2:project.height/2)-fixtureHeight/2/m,width:fixtureWidth/m,height:fixtureHeight/m,rotation:0}:{id:crypto.randomUUID(),kind:type,x:element?.kind==='room'?element.x+Math.max(0,(element.width-1/m)/2):Math.max(0,(project.width-1/m)/2),y:element?.kind==='room'?element.y:project.height,width:1/m,rotation:0,swing:1};
    const floor=project.floor;
    update({...storedProject,floors:storedProject.floors.map(f=>f.id===floor.id?{...f,[collection]:[...f[collection],item]}:f)});
    setSelected(item.id);setPanel('layers');setBuildingView('plan');setPreviewProposal(false);setTool('select');
  };
  const send=async()=>{
    if(!prompt.trim()||running)return;
    const text=prompt.trim(),base=JSON.stringify(storedProject),history=messages.filter(m=>m.role!=='error').slice(-8).map(({role,content})=>({role,content}));
    updateRecovery({draft:text,pending:true,proposal:null,base:''});setMessages(m=>[...m,{role:'user',content:text}]);setRunning(true);setActivity('Connecting to Codex…');
    const controller=new AbortController();request.current=controller;
    let gotResult=false;
    try {
      const res=await fetch('/api/studio/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Kosal-Client':'studio'},signal:controller.signal,body:JSON.stringify({prompt:text,project:storedProject,history,selected:selected?[selected]:[]})});
      if(!res.ok){const body=await res.json().catch(()=>({}));throw new Error(body.error||'Could not reach the local AI service.');}
      const reader=res.body.getReader(),decoder=new TextDecoder();let buffer='';
      while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let n;
        while((n=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,n);buffer=buffer.slice(n+1);if(!line)continue;const event=JSON.parse(line);
          if(event.type==='status')setActivity(event.message);
          if(event.type==='error'){if(event.code==='CODEX_AUTH_REQUIRED'){setStatus({available:true,connected:false,needsSignIn:true});setNotice('');}throw new Error(event.message);}
          if(event.type==='result'){if(event.proposal)validateProject(event.proposal);gotResult=true;setMessages(m=>[...m,{role:'assistant',content:event.message}]);if(event.proposal){updateRecovery({proposal:validateProject(event.proposal),base});setPreviewProposal(true);}}
        }
      }
      if(!gotResult)throw new Error('The connection ended before Codex finished. Please retry.');
    } catch(e){setMessages(m=>[...m,{role:'error',content:e.name==='AbortError'?'Stopped. Your drawing is unchanged.':e.message}]);}
    finally{updateRecovery({pending:false,draft:gotResult?'':text});setRunning(false);setActivity('');request.current=null;}
  };
  const importProject=async file=>{if(!file||running)return;try{if(projects.length>=30)throw new Error('Export a backup before adding more than 30 local projects.');if(file.size>1000000)throw new Error('Choose a project smaller than 1 MB.');const imported=validateProject(JSON.parse(await file.text()));const copy={...imported,id:crypto.randomUUID()};setProjects(rows=>[copy,...rows]);selectProject(copy.id);}catch(e){setNotice(e.message);}if(fileInput.current)fileInput.current.value='';};
  const exportPdf=async (toTakeoff,target=storedProject)=>{if(exporting)return;setExporting(true);setExportOpen(false);try{const bytes=await createPlanPdf(target);const name=`${target.name.replace(/[\\/:*?"<>|]/g,'-')}-${target.id.slice(0,8)}.pdf`;if(toTakeoff){await localStore.addPdf(new File([bytes],name,{type:'application/pdf'}));setWorkspace('takeoff');}else download(name,bytes,'application/pdf');}catch(error){setNotice(error.message||'Could not export the drawing set.');}finally{setExporting(false);}};
  const connectStatus=next=>{setStatus(next);if(next.connected)setNotice('Codex is ready. Describe your design to begin.');};
  const selectFloor=id=>{setActiveFloor(id);setSelected(null);if(buildingView!=='three')setBuildingView('plan');setEstimateOpen(false);};
  const shownStored=proposal&&previewProposal?proposal:storedProject;
  const shown=projectView(shownStored,activeFloor);
  const shownBuilding=shownStored.schema===BUILDING_SCHEMA;
  return <div ref={root} style={{'--ks-sidebar-size':sidebarOpen?layout.sidebar+'px':'0px','--ks-chat-ratio':layout.chat+'fr','--ks-preview-ratio':(100-layout.chat)+'fr','--ks-projects-size':layout.projects+'px','--ks-layers-size':layout.layers+'px'}} className={`ks-app ${previewOpen?'preview-open':''} ${sidebarOpen?'':'sidebar-closed'} ${workspace==='takeoff'?'takeoff-mode':''}`} onKeyDown={e=>{if(workspace!=='design'||e.target.closest('input,textarea,select'))return;if((e.metaKey||e.ctrlKey)&&e.key==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();}if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();remove();}if(e.key==='Escape'){setSelected(null);setTool('select');setExportOpen(false);setNewOpen(false);setHelpOpen(false);}}}>
    <TitlebarAura busy={running}/><header className="ks-topbar">
      <button className="ks-icon-button" aria-label="Toggle sidebar" onClick={()=>setSidebarOpen(!sidebarOpen)}><Glyph name="layers"/></button>
      <input className="ks-project-title" aria-label="Project name" value={project.name} maxLength={120} onChange={e=>{if(e.target.value.trim())update({...project,name:e.target.value});}}/>
      <span className="ks-save"><span className={saved?'ks-dot':'ks-dot warning'}/>{saved?'Saved on this device':'Not saved'}</span>
      <button className="ks-button quiet ks-help" onClick={()=>setHelpOpen(true)}><Glyph name="help"/>Guide</button>
      <button className={`ks-button ${previewOpen?'':'primary'}`} aria-pressed={previewOpen} onClick={()=>setPreviewOpen(!previewOpen)}><Glyph name="grid"/>{previewOpen?'Close preview':'Preview'}</button><div className="ks-menu-wrap"><button disabled={exporting} className="ks-button quiet" onClick={()=>setExportOpen(!exportOpen)}><Glyph name="export"/>Export</button>{exportOpen&&<div className="ks-popover"><button disabled={exporting} onClick={()=>exportPdf(false)}>Architectural plan set <span>.pdf</span></button><button disabled={exporting} onClick={()=>exportPdf(true)}>Open in Plan takeoff <span>Measure</span></button><button onClick={()=>{download(`${project.name}.kosal.json`,JSON.stringify(storedProject,null,2),'application/json');setExportOpen(false);}}>Editable project <span>.json</span></button><button onClick={()=>{download(`${project.name}.svg`,drawingSvg(storedProject,project.floor?.id),'image/svg+xml');setExportOpen(false);}}>{isBuilding?'Current floor sheet':'Drawing sheet'} <span>.svg</span></button></div>}</div>
    </header>
    <div className="ks-body">
      <aside className="ks-sidebar"><div className="ks-sidebar-brand"><Brand/><span className="ks-beta">BETA</span></div>
        <nav className="ks-workspaces"><button className={workspace==='design'?'active':''} onClick={()=>setWorkspace('design')}><Glyph name="grid"/>Design studio<span>01</span></button><button className={workspace==='takeoff'?'active':''} onClick={()=>{setWorkspace('takeoff');if(window.innerWidth<=760)setSidebarOpen(false);}}><Glyph name="file"/>PDF takeoff<Glyph name="chevron" size={14}/></button></nav>
        <button className="ks-button primary ks-new-project" aria-label="New project" disabled={running} onClick={()=>setNewOpen(!newOpen)}><Glyph name="plus" size={16}/>New design</button><div className="ks-section-heading"><span>YOUR PROJECTS</span><span>{projects.length}</span></div>
        {newOpen&&<div className="ks-new-options"><button onClick={()=>addProject('building')}>3-floor bank / café / IT building</button><button onClick={()=>addProject('site')}>New site layout</button><button onClick={()=>addProject('floor')}>New floor plan</button><button onClick={()=>fileInput.current?.click()}>Import Arcloom project</button></div>}
        <input type="file" hidden ref={fileInput} accept=".json" onChange={e=>importProject(e.target.files[0])}/>
        <div className="ks-project-list">{projects.map(p=><button key={p.id} disabled={running} className={p.id===active?'active':''} onClick={()=>selectProject(p.id)}><Glyph name="folder" size={16}/><span>{p.name}</span></button>)}</div>
        <ResizeHandle label="Resize Projects section" orientation="horizontal" value={layout.projects} min={80} max={360} onChange={v=>resizeLayout('projects',v)} className={previewOpen?'ks-section-resizer':'ks-section-resizer is-hidden'}/><div className="ks-editor-sidebar" hidden={!previewOpen}><div className="ks-sidebar-tabs"><button className={panel==='layers'?'active':''} onClick={()=>setPanel('layers')}>Layers <span>{project.elements.length}</span></button><button className={panel==='document'?'active':''} onClick={()=>setPanel('document')}>Drawing</button></div>
        {panel==='layers'?<div className="ks-layer-list">
          {(isBuilding?[{title:'Spaces',items:project.elements,key:'elements'},{title:'Doors & windows',items:project.floor.openings,key:'openings'},{title:'Furniture & fixtures',items:project.floor.fixtures,key:'fixtures'}]:[{title:'Elements',items:project.elements,key:'elements'}]).map(group=><details className="ks-layer-group" key={group.key} open={group.key===collection}><summary>{group.title}<span>{group.items.length}</span></summary>{group.items.map(e=><button key={e.id} className={selected===e.id?'active':''} onClick={()=>{setSelected(e.id);setTool('select');setPreviewProposal(false);setBuildingView('plan');}}><span className="ks-layer-color" style={{background:PAINT[e.kind]?.stroke||'#879898'}}/><span>{e.label||e.kind[0].toUpperCase()+e.kind.slice(1)+' · '+e.id.slice(-5)}</span><small>{KIND_LABELS[e.kind]||e.type||e.kind}</small></button>)}</details>)}
          {!project.elements.length&&<p className="ks-muted ks-empty-layers">Draw on the sheet or ask Arcloom to create your first layout.</p>}
        </div>:<div className="ks-document"><div className="ks-paired"><NumberField label={`Width (${project.unit})`} value={project.width} onChange={width=>update({...project,width})}/><NumberField label={`Height (${project.unit})`} value={project.height} onChange={height=>update({...project,height})}/></div><label className="ks-field"><span>Drawing unit</span><select value={project.unit} onChange={e=>{const unit=e.target.value;if(isBuilding){try{update(convertBuildingUnit(storedProject,unit));}catch(error){setNotice(error.message);}return;}const ratio=unit==='ft'?1/.3048:.3048;update({...project,unit,width:project.width*ratio,height:project.height*ratio,elements:project.elements.map(el=>({...el,x:el.x*ratio,y:el.y*ratio,width:el.width*ratio,height:el.height*ratio}))});}}><option value="m">Metres</option><option value="ft">Feet</option></select></label><p className="ks-muted">Changing units converts all dimensions. Your drawing stays the same size.</p>
          {isBuilding&&<><label className="ks-field"><span>Floor name</span><input value={project.floor.name} maxLength={120} onChange={e=>update({...storedProject,floors:storedProject.floors.map(f=>f.id===project.floor.id?{...f,name:e.target.value}:f)})}/></label><div className="ks-paired"><NumberField label="Elevation (m)" value={project.floor.elevation} onChange={elevation=>update({...storedProject,floors:storedProject.floors.map(f=>f.id===project.floor.id?{...f,elevation}:f)})}/><NumberField label="Storey height (m)" value={project.floor.storeyHeight} onChange={storeyHeight=>update({...storedProject,floors:storedProject.floors.map(f=>f.id===project.floor.id?{...f,storeyHeight}:f)})}/></div></>}
        </div>}
        {panel==='layers'&&<ResizeHandle label="Resize Layers section" orientation="horizontal" value={layout.layers} min={80} max={400} onChange={v=>resizeLayout('layers',v)} className="ks-section-resizer"/>}
        {element&&<section className="ks-inspector"><div className="ks-section-heading"><span>{collection==='openings'?'OPENING':collection==='fixtures'?'FIXTURE':'SELECTION'}</span><button className="ks-icon-button" aria-label="Delete selected element" onClick={remove}><Glyph name="delete" size={15}/></button></div>
          {element.label!==undefined&&<label className="ks-field"><span>Label</span><input value={element.label} maxLength={120} onChange={e=>editElement({label:e.target.value})}/></label>}
          {collection==='openings'&&<label className="ks-field"><span>Opening type</span><select aria-label="Opening type" value={element.kind} onChange={e=>editElement({kind:e.target.value})}><option value="door">Door</option><option value="window">Window</option><option value="opening">Open passage</option></select></label>}
          {collection==='fixtures'&&<label className="ks-field"><span>Fixture type</span><select aria-label="Fixture type" value={element.type} onChange={e=>editElement({type:e.target.value})}>{FIXTURE_TYPES.map(type=><option key={type} value={type}>{type}</option>)}</select></label>}
          <div className="ks-paired"><NumberField label={`X (${project.unit})`} value={element.x} onChange={x=>editElement({x})}/><NumberField label={`Y (${project.unit})`} value={element.y} onChange={y=>editElement({y})}/><NumberField label={`Width (${project.unit})`} value={element.width} onChange={width=>editElement({width})}/>{element.height!==undefined&&<NumberField label={`Height (${project.unit})`} value={element.height} onChange={height=>editElement({height})}/>}</div>
          {element.wallThickness!==undefined&&<NumberField label={`Wall thickness (${project.unit})`} value={element.wallThickness} step={.01} onChange={wallThickness=>editElement({wallThickness})}/>}
          {isBuilding&&element.kind==='room'&&<div className="ks-room-move-options"><label><input type="checkbox" checked={moveRoomDetails} onChange={e=>setMoveRoomDetails(e.target.checked)}/>Move furniture and openings with room</label><p>Fully contained furniture and openings on this room’s edges move by the same distance. Shared doors move too; check neighbouring connections afterward. Resizing keeps furniture sizes unchanged.</p></div>}
          {element.rotation!==undefined&&<label className="ks-field"><span>Rotation</span><select aria-label="Rotation" value={element.rotation} onChange={e=>editElement({rotation:Number(e.target.value)})}>{[0,90,180,270].map(n=><option key={n} value={n}>{n}°</option>)}</select></label>}
          {element.kind==='door'&&<label className="ks-field"><span>Door swing</span><select aria-label="Door swing" value={element.swing} onChange={e=>editElement({swing:Number(e.target.value)})}><option value={1}>Left</option><option value={-1}>Right</option></select></label>}
          {element.height!==undefined&&<div className="ks-selection-area">{format(element.width*element.height)} <span>{project.unit}²</span></div>}
        </section>}
        {isBuilding&&<details className="ks-detail-add"><summary>Add furniture or opening</summary><label className="ks-field"><span>Add furniture</span><select aria-label="Add furniture" value="" onChange={e=>addDetail(e.target.value,'fixtures')}><option value="">Choose a fixture…</option>{FIXTURE_TYPES.map(type=><option key={type} value={type}>{type[0].toUpperCase()+type.slice(1)}</option>)}</select></label><label className="ks-field"><span>Add opening</span><select aria-label="Add opening" value="" onChange={e=>addDetail(e.target.value,'openings')}><option value="">Choose an opening…</option><option value="door">Door</option><option value="window">Window</option><option value="opening">Open passage</option></select></label><p className="ks-muted">Select a room first to place new details inside it or on its north wall.</p></details>}
        </div><div className="ks-sidebar-footer"><button className="ks-text-button" onClick={()=>setHelpOpen(true)}><Glyph name="help"/>Help & getting started</button></div>
      </aside>
      <ResizeHandle label="Resize sidebar" value={layout.sidebar} min={220} max={440} onChange={v=>resizeLayout('sidebar',v)} className={sidebarOpen?'ks-sidebar-resizer':'ks-sidebar-resizer is-hidden'}/>
      {previewOpen&&workspace==='design'&&<div className="ks-preview-resizer" role="separator" tabIndex={0} aria-label="Resize chat and preview" aria-orientation="vertical" aria-valuemin={24} aria-valuemax={76} aria-valuenow={Math.round(layout.chat)} onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);const box=root.current.getBoundingClientRect(),side=root.current.querySelector('.ks-sidebar').getBoundingClientRect().width;splitGesture.current={left:box.left+side,width:box.width-side-16};}} onPointerMove={e=>{const g=splitGesture.current;if(g)resizeLayout('chat',Math.max(24,Math.min(76,100*(e.clientX-g.left)/g.width)));}} onPointerUp={()=>{splitGesture.current=null;}} onPointerCancel={()=>{splitGesture.current=null;}} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();resizeLayout('chat',Math.max(24,Math.min(76,layout.chat+(e.key==='ArrowRight'?2:-2))));}}}><span/></div>}
      {workspace==='takeoff'&&<div className="ks-takeoff-workspace"><header className="ks-measure-intro"><div><strong>Measure a PDF plan</strong><p>Draw areas, lengths or counts on the sheet to create measured quantities. Use Report to export them.</p></div><button className="ks-button" onClick={()=>{setWorkspace('design');setPreviewOpen(true);setEstimateOpen(true);}}>Design quantities & reports</button></header><WorkspaceIdentity.Provider value={{name:"Arcloom"}}>{takeoffWorkspace}</WorkspaceIdentity.Provider></div>}<main className="ks-main" hidden={!previewOpen||workspace!=='design'}>
        <div className="ks-canvas-top"><span><span className="ks-live-dot"/>{project.mode==='site'?'Site layout':'Floor plan'}<span className="ks-slash">/</span>Concept 01</span><div className="ks-canvas-actions"><button className={`ks-button ${estimateOpen?'primary':'quiet'}`} onClick={()=>setEstimateOpen(!estimateOpen)}>Quantities & reports</button><button className="ks-button quiet" disabled={exporting} onClick={()=>exportPdf(true)}>Measure drawing</button></div></div>
        {shownBuilding&&<div className="ks-building-controls">{shownStored.floors.length>4?<label className="ks-floor-picker"><span>Floor</span><select aria-label="Building floor" value={shown.floor.id} onChange={e=>selectFloor(e.target.value)}>{shownStored.floors.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select><small>{shownStored.floors.length} floors</small></label>:<div className="ks-floor-tabs" role="tablist" aria-label="Building floors">{shownStored.floors.map(f=><button key={f.id} role="tab" aria-selected={shown.floor.id===f.id} onClick={()=>selectFloor(f.id)}>{f.name}</button>)}</div>}<div className="ks-view-tabs"><button className={buildingView==='plan'?'active':''} onClick={()=>{setBuildingView('plan');setEstimateOpen(false);}}>Floor plan</button><button className={buildingView==='three'?'active':''} onClick={()=>{setBuildingView('three');setEstimateOpen(false);}}>3D model</button><button className={buildingView==='stack'?'active':''} onClick={()=>{setBuildingView('stack');setEstimateOpen(false);}}>3D study</button><button className={buildingView==='elevation'?'active':''} onClick={()=>{setBuildingView('elevation');setEstimateOpen(false);}}>Elevation</button></div></div>}
        <div className="ks-toolbar" hidden={estimateOpen}><div className="ks-tool-group"><button className={`ks-icon-button ${tool==='select'?'active':''}`} title="Select and move" aria-label="Select and move" onClick={()=>setTool('select')}><Glyph name="cursor"/></button><span className="ks-tool-divider"/><select aria-label="Drawing tool" value={tool} onChange={e=>{setTool(e.target.value);setPreviewProposal(false);}}><option value="select">Select</option>{(isBuilding?BUILDING_KINDS:KINDS).map(k=><option value={k} key={k}>Draw {KIND_LABELS[k].toLowerCase()}</option>)}</select></div><div className="ks-tool-group"><button className="ks-icon-button" title="Undo" aria-label="Undo" disabled={!past.length} onClick={undo}><Glyph name="undo"/></button><button className="ks-icon-button" title="Redo" aria-label="Redo" disabled={!future.length} onClick={redo}><Glyph name="redo"/></button><span className="ks-tool-divider"/><button className={`ks-icon-button ${showGrid?'active':''}`} title="Toggle grid" aria-label="Toggle grid" aria-pressed={showGrid} onClick={()=>setShowGrid(!showGrid)}><Glyph name="grid"/></button><button className="ks-text-button" aria-pressed={showLabels} onClick={()=>setShowLabels(!showLabels)}>Labels</button></div></div>
        {notice&&<div className="ks-notice" role="alert">{notice}<button aria-label="Dismiss message" onClick={()=>setNotice('')}><Glyph name="close" size={14}/></button></div>}
        {proposal&&<div className="ks-proposal-banner"><Glyph name="sparkle" size={16}/><span>{previewProposal?'Previewing AI proposal':'Viewing your current drawing'}</span><button onClick={()=>setPreviewProposal(!previewProposal)}>{previewProposal?'Show original':'Preview proposal'}</button></div>}
        {estimateOpen?<EstimatePanel key={storedProject.id} project={shownStored} preview={!!proposal&&previewProposal} onClose={()=>setEstimateOpen(false)} onPlan={()=>exportPdf(false,shownStored)} onMeasure={()=>exportPdf(true,shownStored)}/>:shownBuilding&&buildingView==='three'?<Building3D project={shownStored} floorId={shown.floor.id}/>:shownBuilding&&buildingView==='stack'?<BuildingStack project={shownStored} selected={shown.floor.id} onSelect={setActiveFloor}/>:shownBuilding&&buildingView==='elevation'?<BuildingElevation project={shownStored}/>:<Drawing project={shown} selected={previewProposal&&proposal?null:selected} onSelect={setSelected} onMove={next=>update(isBuilding?editFloorItem(storedProject,activeFloor,next.id,next,{moveDetails:moveRoomDetails}):{...project,elements:project.elements.map(e=>e.id===next.id?next:e)})} tool={tool} onDraw={next=>{const e={...next,id:crypto.randomUUID()};update({...project,elements:[...project.elements,e]});setSelected(e.id);setTool('select');}} zoom={zoom} setZoom={setZoom} showGrid={showGrid} showLabels={showLabels} readOnly={!!proposal&&previewProposal}/> }
        <div className="ks-canvas-bottom" hidden={estimateOpen}><span>{tool==='select'?'Select an element to refine it':'Drag on the sheet to draw'}<span className="ks-shortcut">⌘ Z undo</span></span><div><button aria-label="Zoom out" onClick={()=>setZoom(z=>Math.max(.5,z-.1))}>−</button><span>{Math.round(zoom*100)}%</span><button aria-label="Zoom in" onClick={()=>setZoom(z=>Math.min(3,z+.1))}>+</button><button aria-label="Fit drawing" onClick={()=>setZoom(1)}><Glyph name="fit" size={14}/></button></div></div>
        <div className="ks-quantities" hidden={estimateOpen}><div><span>DRAWING AREA</span><strong>{format(stats.area)} <small>{project.unit}²</small></strong></div><div><span>{project.mode==='site'?'PLOTS':'ROOMS'}</span><strong>{project.elements.filter(e=>e.kind===(project.mode==='site'?'plot':'room')).length.toString().padStart(2,'0')}</strong></div><div><span>LANDSCAPE</span><strong>{format(stats.areas.landscape)} <small>{project.unit}²</small></strong></div><div className="ks-quantity-note"><span>DESIGN STAGE</span><p>Concept exploration<br/><small>Areas are gross; overlaps are not deducted.</small></p></div></div>
      </main>
      <aside className="ks-chat">
        <header className="ks-chat-header" hidden><span className="ks-ai-mark"><Glyph name="sparkle" size={20}/></span><div><strong>Arcloom assistant</strong><span>{status?.connected?`Connected with ${status.method}`:status===null?'Checking Codex…':'Connect your Codex'}</span></div><span className={`ks-dot ${status?.connected?'':'warning'}`}/></header>
        {!status?.connected&&status!==null&&<CodexConnection status={status} onStatus={connectStatus}/>}
        {(chatBoot.error||recoveryBoot.error)&&<div className="ks-notice" role="alert">{chatBoot.error||recoveryBoot.error}</div>}{notice&&!previewOpen&&<div className="ks-notice" role="alert">{notice}<button aria-label="Dismiss message" onClick={()=>setNotice('')}><Glyph name="close" size={14}/></button></div>}<div className="ks-chat-scroll" ref={chatScroll} style={{overflowAnchor:messages.length?'auto':'none'}}><div className="ks-conversation">
          {!messages.length&&<div className="ks-chat-intro"><span className="ks-welcome-mark"><Glyph name="sparkle" size={32}/></span><span className="ks-eyebrow">YOUR SPACE TO EXPLORE</span><h1>What will we create?</h1><p>From the first idea to a place you can see.<br/>Describe your vision. Let’s give it shape.</p><div className="ks-prompt-cards">{[{title:'Plan a neighbourhood',body:'Plots, access & shared green',prompt:'Design a residential site with 8 plots, a 6 m access road, a central green and visitor parking. Keep all elements inside the current boundary.'},{title:'Design a floor plan',body:'Rooms that work together',prompt:'Create a 20 by 15 metre floor plan with three bedrooms, two bathrooms, a living and dining area, kitchen, and circulation. Change the drawing mode to floor. Label all rooms and explain your assumptions.'},{title:'Review this layout',body:'Find room for improvement',prompt:'Review the current layout for circulation, overlapping elements and inefficient space. Give me specific improvements; do not change the drawing yet.'}].map(c=><button key={c.title} onClick={()=>setPrompt(c.prompt)}><span><strong>{c.title}</strong><small>{c.body}</small></span><Glyph name="chevron" size={14}/></button>)}</div></div>}
          {messages.map((m,i)=><div className={`ks-message ${m.role}`} key={i}><span className="ks-message-author">{m.role==='user'?'You':m.role==='error'?'Connection notice':'Arcloom'}</span><p>{m.content}</p></div>)}
          {session.pending&&!running&&<div className="ks-recovery-notice" role="status"><strong>Your last request was interrupted.</strong><p>Your brief is restored below. Send it again to continue; your drawing is unchanged.</p><button className="ks-text-button" onClick={()=>updateRecovery({pending:false})}>Dismiss</button></div>}{running&&<div className="ks-activity" role="status"><span className="ks-pulse"/>{activity}</div>}
          {proposal&&<div className="ks-review"><span className="ks-eyebrow">READY FOR YOUR REVIEW</span><strong>{proposal.name}</strong><p>{proposal.schema===BUILDING_SCHEMA?`${buildingStats(proposal).floors} floors · ${buildingStats(proposal).spaces} spaces`:proposal.elements.length+' editable elements'} · {format(proposal.width)} × {format(proposal.height)} {proposal.unit}</p>{warnings.map((w,i)=><p className="ks-warning" key={i}>{w}</p>)}{stale&&<p className="ks-warning">Your drawing changed after this request. Ask for an updated proposal before applying.</p>}<div><button className="ks-button" onClick={()=>{setPreviewOpen(true);setPreviewProposal(true);}}><Glyph name="grid" size={15}/>Preview drawing</button><button className="ks-button primary" disabled={!!stale} onClick={()=>{update(proposal);setProposal(null);setSelected(null);setMessages(m=>[...m,{role:'assistant',content:'Proposal applied. Every element is editable. You can undo this change.'}]);}}><Glyph name="check" size={15}/>Apply to drawing</button><button className="ks-text-button" onClick={()=>setProposal(null)}>Discard</button></div></div>}
          {!!project.elements.length&&<div className="ks-chat-report"><Glyph name="file"/><div><strong>Your design report</strong><p>Areas, material quantities and costs update as you edit.</p><button className="ks-button" onClick={()=>{setPreviewOpen(true);setEstimateOpen(true);}}>View quantities & reports</button></div></div>}
          {isBuilding&&<details className="ks-building-brief"><summary>Building brief & assumptions</summary>{storedProject.notes.map((note,i)=><p key={i}>{note}</p>)}</details>}<div ref={chatBottom}/></div>
        </div>
        <form className="ks-composer" onSubmit={e=>{e.preventDefault();send();}}>
          {element&&<div className="ks-context"><Glyph name="layers" size={13}/>{element.label||element.kind}<button type="button" aria-label="Clear selection" onClick={()=>setSelected(null)}>×</button></div>}
          <textarea disabled={running} aria-label="Message Arcloom" placeholder="Describe what you want to create…" value={prompt} maxLength={12000} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send();}}}/>
          <div className="ks-composer-bottom"><button type="button" className="ks-icon-button" aria-label="Import project" disabled={running} onClick={()=>fileInput.current?.click()}><Glyph name="plus"/></button><span><Glyph name="sparkle" size={13}/>Codex<span className="ks-context-count">{isBuilding?`${storedProject.floors.length} floors in context`:`${project.elements.length} elements in context`}</span></span>{running?<button type="button" className="ks-send" aria-label="Stop generation" onClick={()=>request.current?.abort()}><Glyph name="stop" size={16}/></button>:<button type="submit" className="ks-send" disabled={!prompt.trim()||!status?.connected} aria-label="Send message"><Glyph name="arrow" size={17}/></button>}</div>
        </form><p className="ks-chat-footnote">AI drafts. You decide. Review before building.</p>
      </aside>
    </div>
    {helpOpen&&<div className="ks-modal-backdrop" onClick={()=>setHelpOpen(false)}><section className="ks-modal" role="dialog" aria-modal="true" aria-labelledby="ks-guide-title" onClick={e=>e.stopPropagation()}><button className="ks-icon-button ks-modal-close" aria-label="Close guide" onClick={()=>setHelpOpen(false)}><Glyph name="close"/></button><Brand/><h2 id="ks-guide-title">Make space for your next idea.</h2><ol><li><strong>Start a drawing.</strong> Create a site or floor plan using + in Projects. Set its dimensions in Drawing.</li><li><strong>Describe your brief.</strong> Arcloom uses your local Codex login. Your brief, drawing and selected elements are sent to Codex when you press Send.</li><li><strong>Review the proposal.</strong> Compare it with your original and apply when ready. Drag elements or edit exact dimensions. Undo is always available for current-session edits.</li><li><strong>Take it with you.</strong> Export an editable project or a vector drawing. Open Plan takeoff to measure existing PDFs.</li></ol><p>Drawings save in this browser on this device. Export backups before clearing browser data. Concepts require professional review before construction.</p><p className="ks-muted">Arcloom builds on OpenTakeoff, licensed AGPL-3.0. <a href="https://github.com/buddhathemanoj/opentakeoff" target="_blank" rel="noreferrer">View source and license</a>. The original measuring engine and its provenance remain intact.</p></section></div>}
  </div>;
}
