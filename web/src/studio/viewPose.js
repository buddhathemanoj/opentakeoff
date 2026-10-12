const vector=value=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite);
export function canRestoreView(saved,current){
 if(!saved||!vector(saved.position)||!vector(saved.target)||!Number.isFinite(saved.yaw)||!Number.isFinite(saved.pitch))return false;
 const previous=saved.context;
 if(!previous||['projectId','floorId','walk','scope','cutaway','exploded'].some(key=>previous[key]!==current[key]))return false;
 return ['width','depth','height'].every(key=>Number.isFinite(previous[key])&&Number.isFinite(current[key])&&Math.abs(previous[key]-current[key])<1e-6);
}
