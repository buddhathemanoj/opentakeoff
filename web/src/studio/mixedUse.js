import { BUILDING_SCHEMA, validateBuilding } from './building.js';

/** A furnished concept brief, with aligned cores and distinct tenant plans.
 * Dimensions are in metres. It is a design study, not a certified construction set. */
export function mixedUseBuilding(id=crypto.randomUUID()){
  const floors=[];
  const make=(level,name,use)=>{
    const prefix=`f${level}`,floor={id:prefix,name,use,elevation:level*4,storeyHeight:4,elements:[],openings:[],fixtures:[]};
    let count=0;
    const room=(label,x,y,width,height,kind='room')=>{const space={id:`${prefix}-space-${++count}`,kind,label,x,y,width,height,wallThickness:.18};floor.elements.push(space);return space;};
    const opening=(kind,x,y,width=1,rotation=0,swing=1)=>floor.openings.push({id:`${prefix}-opening-${floor.openings.length+1}`,kind,x,y,width,rotation,swing});
    const fixture=(type,label,x,y,width,height,rotation=0)=>floor.fixtures.push({id:`${prefix}-fixture-${floor.fixtures.length+1}`,type,label,x,y,width,height,rotation});
    room('Stair A · protected core',0,0,4,6);room('Lift lobby',0,6,4,3);room('Accessible WC',0,9,4,4);room('Staff WC / services',0,13,4,4);room('Tenant entry lobby',0,17,4,7);
    room('West circulation',4,0,2,24);room('Main circulation',6,10,20,4);
    room('Electrical / risers',26,0,4,4);room('Washrooms',26,4,4,6);room('East circulation',26,10,4,8);room('Stair B · protected core',26,18,4,6);
    fixture('stair','Stair A',.7,.8,2.6,4.4);fixture('lift','Passenger lift',.4,6.4,2,2.1);fixture('stair','Stair B',26.7,18.8,2.6,4.4);
    fixture('toilet','Accessible toilet',.6,10,1,1.1);fixture('sink','Accessible basin',2.6,9.6,.7,.5);fixture('toilet','Staff toilet',.6,14,1,1.1);fixture('sink','Staff basin',2.6,13.6,.7,.5);
    for(let i=0;i<2;i++){fixture('toilet','Tenant toilet',26.5+i*1.7,5,1,1.1);fixture('sink','Wash basin',26.5+i*1.7,8.5,.8,.5);}
    opening('door',4,2,1.1,90);opening('door',4,7,1.2,90);opening('door',4,10,1,90);opening('door',4,14,1,90);opening('door',4,19,1.2,90);opening('door',27,18,1.1);opening('door',27,10,1);opening('door',27,4,1);opening('opening',4,11,2,90);opening('opening',26,11,2,90);
    opening('door',1,24,1.4,0,-1);opening('door',28,24,1.2,0,-1);
    const desk=(label,x,y,w=1.8,h=.8)=>{fixture('desk',label,x,y,w,h);fixture('chair','Task chair',x+w/2-.25,y+h+.15,.5,.5);};
    const table=(label,x,y,w=2.8,h=1.2)=>{fixture('table',label,x,y,w,h);for(let i=0;i<Math.floor(w/.75);i++){fixture('chair','Seat',x+.15+i*.75,y-.65,.5,.5);fixture('chair','Seat',x+.15+i*.75,y+h+.15,.5,.5);}fixture('chair','Seat',x-.65,y+h/2-.25,.5,.5);fixture('chair','Seat',x+w+.15,y+h/2-.25,.5,.5);};
    const plant=(x,y)=>fixture('plant','Indoor planting',x,y,.7,.7);
    if(use==='bank'){
      room('Secure vault',6,0,6,6);room('Cash processing',12,0,6,6);room('IT / security server',18,0,4,6);room('Branch manager',22,0,4,6);
      room('Bank operations',6,6,10,4);room('Staff lounge',16,6,6,4);room('Security / control',22,6,4,4);
      room('Teller hall',6,14,12,4);room('Consultation 01',18,14,4,4);room('Consultation 02',22,14,4,4);
      room('Customer waiting',6,18,10,6);room('Public entrance / reception',16,18,6,6);room('ATM vestibule',22,18,4,6);
      fixture('safe','Strongroom safe',7,1,3,3);fixture('cabinet','Secure lockers',10.6,.5,.7,5);
      desk('Cash verification',13,1.4,3,.9);fixture('cabinet','Cash storage',17,.5,.6,4.5);
      fixture('rack','Security rack',18.5,.6,1,1.5);fixture('rack','Network rack',20,.6,1,1.5);desk('Manager desk',22.6,1.4,2,.9);fixture('sofa','Visitor bench',23,4.6,2,.7);
      for(let i=0;i<4;i++)desk('Operations workstation',6.7+i*2.2,7,1.7,.7);
      fixture('kitchen','Staff kitchenette',16.5,6.5,4.5,.7);table('Staff table',18,8,2,.8);desk('Security desk',22.6,7,2,.8);
      for(let i=0;i<4;i++){fixture('teller',`Teller ${i+1}`,6.6+i*2.7,14.5,2.4,.85);fixture('chair','Teller seat',7.4+i*2.7,16,.55,.55);}
      desk('Consultation desk',18.6,15.1,2,.8);desk('Consultation desk',22.6,15.1,2,.8);
      for(let row=0;row<2;row++)for(let col=0;col<5;col++)fixture('chair','Customer waiting seat',7+col*1.55,19+row*2,.6,.65);
      fixture('counter','Reception / information',17,19,3,.8);fixture('atm','ATM 01',22.5,19,.9,.8);fixture('atm','ATM 02',24,19,.9,.8);
      plant(6.5,22.6);plant(15,22.6);plant(21,22.6);
      [[8,6],[14,6],[19,6],[23,6],[9,10],[18,10],[23,10],[8,14],[19,14],[23,14],[10,18],[17,18],[23,18]].forEach(([x,y])=>opening('door',x,y,1));
      opening('door',18,24,1.6,0,-1);
    }else if(use==='cafe'){
      room('Production kitchen',6,0,12,6);room('Dishwash / wet area',18,0,4,6);room('Dry & cold storage',22,0,4,6);
      room('Pastry / preparation',6,6,6,4);room('Coffee bar / pickup',12,6,8,4);room('Staff changing',20,6,6,4);
      room('Main dining · 40 seats',6,14,14,10);room('Lounge / private dining',20,14,6,6);room('Garden terrace',20,20,6,4,'landscape');
      fixture('kitchen','Cooking line',6.5,.5,10.8,.9);fixture('counter','Preparation island',8.4,3.2,6.5,1.2);fixture('sink','Kitchen wash sink',16.5,3.8,1,.6);
      fixture('sink','Commercial dishwash',18.5,.5,2.8,1);fixture('rack','Dish storage',18.5,4.7,2.8,.6);fixture('cabinet','Cold storage',22.5,.5,2.9,1.5);fixture('rack','Dry storage shelves',22.5,3.5,2.9,.6);
      fixture('counter','Pastry preparation',6.5,6.5,4.8,.9);fixture('counter','Coffee service bar',12.5,8.2,6.8,1.1);fixture('kitchen','Espresso / back bar',12.5,6.5,6.8,.7);fixture('cabinet','Staff lockers',20.5,6.5,4.8,.6);
      for(let row=0;row<2;row++)for(let col=0;col<3;col++)table('Dining table',7.4+col*4.1,15.6+row*4.3,2,1);
      fixture('sofa','Banquette seating',6.6,22.7,11.5,.7);fixture('table','Banquette table',8,21.4,2,.8);fixture('table','Banquette table',12,21.4,2,.8);fixture('table','Banquette table',16,21.4,2,.8);
      fixture('sofa','Lounge sofa',20.5,14.6,4.8,.8);table('Private dining',21.5,17,2.6,1);
      table('Terrace table',21.7,21.3,1.6,.8);plant(20.5,20.5);plant(24.8,22.8);plant(6.5,14.5);
      [[8,6],[19,6],[23,6],[8,10],[21,10],[8,14],[21,14],[22,20]].forEach(([x,y])=>opening('door',x,y,1.2));opening('opening',13,10,5);
    }else{
      room('Meeting room A',6,0,4,6);room('Meeting room B',10,0,4,6);room('Director / management',14,0,6,6);room('Server / network',20,0,6,6);
      room('Project / training room',6,6,10,4);room('Pantry / breakout',16,6,10,4);
      room('Open office · 24 workstations',6,14,14,10);room('Collaboration lounge',20,14,6,4);room('Focus booth A',20,18,3,3);room('Focus booth B',23,18,3,3);room('Print / library',20,21,6,3);
      table('Meeting table',7.1,1.8,1.8,1.2);table('Meeting table',11.1,1.8,1.8,1.2);desk('Director desk',15,1.7,2.4,.9);fixture('sofa','Visitor sofa',16,4.8,3,.7);
      for(let i=0;i<4;i++)fixture('rack',`Server rack ${i+1}`,20.7+i*1.2,.8,.8,1.4);fixture('rack','Network cabinet',20.7,4.5,2,.8);
      table('Project table',8,7.4,5.8,1);fixture('kitchen','Office pantry',16.5,6.4,8.8,.8);table('Breakout table',18,8.1,4,.8);
      for(let row=0;row<3;row++)for(let col=0;col<4;col++){
        const x=6.7+col*3.25,y=14.6+row*3.1;
        desk('Workstation',x,y,1.3,.65);fixture('desk','Workstation',x,y+.7,1.3,.65);fixture('chair','Task chair',x+.4,y+1.55,.5,.5);
      }
      fixture('sofa','Collaboration sofa',20.5,14.5,4.8,.75);fixture('table','Collaboration table',22,16,2,.8);desk('Focus desk',20.4,18.5,1.8,.65);desk('Focus desk',23.4,18.5,1.8,.65);fixture('cabinet','Print station',20.5,21.5,2,.8);fixture('rack','Library shelving',23,21.5,2.4,.6);
      plant(19,23);plant(25,16.7);plant(16.4,9);
      [[7,6],[11,6],[16,6],[23,6],[9,10],[18,10],[8,14],[21,14],[21,18],[24,18],[21,21]].forEach(([x,y])=>opening('door',x,y,1));
    }
    // Perimeter glazing is broken by the cores, rather than continuous through services.
    for(let x=6.7;x<25;x+=3.4){opening('window',x,0,2.2);opening('window',x,24,2.2);}
    for(let y=1;y<17;y+=4)opening('window',30,y,2.2,90);
    floors.push(floor);
  };
  make(0,'Ground floor · Bank','bank');make(1,'Level 1 · Café','cafe');make(2,'Level 2 · IT company','office');
  return validateBuilding({schema:BUILDING_SCHEMA,id,name:'Kosal Commons · Bank / Café / IT',mode:'building',unit:'m',width:30,height:24,floors,notes:[
    'Concept design for a 30 × 24 m mixed-use building. North is at the top; principal bank entrance is south-facing.',
    'Three storeys at 4 m floor-to-floor height; gross area 720 m² per floor / 2,160 m² total.',
    'A shared west lift/stair core and a second east stair are aligned on every floor. Tenant access is independent of the bank secure area.',
    'Ground: public banking, teller hall, consultation rooms, back office, strongroom and separate ATM vestibule.',
    'Level 1: café dining, coffee counter, production kitchen, dishwash, storage, staff facilities and planted terrace.',
    'Level 2: IT workstations, meetings, training, quiet booths, server room, pantry and collaboration lounge.',
    'Furniture and wall dimensions are indicative. Structure, fire strategy, accessibility, ventilation, acoustics, vault security and local regulations require qualified professional design.',
    'No site survey, structural calculations or jurisdiction have been supplied. This set is not approved for construction.'
  ]});
}
