import * as THREE from 'three';
import {OrbitControls} from 'three/addons/OrbitControls.js';
import {organelles} from './data.js?v=17';
import {cell,organelle,dispose} from './models.js?v=14';
import {resetReference} from './comparison.js?v=17';
import {createLabels} from './labels.js?v=14';
import {loadCell} from './imported-cells.js?v=14';
import {setupDisassembly} from './disassembly.js?v=20';
import {createSpecificMarks} from './specific-organelles.js?v=20';
import {setupCellRotation} from './cell-rotation.js?v=21';
import {providedModels,loadProvided,releaseProvided} from './provided-models.js?v=15';
import {GLTFExporter} from './vendor/GLTFExporter.js';
let useImported=true,loadEpoch=0;
const $=id=>document.getElementById(id);let mode='both',isCut=true,selected=null,detailCut=true,detailModel=null,detailView=null,world=new THREE.Group(),hovered=null,lastTrigger=null;
const dialog=$('detail-dialog');
let detailLabels,detailMode='teaching',detailEpoch=0;
function makeView(host){const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;host.append(renderer.domElement);const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(34,1,.1,100);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;controls.minDistance=4;controls.maxDistance=38;scene.add(new THREE.HemisphereLight(0xffffff,0x8a96ad,2.0));const key=new THREE.DirectionalLight(0xfff6ea,2.6);key.position.set(-5,8,10);scene.add(key);const fill=new THREE.DirectionalLight(0xd5e9ff,1.4);fill.position.set(5,2,-4);scene.add(fill);const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(host);resize();return{renderer,scene,camera,controls,host,resize};}
let main,specificMarks;
const disassembly=setupDisassembly(()=>world,expanded=>{if(expanded)specificMarks?.set(null);resetMain(expanded);});
try{main=makeView($('canvas-host'));$('loading').remove();}catch(e){$('loading').textContent='当前浏览器无法启用三维显示，请使用支持 WebGL 的浏览器并开启硬件加速。';throw e;}
main.scene.add(world);
const cellRotation=setupCellRotation(main,()=>world,()=>mode,clearHover);
specificMarks=createSpecificMarks($('canvas-host'),()=>world);
function setSpecific(type){
 const next=specificMarks.active===type?null:type;
 if(next){
  clearHover();disassembly.reset(true);
  if(mode!=='both'&&mode!==next)setCell(next);
 }
 specificMarks.set(next);
}
document.querySelectorAll('[data-specific]').forEach(button=>button.addEventListener('click',()=>setSpecific(button.dataset.specific)));
function resetMain(expanded=false){const aspect=main.host.clientWidth/main.host.clientHeight;const distance=mode==='both'?Math.max(12,12/aspect/Math.tan(17*Math.PI/180)*.54):Math.max(10.8,5.8/aspect/Math.tan(17*Math.PI/180)*.55);const damping=main.controls.enableDamping;main.controls.enableDamping=false;main.controls.update();main.camera.position.set(0,1.9,distance*(expanded?1.32:1));main.controls.target.set(0,-.35,0);main.controls.update();main.controls.enableDamping=damping;}
const labelPoint=new THREE.Vector3();
function alignCellNames(){const labels=$('cell-labels').children;world.children.forEach((root,i)=>{if(!labels[i])return;root.getWorldPosition(labelPoint).project(main.camera);labels[i].style.left=`${Math.max(12,Math.min(88,(labelPoint.x+1)*50))}%`;});}
function rebuild(){cellRotation.sync();const epoch=++loadEpoch;clearHover();specificMarks.detach();main.scene.remove(world);if(!world.userData.imported)dispose(world);world=new THREE.Group();world.userData.imported=useImported;main.scene.add(world);resetMain();$('scene-title').textContent=mode==='both'?'细胞结构总览':mode==='animal'?'动物细胞 · 结构总览':'植物细胞 · 结构总览';$('cell-labels').innerHTML=(mode==='both'?['animal','plant']:[mode]).map(t=>`<span>${t==='animal'?'动物细胞':'植物细胞'}</span>`).join('');renderList();$('cutaway').hidden=useImported;$('model-source').textContent=useImported?'教学示意':'细胞总览';document.querySelector('.stage-top .badge').textContent=useImported?'3D结构':'教学示意';$('asset-loading')?.remove();if(useImported){const loading=document.createElement('div');loading.id='asset-loading';loading.setAttribute('role','status');loading.textContent='正在加载细胞模型…';$('canvas-host').append(loading);const types=mode==='both'?['animal','plant']:[mode];Promise.all(types.map(loadCell)).then(cells=>{if(epoch!==loadEpoch)return;cells.forEach(c=>{c.position.x=mode==='both'?(c.userData.cellType==='animal'?-3.25:3.25):0;world.add(c);});loading.remove();$('canvas-host').dataset.modelState='ready';}).catch(()=>{if(epoch!==loadEpoch)return;loading.textContent='模型加载失败，请点击“重试加载”。';const retry=document.createElement('button');retry.textContent='重试加载';retry.onclick=rebuild;loading.append(retry);$('canvas-host').dataset.modelState='error';});$('canvas-host').dataset.modelState='loading';}else{for(const type of ['animal','plant']){if(mode!=='both'&&type!==mode)continue;const c=cell(type,isCut);c.position.x=mode==='both'?(type==='animal'?-3.25:3.25):0;world.add(c);}$('canvas-host').dataset.modelState='schematic';}}
$('model-source').addEventListener('click',()=>{useImported=!useImported;rebuild();});
function renderList(){const entries=Object.entries(organelles).filter(([,v])=>mode==='both'||v.cells.includes(mode));$('structure-count').textContent=entries.length;$('organelle-list').innerHTML=entries.map(([id,v])=>`<button class="structure-button" data-organelle="${id}" style="--color:${v.color}" aria-label="查看${v.name}结构"><span class="swatch"></span><span>${v.name}</span><span class="type">${v.cells.length===2?'共有':v.cells[0]==='plant'?'本图植物':'本图动物'}</span><span class="chevron">›</span></button>`).join('');}
function setCell(next){if(!['both','animal','plant'].includes(next))throw new Error('未知的细胞类型');if(specificMarks.active&&next!=='both'&&next!==specificMarks.active)specificMarks.set(null);mode=next;document.querySelectorAll('[data-cell]').forEach(b=>{const active=b.dataset.cell===mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});rebuild();return{cell:mode};}
document.querySelectorAll('[data-cell]').forEach(b=>b.addEventListener('click',()=>setCell(b.dataset.cell)));
$('cutaway').addEventListener('click',()=>{isCut=!isCut;$('cutaway').classList.toggle('active',isCut);$('cutaway').setAttribute('aria-pressed',String(isCut));$('cutaway').textContent=isCut?'剖切视图':'完整外观';document.querySelector('.stage-top .badge').textContent=isCut?'3D 互动模型':'边界半透明示意';rebuild();});$('reset').addEventListener('click',()=>{specificMarks.set(null);cellRotation.reset();disassembly.reset();resetMain();});
$('organelle-list').addEventListener('click',e=>{const b=e.target.closest('[data-organelle]');if(b)openDetail(b.dataset.organelle,b);});
function fillDetail(id){const d=organelles[id];$('detail-title').textContent=d.name;$('detail-crumb').textContent=d.name;$('detail-en').textContent=d.en;$('detail-summary').textContent=d.summary;$('detail-function').textContent=d.function;$('detail-note').textContent=d.note;$('detail-tags').innerHTML=`<span class="tag">${d.membrane}</span><span class="tag">${d.cells.length===2?'动植物细胞共有':d.cells[0]==='plant'?'本图植物细胞结构':'本图动物细胞结构'}</span>`;$('part-list').innerHTML=d.parts.map((p,i)=>`<div class="part"><span class="part-index">${String(i+1).padStart(2,'0')}</span><div><strong>${p[0]}</strong><p>${p[1]}</p></div></div>`).join('');const img=$('reference-image');img.src=providedModels[id]?`./references/provided-${id}.png`:`./references/${encodeURIComponent(d.image)}.jpg`;img.alt=`${d.name}二维形态参考图`;document.querySelector('.reference').open=false;document.querySelector('.detail-info').scrollTop=0;}
function resetDetail(){if(!detailView)return;if(detailMode==='provided'){detailView.camera.position.set(0,.25,7.6);detailView.controls.target.set(0,0,0);detailView.controls.update();return;}detailView.camera.position.set(['membrane','wall','centrosome'].includes(selected)?2.5:.5,['membrane','wall','centrosome'].includes(selected)?2.6:['chloroplast','golgi','er'].includes(selected)?2:.45,selected==='wall'?8:7.2);detailView.controls.target.set(0,0,0);detailView.controls.update();}
async function buildDetail(){
 const epoch=++detailEpoch;
 if(detailModel){detailView.scene.remove(detailModel);releaseProvided(detailModel);dispose(detailModel);detailModel=null;}
 $('detail-loading').hidden=true;$('download-part').disabled=false;
 $('view-provided').hidden=!providedModels[selected];$('view-provided').setAttribute('aria-pressed',String(detailMode==='provided'));
 if(detailMode==='provided'){
  const id=selected;$('view-teaching').setAttribute('aria-pressed','false');$('detail-cut').hidden=true;
  detailLabels?.setVisible(false);$('detail-model-label').textContent=organelles[id].name;document.querySelector('.detail-stage').dataset.representation='provided';
  $('detail-canvas').dataset.modelState='loading';$('detail-loading').textContent='正在加载…';$('detail-loading').hidden=false;$('download-part').disabled=true;
  try{const model=await loadProvided(id);if(epoch!==detailEpoch||!dialog.open){releaseProvided(model);dispose(model);return;}detailModel=model;detailView.scene.add(model);$('detail-loading').hidden=true;$('detail-canvas').dataset.modelState='ready';$('download-part').disabled=false;resetDetail();}
  catch{if(epoch!==detailEpoch)return;$('detail-loading').textContent='加载失败，点击“3D结构”重试。';$('detail-canvas').dataset.modelState='error';}
  return;
 }
 detailModel=organelle(selected,detailCut,true);
 if(selected==='mitochondrion')detailModel.rotation.z=Math.PI*.43;
 detailModel.userData.representation='educational-reconstruction';
 detailView.scene.add(detailModel);$('detail-canvas').dataset.modelState='ready';
 $('detail-cut').hidden=['membrane','centrosome'].includes(selected);
 $('detail-cut').textContent=selected==='ribosome'?(detailCut?'亚基分开':'亚基结合'):(detailCut?'剖切结构':'完整外观');
 $('detail-cut').classList.toggle('active',detailCut);$('detail-cut').setAttribute('aria-pressed',String(detailCut));
 $('detail-model-label').textContent=organelles[selected].name;
 $('view-teaching').setAttribute('aria-pressed','true');
 document.querySelector('.detail-stage').dataset.representation='teaching';
 detailLabels?.setVisible(true);
}
function openDetail(id,trigger){
 if(!organelles[id])throw new Error('未知的细胞结构');
 selected=id;detailCut=true;lastTrigger=trigger||document.activeElement;fillDetail(id);resetReference(id);
 document.querySelectorAll('[data-organelle]').forEach(b=>{if(b.dataset.organelle===id)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
 detailMode=providedModels[id]?'provided':'teaching';
 if(!dialog.open)dialog.showModal();document.body.style.overflow='hidden';
 if(!detailView)detailView=makeView($('detail-canvas'));detailView.resize();buildDetail();resetDetail();$('close-detail').focus();
 return{structure:id,name:organelles[id].name,representation:detailMode};
}
$('view-provided').onclick=()=>{if(providedModels[selected]){detailMode='provided';buildDetail();resetDetail();}};
$('view-teaching').onclick=()=>{detailMode='teaching';buildDetail();resetDetail();};
$('download-part').onclick=async()=>{
 if(!detailModel)return;if(detailMode==='provided'){const a=document.createElement('a');a.href=`./assets/user-models/${selected}.glb`;a.download=`${providedModels[selected].name}.glb`;document.body.append(a);a.click();a.remove();notify('已请求下载。');return;}const button=$('download-part');button.disabled=true;button.textContent='正在准备…';
 try{const exported=detailModel.clone(true);const result=await new GLTFExporter().parseAsync(exported,{binary:true,onlyVisible:true});
 if(new DataView(result).getUint32(0,true)!==0x46546c67)throw Error('导出文件无效');
 const url=URL.createObjectURL(new Blob([result],{type:'model/gltf-binary'})),a=document.createElement('a');
 a.href=url;a.download=`${selected}-teaching.glb`;document.body.append(a);a.click();a.remove();notify(`模型已生成（${(result.byteLength/1048576).toFixed(1)} MB），已请求浏览器保存。`);setTimeout(()=>URL.revokeObjectURL(url),15000);
 }catch{notify('导出失败，请重试。');}finally{button.disabled=false;button.textContent='下载模型';}
};
$('close-detail').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>{document.body.style.overflow='';detailEpoch++;$('detail-loading').hidden=true;if(detailModel?.userData.provided){detailView.scene.remove(detailModel);releaseProvided(detailModel);dispose(detailModel);detailModel=null;}selected=null;lastTrigger?.focus?.();});$('detail-cut').addEventListener('click',()=>{detailCut=!detailCut;buildDetail();});$('detail-reset').addEventListener('click',resetDetail);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
function pick(e){const r=main.renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,main.camera);const hits=raycaster.intersectObjects(world.children,true).filter(h=>{let o=h.object;while(o){if(!o.visible||o.userData.transparentCover)return false;o=o.parent;}return true;});if(!hits.length)return null;let obj=hits[0].object;while(obj&&!obj.userData.organelle)obj=obj.parent;return obj?.userData.organelle?obj:null;}
function clearHover(){if(hovered)hovered.traverse(o=>{if(o.material?.emissive)o.material.emissive.setHex(0);});hovered=null;$('hover-label').hidden=true;main.renderer.domElement.style.cursor='grab';}
main.renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons){clearHover();return;}const obj=pick(e);if(obj!==hovered){clearHover();hovered=obj;if(hovered)hovered.traverse(o=>{if(o.material?.emissive)o.material.emissive.setHex(0x152332);});}if(obj){const rect=$('canvas-host').parentElement.getBoundingClientRect();$('hover-label').hidden=false;$('hover-label').textContent=organelles[obj.userData.organelle].name;$('hover-label').style.left=Math.min(e.clientX-rect.left+14,rect.width-115)+'px';$('hover-label').style.top=Math.min(e.clientY-rect.top+14,rect.height-50)+'px';main.renderer.domElement.style.cursor='pointer';}});
main.renderer.domElement.addEventListener('pointerleave',clearHover);let down=null;main.renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});main.renderer.domElement.addEventListener('pointerup',e=>{if(!down||(mode==='both'&&cellRotation.dragged)||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6){down=null;return;}down=null;const obj=pick(e);if(obj)openDetail(obj.userData.organelle,$('canvas-host'));});
main.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();notify('三维显示暂时中断，请刷新页面恢复。');});
function notify(text){$('status').textContent=text;$('status').classList.add('visible');setTimeout(()=>$('status').classList.remove('visible'),3200);}
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('当前窗口不支持全屏，可使用浏览器的全屏功能。');}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').querySelector('span').textContent=document.fullscreenElement?'退出全屏':'课堂全屏';});
rebuild();main.renderer.setAnimationLoop(()=>{if(document.hidden)return;disassembly.tick(useImported);if(dialog.open&&detailView){if(!detailLabels)detailLabels=createLabels($('detail-canvas'),document.querySelector('.detail-controls'));if(detailLabels.model!==detailModel){detailLabels.set(selected,detailCut);detailLabels.model=detailModel;}detailView.controls.update();detailView.renderer.render(detailView.scene,detailView.camera);detailLabels.setVisible(detailMode==='teaching');if(detailMode==='teaching'&&detailModel)detailLabels.update(detailView.camera,detailModel);}else{main.controls.update();specificMarks.update(main.camera);main.renderer.render(main.scene,main.camera);alignCellNames();}});
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{main.resize();resetMain(disassembly.exploded);detailView?.resize();},150);});
if(document.modelContext?.registerTool){const lifecycle=new AbortController();const tools=[{name:'set_cell_view',title:'切换细胞视图',description:'切换到动物细胞、植物细胞或双细胞对照。',inputSchema:{type:'object',properties:{cell:{type:'string',enum:['animal','plant','both']}},required:['cell'],additionalProperties:false},execute:input=>{if(!input||!['animal','plant','both'].includes(input.cell))throw new Error('cell 必须为 animal、plant 或 both');if(dialog.open)dialog.close();return setCell(input.cell);}},{name:'open_organelle',title:'观察细胞结构',description:'打开指定细胞结构的三维放大模型和教学说明。',inputSchema:{type:'object',properties:{id:{type:'string',enum:Object.keys(organelles)}},required:['id'],additionalProperties:false},execute:input=>{if(!input||!Object.hasOwn(organelles,input.id))throw new Error('未知结构');return openDetail(input.id);}}];for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool({...tool,annotations:{readOnlyHint:false,untrustedContentHint:false}},{signal:lifecycle.signal})).catch(()=>{});}catch{}}window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}
