import {useState,useEffect,useRef} from 'react';
export default function NumberField({label,value,onChange,step=.1}){
  const [draft,setDraft]=useState(String(value));
  const cancelled=useRef(false);
  useEffect(()=>setDraft(String(value)),[value]);
  const commit=()=>{const number=Number(draft);if(!cancelled.current&&draft.trim()&&Number.isFinite(number)&&number!==value)onChange(number);cancelled.current=false;setDraft(String(value));};
  return <label className="ks-field"><span>{label}</span><input aria-label={label} type="number" step={step} value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}if(e.key==='Escape'){cancelled.current=true;setDraft(String(value));e.currentTarget.blur();}}}/></label>;
}

