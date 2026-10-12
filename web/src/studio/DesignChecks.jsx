import {useMemo,useState} from 'react';
import {reviewLayout} from './designReview.js';

export default function DesignChecks({project,onLocate}){
 const [floorId,setFloorId]=useState(''),[page,setPage]=useState(0);
 const activeFloorId=project.floors?.some(f=>f.id===floorId)?floorId:'';
 const review=useMemo(()=>{const result=reviewLayout(project,{floorId:activeFloorId||null,offset:page*25,limit:25});return result.total&&result.offset>=result.total?reviewLayout(project,{floorId:activeFloorId||null,limit:25}):result;},[project,activeFloorId,page]);
 const visible=review;
 const currentPage=visible.offset/25;
 return <details className="ks-design-checks">
  <summary>Design checks <span>{review.total?`${review.total} issues`:'No issues found'}</span></summary>
  <p className="ks-muted">Checks for overlapping spaces and modelled openings. These do not verify connected routes, accessibility, structure or building regulations.</p>
  {project.floors&&<label className="ks-check-filter">Floor<select aria-label="Design check floor" value={activeFloorId} onChange={e=>{setFloorId(e.target.value);setPage(0);}}><option value="">All floors</option>{project.floors.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>}
  {!review.total?<p className="ks-muted">No issues found by these geometry checks. The design still needs review.</p>:<>
   <ol className="ks-check-list" start={visible.offset+1}>{visible.issues.map(issue=><li key={[issue.floorId,issue.kind,...issue.itemIds].join(':')}><button type="button" onClick={()=>onLocate(issue)}>{project.floors&&<small>{issue.floorName}</small>}<span>{issue.message}</span><em>Inspect in floor plan →</em></button></li>)}</ol>
   <div className="ks-check-pages"><span>{visible.offset+1}–{visible.offset+visible.issues.length} of {review.total}</span><button type="button" className="ks-button quiet" disabled={!currentPage} onClick={()=>setPage(currentPage-1)}>Previous issues</button><button type="button" className="ks-button quiet" disabled={visible.offset+visible.issues.length>=review.total} onClick={()=>setPage(currentPage+1)}>Next issues</button></div>
  </>}
 </details>;
}
