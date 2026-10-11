import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createStudioApi } from './api.mjs';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf','.wasm':'application/wasm','.woff2':'font/woff2','.ico':'image/x-icon'};
export async function startStudioServer({root,port=51377}) {
  const base=resolve(root),api=createStudioApi();
  const server=createServer((req,res)=>api(req,res,async()=>{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
    try {
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      let file=resolve(base,`.${pathname}`);
      if(file!==base&&!file.startsWith(base+sep)){res.writeHead(403);return res.end();}
      try{if(!(await stat(file)).isFile())file=resolve(base,'index.html');}catch{if(extname(pathname)){res.writeHead(404);return res.end();}file=resolve(base,'index.html');}
      const bytes=await readFile(file);
      res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});
      res.end(req.method==='HEAD'?undefined:bytes);
    }catch{res.writeHead(500);res.end('Unable to load Kosal Studio.');}
  }));
  await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
  return {server,url:`http://127.0.0.1:${server.address().port}`};
}
