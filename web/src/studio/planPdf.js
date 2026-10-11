import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { validateProject, PAINT } from './model.js';
import { BUILDING_SCHEMA, fixtureFrame } from './building.js';
const ascii=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[–—·]/g,'-').replace(/[^\x20-\x7e]/g,'');
const color=hex=>rgb(parseInt(hex.slice(1,3),16)/255,parseInt(hex.slice(3,5),16)/255,parseInt(hex.slice(5,7),16)/255);
export async function createPlanPdf(input){
 const project=validateProject(input),pdf=await PDFDocument.create();
 const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 pdf.setTitle(ascii(project.name));pdf.setAuthor('Arcloom');pdf.setSubject('Concept architectural plan set');
 const floors=project.schema===BUILDING_SCHEMA?project.floors:[{name:project.mode==='site'?'Site layout':'Floor plan',elements:project.elements,openings:[],fixtures:[],elevation:0}];
 for(const [index,floor] of floors.entries()){
  const page=pdf.addPage([1190.55,841.89]),ink=color('#36464c'),soft=color('#839298');
  // Fit in the drawing field; use 1:100 where the metre footprint fits it.
  const metresPerUnit=project.unit==='ft'?.3048:1;
  const physical=28.3464567*metresPerUnit;
  const denominator=[100,125,150,200,250,500,1000,2000,5000,10000].find(d=>project.width*physical*100/d<=850&&project.height*physical*100/d<=650)||10000;
  const s=physical*100/denominator,ox=65,oy=115;
  const xy=(x,y)=>({x:ox+x*s,y:oy+(project.height-y)*s});
  const line=(x1,y1,x2,y2,width=.05,stroke=ink)=>page.drawLine({start:xy(x1,y1),end:xy(x2,y2),thickness:width*s,color:stroke});
  const rect=(x,y,w,h,fill,border=soft,bw=.05)=>page.drawRectangle({...xy(x,y+h),width:w*s,height:h*s,color:fill,borderColor:border,borderWidth:bw*s});
  const text=(value,x,y,size=7,type=font,shade=ink)=>page.drawText(ascii(value),{x,y,size,font:type,color:shade});
  const center=(value,x,y,size=7,type=font,shade=ink)=>{const label=ascii(value);text(label,x-type.widthOfTextAtSize(label,size)/2,y,size,type,shade);};
  rect(0,0,project.width,project.height,color('#fafaf7'),ink,.22);
  for(const e of floor.elements)rect(e.x,e.y,e.width,e.height,color(e.kind==='landscape'?'#e1eadb':project.schema===BUILDING_SCHEMA?floor.use==='bank'?'#edf1f3':floor.use==='cafe'?'#f5f0e8':'#f0f2ef':PAINT[e.kind].fill),ink,e.wallThickness||.08);
  for(const item of floor.fixtures){
   const {type}=item,frame=fixtureFrame(item),w=frame.width,h=frame.height;
   const pos=(x,y)=>{const p=frame.point(x,y);return xy(p.x,p.y);};
   const edge=(x1,y1,x2,y2,width=.04)=>page.drawLine({start:pos(x1,y1),end:pos(x2,y2),thickness:width*s/metresPerUnit,color:soft});
   const box=(x,y,width,height,fill=color('#f8f8f5'),bw=.04)=>page.drawRectangle({...pos(x,y+height),width:width*s,height:height*s,rotate:degrees(-item.rotation),color:fill,borderColor:soft,borderWidth:bw*s/metresPerUnit});
   const ellipse=(x,y,rx,ry,fill)=>page.drawEllipse({...pos(x,y),xScale:rx*s,yScale:ry*s,rotate:degrees(-item.rotation),color:fill,borderColor:soft,borderWidth:.035*s/metresPerUnit});
   if(type==='plant'){ellipse(w/2,h/2,w*.43,h*.43,color('#d7e4d0'));continue;}
   box(0,0,w,h,color(type==='table'||type==='counter'?'#eee6d7':type==='desk'?'#e4e9eb':'#f8f8f5'));
   if(type==='stair'){for(let i=1;i<13;i++)edge(0,h*i/13,w,h*i/13,.035);edge(w/2,h*.9,w/2,h*.12,.05);edge(w/2,h*.12,w*.3,h*.24,.05);edge(w/2,h*.12,w*.7,h*.24,.05);}
   if(type==='lift'){edge(0,0,w,h);edge(w,0,0,h);}
   if(type==='bed'){box(w*.05,h*.02,w*.9,h*.08,color('#e6e0d6'));box(w*.08,h*.12,w*.36,h*.18);box(w*.56,h*.12,w*.36,h*.18);edge(0,h*.36,w,h*.36);edge(0,h*.8,w,h*.8);}
   if(type==='shower'){edge(0,0,w,h);edge(w,0,0,h);ellipse(w/2,h/2,Math.min(w,h)*.06,Math.min(w,h)*.06,color('#eaf0f1'));}
   if(type==='desk')box(w*.32,h*.1,w*.36,h*.28,color('#fafaf7'),.025);
   if(type==='chair')edge(0,h*.2,w,h*.2);
   if(type==='rack'||type==='cabinet')for(let i=1;i<5;i++)edge(0,h*i/5,w,h*i/5,.035);
   if(type==='toilet')ellipse(w/2,h*.6,w*.3,h*.3);
   if(type==='sink')ellipse(w/2,h/2,w*.32,h*.28);
  }
  for(const o of floor.openings){
   const angle=o.rotation*Math.PI/180,u={x:Math.cos(angle),y:Math.sin(angle)},v={x:Math.sin(angle)*o.swing,y:-Math.cos(angle)*o.swing};
   const end={x:o.x+o.width*u.x,y:o.y+o.width*u.y};
   line(o.x,o.y,end.x,end.y,.44/metresPerUnit,rgb(1,1,1));
   if(o.kind==='door'){
    line(o.x,o.y,o.x+o.width*v.x,o.y+o.width*v.y,.06,soft);
    for(let i=0;i<12;i++){const a=i*Math.PI/24,b=(i+1)*Math.PI/24;line(o.x+o.width*(u.x*Math.cos(a)+v.x*Math.sin(a)),o.y+o.width*(u.y*Math.cos(a)+v.y*Math.sin(a)),o.x+o.width*(u.x*Math.cos(b)+v.x*Math.sin(b)),o.y+o.width*(u.y*Math.cos(b)+v.y*Math.sin(b)),.025,soft);}
   }else if(o.kind==='window')for(const delta of[-.12/metresPerUnit,0,.12/metresPerUnit])line(o.x+delta*v.x,o.y+delta*v.y,end.x+delta*v.x,end.y+delta*v.y,.04,color('#7d9ca5'));
  }
  for(const e of floor.elements){
   const pos=xy(e.x+e.width/2,e.y+e.height/2),label=ascii(e.label),size=Math.min(7,e.width*s/Math.max(font.widthOfTextAtSize(label,1),1)*.86);
   const tw=bold.widthOfTextAtSize(label,size);
   page.drawRectangle({x:pos.x-tw/2-3,y:pos.y-7,width:tw+6,height:size+12,color:color('#fafaf7'),opacity:.94});
   center(label,pos.x,pos.y,size,bold);center(`${(e.width*e.height*metresPerUnit**2).toFixed(1)} m2`,pos.x,pos.y-7,5,font,soft);
  }
  const north=xy(project.width+.8,1);page.drawLine({start:{x:north.x,y:north.y-20},end:{x:north.x,y:north.y},thickness:.8,color:soft});text('N',north.x-3,north.y+5,8,bold,soft);
  const dp=xy(project.width/2,-.5);center(`${project.width.toFixed(2)} ${project.unit}`,dp.x,dp.y,8,font,soft);
  const dh=xy(-.9,project.height/2);text(`${project.height.toFixed(2)} ${project.unit}`,dh.x-25,dh.y,8,font,soft);
  text('ARCLOOM',65,805,12,bold);text(ascii(project.name),65,783,15,bold);
  text(floor.name,960,770,11,bold);text(`SHEET A-${String(index+1).padStart(2,'0')}`,960,752,8,font,soft);
  text(`Elevation +${floor.elevation.toFixed(2)} m`,960,730,8,font,soft);
  text(`Gross ${(project.width*project.height*metresPerUnit**2).toFixed(0)} m2`,960,715,8,font,soft);
  text(`Scale 1:${denominator} at A3`,960,700,8,font,soft);
  text('SPACE SCHEDULE',960,670,8,bold);
  floor.elements.slice(0,30).forEach((e,i)=>{const name=ascii(e.label).slice(0,26);text(name,960,652-i*13,6.2);text(`${(e.width*e.height*metresPerUnit**2).toFixed(1)}`,1117,652-i*13,6.2,font,soft);});
  page.drawLine({start:{x:65,y:87},end:{x:1125,y:87},color:soft,thickness:.6});
  text('CONCEPT DESIGN / NOT FOR CONSTRUCTION',65,66,9,bold);text('Walls, openings and furniture are indicative. Structure, fire strategy, services and local approval require professional design.',65,49,7,font,soft);
  text(`${floor.name} - ${project.width} x ${project.height} ${project.unit}`,65,31,8,font,soft);text(`${index+1} / ${floors.length}`,1095,31,8,font,soft);
 }
 return pdf.save();
}
