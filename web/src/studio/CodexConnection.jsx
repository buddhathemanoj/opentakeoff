import {useEffect,useRef,useState} from 'react';
export default function CodexConnection({status,onStatus}){
 const request=useRef(null),[working,setWorking]=useState(false),[message,setMessage]=useState(''),[authUrl,setAuthUrl]=useState(''),[error,setError]=useState('');
 useEffect(()=>()=>request.current?.abort(),[]);
 const check=async()=>{setError('');try{const r=await fetch('/api/studio/status');if(!r.ok)throw new Error();const next=await r.json();if(status.needsSignIn&&next.connected){setError('This session failed authentication. Sign in again to refresh it.');return;}onStatus(next);}catch{setError('The local Codex service is unavailable. Reopen the app and try again.');}};
 const connect=async()=>{
  if(working)return;const controller=new AbortController();request.current=controller;setWorking(true);setError('');setAuthUrl('');setMessage('Starting Codex sign-in…');
  try{
   const response=await fetch('/api/studio/login',{method:'POST',headers:{'Content-Type':'application/json','X-Kosal-Client':'studio'},body:JSON.stringify(status.needsSignIn?{force:true}:{}),signal:controller.signal});
   if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||'Could not start sign-in.');}
   const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',connected=false;
   const consume=line=>{if(!line)return;const event=JSON.parse(line);if(event.type==='error')throw new Error(event.message);if(event.type==='status')setMessage(event.message);if(event.type==='auth'){const url=new URL(event.url);if(url.protocol==='https:'&&url.hostname==='auth.openai.com'&&!url.username&&!url.password&&(!url.port||url.port==='443')&&url.pathname==='/oauth/authorize'){setAuthUrl(url.href);setMessage('Complete sign-in in your browser, then return here.');}}if(event.type==='connected'){connected=true;onStatus(event.status);}};
   while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let i;while((i=buffer.indexOf('\n'))>=0){consume(buffer.slice(0,i));buffer=buffer.slice(i+1);}}if(buffer.trim())consume(buffer);if(!connected)throw new Error('Sign-in ended before connecting. Try again.');
  }catch(e){if(e.name!=='AbortError')setError(e.message);else setMessage('Sign-in cancelled.');setAuthUrl('');}finally{request.current=null;setWorking(false);}
 };
 return <section className="ks-connection" aria-label="Connect Codex"><strong>Connect your Codex</strong><p>{status.available?'Use your ChatGPT account for AI design. Codex opens its browser sign-in and manages your saved login.':'The drawing tools work offline. Open the local Arcloom app to connect Codex.'}</p>
  {status.available&&<div className="ks-connect-actions">{working?<button className="ks-button" onClick={()=>request.current?.abort()}>Cancel sign-in</button>:<button className="ks-button primary" onClick={connect}>{status.needsSignIn?'Sign in again':'Sign in to Codex'}</button>}{authUrl&&<a className="ks-button" href={authUrl} target="_blank" rel="noreferrer">Open sign-in page</a>}<button className="ks-text-button" onClick={check}>Check connection</button></div>}
  {working&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}
 </section>;
}
