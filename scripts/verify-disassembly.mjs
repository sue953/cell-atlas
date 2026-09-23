import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/vendor/three.module.js';

const elements=new Map();
globalThis.document={getElementById(id){
 if(!elements.has(id))elements.set(id,{value:'0',checked:true,disabled:false,parentElement:{},setAttribute(name,value){this[name]=value;}});
 return elements.get(id);
}};
const source=fs.readFileSync(new URL('../dist/disassembly.js',import.meta.url),'utf8')
 .replace("from 'three'",`from '${new URL('../dist/vendor/three.module.js',import.meta.url).href}'`)
 .replace("import {getParts} from './imported-cells.js?v=14';",'function getParts(world){const parts=[];world.traverse(o=>{if(o.userData.key)parts.push(o);});return parts;}');
const {setupDisassembly}=await import('data:text/javascript,'+encodeURIComponent(source));
let world=new THREE.Group();
function fixture(){
 const group=new THREE.Group();
 for(const organelle of ['nucleus','mitochondrion','ribosome','wall','membrane']){
  const part=new THREE.Group();part.userData={key:organelle,organelle,origin:[.01,.02,.03]};part.position.fromArray(part.userData.origin);group.add(part);
 }
 const context=new THREE.Group();context.userData.context=true;group.add(context);return group;
}
world=fixture();
const controller=setupDisassembly(()=>world,()=>{}),button=document.getElementById('explode-all'),context=document.getElementById('show-context'),slider=document.getElementById('explode-amount');
const tick=(n=1)=>{for(let i=0;i<n;i++)controller.tick(true);};
const assertExploded=()=>{assert.equal(context.disabled,true);assert.equal(context.checked,false);for(const part of world.children){assert.equal(part.visible,!part.userData.context&&!['wall','membrane'].includes(part.userData.organelle));}assert.match(document.getElementById('extraction-count').textContent,/3 个可选部件/);};
tick();button.onclick();tick();assertExploded();tick(100);assertExploded();
button.onclick();tick();assertExploded();tick(100);
for(const part of world.children){assert.equal(part.visible,true);if(part.userData.key)assert.deepEqual(part.position.toArray(),part.userData.origin);}
assert.equal(context.disabled,false);assert.equal(context.checked,true);
// A hidden-background preference survives expand/reassemble.
context.checked=false;context.onchange();slider.value='35';slider.oninput();tick(100);assertExploded();slider.value='0';slider.oninput();tick(100);assert.equal(context.checked,false);assert.equal(world.children.at(-1).visible,false);
// Switching cells and resetting never retains a hidden boundary or offset.
button.onclick();tick(100);world=fixture();tick();assert.equal(controller.exploded,false);assert.equal(context.checked,true);assert(world.children.every(p=>p.visible));
button.onclick();tick(100);controller.reset();tick(100);assert(world.children.every(p=>p.visible));
// The whole-cell marker action must restore immediately, not wait for animation.
button.onclick();tick(100);controller.reset(true);tick();
assert.equal(slider.value,'0');assert.equal(context.checked,true);
for(const part of world.children){assert.equal(part.visible,true);if(part.userData.key)assert.deepEqual(part.position.toArray(),part.userData.origin);}
console.log('PASS: only selectable organelles visible while expanded; backgrounds and envelopes restored; partial slider, reset and cell switch checked.');
