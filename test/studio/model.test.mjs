import {test} from 'node:test';
import assert from 'node:assert/strict';
import { exampleProject, validateProject, projectSvg, layoutWarnings } from '../../web/src/studio/model.js';
test('project round trip preserves all editable geometry',()=>{
 const p=exampleProject(); assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))),p);
});
test('rejects duplicate IDs, out-of-bounds shapes and nonfinite dimensions',()=>{
 const p=exampleProject();
 assert.throws(()=>validateProject({...p,width:Infinity}));
 assert.throws(()=>validateProject({...p,elements:[p.elements[0],p.elements[0]]}));
 assert.throws(()=>validateProject({...p,elements:[{...p.elements[0],x:79}]}));
});
test('SVG escapes untrusted labels and project names',()=>{
 const p=exampleProject();p.name='<script>alert(1)</script>';p.elements[0].label='"<&';
 const svg=projectSvg(p);assert.ok(!svg.includes('<script>'));assert.match(svg,/&lt;script&gt;/);
});
test('overlapping same-kind shapes are disclosed',()=>{
 const p=exampleProject();const a=p.elements.find(e=>e.kind==='plot');p.elements.push({...a,id:'overlap'});
 assert.ok(layoutWarnings(p).some(w=>w.includes('overlaps')));
});
