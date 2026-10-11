import { validateProject } from './model.js';
export const RECOVERY_STORAGE = 'kosal.studio.recovery.v1';
export const EMPTY_RECOVERY = Object.freeze({ draft: '', proposal: null, base: '', pending: false });

// Recovery is separate from drawings: restoring a proposal never applies it.
export function validateRecovery(value, projectId) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid saved conversation.');
  const draft = typeof value.draft === 'string' ? value.draft.slice(0, 12000) : '';
  const proposal = value.proposal ? validateProject(value.proposal) : null;
  const base = typeof value.base === 'string' ? value.base : '';
  if (proposal) {
    if (proposal.id !== projectId) throw new Error('Saved proposal belongs to a different project.');
    const original = validateProject(JSON.parse(base));
    if (original.id !== projectId) throw new Error('Saved proposal context belongs to a different project.');
  }
  return { draft, proposal, base, pending: value.pending === true };
}
export function restoreRecovery(storage) {
  const records = Object.create(null);
  let error = '';
  try {
    const raw = storage.getItem(RECOVERY_STORAGE);
    if (!raw) return { records, error };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    for (const [id, value] of Object.entries(parsed)) {
      try { records[id] = validateRecovery(value, id); }
      catch { error = 'Some saved conversation details could not be opened. The original saved data is preserved.'; }
    }
  } catch { error = 'Saved conversation details could not be opened. The original saved data is preserved.'; }
  return { records, error };
}
export function validateChats(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid saved chats.');
  const records = Object.create(null);
  for (const [id, messages] of Object.entries(value)) {
    if (!Array.isArray(messages) || messages.some(message => !message || !['user', 'assistant', 'error'].includes(message.role) || typeof message.content !== 'string')) throw new Error('Invalid saved chat messages.');
    records[id] = messages.map(({ role, content }) => ({ role, content: content.slice(0, 30000) }));
  }
  return records;
}
