import * as THREE from 'three';
import {loadStandalone} from './imported-cells.js?v=14';
export const providedModels={
 nucleus:{name:'细胞核',note:'保留你提供的核仁外形和核旁内质网，不用另一个球体替换。核孔的通透性、核膜层次与染色质应结合教学补全讲解。'},
 mitochondrion:{name:'线粒体',note:'保留原有嵴形态。嵴应为内膜折叠，不能把贴图中呈现的线条都当作独立膜或管道。'},
 chloroplast:{name:'叶绿体',note:'保留原有基粒、片层与剖切形态。类囊体膜、类囊体腔和叶绿体基质是不同区域，放大造型并不证明所有膜腔真实连通。'},
 er:{name:'内质网',note:'保留粗面膜囊、光面小管与核膜参照。核糖体应在细胞质侧；原素材若有腔内颗粒，不应据此讲解为正确的核糖体位置。'},
 membrane:{name:'细胞膜',note:'保留磷脂与膜蛋白的原有形态。两排亲水头部属于一个磷脂双分子层，即一层生物膜；糖链朝细胞外侧。'},
 lysosome:{name:'溶酶体',note:'保留膜性囊体与内部示意物。单层膜包围内腔，颗粒仅示意水解酶或待降解物，并非分子级形态。'},
 wall:{name:'细胞壁',file:'植物细胞壁.glb',note:'保留你提供的植物细胞壁形态。壁位于细胞膜外，主要由纤维素、果胶等组成；细胞壁不是一层生物膜。图中的内侧薄层与壁需要区分。'}
};
let manifestPromise;
export async function loadProvided(id){
 if(!providedModels[id])throw Error('没有对应的用户模型');
 manifestPromise??=fetch('./assets/user-models/manifest.json?v=14').then(r=>{if(!r.ok)throw Error('来源记录加载失败');return r.json();}).catch(e=>{manifestPromise=null;throw e;});
 const [gltf,manifest]=await Promise.all([loadStandalone(`./assets/user-models/${id}.glb`),manifestPromise]);
 const model=gltf.scene;
 // These two supplied exports lie flat in their authored node coordinates.
 // Face their raised cutaway towards the camera; this is a rigid rotation only.
 if(id==='mitochondrion'||id==='er')model.rotation.x=Math.PI/2;
 model.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=3.3/Math.max(size.x,size.y,size.z);
 if(!Number.isFinite(scale)||scale<=0)throw Error('模型尺寸无效');
 model.scale.setScalar(scale);model.position.copy(center).multiplyScalar(-scale);
 const root=new THREE.Group();root.add(model);root.userData={provided:true,representation:'user-provided-3d',assetAudit:manifest[id],biologicalCaution:providedModels[id].note};return root;
}
export function releaseProvided(root){if(!root?.userData.provided)return;const textures=new Set();root.traverse(o=>{if(o.material)for(const material of(Array.isArray(o.material)?o.material:[o.material]))for(const v of Object.values(material))if(v?.isTexture)textures.add(v);});textures.forEach(t=>t.dispose());}
