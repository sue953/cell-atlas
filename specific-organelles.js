import * as THREE from 'three';

// A comparison of the two illustrated cell types, not a universal taxonomy.
// Wall is not an organelle; lysosomes are not used as an animal-only marker.
export const specificOrganelles={plant:['chloroplast','vacuole'],animal:['centrosome']};
const names={chloroplast:'叶绿体',vacuole:'中央液泡',centrosome:'中心体'};
export function findSpecificParts(world,type){
 const result=[];
 for(const cell of world.children){
  if((cell.userData.cellType||cell.userData.cell)!==type)continue;
  cell.traverse(part=>{if(!part.userData.specificOverlay&&specificOrganelles[type]?.includes(part.userData.organelle))result.push(part);});
 }
 return result;
}

export function createSpecificMarks(host,getWorld){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.classList.add('specific-labels');svg.setAttribute('aria-label','特有细胞器标注');svg.setAttribute('hidden','');host.append(svg);
 const highlight=new THREE.MeshBasicMaterial({color:0x0071e3,transparent:true,opacity:.27,depthWrite:false,depthTest:true,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 const box=new THREE.Box3(),point=new THREE.Vector3();
 let active=null,lastWorld=null,lastCount=-1,overlays=[],entries=[];
 function detach(){
  for(const overlay of overlays)overlay.removeFromParent();
  overlays=[];entries=[];svg.replaceChildren();lastWorld=null;lastCount=-1;
 }
 function syncUI(){
  document.querySelectorAll('[data-specific]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.specific===active)));
  document.querySelectorAll('[data-organelle]').forEach(b=>b.classList.toggle('is-specific',specificOrganelles[active]?.includes(b.dataset.organelle)||false));
  host.dataset.specific=active||'none';svg.toggleAttribute('hidden',!active);
 }
 function set(type){
  if(type!==null&&!Object.hasOwn(specificOrganelles,type))throw Error('未知的细胞比较类型');
  detach();active=type;syncUI();
 }
 function rebuild(world){
  detach();lastWorld=world;lastCount=world.children.length;
  const parts=findSpecificParts(world,active);
  for(const id of specificOrganelles[active]){
   const matching=parts.filter(p=>p.userData.organelle===id);if(!matching.length)continue;
   const group=document.createElementNS(ns,'g'),connectors=[];
   for(const part of matching){
    const meshes=[];part.traverse(o=>{if(o.isMesh&&!o.userData.specificOverlay)meshes.push(o);});
    for(const mesh of meshes){
     const overlay=mesh.isInstancedMesh?new THREE.InstancedMesh(mesh.geometry,highlight,mesh.count):new THREE.Mesh(mesh.geometry,highlight);
     if(mesh.isInstancedMesh)overlay.instanceMatrix=mesh.instanceMatrix;
     overlay.userData.specificOverlay=true;
     // Share the source buffers without changing source materials or geometry.
     overlay.raycast=()=>{};overlay.renderOrder=2;mesh.add(overlay);overlays.push(overlay);
    }
    const line=document.createElementNS(ns,'line'),dot=document.createElementNS(ns,'circle');
    dot.setAttribute('r','4');group.append(line,dot);connectors.push({part,line,dot});
   }
   const rect=document.createElementNS(ns,'rect'),text=document.createElementNS(ns,'text');
   rect.setAttribute('rx','8');rect.setAttribute('height','32');text.textContent=names[id];
   group.append(rect,text);svg.append(group);entries.push({id,group,rect,text,connectors});
  }
  syncUI();
 }
 function update(camera){
  if(!active)return;
  const world=getWorld();if(world!==lastWorld||world.children.length!==lastCount)rebuild(world);
  const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);world.updateMatrixWorld(true);
  for(const entry of entries){
   const tw=names[entry.id].length*14+24,lx=active==='plant'?w-tw-12:12;
   const ly=entry.id==='vacuole'?h-24:entry.id==='centrosome'?h*.78:24;
   entry.rect.setAttribute('x',lx);entry.rect.setAttribute('y',ly-16);entry.rect.setAttribute('width',tw);
   entry.text.setAttribute('x',lx+12);entry.text.setAttribute('y',ly+5);
   for(const {part,line,dot}of entry.connectors){
    box.setFromObject(part);box.getCenter(point);point.project(camera);
    const onScreen=Number.isFinite(point.x+point.y+point.z)&&point.z>=-1&&point.z<=1&&Math.abs(point.x)<1.1&&Math.abs(point.y)<1.1;
    line.style.display=dot.style.display=onScreen?'':'none';if(!onScreen)continue;
    const x=(point.x+1)*w/2,y=(1-point.y)*h/2;
    line.setAttribute('x1',active==='plant'?lx:lx+tw);line.setAttribute('y1',ly);line.setAttribute('x2',x);line.setAttribute('y2',y);
    dot.setAttribute('cx',x);dot.setAttribute('cy',y);
   }
  }
 }
 return{set,detach,update,get active(){return active;}};
}
