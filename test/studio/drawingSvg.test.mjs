import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {build} from '../../web/node_modules/esbuild/lib/main.js';
import {mixedUseBuilding} from '../../web/src/studio/mixedUse.js';
import {convertBuildingUnit} from '../../web/src/studio/building.js';

test('architectural SVG retains selected floor details, escapes labels and exports feet correctly',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'kosal-svg-test-'));
  try{
    const file=join(dir,'renderer.cjs');
    await build({entryPoints:[new URL('../../web/src/studio/drawingSvg.jsx',import.meta.url).pathname],outfile:file,bundle:true,platform:'node',format:'cjs',jsx:'automatic',logLevel:'silent'});
    const {drawingSvg}=createRequire(import.meta.url)(file),project=mixedUseBuilding('svg-details');
    project.name='Bank <script> & café';
    project.floors[1].fixtures[0].rotation=90;
    const svg=drawingSvg(project,'f1');
    assert.equal((svg.match(/data-fixture=/g)||[]).length,project.floors[1].fixtures.length);
    assert.equal((svg.match(/data-opening=/g)||[]).length,project.floors[1].openings.length);
    assert.ok(svg.includes('Bank &lt;script&gt; &amp; café'));
    assert.ok(!svg.includes('<script>'));
    assert.ok(svg.includes('rotate(90)'));
    assert.ok(!svg.includes('Secure vault'));
    const feet=drawingSvg(convertBuildingUnit(project,'ft'),'f1');
    assert.ok(feet.includes('ft²'));assert.ok(feet.includes('19.69 ft'));
    assert.ok(!feet.includes('6,000'));
    assert.equal((feet.match(/data-fixture=/g)||[]).length,project.floors[1].fixtures.length);
  }finally{await rm(dir,{recursive:true,force:true});}
});
