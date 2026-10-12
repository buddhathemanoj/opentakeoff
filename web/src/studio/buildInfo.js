// Product identity only; no project data or local machine paths belong here.
export function validateBuildInfo(value){
 if(!value||value.schema!=='arcloom.build.v1'||typeof value.version!=='string'||!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(value.version)||!['darwin','win32','linux'].includes(value.platform)||!['arm64','x64'].includes(value.arch)||typeof value.builtAt!=='string'||!Number.isFinite(Date.parse(value.builtAt))||typeof value.contentDigest!=='string'||! /^[a-f0-9]{64}$/.test(value.contentDigest)||value.buildId!==value.contentDigest.slice(0,12)||typeof value.electronVersion!=='string'||!/^\d+\.\d+\.\d+$/.test(value.electronVersion))throw new Error('Invalid Arcloom build information.');
 return {schema:value.schema,version:value.version,platform:value.platform,arch:value.arch,builtAt:value.builtAt,buildId:value.buildId,contentDigest:value.contentDigest,electronVersion:value.electronVersion};
}
