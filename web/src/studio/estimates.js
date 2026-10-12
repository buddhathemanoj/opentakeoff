import {BUILDING_SCHEMA,metresPerUnit} from './building.js';
import {validateProject,layoutWarnings} from './model.js';
import {wallBoxes,floorPanels} from './threeGeometry.js';
export function estimateQuantities(input,{slabThickness=.2}={}){
  const p=validateProject(input),m=metresPerUnit(p.unit);
  if(!Number.isFinite(slabThickness)||slabThickness<.05||slabThickness>1)throw new Error('Slab thickness must be between 0.05 and 1 metre.');
  const floors=p.schema===BUILDING_SCHEMA?p.floors:[{elements:p.elements,openings:[],fixtures:[]}];
  const rows=[],add=(id,label,unit,quantity,basis)=>rows.push({id,label,unit,quantity,basis});
  const gross=p.width*p.height*m*m*floors.length;
  if(p.schema===BUILDING_SCHEMA){
    const slabArea=floors.reduce((n,f)=>n+floorPanels(p,f).reduce((sum,panel)=>sum+panel.width*panel.depth,0),0),voidArea=Math.max(0,gross-slabArea);
    add('slabs','Floor slab concrete','m³',slabArea*slabThickness,`${Number(slabArea.toFixed(3))} m² modelled slab area × ${slabThickness} m assumed thickness; explicit floor openings deducted, other core holes not inferred.`);
    if(voidArea>1e-8)add('area-void','Floor opening area','m²',voidArea,'Union of explicit openings across floors; already deducted from slab concrete. Any entered rate is a separate opening allowance.');
    let walls=0,finishes=0,glazing=0,doors=0;
    for(const f of floors){
      for(const b of wallBoxes(p,f)){walls+=b.width*b.depth*b.height;finishes+=2*(b.axis==='x'?b.width:b.depth)*b.height;}
      doors+=f.openings.filter(o=>o.kind==='door').length;
      glazing+=f.openings.filter(o=>o.kind==='window').reduce((n,o)=>n+o.width*m*(Math.min(2.7,(f.storeyHeight-.22)*.85)-Math.min(1,(f.storeyHeight-.22)*.35)),0);
    }
    add('walls','Wall masonry / partitions','m³',walls,'Unique wall segments with modelled openings deducted; junction volumes approximate.');
    add('wall-finish','Wall finishes, both faces','m²',finishes,'Both faces of modelled wall segments; openings deducted, reveals excluded.');
    add('doors','Door sets','each',doors,'Door objects in all floors; no doors inferred from room labels.');
    add('windows','Window glazing','m²',glazing,'Opening width × modelled glazing height; frame allowances excluded.');
  }
  for(const [kind,label] of [['room','Room floor finishes (gross)'],['building','Building footprints'],['water','Water area'],['landscape','Landscape area'],['parking','Parking area'],['road','Road surface'],['plot','Plot area']]){
    const quantity=floors.flatMap(f=>f.elements).filter(e=>e.kind===kind).reduce((n,e)=>n+e.width*e.height*m*m,0);
    if(quantity)add('area-'+kind,label,'m²',quantity,'Sum of labelled rectangle areas; overlapping areas are not deducted.');
  }
  const fixtures=new Map();
  for(const item of floors.flatMap(f=>f.fixtures))fixtures.set(item.type,(fixtures.get(item.type)||0)+1);
  for(const [type,count] of fixtures)add('fixture-'+type,type[0].toUpperCase()+type.slice(1)+' fixtures','each',count,'Count of editable fixture objects across all floors.');
  return{grossArea:gross,floors:floors.length,areaLabel:p.mode==='site'?'Site boundary area':floors.some(f=>f.elements.some(e=>e.kind==='void'))?'Gross floor footprint including openings':'Gross floor area',summary:p.mode==='site'?'Site layout':floors.length+' '+(floors.length===1?'floor':'floors'),scheduleLabel:p.mode==='site'?'Plots & areas':'Rooms & areas',hasSlabs:p.schema===BUILDING_SCHEMA,rows,warnings:layoutWarnings(p),assumptions:['Concept quantities, not a priced construction tender.','No foundations, reinforcement, structural sizing, MEP, earthworks, taxes or contractor allowances are inferred.','Enter local supplier or estimator rates. Blank rates remain unpriced.']};
}
export function priceEstimate(rows,rates){
  const priced=rows.map(row=>{const rate=rates[row.id];return{...row,rate:typeof rate==='number'&&Number.isFinite(rate)&&rate>=0?rate:null,amount:typeof rate==='number'&&Number.isFinite(rate)&&rate>=0?row.quantity*rate:null};});
  return{rows:priced,total:priced.reduce((n,r)=>n+(r.amount??0),0),unpriced:priced.filter(r=>r.rate===null).length};
}
export function estimateCsv(rows,currency){
  const cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  return [['Item','Quantity','Unit','Rate ('+currency+')','Amount ('+currency+')','Basis'],...rows.map(r=>[r.label,r.quantity.toFixed(3),r.unit,r.rate??'',r.amount===null?'':r.amount.toFixed(2),r.basis])].map(row=>row.map(cell).join(',')).join('\n');
}
