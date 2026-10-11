// Adapted from Remocn Studio's titlebar.tsx, shader-field.tsx and use-shader-backdrop.ts.
// Copyright (c) 2026 Remocn. MIT license: desktop/licenses/remocn-MIT.txt.
import { useEffect, useState } from 'react';
import { NeuroNoise } from '@paper-design/shaders-react';
export default function TitlebarAura({busy=false}) {
  const [support,setSupport]=useState(null),[focused,setFocused]=useState(()=>document.hasFocus());
  useEffect(()=>{
    const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const preference=()=>setSupport({hasWebgl:gl!==null,isStill:media.matches});
    const focus=()=>setFocused(true),blur=()=>setFocused(false);
    preference();media.addEventListener('change',preference);window.addEventListener('focus',focus);window.addEventListener('blur',blur);
    return()=>{media.removeEventListener('change',preference);window.removeEventListener('focus',focus);window.removeEventListener('blur',blur);};
  },[]);
  return <div className="ks-titlebar-aura" aria-hidden="true"><div className="ks-titlebar-mood">{support?.hasWebgl&&<NeuroNoise brightness={0.26} contrast={0.2} scale={0.55} speed={support.isStill||!focused?0:busy?0.85:0.24} colorBack="rgba(0, 0, 0, 0)" colorMid="rgba(124, 58, 237, 0.55)" colorFront="rgba(196, 181, 253, 0.45)" maxPixelCount={1920*1080} minPixelRatio={1} width="100%" height="100%"/>}</div></div>;
}
