import {Vector3} from 'three';
const anchors={
 nucleus:[['核膜',[1.12,.12,0]],['核仁',[-.27,-.12,.17]],['染色质',[.35,.49,-.27]]],
 mitochondrion:[['外膜',[0,.54,0]],['内膜形成的嵴',[.18,-.42,-.025]],['线粒体基质',[.4,.1,-.29]]],
 chloroplast:[['双层包膜',[-1.56,.13,0]],['基粒',[.03,-.32,.03]],['类囊体腔',[.96,-.2,-.03]]],
 er:[['附着的核糖体',[-.72,.78,-.1]],['粗面内质网',[-.2,-.65,-.15]],['光面内质网',[1.6,.1,-.3]]],
 golgi:[['扁平膜囊',[-.6,.69,0]],['膜囊腔',[.3,-.69,-.1]],['囊泡',[1.5,.8,-.04]]],
 ribosome:[['大亚基',[.3,.48,.5]],['小亚基',[.15,-.83,.48]]],
 centrosome:[['中心粒',[-.5,.6,.37]],['微管三联体',[-.13,.92,0]],['另一中心粒',[.93,-.65,.37]]],
 lysosome:[['溶酶体膜',[-.9,.3,0]],['水解酶',[-.22,.2,-.22]],['待降解物质',[.45,-.23,-.1]]],
 vesicle:[['囊泡膜',[-.9,.3,0]],['运输物质',[.3,0,-.24]]],
 vacuole:[['液泡膜',[-1.2,.5,0]],['细胞液所在空间',[.15,-.3,-.6]]],
 wall:[['细胞壁',[1.45,.6,0]],['内侧的细胞膜',[0,0,-1.13]]],
 membrane:[['磷脂亲水头部',[-1.12,.38,.44]],['膜蛋白',[.75,0,.4]],['糖链 · 细胞外侧',[-.65,.95,0]]]
};
export function createLabels(host,controls){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('model-labels');svg.setAttribute('aria-label','模型结构标注');host.append(svg);
 const toggle=document.createElement('button');toggle.textContent='标注';toggle.className='active';toggle.setAttribute('aria-label','切换结构标注');toggle.setAttribute('aria-pressed','true');controls.insertBefore(toggle,controls.lastElementChild);
 let enabled=true,current=[],id='',cut=true;
 toggle.addEventListener('click',()=>{enabled=!enabled;toggle.classList.toggle('active',enabled);toggle.setAttribute('aria-pressed',String(enabled));svg.style.display=enabled?'':'none';});
 function set(next,isCut){id=next;cut=isCut;svg.replaceChildren();current=[];
  anchors[id].filter((_,i)=>cut||['centrosome','membrane','ribosome'].includes(id)||i===0).forEach(([name,position],i)=>{
   const group=document.createElementNS(ns,'g'),line=document.createElementNS(ns,'line'),dot=document.createElementNS(ns,'circle'),rect=document.createElementNS(ns,'rect'),text=document.createElementNS(ns,'text');
   dot.setAttribute('r','3');rect.setAttribute('rx','6');rect.setAttribute('height','28');text.textContent=name;group.append(line,dot,rect,text);svg.append(group);current.push({name,position,line,dot,rect,text,index:i});
  });
 }
 const v=new Vector3();
 function update(camera,model){if(!enabled)return;const w=host.clientWidth,h=host.clientHeight;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);model.updateMatrixWorld();
  for(const a of current){const p=[...a.position];if(id==='ribosome'&&!cut&&a.index===1)p[1]+=.27;v.set(...p).applyMatrix4(model.matrixWorld).project(camera);
   const x=(v.x+1)*w/2,y=(1-v.y)*h/2,right=a.index===2,tw=a.name.length*13+18,lx=right?w-tw-16:16,ly=h*(a.index===1?.79:.32);
   a.line.setAttribute('x1',right?lx:lx+tw);a.line.setAttribute('y1',ly);a.line.setAttribute('x2',x);a.line.setAttribute('y2',y);a.dot.setAttribute('cx',x);a.dot.setAttribute('cy',y);a.rect.setAttribute('x',lx);a.rect.setAttribute('y',ly-14);a.rect.setAttribute('width',tw);a.text.setAttribute('x',lx+9);a.text.setAttribute('y',ly+4.5);
  }
 }
 return{set,update,setVisible(show){svg.style.visibility=show?'':'hidden';toggle.hidden=!show;}};
}
