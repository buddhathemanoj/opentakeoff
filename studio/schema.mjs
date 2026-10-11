import { KINDS, SCHEMA } from '../web/src/studio/model.js';
import { BUILDING_SCHEMA, FIXTURE_TYPES, USES } from '../web/src/studio/building.js';
const object = properties => ({ type:'object', properties, required:Object.keys(properties), additionalProperties:false });
const string={type:'string'},number={type:'number'},rotation={type:'number',enum:[0,90,180,270]};
const baseElement={id:string,kind:{type:'string',enum:KINDS},label:string,x:number,y:number,width:number,height:number};
export const projectSchema=object({schema:{type:'string',enum:[SCHEMA]},id:string,name:string,mode:{type:'string',enum:['site','floor']},unit:{type:'string',enum:['m','ft']},width:number,height:number,elements:{type:'array',items:object(baseElement)}});
export const buildingSchema=object({
 schema:{type:'string',enum:[BUILDING_SCHEMA]},id:string,name:string,mode:{type:'string',enum:['building']},unit:{type:'string',enum:['m','ft']},width:number,height:number,
 floors:{type:'array',items:object({id:string,name:string,use:{type:'string',enum:USES},elevation:number,storeyHeight:number,
  elements:{type:'array',items:object({...baseElement,kind:{type:'string',enum:['room','landscape','water','parking','building']},wallThickness:number})},
  openings:{type:'array',items:object({id:string,kind:{type:'string',enum:['door','window','opening']},x:number,y:number,width:number,rotation,swing:{type:'number',enum:[-1,1]}})},
  fixtures:{type:'array',items:object({id:string,type:{type:'string',enum:FIXTURE_TYPES},label:string,x:number,y:number,width:number,height:number,rotation})}
 })},notes:{type:'array',items:string}
});
const nullable=schema=>({anyOf:[schema,{type:'null'}]});
const editSchema=object({floorId:string,collection:{type:'string',enum:['spaces','fixtures','openings']},targetId:string,label:nullable(string),x:nullable(number),y:nullable(number),width:nullable(number),height:nullable(number),rotation:nullable(rotation)});
export const responseSchema=object({message:string,proposal:{anyOf:[projectSchema,buildingSchema,{type:'null'}]},edits:nullable({type:'array',items:editSchema})});
