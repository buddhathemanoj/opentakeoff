import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument,PDFName,PDFDict} from '../../web/node_modules/pdf-lib/cjs/index.js';
import {createPlanPdf} from '../../web/src/studio/planPdf.js';
import {mixedUseBuilding} from '../../web/src/studio/mixedUse.js';
import {exampleProject} from '../../web/src/studio/model.js';
test('exports all three tenant plans as vector A3 sheets with a stable project title',async()=>{
 const project=mixedUseBuilding('pdf-building'),bytes=await createPlanPdf(project),pdf=await PDFDocument.load(bytes);
 assert.equal(pdf.getPageCount(),3);assert.equal(pdf.getTitle(),'Kosal Commons - Bank / Cafe / IT');
 for(const page of pdf.getPages()){
  assert.deepEqual(page.getSize(),{width:1190.55,height:841.89});
  assert.ok(page.node.Contents());
  const resources=page.node.Resources();
  // Vector furniture, walls and dimensions remain measurable; no flattened page image.
  assert.equal(resources.lookupMaybe(PDFName.of('XObject'),PDFDict)?.keys().length||0,0);
 }
 assert.ok(bytes.length>10000);assert.deepEqual(project,mixedUseBuilding('pdf-building'));
});
test('keeps single-floor and site project export supported',async()=>{
 const pdf=await PDFDocument.load(await createPlanPdf(exampleProject()));assert.equal(pdf.getPageCount(),1);
});
