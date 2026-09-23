import * as THREE from 'three';

// Keep the comparison camera fixed while each cell rotates about its own origin.
export function setupCellRotation(view,getWorld,getMode,onDrag=()=>{}){
 const canvas=view.renderer.domElement,initial=new WeakMap(),pointers=new Set();
 const projected=new THREE.Vector3(),axis=new THREE.Vector3(),turn=new THREE.Quaternion();
 let gesture=null,dragged=false;
 function rootAt(x,y){
  const rect=canvas.getBoundingClientRect();
  let closest=null,distance=Infinity;
  getWorld().updateMatrixWorld(true);view.camera.updateMatrixWorld(true);
  for(const root of getWorld().children){
   if(!root.visible)continue;
   root.getWorldPosition(projected).project(view.camera);
   const dx=rect.left+(projected.x+1)*rect.width/2-x;
   const dy=rect.top+(1-projected.y)*rect.height/2-y;
   const d=dx*dx+dy*dy;
   if(d<distance){distance=d;closest=root;}
  }
  return closest;
 }
 function release(){
  for(const id of pointers)if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
  pointers.clear();gesture=null;canvas.style.cursor='grab';
 }
 function sync(){release();dragged=false;view.controls.enableRotate=getMode()!=='both';}
 function reset(){
  release();
  for(const root of getWorld().children)if(initial.has(root))root.quaternion.copy(initial.get(root));
 }
 canvas.addEventListener('pointerdown',e=>{
  if(getMode()!=='both'||(e.pointerType!=='touch'&&e.button!==0))return;
  if(!pointers.size)dragged=false;
  pointers.add(e.pointerId);
  // Two fingers remain available to OrbitControls for pinch zoom; never rotate
  // either cell during the pinch or interpret its final release as a click.
  if(pointers.size>1){gesture=null;dragged=true;return;}
  const root=rootAt(e.clientX,e.clientY);if(!root)return;
  if(!initial.has(root))initial.set(root,root.quaternion.clone());
  gesture={root,id:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY};
  canvas.setPointerCapture(e.pointerId);
 });
 canvas.addEventListener('pointermove',e=>{
  if(!gesture||gesture.id!==e.pointerId||getMode()!=='both')return;
  if(gesture.root.parent!==getWorld()){release();return;}
  if(!dragged&&Math.hypot(e.clientX-gesture.startX,e.clientY-gesture.startY)<=6)return;
  dragged=true;onDrag();canvas.style.cursor='grabbing';
  const scale=2*Math.PI/Math.max(canvas.clientHeight,240);
  const dx=(e.clientX-gesture.x)*scale,dy=(e.clientY-gesture.y)*scale;
  // Camera-aligned axes make horizontal/vertical dragging consistent at any angle.
  axis.set(0,1,0).applyQuaternion(view.camera.quaternion);
  turn.setFromAxisAngle(axis,dx);gesture.root.quaternion.premultiply(turn);
  axis.set(1,0,0).applyQuaternion(view.camera.quaternion);
  turn.setFromAxisAngle(axis,dy);gesture.root.quaternion.premultiply(turn).normalize();
  gesture.x=e.clientX;gesture.y=e.clientY;
 });
 function end(e){
  pointers.delete(e.pointerId);
  if(gesture?.id===e.pointerId)gesture=null;
  if(!pointers.size)canvas.style.cursor='grab';
 }
 canvas.addEventListener('pointerup',end);
 canvas.addEventListener('pointercancel',e=>{dragged=true;end(e);});
 canvas.addEventListener('lostpointercapture',e=>{if(gesture?.id===e.pointerId){dragged=true;end(e);}});
 sync();
 return{sync,reset,get dragged(){return dragged;}};
}
