import {createContext,useContext} from 'react';
export const WorkspaceIdentity=createContext(null);
export function WorkspaceWordmark({className,style}){
 const identity=useContext(WorkspaceIdentity);
 return <strong className={className} style={style}>{identity?<>{identity.name}<span style={{fontSize:12,fontWeight:400,marginLeft:6,color:'var(--ink-muted)'}}>Takeoff</span></>:<>open<span style={className?undefined:{fontStyle:'italic',color:'var(--cobalt)'}}>takeoff</span></>}</strong>;
}
