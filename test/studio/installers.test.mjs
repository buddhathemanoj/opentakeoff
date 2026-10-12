import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildInstallers,isDmgDetachBusy} from '../../desktop/scripts/build-installers.mjs';
const busy='dmgbuild.core.DMGError: Unable to detach device cleanly: hdiutil: couldn\'t eject "disk2" - Resource busy';
test('installer recovery retries the observed Mac detach error once, never hiding other failures',async()=>{
 assert.equal(isDmgDetachBusy(busy),true);assert.equal(isDmgDetachBusy('Resource busy: app packaging failed'),false);
 let attempts=0;
 await buildInstallers({platform:'mac',arch:'x64',prepackaged:'release/mac',run:async args=>{assert.ok(args.includes('--prepackaged'));return ++attempts===1?{code:1,output:busy}:{code:0,output:''};}});
 assert.equal(attempts,2);
 attempts=0;await assert.rejects(buildInstallers({platform:'mac',arch:'x64',prepackaged:'release/mac',run:async()=>{attempts++;return{code:1,output:busy};}}),/failed/);assert.equal(attempts,2);
 attempts=0;await assert.rejects(buildInstallers({platform:'mac',arch:'arm64',prepackaged:'release/mac-arm64',run:async()=>{attempts++;return{code:1,output:'Invalid signature'};}}),/failed/);assert.equal(attempts,1);
 attempts=0;await assert.rejects(buildInstallers({platform:'win',arch:'x64',prepackaged:'release/win-unpacked',run:async()=>{attempts++;return{code:1,output:busy};}}),/failed/);assert.equal(attempts,1);
});
