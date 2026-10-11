import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
export async function createQuantityReport(project,quantities,priced,currency){
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 let page,y;
 const clean=s=>String(s).normalize('NFKD').replace(/[^\x20-\x7E]/g,'');
 const next=()=>{page=pdf.addPage([595.28,841.89]);y=790;line('ARCLOOM / DESIGN REPORT',12,true);wrap(project.name,16,true);line('Concept quantities | '+currency+' | '+quantities.summary,10);y-=14;};
 const line=(text,size=10,strong=false)=>{if(y<55)next();page.drawText(clean(text),{x:40,y,size,font:strong?bold:font,color:rgb(.15,.17,.18)});y-=size+9;};
 const wrap=(text,size=9,strong=false)=>{const face=strong?bold:font,words=[];for(const word of clean(text).split(/\s+/)){let part='';for(const ch of word){if(face.widthOfTextAtSize(part+ch,size)>505){words.push(part);part=ch;}else part+=ch;}if(part)words.push(part);}let row='';for(const word of words){if(row&&face.widthOfTextAtSize(row+' '+word,size)>505){line(row,size,strong);row=word;}else row+=(row?' ':'')+word;}if(row)line(row,size,strong);};
 const num=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
 next();line(project.mode==='site'?'Site summary':'Building summary',12,true);line(quantities.areaLabel+': '+num(quantities.grossArea)+' m2');line('Entered rates subtotal: '+currency+' '+num(priced.total));line(priced.unpriced+' items unpriced. This subtotal is not a complete construction budget.');y-=12;
 line('Quantities and entered rates',12,true);
 for(const row of priced.rows){if(y<130)next();line(row.label,11,true);line(num(row.quantity)+' '+row.unit+' | Rate: '+(row.rate===null?'Unpriced':currency+' '+num(row.rate))+' | Amount: '+(row.amount===null?'Unpriced':currency+' '+num(row.amount)),9);wrap(row.basis);y-=5;}
 next();line(project.mode==='site'?'Plot and site schedule':'Room and space schedule',12,true);
 const m=project.unit==='ft'?.3048:1,floors=project.floors||[{name:project.name,elements:project.elements}];
 for(const f of floors){line(f.name,11,true);for(const e of f.elements)wrap(e.label+' | '+num(e.width*m)+' x '+num(e.height*m)+' m | '+num(e.width*e.height*m*m)+' m2');y-=10;}
 if(project.notes?.length){if(y<140)next();line('Design assumptions and unresolved issues',12,true);for(const note of project.notes){wrap(note);y-=5;}}
 line('Basis and exclusions',12,true);for(const text of [...quantities.assumptions,...quantities.warnings])wrap(text);
 const pages=pdf.getPages();pages.forEach((p,i)=>p.drawText('Concept design - not for construction | '+(i+1)+' / '+pages.length,{x:40,y:25,size:8,font}));
 return pdf.save();
}
