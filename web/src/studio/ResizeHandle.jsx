import {useRef} from 'react';
export default function ResizeHandle({label,orientation='vertical',value,min,max,onChange,className=''}){
  const gesture=useRef(null),vertical=orientation==='vertical';
  return <div className={'ks-resize-handle '+className} role="separator" tabIndex={0} aria-label={label} aria-orientation={orientation} aria-valuemin={min} aria-valuemax={max} aria-valuenow={Math.round(value)}
    onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);gesture.current={at:vertical?e.clientX:e.clientY,value};}}
    onPointerMove={e=>{if(!gesture.current)return;const delta=(vertical?e.clientX:e.clientY)-gesture.current.at;onChange(Math.max(min,Math.min(max,gesture.current.value+delta)));}}
    onPointerUp={()=>{gesture.current=null;}} onPointerCancel={()=>{gesture.current=null;}}
    onKeyDown={e=>{const delta=['ArrowRight','ArrowDown'].includes(e.key)?12:['ArrowLeft','ArrowUp'].includes(e.key)?-12:0;if(delta){e.preventDefault();e.stopPropagation();onChange(Math.max(min,Math.min(max,value+delta)));}}}><span/></div>;
}
