import FloorDetails from './FloorDetails.jsx';
import {metresPerUnit} from './building.js';
import {buildingEnvelope,southFacadeOpenings} from './buildingViews.js';
const number=n=>new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(n);
export function BuildingStack({project,selected,onSelect}){
 const floors=[...project.floors].sort((a,b)=>b.elevation-a.elevation),m=metresPerUnit(project.unit),{width,depth}=buildingEnvelope(project);
 const diamondHeight=(width+depth)*1.15,gap=Math.max(12,diamondHeight*.58),left=-depth*2.1-8,right=width*2.1+Math.max(55,...floors.map(f=>f.name.length*1.5+15)),top=-(floors.length-1)*gap-8,bottom=diamondHeight+16;
 return <div className="ks-building-stack"><svg viewBox={`${left} ${top} ${right-left} ${bottom-top}`} aria-label={`Exploded axonometric view of ${floors.length} floors`} role="img">
  {floors.map((f,i)=>{const offset=-(floors.length-1-i)*gap,y=offset+diamondHeight*.55;return <g key={f.id} onClick={()=>onSelect(f.id)} tabIndex="0" role="button" aria-label={f.name} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(f.id);}}}>
   <g transform={`translate(0 ${offset}) matrix(2.1 1.15 -2.1 1.15 0 0) scale(${m})`}><rect width={project.width} height={project.height} fill={selected===f.id?'#edf1e8':'#fafaf7'} stroke="#9ca7a6" strokeWidth={.1/m}/>{f.elements.map(e=><rect key={e.id} x={e.x} y={e.y} width={e.width} height={e.height} fill={e.kind==='landscape'?'#d8e4ce':f.use==='bank'?'#e3e9ed':f.use==='cafe'?'#eee5d7':'#e8e9e7'} stroke="#8f9ca0" strokeWidth={.08/m}/>)}<FloorDetails floor={f} width={project.width} height={project.height} unit={project.unit} showLabels={false}/></g>
   <path d={`M${width*2.1+2} ${y}h8`} stroke="#a2aaa7" strokeWidth=".3"/><text x={width*2.1+12} y={y-1} fontSize="2.5" fill="#67716d">{f.name}</text><text x={width*2.1+12} y={y+3} fontSize="2" fill="#85918c">+{number(f.elevation)} m · {number(project.width*project.height)} {project.unit}²</text>
  </g>;})}
  <text x={left+8} y={bottom-4} fontSize="2.5" fill="#67716d">ARCLOOM / EXPLODED FLOOR STUDY</text>
 </svg></div>;
}
export function BuildingElevation({project}){
 const {width,height}=buildingEnvelope(project),margin=Math.max(4,width*.1),font=Math.max(.3,width/100);
 return <div className="ks-building-elevation"><svg viewBox={`${-margin} ${-margin} ${width+margin*2} ${height+margin*2+font*6}`} role="img" aria-label={`South elevation, ${number(width)} metres wide and ${number(height)} metres high, showing modelled openings`}>
  <rect width={width} height={height} fill="#e6e2d8" stroke="#697374" strokeWidth=".08"/>
  {project.floors.map(f=><g key={f.id}>
   <path d={`M0 ${height-f.elevation}h${width}`} stroke="#a9a89d" strokeWidth=".18"/>
   {southFacadeOpenings(project,f).map(o=>{const y=height-f.elevation-o.top,h=o.top-o.bottom;return <g key={o.id} data-facade-opening={o.id}>
    <rect x={o.x} y={y} width={o.width} height={h} fill={o.kind==='window'?'#b8cbd0':o.kind==='door'?'#bda080':'#657572'} stroke="#788b8f" strokeWidth=".065"/>
    {o.kind==='window'&&<path d={`M${o.x+o.width/2} ${y}v${h}`} stroke="#788b8f" strokeWidth=".05"/>}
    {o.kind==='door'&&<circle cx={o.x+o.width*.85} cy={height-f.elevation-1.05} r=".035" fill="#546363"/>}
   </g>;})}
   <g fill="#85918c" fontSize={font}><path d={`M${width+.3} ${height-f.elevation}h${margin*.45}`} stroke="#85918c" strokeWidth=".05"/><text x={width+.4} y={height-f.elevation-.25}>+{number(f.elevation)} m</text></g>
  </g>)}
  <path d={`M${-margin*.5} ${height+.05}h${width+margin}`} stroke="#849080" strokeWidth=".1"/>
  <text x="0" y={height+font*5} fill="#536264" fontSize={font*1.5}>SOUTH ELEVATION · MODELLED OPENINGS</text><text x="0" y={height+font*7.5} fill="#8c9692" fontSize={font}>{number(width)} m frontage · {number(height)} m overall height · Concept geometry</text>
 </svg></div>;
}
