import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {DRACOLoader} from './vendor/DRACOLoader.js';
const decoder=new DRACOLoader().setDecoderPath('./vendor/draco/').setDecoderConfig({type:'wasm'}).setWorkerLimit(2);
const loader=new GLTFLoader().setDRACOLoader(decoder),cache=new Map();
export function loadStandalone(url){return loader.loadAsync(url);}
async function response(url){const r=await fetch(url);if(!r.ok)throw Error('细胞拆分数据加载失败');return r;}
async function partition(model,type){
 const [meta,buffer]=await Promise.all([response(`./assets/models/${type}-parts.json?v=14`).then(r=>r.json()),response(`./assets/models/${type}-parts.bin?v=14`).then(r=>r.arrayBuffer())]);
 let source;model.traverse(o=>{if(o.isMesh&&!source)source=o;});
 const geometry=source.geometry,index=geometry.index.array,labels=new Uint8Array(buffer);
 if(index.length!==meta.faces*3||geometry.attributes.position.count!==meta.vertices||labels.length!==meta.faces)throw Error('原模型与拆分记录不一致');
 const arrays=[new Uint32Array(meta.contextFaces*3),...meta.parts.map(p=>new Uint32Array(p.faces*3))],cursors=new Uint32Array(arrays.length);
 for(let f=0;f<labels.length;f++){const code=labels[f],a=arrays[code];if(!a)throw Error('无效分区');const i=cursors[code];a[i]=index[f*3];a[i+1]=index[f*3+1];a[i+2]=index[f*3+2];cursors[code]+=3;}
 arrays.forEach((a,i)=>{if(a.length!==cursors[i])throw Error('分区面数不一致');});
 function subset(values,bounds){const g=new THREE.BufferGeometry();for(const [name,a]of Object.entries(geometry.attributes))g.setAttribute(name,a);g.setIndex(new THREE.BufferAttribute(values,1));if(bounds){g.boundingBox=new THREE.Box3(new THREE.Vector3(...bounds[0]),new THREE.Vector3(...bounds[1]));g.boundingSphere=g.boundingBox.getBoundingSphere(new THREE.Sphere());}return g;}
 source.geometry=subset(arrays[0]);source.name=`${type}-unclassified-context`;source.userData.context=true;
 for(const data of meta.parts){
  const part=new THREE.Mesh(subset(arrays[data.code],data.bounds),source.material.clone());part.name=data.key;part.position.copy(source.position);part.quaternion.copy(source.quaternion);part.scale.copy(source.scale);
  part.userData={...data,cellType:type,extracted:true,origin:part.position.toArray()};source.parent.add(part);
 }
 // Unresolved original dots are not relabelled as ribosomes. Add explicit teaching
 // particles outside the vacuole, on ER surfaces and in the surrounding cytoplasm.
 const ribosomes=new THREE.Group();ribosomes.name=`${type}-ribosome-supplement`;
 const points=type==='animal'?[[.24,.04],[.23,.10],[.24,-.02],[.19,-.12],[.10,-.17],[-.04,-.17],[-.15,-.12],[-.25,.06],[-.22,.14],[-.19,.19],[.30,.13],[.18,.32],[-.14,-.28]]:[[.23,.25],[.24,.18],[.23,.09],[.16,.008],[.06,-.018],[-.045,.018],[-.13,.24],[-.1,.34],[.25,-.33],[-.25,-.36]];
 const geo=new THREE.SphereGeometry(1,10,8),mat=new THREE.MeshStandardMaterial({color:0x41619a,roughness:.65});
 for(const [z,y]of points){const x=type==='animal'?.08-.88*y:.105;for(let j=0;j<2;j++){const m=new THREE.Mesh(geo,mat);m.scale.set(j?.003:.0045,j?.004:.006,j?.004:.006);m.position.set(x+j*.003,y+j*.005,z);ribosomes.add(m);}}
 ribosomes.userData={organelle:'ribosome',name:'核糖体',cellType:type,method:'supplement',key:ribosomes.name,origin:[0,0,0],note:'原素材中的微小颗粒不能可靠分割为核糖体；这组大小亚基与分布为教学补建，已适当放大。'};source.parent.add(ribosomes);model.userData.partition=meta;
}
export function loadCell(type){
 if(!cache.has(type))cache.set(type,loader.loadAsync(`./assets/models/${type}-cell.glb`).then(async gltf=>{
  const model=gltf.scene,bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=5.4/Math.max(size.x,size.y,size.z);
  await partition(model,type);model.position.copy(center).multiplyScalar(-scale);model.scale.setScalar(scale);
  const root=new THREE.Group();root.add(model);root.rotation.y=-Math.PI/2;root.userData={imported:true,cellType:type};return root;
 }).catch(e=>{cache.delete(type);throw e;}));
 return cache.get(type).then(root=>root.clone(true));
}
export function getParts(world,id){const parts=[];world.traverse(o=>{if(o.userData.key&&(!id||o.userData.organelle===id))parts.push(o);});return parts;}
export function isolatedPart(part){
 // Export contains this part's vertices only. The assembled scene shares buffers.
 const src=part.geometry,old=src.index.array,map=new Map(),ids=[],index=new Uint32Array(old.length);
 for(let i=0;i<old.length;i++){let n=map.get(old[i]);if(n===undefined){n=ids.length;map.set(old[i],n);ids.push(old[i]);}index[i]=n;}
 const g=new THREE.BufferGeometry();for(const [name,a]of Object.entries(src.attributes)){const array=new Float32Array(ids.length*a.itemSize);for(let j=0;j<ids.length;j++)for(let k=0;k<a.itemSize;k++)array[j*a.itemSize+k]=a.array[ids[j]*a.itemSize+k];g.setAttribute(name,new THREE.BufferAttribute(array,a.itemSize));}g.setIndex(new THREE.BufferAttribute(index,1));g.computeBoundingBox();g.computeBoundingSphere();
 const m=new THREE.Mesh(g,part.material.clone());m.material.emissive?.setHex(0);m.name=part.name;m.userData={...part.userData,source:'GordenSun / LearningCell',use:'课堂教学与科普展示'};
 const bounds=g.boundingBox,size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=3.3/Math.max(size.x,size.y,size.z);
 m.position.copy(center).multiplyScalar(-scale);m.scale.setScalar(scale);const root=new THREE.Group();root.add(m);root.rotation.y=-Math.PI/2;return root;
}
