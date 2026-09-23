import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/vendor/three.module.js';
const source=fs.readFileSync(new URL('../dist/cell-rotation.js',import.meta.url),'utf8').replace("from 'three'",`from '${new URL('../dist/vendor/three.module.js',import.meta.url).href}'`);
const {setupCellRotation}=await import('data:text/javascript,'+encodeURIComponent(source));
const listeners=new Map(),captured=new Set();
const canvas={clientHeight:600,style:{},getBoundingClientRect:()=>({left:0,top:0,width:1000,height:600}),
 addEventListener(name,fn){if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn);},
 setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id)};
const emit=(name,x,y=300,id=1,type='mouse')=>{for(const fn of listeners.get(name)||[])fn({clientX:x,clientY:y,pointerId:id,pointerType:type,button:0});};
let world=new THREE.Group(),mode='both';
const animal=new THREE.Group(),plant=new THREE.Group();animal.position.x=-3.25;plant.position.x=3.25;
animal.rotation.y=plant.rotation.y=-Math.PI/2;world.add(animal,plant);
const camera=new THREE.PerspectiveCamera(34,1000/600,.1,100);camera.position.z=15;camera.updateMatrixWorld();
const original=camera.quaternion.clone(),a0=animal.quaternion.clone(),p0=plant.quaternion.clone();
const controls={enableRotate:true};const rot=setupCellRotation({renderer:{domElement:canvas},camera,controls},()=>world,()=>mode);
assert.equal(controls.enableRotate,false);
emit('pointerdown',300);emit('pointermove',380,330);emit('pointerup',380,330);
assert(!animal.quaternion.equals(a0));assert(plant.quaternion.equals(p0));assert(camera.quaternion.equals(original));assert(rot.dragged);
const a1=animal.quaternion.clone();
// Selection stays locked to the starting cell even when crossing the midpoint.
emit('pointerdown',700);emit('pointermove',280,330);emit('pointerup',280,330);
assert(animal.quaternion.equals(a1));assert(!plant.quaternion.equals(p0));
assert.deepEqual(animal.position.toArray(),[-3.25,0,0]);assert.deepEqual(plant.position.toArray(),[3.25,0,0]);
rot.reset();assert(animal.quaternion.equals(a0));assert(plant.quaternion.equals(p0));
// Small clicks do not rotate; a drag returning to its starting point is not a click.
emit('pointerdown',300);emit('pointermove',303);emit('pointerup',303);assert(!rot.dragged);assert(animal.quaternion.equals(a0));
emit('pointerdown',300);emit('pointermove',370);emit('pointermove',300);emit('pointerup',300);assert(rot.dragged);
rot.reset();
// A pinch leaves both rotations alone, suppresses click, and can be followed by a new drag.
emit('pointerdown',300,300,1,'touch');emit('pointerdown',700,300,2,'touch');emit('pointermove',350,300,1,'touch');
emit('pointerup',350,300,1,'touch');emit('pointerup',700,300,2,'touch');
assert(animal.quaternion.equals(a0));assert(plant.quaternion.equals(p0));assert(rot.dragged);
emit('pointerdown',300);emit('pointercancel',300);emit('pointermove',380);assert(animal.quaternion.equals(a0));
mode='animal';rot.sync();assert.equal(controls.enableRotate,true);
emit('pointerdown',300);emit('pointermove',380);assert(animal.quaternion.equals(a0));
mode='both';rot.sync();emit('pointerdown',300);world=new THREE.Group();emit('pointermove',380);assert(animal.quaternion.equals(a0));
console.log('PASS: independent rotation, fixed centers/camera, cross-cell drag lock, reset, click threshold, pinch, cancellation and mode changes.');
