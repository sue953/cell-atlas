import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=name=>fs.readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
const html=read('index.html'),app=read('app.js'),css=read('style.css');
const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
ids.add('asset-loading'); // Created while the overview loads.
for(const [,id]of app.matchAll(/\$\('([^']+)'\)/g))assert(ids.has(id),'Missing DOM element: '+id);
for(const removed of ['view-original','part-instance','part-provenance','detail-repair','source-note'])assert(!ids.has(removed),removed+' should be removed');
for(const s of [html,app,read('comparison.js')])assert(!/你提供的|原模型拆分|拖动旋转|滚轮缩放|LearningCell/.test(s));
assert(!/\.detail-stage.*::after\{content:/.test(css));
assert(html.includes('>3D结构</button>'));
assert(html.includes('>教学补全</button>'));
assert(!/sourcePart|refreshSourceOptions|view-original/.test(app));
for(const type of ['plant','animal'])assert(html.includes(`data-specific="${type}" aria-pressed="false"`));
assert(app.includes('disassembly.reset(true)'));
assert(app.includes('specificMarks.update(main.camera)'));
console.log('PASS: classroom copy simplified; two detail views; no dangling removed-element references.');
