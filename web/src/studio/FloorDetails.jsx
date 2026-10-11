import {fixtureFrame,metresPerUnit} from './building.js';
function Fixture({item,selected,onSelect}){
  const {type}=item,{width:w,height:h,transform}=fixtureFrame(item),stroke='#536168';
  let detail;
  if(type==='chair')detail=<><rect x={w*.1} y={h*.2} width={w*.8} height={h*.65} rx={Math.min(w,h)*.15}/><path d={`M0 ${h*.15}Q${w/2} ${-h*.1} ${w} ${h*.15}`}/></>;
  else if(type==='plant')detail=<><circle cx={w/2} cy={h/2} r={Math.min(w,h)*.43} fill="#dae5d3"/><path d={`M${w/2} ${h*.16}v${h*.68}M${w*.16} ${h/2}h${w*.68}m${-w*.6} ${-h*.27} ${w*.52} ${h*.54}m${-w*.52} 0 ${w*.52} ${-h*.54}`}/></>;
  else if(type==='stair')detail=<><rect width={w} height={h}/>{Array.from({length:13},(_,i)=><path key={i} d={`M0 ${h*i/13}h${w}`}/>)}<path d={`M${w/2} ${h*.9}V${h*.12}m${-w*.18} ${h*.12} ${w*.18} ${-h*.12} ${w*.18} ${h*.12}`}/></>;
  else if(type==='lift')detail=<><rect width={w} height={h}/><path d={`M0 0 ${w} ${h}M${w} 0 0 ${h}`}/></>;
  else if(type==='toilet')detail=<><rect x={w*.2} y={0} width={w*.6} height={h*.25} rx={.06}/><ellipse cx={w/2} cy={h*.57} rx={w*.34} ry={h*.37}/><ellipse cx={w/2} cy={h*.57} rx={w*.2} ry={h*.24}/></>;
  else if(type==='sink')detail=<><rect width={w} height={h} rx={.06}/><ellipse cx={w/2} cy={h/2} rx={w*.35} ry={h*.3}/><circle cx={w/2} cy={h*.18} r={.025}/></>;
  else if(type==='sofa')detail=<><rect width={w} height={h} rx={.08}/><rect x={.1} y={h*.28} width={w-.2} height={h*.6} rx={.06}/><path d={`M${w/3} ${h*.28}v${h*.6}M${w*2/3} ${h*.28}v${h*.6}`}/></>;
  else if(type==='bed')detail=<><rect width={w} height={h} rx={.05}/><rect x={w*.05} y={h*.02} width={w*.9} height={h*.08} fill="#e6e0d6"/><rect x={w*.08} y={h*.12} width={w*.36} height={h*.18} rx={.04}/><rect x={w*.56} y={h*.12} width={w*.36} height={h*.18} rx={.04}/><path d={`M0 ${h*.36}h${w}M0 ${h*.8}h${w}`}/></>;
  else if(type==='shower')detail=<><rect width={w} height={h} fill="#eaf0f1"/><path d={`M0 0 ${w} ${h}M${w} 0 0 ${h}`}/><circle cx={w/2} cy={h/2} r={Math.min(w,h)*.06}/></>;
  else if(type==='table')detail=<rect width={w} height={h} rx={.12} fill="#eee6d7"/>;
  else if(type==='desk')detail=<><rect width={w} height={h} fill="#e4e9eb"/><rect x={w*.32} y={h*.1} width={w*.36} height={h*.28}/><path d={`M${w*.36} ${h*.58}h${w*.28}`}/></>;
  else if(type==='rack'||type==='cabinet')detail=<><rect width={w} height={h}/>{Array.from({length:4},(_,i)=><path key={i} d={`M0 ${h*(i+1)/5}h${w}`}/>)}<path d={`M${w*.85} ${h*.35}v${h*.3}`}/></>;
  else if(type==='kitchen')detail=<><rect width={w} height={h} fill="#e4e8e2"/>{Array.from({length:Math.max(1,Math.floor(w/.9))},(_,i)=><rect key={i} x={i*.9+.1} y={h*.2} width={.65} height={h*.6} rx={.06}/>)}</>;
  else if(type==='atm')detail=<><rect width={w} height={h}/><rect x={w*.15} y={h*.15} width={w*.7} height={h*.4}/><path d={`M${w*.3} ${h*.75}h${w*.4}`}/></>;
  else if(type==='safe')detail=<><rect width={w} height={h}/><rect x={.12} y={.12} width={w-.24} height={h-.24}/><circle cx={w*.65} cy={h/2} r={Math.min(w,h)*.12}/></>;
  else detail=<><rect width={w} height={h} fill="#e6e0d6"/><path d={`M.1 ${h*.6}h${Math.max(0,w-.2)}`}/></>;
  return <g transform={transform} fill="#f8f8f5" stroke={stroke} strokeWidth=".045" strokeLinejoin="round" data-fixture={item.id} pointerEvents={onSelect?'all':'none'} role={onSelect?'button':undefined} tabIndex={onSelect?0:undefined} aria-label={onSelect?item.label+' fixture':undefined} onPointerDown={onSelect?e=>{e.stopPropagation();onSelect(item.id);}:undefined} onKeyDown={onSelect?e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(item.id);}}:undefined}><title>{item.label}</title>{detail}{selected===item.id&&<rect width={w} height={h} fill="none" stroke="#bd6c40" strokeWidth=".1"/>}</g>;
}
export default function FloorDetails({floor,width,height,unit='m',showLabels=true,showFixtures=true,selected,onSelect}){
  const m=metresPerUnit(unit);
  const rect=e=>({...e,x:e.x*m,y:e.y*m,width:e.width*m,height:e.height*m,...(e.wallThickness===undefined?{}:{wallThickness:e.wallThickness*m})});
  floor={...floor,elements:floor.elements.map(rect),fixtures:floor.fixtures.map(rect),openings:floor.openings.map(o=>({...o,x:o.x*m,y:o.y*m,width:o.width*m}))};
  width*=m;height*=m;

  return <g pointerEvents="none" transform={`scale(${1/m})`}>
    {showFixtures&&floor.fixtures.map(item=><Fixture key={item.id} item={item} selected={selected} onSelect={onSelect}/>)}
    {floor.elements.filter(e=>e.kind==='room').map(e=><rect key={e.id} x={e.x} y={e.y} width={e.width} height={e.height} fill="none" stroke="#495055" strokeWidth={e.wallThickness}/>)}
    <rect width={width} height={height} fill="none" stroke="#2f393c" strokeWidth=".32"/>
    {floor.openings.map(o=><g key={o.id} data-opening={o.id} transform={`translate(${o.x} ${o.y}) rotate(${o.rotation})`} fill="none" stroke="#64737b" strokeWidth=".055" pointerEvents={onSelect?'all':'none'} role={onSelect?'button':undefined} tabIndex={onSelect?0:undefined} aria-label={onSelect?o.kind+' opening '+o.id.slice(-5):undefined} onPointerDown={onSelect?e=>{e.stopPropagation();onSelect(o.id);}:undefined} onKeyDown={onSelect?e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(o.id);}}:undefined}>
      {onSelect&&<path d={`M0 0h${o.width}`} stroke="transparent" strokeWidth=".5"/>}
      <path d={`M0 0h${o.width}`} stroke="#fafaf7" strokeWidth=".44"/>
      {o.kind==='door'?<><path d={`M0 0v${-o.width*o.swing}`} strokeWidth=".08"/><path d={`M${o.width} 0A${o.width} ${o.width} 0 0 ${o.swing===1?0:1} 0 ${-o.width*o.swing}`}/><path d={`M0 -.16v.32M${o.width} -.16v.32`}/></>:o.kind==='window'?<><path d={`M0 -.12h${o.width}M0 .12h${o.width}M0 0h${o.width}`} stroke="#7d9ca5"/></>:null}
      {selected===o.id&&<path d={`M0 0h${o.width}`} stroke="#bd6c40" strokeWidth=".12"/>}
    </g>)}
    {showLabels&&floor.elements.map(e=>{
      const label=e.label,fs=Math.min(.34,e.width/Math.max(label.length*.56,5));
      return <g key={e.id} transform={`translate(${e.x+e.width/2} ${e.y+e.height/2})`} textAnchor="middle" fontFamily="sans-serif">
        <rect x={-Math.min(e.width*.46,label.length*fs*.29+.15)} y={-.27} width={Math.min(e.width*.92,label.length*fs*.58+.3)} height=".8" fill="#fafaf7" opacity=".93" rx=".07"/>
        <text fontSize={fs} fill="#39464b" fontWeight="550">{label}</text><text y=".38" fontSize=".23" fill="#869095">{Math.round(e.width*e.height/m**2*10)/10} {unit}²</text>
      </g>;
    })}
    <g stroke="#a1abb0" strokeWidth=".035" fill="#718087" fontSize=".26" fontFamily="monospace" textAnchor="middle">
      {Array.from({length:6},(_,i)=>{const bay=width/5,x=i*bay;return <g key={i}><path d={`M${x} -.55v-1.5`}/><circle cx={x} cy={-2.3} r=".3" fill="#fafaf7"/><text x={x} y={-2.2} stroke="none">{String.fromCharCode(65+i)}</text>{i<5&&<><path d={`M${x} -1.1h${bay}`}/><text x={x+bay/2} y={-1.25} stroke="none">{unit==='ft'?(bay/m).toFixed(2)+' ft':Math.round(bay*1000).toLocaleString()}</text></>}</g>;})}
    </g>
  </g>;
}
