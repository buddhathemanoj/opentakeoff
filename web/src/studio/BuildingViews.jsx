import FloorDetails from './FloorDetails.jsx';
export function BuildingStack({project,selected,onSelect}){
 const floors=[...project.floors].reverse();
 return <div className="ks-building-stack"><svg viewBox="-65 -70 210 220" aria-label="Exploded axonometric view of the three-floor building" role="img">
  <defs><filter id="floor-shadow"><feDropShadow dx="1" dy="5" stdDeviation="3" floodOpacity=".12"/></filter></defs>
  {floors.map((f,i)=>{const offset=(floors.length-1-i)*42;return <g key={f.id} onClick={()=>onSelect(f.id)} tabIndex="0" role="button" aria-label={f.name} onKeyDown={e=>{if(e.key==='Enter')onSelect(f.id);}}>
    <g transform={`translate(0 ${70-offset}) matrix(2.1 1.15 -2.1 1.15 0 0)`} filter="url(#floor-shadow)"><rect width={project.width} height={project.height} fill={selected===f.id?'#edf1e8':'#fafaf7'} stroke="#9ca7a6" strokeWidth=".1"/>{f.elements.map(e=><rect key={e.id} x={e.x} y={e.y} width={e.width} height={e.height} fill={e.kind==='landscape'?'#d8e4ce':f.use==='bank'?'#e3e9ed':f.use==='cafe'?'#eee5d7':'#e8e9e7'} stroke="#8f9ca0" strokeWidth=".08"/>)}<FloorDetails floor={f} width={project.width} height={project.height} showLabels={false}/></g>
    <path d={`M70 ${89-offset}h30`} stroke="#a2aaa7" strokeWidth=".4"/><text x="102" y={87-offset} fontSize="3.2" fill="#67716d">{f.name}</text><text x="102" y={93-offset} fontSize="2.6" fill="#9ba29d">+{f.elevation.toFixed(2)} m · 720 m²</text>
  </g>;})}
  <text x="-52" y="143" fontSize="3" fill="#67716d" letterSpacing=".4">ARCLOOM COMMONS / EXPLODED FLOOR STUDY</text>
 </svg></div>;
}
export function BuildingElevation({project}){
 const h=project.floors.reduce((max,f)=>Math.max(max,f.elevation+f.storeyHeight),0);
 return <div className="ks-building-elevation"><svg viewBox={`-5 -3 ${project.width+10} ${h+9}`} role="img" aria-label="South elevation concept with three distinct tenant floors">
  <defs><linearGradient id="glass" x2="0" y2="1"><stop stopColor="#b8cbd0"/><stop offset="1" stopColor="#e2ebeb"/></linearGradient></defs>
  <rect x="0" y="0" width={project.width} height={h} fill="#e6e2d8" stroke="#697374" strokeWidth=".08"/>
  {project.floors.map(f=><g key={f.id} transform={`translate(0 ${h-f.elevation-f.storeyHeight})`}>
    <rect x=".4" y=".65" width={project.width-.8} height={f.storeyHeight-1} fill="url(#glass)"/>
    {Array.from({length:15},(_,i)=><path key={i} d={`M${i*2} .6v${f.storeyHeight-1}`} stroke="#7a898c" strokeWidth=".08"/>)}
    <path d={`M0 ${f.storeyHeight-.25}h${project.width}`} stroke="#a9a89d" strokeWidth=".25"/>
    <rect x=".5" y={f.storeyHeight-1.1} width="8" height=".75" fill="#f5f4ef"/><text x=".85" y={f.storeyHeight-.58} fill="#546363" fontSize=".36" letterSpacing=".05">{f.use==='bank'?'ARCLOOM BANK':f.use==='cafe'?'COMMONS CAFÉ':'ARCLOOM TECHNOLOGIES'}</text>
    {f.use==='cafe'&&Array.from({length:8},(_,i)=><g key={i}><rect x={10+i*2} y={f.storeyHeight-.7} width="1.3" height=".5" fill="#adbaa0"/><circle cx={10.6+i*2} cy={f.storeyHeight-.9} r=".45" fill="#a0b58e"/></g>)}
  </g>)}
  <rect x="16" y={h-2.8} width="4" height="2.8" fill="#aabcbf" stroke="#788b8f" strokeWidth=".1"/><path d={`M18 ${h-2.8}v2.8`} stroke="#6a7e82" strokeWidth=".06"/>
  <path d={`M-3 ${h+.05}h${project.width+6}`} stroke="#849080" strokeWidth=".1"/>
  {project.floors.map(f=><g key={f.id} fill="#85918c" fontSize=".36"><path d={`M${project.width+.3} ${h-f.elevation}h1.5`} stroke="#85918c" strokeWidth=".05"/><text x={project.width+1} y={h-f.elevation-.2}>+{f.elevation.toFixed(2)}</text></g>)}
  <text x="0" y={h+3} fill="#536264" fontSize=".55" letterSpacing=".04">SOUTH ELEVATION · CONCEPT STUDY</text><text x="0" y={h+4} fill="#8c9692" fontSize=".35">30 m frontage · 12 m overall height · Indicative façade materials</text>
 </svg></div>;
}
