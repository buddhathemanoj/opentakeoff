import {useEffect,useState} from 'react';
import {validateBuildInfo} from './buildInfo.js';
export default function BuildInfo(){
 const [info,setInfo]=useState(null);
 useEffect(()=>{const controller=new AbortController();fetch('/build-info.json',{signal:controller.signal,cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error();return validateBuildInfo(await response.json());}).then(value=>{if(!controller.signal.aborted)setInfo(value);}).catch(()=>{});return()=>controller.abort();},[]);
 return <p className="ks-build-info" aria-label="Arcloom build information">{info?<>Arcloom {info.version}<span>Build {info.buildId} · {info.platform==='darwin'?'macOS':info.platform==='win32'?'Windows':'Linux'} {info.arch}</span></>:<>Arcloom<span>Build information unavailable in this development view.</span></>}</p>;
}
