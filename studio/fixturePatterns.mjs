import {validateProject} from '../web/src/studio/model.js';
import {BUILDING_SCHEMA} from '../web/src/studio/building.js';

// Compact generation transport; saved drawings still contain ordinary editable fixtures.
export function expandFixturePatterns(project,patterns){
 const next=structuredClone(validateProject(project));
 if(next.schema!==BUILDING_SCHEMA||!Array.isArray(patterns)||!patterns.length||patterns.length>100)throw new Error('Fixture patterns require a building and 1–100 grids.');
 for(const pattern of patterns){
  const floor=next.floors.find(f=>f.id===pattern.floorId),item=pattern.fixture;
  if(!floor||!item||typeof item!=='object'||Array.isArray(item)||typeof pattern.idPrefix!=='string'||!pattern.idPrefix||pattern.idPrefix.length>70)throw new Error('Invalid fixture grid target or template.');
  const {rows,columns,x,y,rowSpacing,columnSpacing}=pattern;
  const space=floor.elements.find(e=>e.id===pattern.spaceId&&(e.kind==='room'||e.kind==='landscape'));
  if(!space)throw new Error('Fixture grids need an existing room or landscape area.');
  if(!Number.isInteger(rows)||!Number.isInteger(columns)||rows<1||columns<1||rows*columns>400||floor.fixtures.length+rows*columns>400)throw new Error('Fixture grids must fit the 400-fixture floor limit.');
  if([x,y,rowSpacing,columnSpacing,item.width,item.height].some(n=>typeof n!=='number'||!Number.isFinite(n))||x<0||y<0||rowSpacing<0||columnSpacing<0||(rows>1&&rowSpacing<item.height)||(columns>1&&columnSpacing<item.width))throw new Error('Fixture grid dimensions or spacing are invalid.');
  const margin=space.kind==='room'?space.wallThickness/2:0;
  if(x<space.x+margin||y<space.y+margin||x+(columns-1)*columnSpacing+item.width>space.x+space.width-margin||y+(rows-1)*rowSpacing+item.height>space.y+space.height-margin)throw new Error('The fixture grid extends outside its space or into its walls.');
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++)floor.fixtures.push({id:`${pattern.idPrefix}-${row+1}-${column+1}`,type:item.type,label:item.label,x:x+column*columnSpacing,y:y+row*rowSpacing,width:item.width,height:item.height,rotation:item.rotation});
 }
 return validateProject(next);
}
