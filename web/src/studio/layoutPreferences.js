export const LAYOUT_STORAGE='kosal.studio.layout.v1';
export const DEFAULT_LAYOUT={sidebar:288,projects:144,layers:220,chat:56};
export function restoreLayout(storage){
  try{
    const value=JSON.parse(storage.getItem(LAYOUT_STORAGE)||'{}'),next={...DEFAULT_LAYOUT};
    for(const [key,min,max] of [['sidebar',220,440],['projects',80,360],['layers',80,400],['chat',24,76]]){
      if(Number.isFinite(value[key]))next[key]=Math.max(min,Math.min(max,value[key]));
    }
    return next;
  }catch{return{...DEFAULT_LAYOUT};}
}
