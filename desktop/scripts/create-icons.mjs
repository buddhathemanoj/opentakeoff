import sharp from '../../web/node_modules/sharp/dist/index.mjs';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const folder=join(dirname(fileURLToPath(import.meta.url)),'../assets'),source=await readFile(join(folder,'../../web/src/brand/arcloom-logo.png'));
const png=async size=>sharp(source).resize(size,size).png().toBuffer();
await writeFile(join(folder,'icon.png'),await png(1024));
const sizes=[16,24,32,48,64,128,256],buffers=await Promise.all(sizes.map(png)),header=Buffer.alloc(6+16*sizes.length);
header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let offset=header.length;
for(const [i,size] of sizes.entries()){
 const p=6+i*16;header[p]=size===256?0:size;header[p+1]=header[p];header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(buffers[i].length,p+8);header.writeUInt32LE(offset,p+12);offset+=buffers[i].length;
}
await writeFile(join(folder,'icon.ico'),Buffer.concat([header,...buffers]));
if(process.platform==='darwin'){
 const iconset=join(folder,'icon.iconset');await mkdir(iconset,{recursive:true});
 for(const size of[16,32,128,256,512])for(const scale of[1,2])await writeFile(join(iconset,`icon_${size}x${size}${scale===2?'@2x':''}.png`),await png(size*scale));
 await promisify(execFile)('iconutil',['-c','icns',iconset,'-o',join(folder,'icon.icns')]);await rm(iconset,{recursive:true});
}
