import {renderToStaticMarkup} from 'react-dom/server';
import {projectSvg,validateProject} from './model.js';
import {BUILDING_SCHEMA,projectView,metresPerUnit} from './building.js';
import FloorDetails from './FloorDetails.jsx';

// Export the same architectural layer used by the editable canvas.
export function drawingSvg(input,floorId){
  const stored=validateProject(input);
  if(stored.schema!==BUILDING_SCHEMA)return projectSvg(stored);
  const project=projectView(stored,floorId),{floor,width,height,unit}=project;
  const pad=3/metresPerUnit(unit),font=.35/metresPerUnit(unit);
  return '<?xml version="1.0" encoding="UTF-8"?>'+renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={[-pad,-pad*2,width+pad*2,height+pad*4].join(' ')} role="img" aria-label={project.name+' — '+floor.name}>
      <title>{project.name} — {floor.name}</title>
      <rect x={-pad} y={-pad*2} width={width+pad*2} height={height+pad*4} fill="#fafaf7"/>
      <g fontFamily="sans-serif" fill="#39464b">
        <text x="0" y={-pad*1.4} fontSize={font*1.5}>{project.name}</text>
        <text x="0" y={-pad*.9} fontSize={font}>{floor.name} · {width.toFixed(2)} × {height.toFixed(2)} {unit}</text>
      </g>
      {floor.elements.map(e=><rect key={e.id} x={e.x} y={e.y} width={e.width} height={e.height} fill={e.kind==='landscape'?'#e1eadb':floor.use==='bank'?'#edf1f3':floor.use==='cafe'?'#f5f0e8':'#f0f2ef'}/>)}
      <FloorDetails floor={floor} width={width} height={height} unit={unit}/>
      <text x="0" y={height+pad} fontFamily="sans-serif" fontSize={font*.8} fill="#718087">KOSAL STUDIO · CONCEPT DRAWING · NOT FOR CONSTRUCTION</text>
    </svg>
  );
}
