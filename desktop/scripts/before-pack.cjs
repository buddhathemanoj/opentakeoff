const {Arch}=require('builder-util');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
exports.default=async context=>{
 const {stageCodex}=await import(pathToFileURL(path.join(__dirname,'stage-codex.mjs')).href);
 await stageCodex({root:context.packager.projectDir,platform:context.electronPlatformName,arch:Arch[context.arch]});
};
