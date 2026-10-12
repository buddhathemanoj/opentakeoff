const {Arch}=require('builder-util');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
exports.default=async context=>{
 const {stageCodex}=await import(pathToFileURL(path.join(__dirname,'stage-codex.mjs')).href);
 const root=context.packager.projectDir,platform=context.electronPlatformName,arch=Arch[context.arch];
 const codexDirectory=await stageCodex({root,platform,arch});
 const {writeBuildInfo}=await import(pathToFileURL(path.join(__dirname,'build-info.mjs')).href);
 await writeBuildInfo({root,codexDirectory,platform,arch});
};
