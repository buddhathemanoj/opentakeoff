import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {runtimeTarget,verifyArchive} from '../../desktop/scripts/stage-codex.mjs';
test('desktop runtime resolves target architecture, independently of the build host',()=>{
 assert.equal(runtimeTarget('win32','x64').triple,'x86_64-pc-windows-msvc');
 assert.equal(runtimeTarget('win32','x64').binary,'codex.exe');
 assert.equal(runtimeTarget('darwin','arm64').triple,'aarch64-apple-darwin');
 assert.equal(runtimeTarget('darwin','x64').triple,'x86_64-apple-darwin');
 assert.throws(()=>runtimeTarget('darwin','ia32'),/Unsupported/);
});
test('runtime download cannot bypass pinned archive integrity',()=>{
 const bytes=Buffer.from('fixture'),pin='sha512-'+createHash('sha512').update(bytes).digest('base64');
 assert.doesNotThrow(()=>verifyArchive(bytes,pin));
 assert.throws(()=>verifyArchive(Buffer.from('changed'),pin),/integrity/);
 assert.throws(()=>verifyArchive(bytes,'sha1-abc'),/SHA-512/);
});
