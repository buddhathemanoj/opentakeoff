import {runLogin} from './login.mjs';
import { codexStatus, runDesign } from './codex.mjs';
import { allElementIds } from '../web/src/studio/building.js';
import { validateProject } from '../web/src/studio/model.js';
const LOCAL = new Set(['localhost', '127.0.0.1', '[::1]']);

function validateInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid request.');
  if (typeof input.prompt !== 'string' || !input.prompt.trim() || input.prompt.length > 12000) throw new Error('Write a brief of up to 12,000 characters.');
  const project = validateProject(input.project);
  if (!Array.isArray(input.history) || input.history.length > 30 || input.history.some(m => !m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || m.content.length > 30000)) throw new Error('Invalid conversation.');
  const ids = new Set(allElementIds(project));
  if (!Array.isArray(input.selected) || input.selected.length > 250 || input.selected.some(id => typeof id !== 'string' || !ids.has(id))) throw new Error('Invalid selection.');
  return { prompt: input.prompt.trim(), project, history: input.history.map(({ role, content }) => ({ role, content })), selected: [...new Set(input.selected)] };
}

export function createStudioApi({ status = codexStatus, design = runDesign, login = runLogin } = {}) {
  let running = false;
  return async function studioApi(req, res, next) {
    if (!req.url?.startsWith('/api/studio/')) return next();
    const json = (code, data) => {
      if (res.destroyed || res.writableEnded) return;
      res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(data));
    };
    let host;
    try { host = new URL(`http://${req.headers.host}`); } catch { return json(403, { error: 'Local connections only.' }); }
    if (!LOCAL.has(host.hostname)) return json(403, { error: 'Local connections only.' });
    if (req.headers.origin && req.headers.origin !== host.origin) return json(403, { error: 'Cross-origin requests are not allowed.' });
    if (req.url === '/api/studio/status' && req.method === 'GET') {
      try { return json(200, await status()); }
      catch { return json(503, { error: 'Could not check your Codex connection. Try again.' }); }
    }
    const signingIn=req.url==='/api/studio/login';
    if ((!signingIn&&req.url !== '/api/studio/chat') || req.method !== 'POST') return json(404, { error: 'Not found.' });
    if (req.headers['x-kosal-client'] !== 'studio' || !req.headers['content-type']?.startsWith('application/json')) return json(403, { error: 'Invalid studio request.' });
    if (running) return json(409, { error: 'Another Codex request is running. Wait for it to finish.' });

    // Reserve the runtime before reading the body. Slow uploads must not start two jobs.
    running = true;
    const controller = new AbortController();
    const cancel = () => controller.abort();
    res.once('close', cancel);
    req.once('aborted', cancel);
    req.setTimeout(15000, () => { controller.abort(); req.destroy(); });
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 500000) return json(413, { error: 'This drawing is too large for a chat request.' });
        chunks.push(chunk);
      }
      if (req.socket) req.setTimeout(0);
      let input;
      try { const parsed=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(signingIn){if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||Object.keys(parsed).some(key=>key!=='force')||(parsed.force!==undefined&&typeof parsed.force!=='boolean'))throw new Error('Invalid sign-in request.');input={force:parsed.force===true};}else input = validateInput(parsed); }
      catch (error) { return json(400, { error: error instanceof SyntaxError ? 'Invalid request.' : error.message }); }
      if (controller.signal.aborted || res.destroyed) return;
      res.writeHead(200, { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      const send = event => { if (!res.destroyed && !res.writableEnded) res.write(JSON.stringify(event) + '\n'); };
      send({ type: 'status', message: signingIn?'Checking your Codex connection…':'Connecting to your Codex…' });
      try {
        if(signingIn){const existing=await status(),connected=existing.connected&&!input.force?existing:await login({signal:controller.signal,onEvent:send});if(connected?.connected!==true)throw new Error('Sign-in did not complete. Try again.');send({type:'connected',status:connected});return;}
        const result = await design({ ...input, signal: controller.signal, onEvent: send });
        if (typeof result?.message !== 'string' || result.message.length > 30000) throw new Error('Codex returned an invalid response. Please retry.');
        const proposal = result.proposal ? validateProject(result.proposal) : null;
        if (proposal && proposal.id !== input.project.id) throw new Error('The proposal belongs to a different project. Please retry.');
        send({ type: 'result', message: result.message, proposal });
      } catch (error) { send({ type: 'error', message: error.message || 'The request failed.', code:error.code }); }
    } catch {
      if (!res.headersSent) json(400, { error: 'Invalid request.' });
    } finally {
      running = false;
      if (req.socket) req.setTimeout(0);
      req.removeListener('aborted', cancel);
      res.removeListener('close', cancel);
      if (!res.destroyed && !res.writableEnded) res.end();
    }
  };
}
export function studioPlugin() {
  return { name: 'kosal-studio-local-api', configureServer(server) { server.middlewares.use(createStudioApi()); } };
}
