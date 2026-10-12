import { validateBuilding, BUILDING_SCHEMA } from './building.js';
import {reviewLayout} from './designReview.js';
export const SCHEMA = 'kosal.studio.project.v1';
export const KINDS = ['plot', 'building', 'room', 'road', 'landscape', 'water', 'parking'];
export const KIND_LABELS = { plot: 'Plot', building: 'Building', room: 'Room', road: 'Road', landscape: 'Landscape', water: 'Water', parking: 'Parking', void: 'Floor opening' };
export const PAINT = {
  plot: { fill: '#ede7dc', stroke: '#9c9180' }, building: { fill: '#d8d5cc', stroke: '#79796d' },
  room: { fill: '#eee4d9', stroke: '#a38c74' }, road: { fill: '#e0e1df', stroke: '#afb3af' },
  landscape: { fill: '#dce5d4', stroke: '#91a184' }, water: { fill: '#d9e6e7', stroke: '#8cabad' },
  void: {fill:'#fafaf7',stroke:'#88969a'},
  parking: { fill: '#e8e7e3', stroke: '#a2a39a' },
};
const number = (n, min, max) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
export function validateProject(value) {
  if(value?.schema===BUILDING_SCHEMA)return validateBuilding(value);
  if (!value || value.schema !== SCHEMA || typeof value.id !== 'string' || !value.id || value.id.length > 100) throw new Error('This is not a Arcloom project.');
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 120) throw new Error('Use a project name between 1 and 120 characters.');
  if (!['site', 'floor'].includes(value.mode) || !['m', 'ft'].includes(value.unit)) throw new Error('Invalid drawing mode or unit.');
  if (!number(value.width, 1, 2000) || !number(value.height, 1, 2000)) throw new Error('Drawing dimensions must be between 1 and 2,000.');
  if (!Array.isArray(value.elements) || value.elements.length > 250) throw new Error('A drawing can contain up to 250 elements.');
  const ids = new Set();
  const elements = value.elements.map(e => {
    if (!e || typeof e.id !== 'string' || !e.id || e.id.length > 100 || ids.has(e.id)) throw new Error('Every element needs a unique ID.');
    ids.add(e.id);
    if (!KINDS.includes(e.kind) || typeof e.label !== 'string' || e.label.length > 120) throw new Error('Invalid element type or label.');
    if (!number(e.x, 0, value.width) || !number(e.y, 0, value.height) || !number(e.width, .1, value.width) || !number(e.height, .1, value.height) || e.x + e.width > value.width + .001 || e.y + e.height > value.height + .001) throw new Error(`“${e.label}” extends outside the drawing boundary.`);
    return { id: e.id, kind: e.kind, label: e.label, x: e.x, y: e.y, width: e.width, height: e.height };
  });
  return { schema: SCHEMA, id: value.id, name: value.name.trim(), mode: value.mode, unit: value.unit, width: value.width, height: value.height, elements };
}
export function newProject(mode = 'site') {
  return { schema: SCHEMA, id: crypto.randomUUID(), name: mode === 'site' ? 'Untitled site' : 'Untitled floor plan', mode, unit: 'm', width: mode === 'site' ? 80 : 20, height: mode === 'site' ? 60 : 15, elements: [] };
}
export function exampleProject() {
  const project = newProject();
  const element = (id, kind, label, x, y, width, height) => ({ id, kind, label, x, y, width, height });
  project.name = 'Courtyard neighbourhood';
  project.elements = [
    element('green-north', 'landscape', 'North garden', 3, 3, 74, 5),
    element('access', 'road', '6 m access road', 3, 28, 74, 6),
    element('central', 'landscape', 'Shared courtyard', 33, 9, 14, 18),
    element('pond', 'water', 'Rain garden', 35, 12, 10, 8),
    ...[5, 19, 49, 63].map((x, i) => element(`plot-${i+1}`, 'plot', `Plot 0${i+1}`, x, 10, 12, 16)),
    ...[5, 19, 33, 49, 63].map((x, i) => element(`plot-${i+5}`, 'plot', `Plot 0${i+5}`, x, 36, 12, 17)),
    element('community', 'landscape', 'Community green', 3, 55, 56, 3),
    element('parking', 'parking', 'Visitor parking', 61, 55, 16, 3),
  ];
  return project;
}
export function metrics(project) {
  const areas = Object.fromEntries(KINDS.map(k => [k, 0]));
  for (const e of project.elements) areas[e.kind] = (areas[e.kind]||0) + e.width * e.height;
  return { area: project.width * project.height, areas, plots: project.elements.filter(e => e.kind === 'plot').length };
}
export function layoutWarnings(project) {
  const building=project.schema===BUILDING_SCHEMA,review=reviewLayout(project,{limit:building?15:10});
  const warnings=review.issues.map(issue=>(building?issue.floorName+': ':'')+issue.message);
  if(review.total>review.issues.length)warnings.push(`${review.total-review.issues.length} additional geometry issues are not listed here. Inspect Design checks in the app.`);
  return warnings;
}
export const escapeXml = text => String(text).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
export function projectSvg(project) {
  validateProject(project);
  const font = Math.max(project.width / 65, .15);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 -7 ${project.width+10} ${project.height+15}"><rect x="-5" y="-7" width="${project.width+10}" height="${project.height+15}" fill="#faf9f5"/><text x="0" y="-3" font-family="sans-serif" font-size="${font*1.5}" fill="#353c36">${escapeXml(project.name)}</text><rect width="${project.width}" height="${project.height}" fill="white" stroke="#6b756a" stroke-width=".15"/>${project.elements.map(e => `<g><rect x="${e.x}" y="${e.y}" width="${e.width}" height="${e.height}" fill="${PAINT[e.kind].fill}" stroke="${PAINT[e.kind].stroke}" stroke-width=".15"/><text x="${e.x+e.width/2}" y="${e.y+e.height/2}" text-anchor="middle" font-family="sans-serif" font-size="${Math.min(font,e.width/8)}" fill="#414a40">${escapeXml(e.label)}</text></g>`).join('')}<text x="0" y="${project.height+4}" font-family="sans-serif" font-size="${font*.75}" fill="#676d65">ARCLOOM · CONCEPT DESIGN · ${project.width} × ${project.height} ${project.unit} · Not for construction</text></svg>`;
}
