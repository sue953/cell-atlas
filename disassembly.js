import * as THREE from 'three';
import {getParts} from './imported-cells.js?v=14';
export function setupDisassembly(getWorld,onZoom){
 const panel=document.getElementById('extraction-panel'),button=document.getElementById('explode-all'),context=document.getElementById('show-context'),amount=document.getElementById('explode-amount');
 let target=0,current=0,lastWorld=null,enabled=true;
 const isBoundary=part=>['wall','membrane'].includes(part.userData.organelle);
 function set(value){target=value;amount.value=String(Math.round(value*100));button.textContent=value?'复原细胞':'只拆开细胞器';button.setAttribute('aria-pressed',String(value>0));onZoom(value>0);}
 button.onclick=()=>set(target?0:1);amount.oninput=()=>set(Number(amount.value)/100);context.onchange=()=>{enabled=context.checked;};
 function reset(immediate=false){set(0);if(immediate)current=0;enabled=true;context.checked=true;}
 const vector=new THREE.Vector3();
 return {reset,get exploded(){return target>0;},tick(imported){
  const world=getWorld();panel.hidden=!imported;
  if(world!==lastWorld){lastWorld=world;target=current=0;amount.value='0';button.textContent='只拆开细胞器';button.setAttribute('aria-pressed','false');enabled=true;context.checked=true;}
  if(!imported)return;
  current+=(target-current)*.13;if(Math.abs(target-current)<.001)current=target;
  const parts=getParts(world),expanded=target>0||current>0,movable=parts.filter(p=>!isBoundary(p));button.disabled=parts.length===0;amount.disabled=parts.length===0;
  // Keep the assembled-view preference, but never leave unselectable context
  // or the large cell envelopes in the exploded view, including transitions.
  context.disabled=expanded;context.checked=expanded?false:enabled;
  context.parentElement.title=expanded?'拆开时自动隐藏背景；复原后恢复原设置。':'';
  document.getElementById('extraction-count').textContent=parts.length?`${expanded?movable.length:parts.length} 个可选部件`:'正在读取结构…';
  for(const part of parts){
   if(isBoundary(part)){part.visible=!expanded;part.position.fromArray(part.userData.origin);continue;}
   part.visible=true;
   const d=part.userData,b=d.bounds;let y=b?(b[0][1]+b[1][1])/2:.34,z=b?(b[0][2]+b[1][2])/2:.05;
   if(d.organelle==='nucleus'){y=.37;z=.03;}if(d.organelle==='er'){y=-.05;z=.48;}
   vector.set(.17,y,z);vector.normalize().multiplyScalar(.29*current);
   if(d.organelle==='vacuole')vector.set(.06,-.30,0).multiplyScalar(current);
   part.position.fromArray(d.origin).add(vector);
  }
  world.traverse(o=>{if(o.userData.context||o.userData.transparentCover)o.visible=!expanded&&enabled;});
 }};
}
