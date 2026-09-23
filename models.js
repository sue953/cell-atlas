import * as T from 'three';
const mat=(c,extra={})=>new T.MeshStandardMaterial({color:c,roughness:.46,metalness:0,...extra});
const sphere=new T.SphereGeometry(1,28,20);
const referenceTextures=new Map();
function referenceSurface(object,name,region){
 // Reuse an interior surface patch from the supplied artwork, avoiding its white background.
 if(typeof document==='undefined')return;
 let texture=referenceTextures.get(name);
 if(!texture){texture=new T.TextureLoader().load(`./references/${encodeURIComponent(name)}.jpg`);texture.colorSpace=T.SRGBColorSpace;texture.offset.set(region[0],region[1]);texture.repeat.set(region[2],region[3]);referenceTextures.set(name,texture);}
 object.material.color.setHex(0xffffff);object.material.map=texture;object.material.roughness=.64;object.material.needsUpdate=true;
}
function mesh(g,geometry,color,pos=[0,0,0],scale=[1,1,1],extra={}){const m=new T.Mesh(geometry,mat(color,extra));m.position.set(...pos);m.scale.set(...scale);g.add(m);return m;}
function ball(g,c,p,s=[1,1,1],extra={}){return mesh(g,sphere,c,p,s,extra);}
function tube(g,points,r,c,closed=false){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),closed);return mesh(g,new T.TubeGeometry(curve,Math.max(16,points.length*5),r,6,closed),c);}
function beadCloud(g,positions,c,r){const m=new T.InstancedMesh(new T.SphereGeometry(r,10,8),mat(c),positions.length);const matrix=new T.Matrix4();positions.forEach((p,i)=>m.setMatrixAt(i,matrix.makeTranslation(...p)));g.add(m);return m;}
function rim(g,s,c,width=.025){const m=mesh(g,new T.TorusGeometry(1,width,8,72),c);m.scale.set(s[0],s[1],1);return m;}
function shell(g,s,c,cut=true,thick=.035){const geo=new T.SphereGeometry(1,48,32,cut?Math.PI:0,cut?Math.PI:Math.PI*2);const outer=mesh(g,geo,c,[0,0,0],s,{side:T.DoubleSide});if(cut){const innerS=s.map(v=>v-thick);mesh(g,geo,new T.Color(c).multiplyScalar(1.08),[0,0,0],innerS,{side:T.BackSide});rim(g,s,c,thick/2);}return outer;}
function roundRect(w,h,r){const s=new T.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
function wallShell(g,w,h,d,c,cut){const shape=roundRect(w,h,.65);const hole=new T.Path(roundRect(w-.19,h-.19,.57).getPoints());shape.holes.push(hole);const geo=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:10});mesh(g,geo,c,[0,0,-d]);const back=new T.ExtrudeGeometry(roundRect(w-.09,h-.09,.6),{depth:.06,bevelEnabled:false,curveSegments:10});mesh(g,back,c,[0,0,-d]);if(!cut)mesh(g,back,c,[0,0,.06]);}
function nuclearEnvelope(g,s,color,cut,dirs){const geo=new T.SphereGeometry(1,72,48,cut?Math.PI:0,cut?Math.PI:Math.PI*2),pos=geo.attributes.position,indices=geo.index.array,kept=[];const p=new T.Vector3();for(let i=0;i<indices.length;i+=3){p.set(0,0,0);for(let j=0;j<3;j++){const n=indices[i+j];p.x+=pos.getX(n);p.y+=pos.getY(n);p.z+=pos.getZ(n);}p.normalize();if(!dirs.some(d=>p.dot(d)>.995))kept.push(indices[i],indices[i+1],indices[i+2]);}geo.setIndex(kept);mesh(g,geo,color,[0,0,0],s,{side:T.DoubleSide});if(cut)rim(g,s,color,.014);}
function nucleus(g,cut,detail){const dirs=[];for(let i=0;i<25;i++){const z=1-2*(i+.5)/25,a=i*2.39996,r=Math.sqrt(1-z*z);dirs.push(new T.Vector3(Math.cos(a)*r,Math.sin(a)*r,z));}nuclearEnvelope(g,[1.15,1.08,.98],0x9c79c8,cut,dirs);nuclearEnvelope(g,[1.06,.99,.89],0xbca1dc,cut,dirs);for(const d of dirs){if(cut&&d.z>.08)continue;const p=d.clone().multiply(new T.Vector3(1.105,1.035,.935));const normal=new T.Vector3(d.x/1.15,d.y/1.08,d.z/.98).normalize();const collar=mesh(g,new T.CylinderGeometry(.102,.095,.092,16,1,true),0x8863af,p.toArray(),[1,1,1],{side:T.DoubleSide});collar.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),normal);}if(cut){const nucleolus=mesh(g,new T.IcosahedronGeometry(1,4),0x68468e,[-.27,-.12,-.12],[.31,.31,.3]);const np=nucleolus.geometry.attributes.position;for(let i=0;i<np.count;i++){const x=np.getX(i),y=np.getY(i),z=np.getZ(i),r=1+.09*Math.sin(x*5)*Math.cos(y*4)*Math.sin(z*3);np.setXYZ(i,x*r,y*r,z*r);}nucleolus.geometry.computeVertexNormals();for(let j=0;j<(detail?10:4);j++){const pts=[];for(let i=0;i<15;i++){const a=i*.53+j*1.9;pts.push([Math.sin(a)*(.45+j*.025),Math.cos(a*1.6+j)*.64,-.38+Math.sin(a*.8)*.18]);}tube(g,pts,.011,0x9673ba);}}return g;}
function mitochondrion(g,cut,detail){
 // Reconstructed from 线粒体.jpg: asymmetric bean outline and alternating rounded cristae.
 const bend=(x,y)=>y*.9*Math.sqrt(1+(x/1.65)**2)-.18*Math.cos(x*1.7)+.045;
 const envelope=new T.SphereGeometry(1,80,48,cut?Math.PI:0,cut?Math.PI:2*Math.PI);
 const ep=envelope.attributes.position;
 for(let i=0;i<ep.count;i++){const x=ep.getX(i)*1.65,y=ep.getY(i)*.75,z=ep.getZ(i)*.58;ep.setXYZ(i,x,bend(x,y),z);}
 envelope.computeVertexNormals();const outerSurface=mesh(g,envelope,0xe97432,[0,0,0],[1,1,1],{side:T.DoubleSide,roughness:.55});referenceSurface(outerSurface,'线粒体',[.18,.3,.1,.35]);
 if(!cut)return g;
 const outer=[],inner=[],edge=[];
 for(let i=0;i<200;i++){const a=i/200*Math.PI*2,x=1.65*Math.cos(a);outer.push([x,bend(x,.75*Math.sin(a)),0]);const ix=1.55*Math.cos(a);edge.push([ix,bend(ix,.65*Math.sin(a)),-.015]);}
 tube(g,outer,.025,0xfa9a53,true);tube(g,edge,.018,0xffc889,true);
 // One continuous folded inner membrane; each inward fold remains connected to the envelope.
 for(let side=0;side<2;side++)for(let i=0;i<260;i++){
   const a=(side?Math.PI:0)+i/260*Math.PI,x=1.5*Math.cos(a),base=.60*Math.sin(a);
   const centers=side?[-1.02,-.17,.68]:[-.68,.18,1.02];
   let inward=0;for(const c of centers)inward+=.92*Math.exp(-Math.pow((x-c)/.13,2))*(1-Math.pow(x/1.5,6));
   inner.push([x,bend(x,base+(side?1:-1)*inward),-.025]);
 }
 const vertices=[],indices=[],n=inner.length,layers=24;
 // A single folded membrane closes continuously around the back. Its invaginations
 // enclose crista lumina continuous with the space outside the inner membrane.
 // No detached fins, and no separate solid "matrix floor" covering the membrane.
 for(let j=0;j<layers;j++){const a=j/layers*Math.PI/2,s=Math.cos(a);for(const p of inner)vertices.push(p[0]*s,(p[1]+.135)*s-.135,-.025-.43*Math.sin(a));}
 for(let j=0;j<layers-1;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=a+n,d=b+n;indices.push(a,b,c,b,d,c);}
 const pole=vertices.length/3;vertices.push(0,-.135,-.455);
 for(let i=0;i<n;i++)indices.push((layers-1)*n+i,(layers-1)*n+(i+1)%n,pole);
 const folded=new T.BufferGeometry();folded.setAttribute('position',new T.Float32BufferAttribute(vertices,3));folded.setIndex(indices);folded.computeVertexNormals();
 mesh(g,folded,0xe86d24,[0,0,0],[1,1,1],{side:T.DoubleSide,roughness:.55});tube(g,inner,.018,0xffa44a,true);
 // Contents are schematic, not molecules reconstructed from the supplied artwork.
 if(detail){for(const [x,y]of[[-1.2,-.07],[-.42,-.26],[.4,.39],[1.22,.02]]){
   const pts=[];for(let i=0;i<17;i++){const a=i/17*Math.PI*2;pts.push([x+.095*Math.cos(a)+.016*Math.sin(a*4),y+.047*Math.sin(a),-.279]);}tube(g,pts,.006,0xb487b1,true);
 }const dots=[];for(let i=0;i<24;i++){const x=-1.3+(i%8)*.35,y=.04+Math.sin(i*2.1)*.16;dots.push([x,bend(x,y),-.265]);}beadCloud(g,dots,0x607e9e,.016);}
 return g;
}
function chloroplast(g,cut,detail){
 const exterior=shell(g,[1.65,.91,.64],0x649a3d,cut);referenceSurface(exterior,'叶绿体',[.13,.45,.15,.15]);
 if(!cut)return g;
 shell(g,[1.54,.81,.56],0xb1cf7c,true);
 // Five compact grana reproduce the supplied cutaway; thylakoids are hollow flattened sacs.
 const stacks=[[-1,-.08,-.07,6],[-.55,.32,-.28,4],[.03,-.32,.03,6],[.66,.3,-.24,4],[.96,-.2,.04,5]];
 for(const [x,y,z,count]of stacks){const stack=new T.Group();stack.position.set(x,y,z);g.add(stack);for(let j=0;j<count;j++)sac(stack,detail&&x===.96,j%2?0x548e32:0x659f3b,.32,.26,j*.085-(count-1)*.0425,0,.039);}
 for(const [ai,bi]of[[0,1],[0,2],[1,3],[2,4],[3,4]]){
   const a=stacks[ai],b=stacks[bi],bridge=new T.Group();bridge.position.set((a[0]+b[0])/2,(a[1]+b[1])/2-.07,(a[2]+b[2])/2-.07);bridge.rotation.z=Math.atan2(b[1]-a[1],b[0]-a[0]);sac(bridge,false,0x78aa48,Math.hypot(b[0]-a[0],b[1]-a[1])*.53,.12,0,0,.022);g.add(bridge);
 }
 if(detail){for(const [x,y]of[[-.7,-.5],[.12,.5],[.63,-.59]])tube(g,[[x-.09,y,-.25],[x-.03,y+.08,-.26],[x+.09,y+.03,-.24],[x+.07,y-.07,-.25]],.007,0xa595a9,true);beadCloud(g,[[.48,-.58,-.15],[.93,.48,-.17],[-1.14,.31,-.2],[-.3,-.61,-.15],[.35,.6,-.12]],0x507c99,.022);}
 return g;
}
function organicBlob(g,color,pos,scale,seed){
 // Silhouette control points traced from the two subunits in 核糖体.jpg.
 const outline=seed<1?[[-.95,-.35],[-1,-.05],[-.86,.2],[-.95,.49],[-.78,.55],[-.58,.43],[-.3,.62],[.05,.83],[.26,1],[.52,.96],[.66,.68],[.89,.41],[.92,.1],[1,-.12],[.83,-.47],[.51,-.49],[.2,-.31],[-.1,-.43],[-.4,-.54],[-.72,-.47]]:[[-.94,.07],[-.83,.32],[-.48,.27],[-.16,.4],[.1,.32],[.36,.55],[.54,.31],[.85,.29],[.97,.07],[.87,-.2],[.52,-.35],[.16,-.43],[-.1,-.33],[-.45,-.4],[-.78,-.24]];
 const curve=new T.CatmullRomCurve3(outline.map(([x,y])=>new T.Vector3(x,y,0)),true),vertices=[],indices=[],segments=128,rings=40;
 for(let j=0;j<=rings;j++){const a=j/rings*Math.PI,r=Math.sin(a);for(let i=0;i<=segments;i++){const p=curve.getPoint(i/segments);const z=Math.cos(a)*(1+.035*Math.sin(p.x*7)*Math.cos(p.y*6)*r*r*r);vertices.push(p.x*r,p.y*r,z);}}
 for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();return mesh(g,geometry,color,pos,scale,{roughness:.6,side:T.DoubleSide});
}
function ribosome(g,cut){
 // Continuous lobed subunits rather than a cluster of separate spheres.
 organicBlob(g,0x4369b4,[0,.18,0],[.85,.78,.55],.4);
 organicBlob(g,0x8bb6ed,[0,cut?-.86:-.59,.06],[.8,.6,.44],2.2);
}
function sac(g,cut,c,w,d,y,curve=.19,height=.105){const geo=new T.SphereGeometry(1,64,32,cut?Math.PI:0,cut?Math.PI:2*Math.PI);const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i)*w,py=pos.getY(i);pos.setXYZ(i,x,Math.sign(py)*Math.pow(Math.abs(py),.35)*height+curve*x*x+y,pos.getZ(i)*d);}geo.computeVertexNormals();mesh(g,geo,c,[0,0,0],[1,1,1],{side:T.DoubleSide});if(cut){const points=[];for(let i=0;i<96;i++){const a=i/96*Math.PI*2,x=Math.cos(a)*w,py=Math.sin(a);points.push([x,Math.sign(py)*Math.pow(Math.abs(py),.35)*height+curve*x*x+y,0]);}tube(g,points,Math.min(.012,height/4),new T.Color(c).multiplyScalar(1.15),true);}}
function golgi(g,cut){const widths=[1.05,1.28,1.43,1.29,1.08];for(let j=0;j<5;j++){const w=widths[j],y=j*.33-.72;sac(g,cut,0xdba432,w,.64,y,.24,.13);for(const side of[-1,1]){if((j+side)%3===0)continue;const budding=j===1&&side===-1,x=side*(w+(budding?.1:.23)),v=y+.24*w*w;if(budding)tube(g,[[side*w,v,-.04],[x,v+.03,-.04],[x+side*.09,v+.1,-.04]],.04,0xdba432);ball(g,0x64aa9d,[x+side*.12,v+.14,-.04],[.12,.12,.12]);}}}
function er(g,cut,detail){
 for(let j=0;j<5;j++){
  const y=j*.32-.68,w=1.18+(j%2)*.12;sac(g,cut,0x929bd4,w,.57,y,.15);
  const dots=[];for(let i=0;i<28;i++){const x=(-.76+(i%7)*.25)*w,z=-(Math.floor(i/7)*.13+.06)*Math.sqrt(1-(x/w)**2),surface=.105*Math.pow(Math.max(0,1-(x/w)**2-(z/.57)**2),.175);dots.push([x,y+surface+.15*x*x+.03,z]);}
  const attached=beadCloud(g,dots,0x51689f,.035);attached.userData.organelle='ribosome';
  if(j<4)tube(g,[[-1.08,y+.2,-.18],[-1.18,y+.36,-.24],[-1.1,y+.53,-.18]],.065,0x929bd4);
  tube(g,[[1.1,y+.16,-.17],[1.48,y+.18,-.25],[1.6,y-.1,-.34],[1.85,y+.08,-.17]],.085,0x90bddb);
  if(j<4)tube(g,[[1.48,y+.18,-.25],[1.61,y+.32,-.34],[1.52,y+.5,-.3]],.085,0x90bddb);
 }
 if(detail){for(const [radius,color]of[[.8,0xb299d2],[.72,0xc9b6e0]]){const n=mesh(g,new T.SphereGeometry(radius,40,28,Math.PI*.95,Math.PI*.75),color,[-1.63,0,-.18],[.6,1.4,.7],{side:T.DoubleSide});n.name='nuclear-envelope-context';}tube(g,[[-1.18,.16,-.18],[-1.12,.16,-.18],[-1.03,.17,-.18]],.075,0x929bd4);}
}
function centrosome(g,cut,detail){for(let k=0;k<2;k++){const c=new T.Group();for(let i=0;i<9;i++){const a=i/9*Math.PI*2;for(let j=0;j<3;j++){const x=Math.cos(a)*.37+Math.cos(a+.85)*j*.075;const z=Math.sin(a)*.37+Math.sin(a+.85)*j*.075;mesh(c,new T.CylinderGeometry(.042,.042,1.25,10,1,true),0xd2a347,[x,0,z],[1,1,1],{side:T.DoubleSide});}}c.position.set(k?.78:-.5,k?-.65:.33,0);if(k)c.rotation.z=Math.PI/2;g.add(c);}if(detail){const pts=[];for(let i=0;i<36;i++){const a=i*2.4;pts.push([Math.cos(a)*(.7+(i%3)*.12),Math.sin(a)*.65,-.28-(i%3)*.1]);}beadCloud(g,pts,0xe3ce9e,.035);}}
function vesicle(g,cut,lyso){const c=lyso?0xd878a8:0x75bcb3;const surface=shell(g,[1,1,1],c,cut,.055);referenceSurface(surface,lyso?'溶酶体':'运输囊泡',[.13,.37,.16,.22]);if(cut){for(let i=0;i<(lyso?17:6);i++){const a=i*2.4,r=.3+(i%3)*.15,size=.055+(i%3)*.018;ball(g,lyso?0xa94e82:0x458c87,[Math.cos(a)*r,Math.sin(a)*r,-.3+(i%3)*.06],[size,size,size]);}if(lyso)for(let i=0;i<4;i++){const m=mesh(g,new T.IcosahedronGeometry(.15,2),0xe4a7c6,[Math.sin(i*2)*.5,Math.cos(i*2)*.55,-.25]);m.scale.x=1.5;}}}
function vacuole(g,cut){
 const indent=(x,y)=>x>0?x*(1-.2*Math.exp(-Math.pow((y/1.7-.35)/.38,2))*(x/1.3)):x;
 const geo=new T.SphereGeometry(1,64,48,cut?Math.PI:0,cut?Math.PI:2*Math.PI),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i)*1.3,y=p.getY(i)*1.7;p.setXYZ(i,indent(x,y),y,p.getZ(i)*.85);}geo.computeVertexNormals();
 mesh(g,geo,0xa6d7ec,[0,0,0],[1,1,1],{side:T.DoubleSide,roughness:.23});
 if(cut){const pts=[];for(let i=0;i<120;i++){const a=i/120*Math.PI*2,x=Math.cos(a)*1.3,y=Math.sin(a)*1.7;pts.push([indent(x,y),y,0]);}tube(g,pts,.022,0x6fabc6,true);}
}
function wallDetail(g,cut){
 // Hexagonal wall segment with a separate inner plasma membrane, as in 细胞壁.jpg.
 function band(radius,thickness,color){const vertices=[],uv=[],indices=[],levels=[-1.7,-1.52,0,1.52,1.7];
  const vertex=(a,y,r)=>[(r+(Math.abs(y)>1.6?.06:0))*Math.cos(a),y,(r+(Math.abs(y)>1.6?.06:0))*Math.sin(a)];
  const quad=(a,b,c,d)=>{const n=vertices.length/3;vertices.push(...a,...b,...c,...d);uv.push(0,0,1,0,1,1,0,1);indices.push(n,n+1,n+2,n,n+2,n+3);};
  for(let side=0;side<6;side++){const a=side*Math.PI/3,b=(side+1)*Math.PI/3;if(cut&&Math.sin((a+b)/2)>.4)continue;
   for(let j=0;j<levels.length-1;j++){const lo=levels[j],hi=levels[j+1];quad(vertex(a,lo,radius),vertex(b,lo,radius),vertex(b,hi,radius),vertex(a,hi,radius));quad(vertex(b,lo,radius-thickness),vertex(a,lo,radius-thickness),vertex(a,hi,radius-thickness),vertex(b,hi,radius-thickness));}
   for(const y of[-1.7,1.7])quad(vertex(a,y,radius),vertex(b,y,radius),vertex(b,y,radius-thickness),vertex(a,y,radius-thickness));
   for(const angle of[a,b])quad(vertex(angle,-1.7,radius),vertex(angle,1.7,radius),vertex(angle,1.7,radius-thickness),vertex(angle,-1.7,radius-thickness));
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return mesh(g,geo,color,[0,0,0],[1,1,1],{side:T.DoubleSide});
 }
 const wall=band(1.5,.16,0xa8bc70);referenceSurface(wall,'细胞壁',[.21,.36,.13,.18]);band(1.31,.025,0x8fc6d2);
 // Crossed cellulose microfibrils on the OUTER face of the back wall panel.
 for(let j=0;j<10;j++){const y=-1.35+j*.28;tube(g,[[-.62,y,-1.307],[0,y+.08,-1.31],[.62,y+.15,-1.307]],.012,0x70873c);}
 for(let j=0;j<5;j++){const x=-.5+j*.24;tube(g,[[x,-1.5,-1.324],[x+.03,0,-1.324],[x-.04,1.5,-1.324]],.014,0x819647);}
}
function membrane(g){const heads=[];const tails=[];for(let x=-1.5;x<=1.5;x+=.19){for(let z=-.7;z<=.7;z+=.19){if((x+.5)**2+z*z<.16||((x-.75)**2+(z-.15)**2<.11))continue;heads.push([x,.38,z],[x,-.38,z]);for(let side of[-1,1])for(let dx of[-.035,.035])tails.push([[x+dx,.3*side,z],[x+dx+.03,.08*side,z+.025]]);}}beadCloud(g,heads,0x8bc1da,.092);const cylinders=new T.InstancedMesh(new T.CylinderGeometry(.017,.017,.24,5),mat(0xa7d1e4),tails.length);const mx=new T.Matrix4();tails.forEach((p,i)=>{mx.makeTranslation(p[0][0],(p[0][1]+p[1][1])/2,p[0][2]);cylinders.setMatrixAt(i,mx);});g.add(cylinders);const channel=new T.Group();channel.position.set(-.5,0,0);g.add(channel);mesh(channel,new T.CylinderGeometry(.28,.28,1.15,32,1,true),0x8b79bb,[0,0,0],[1,1,1],{side:T.DoubleSide});mesh(channel,new T.CylinderGeometry(.115,.115,1.15,32,1,true),0x63528e,[0,0,0],[1,1,1],{side:T.DoubleSide});for(const y of[-.575,.575]){const ring=mesh(channel,new T.RingGeometry(.115,.28,32),0x9d8bc8,[0,y,0],[1,1,1],{side:T.DoubleSide});ring.rotation.x=Math.PI/2;}ball(g,0x7797c0,[.75,0,.15],[.27,.57,.29]);for(let j=0;j<2;j++){const x=j?1.28:-.72;const pts=[[x,.45,.0],[x,.72,.0],[x-.16,.95,0],[x-.25,1.17,0]];tube(g,pts,.027,0x76a762);beadCloud(g,pts.slice(1),0x8db975,.07);tube(g,[pts[1],[x+.22,.92,.05],[x+.35,1.1,.03]],.025,0x76a762);beadCloud(g,[[x+.22,.92,.05],[x+.35,1.1,.03]],0x8db975,.07);}g.rotation.x=.12;}
export function organelle(id,cut=true,detail=false){const g=new T.Group();g.userData.organelle=id;if(id==='nucleus')nucleus(g,cut,detail);if(id==='mitochondrion')mitochondrion(g,cut,detail);if(id==='chloroplast')chloroplast(g,cut,detail);if(id==='er')er(g,cut,detail);if(id==='golgi')golgi(g,cut);if(id==='ribosome')ribosome(g,cut);if(id==='centrosome')centrosome(g,cut,detail);if(id==='vesicle'||id==='lysosome')vesicle(g,cut,id==='lysosome');if(id==='vacuole')vacuole(g,cut);if(id==='wall')wallDetail(g,cut);if(id==='membrane')membrane(g);return g;}
function add(g,id,pos,scale,rot=0){const obj=organelle(id,id!=='vacuole',false);obj.position.set(...pos);obj.scale.setScalar(scale);obj.rotation.z=rot;g.add(obj);return obj;}
function wrappedER(parent,position,scale,plant){
 const g=new T.Group();g.userData.organelle='er';g.position.set(...position);g.scale.setScalar(scale);parent.add(g);
 const dots=[];
 for(let layer=0;layer<4;layer++){
   const radius=1.28+layer*.2,vertices=[],indices=[],steps=90,cross=12,start=plant?.1:.7,end=plant?4.7:5.9;
   for(let i=0;i<=steps;i++){const a=start+(end-start)*i/steps;const cap=Math.pow(Math.sin(Math.PI*(i+.25)/(steps+.5)),.12);for(let j=0;j<=cross;j++){
     const b=Math.PI+j/cross*Math.PI,r=radius+Math.cos(b)*.07*cap;
     vertices.push(Math.cos(a)*r,Math.sin(a)*r*.94,Math.sin(b)*.36*cap-.05);
   }}
   for(let i=0;i<steps;i++)for(let j=0;j<cross;j++){const a=i*(cross+1)+j,b=a+cross+1;indices.push(a,b,a+1,b,b+1,a+1);}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(g,geo,layer%2?0x8f9bd7:0xa1aae1,[0,0,0],[1,1,1],{side:T.DoubleSide});
   for(const side of[-1,1]){const pts=[];for(let i=0;i<=steps;i++){const a=start+(end-start)*i/steps,r=radius+side*.07*Math.pow(Math.sin(Math.PI*(i+.25)/(steps+.5)),.12);pts.push([Math.cos(a)*r,Math.sin(a)*r*.94,-.05]);}tube(g,pts,.014,0xc1c9ee);}
   for(let i=0;i<32;i++){const a=start+.05+(end-start-.1)*i/31,r=radius+.081;dots.push([Math.cos(a)*r,Math.sin(a)*r*.94,-.09-(i%3)*.055]);}
 }
 const particles=beadCloud(g,dots,0x466499,.028);particles.userData.organelle='ribosome';
 // A short connection to the outer nuclear membrane, not to the nuclear interior.
 tube(g,[[0,1.08,-.12],[0,1.22,-.14],[.1,1.28,-.15]],.045,0x9b9bd4);
 for(let j=0;j<3;j++){const y=plant?.6+j*.25:-1.45-j*.18;const x=plant?1.2:-.5;
  tube(g,[[x,y,-.14],[x+.25,y-.1,-.22],[x+.48,y+.1,-.26],[x+.7,y-.02,-.13]],.065,0x8abbdb);
  if(j<2)tube(g,[[x+.3,y,-.2],[x+.4,y+(plant?.25:-.18),-.24]],.065,0x8abbdb);
 }
 return g;
}
export function cell(type,cut=true){const g=new T.Group();g.userData.cell=type;const plant=type==='plant';const cover=new T.Group();cover.userData.organelle=plant?'wall':'membrane';g.add(cover);if(plant){wallShell(cover,5.05,6,1.55,0xb7ca8b,cut);const m=new T.Group();m.userData.organelle='membrane';wallShell(m,4.82,5.77,1.34,0x94c5d6,cut);m.position.z=-.12;m.children[1].material.color.setHex(0xf0e8cb);g.add(m);if(!cut){for(const front of[cover.children[2],m.children[2]]){front.material.transparent=true;front.material.opacity=.16;front.material.depthWrite=false;front.userData.transparentCover=true;}}}else{shell(cover,[2.67,3.02,1.63],0x99c2d6,cut,.07);if(cut)cover.children[1].material.color.setHex(0xf0e0bd);else{cover.children[0].material.transparent=true;cover.children[0].material.opacity=.2;cover.children[0].material.depthWrite=false;cover.children[0].userData.transparentCover=true;}}
 if(plant){add(g,'vacuole',[.12,-.47,-.62],1.08);wrappedER(g,[-1.18,1.6,.12],.57,true);add(g,'nucleus',[-1.18,1.6,.12],.57);add(g,'golgi',[1.16,1.89,.07],.47);for(const [x,y,a]of[[-1.92,.15,1.3],[-1.8,-1.73,1],[-.35,-2.4,.05],[1.89,.1,1.6],[1.78,-1.7,1.2]])add(g,'chloroplast',[x,y,-.12],.36,a);for(const [x,y,a]of[[.03,2.51,.2],[1.91,1.19,1.2],[.94,-2.43,-.2]])add(g,'mitochondrion',[x,y,-.05],.25,a);for(const [x,y]of[[.32,2.1],[1.89,-.92],[-1.83,-.86]])add(g,'vesicle',[x,y,0],.12);
 }else{wrappedER(g,[-.7,.65,.19],.82,false);add(g,'nucleus',[-.7,.65,.19],.82);add(g,'golgi',[.7,-1.35,.17],.45,-.25);for(const [x,y,a]of[[-.7,2.4,-.25],[1.65,1.2,-1.05],[1.92,-.98,1.02],[-1.64,-1.54,-.85],[.34,-2.42,.1]])add(g,'mitochondrion',[x,y,.13],.33,a);add(g,'centrosome',[.88,1.98,.15],.43);for(const [x,y]of[[1.64,.13],[-1.91,-.76]])add(g,'lysosome',[x,y,.22],.23);for(const [x,y]of[[.76,.75],[-.85,-2.25],[1.18,-1.92],[-.12,2.74]])add(g,'vesicle',[x,y,.3],.16);}
 g.updateMatrixWorld(true);const occupied=g.children.filter(o=>!['wall','membrane'].includes(o.userData.organelle)).map(o=>new T.Box3().setFromObject(o).expandByScalar(.045));const ribos=new T.Group();ribos.userData.organelle='ribosome';const points=[];for(let i=0;i<115;i++){const a=i*2.39996,r=Math.sqrt((i+.5)/115),x=Math.cos(a)*2.22*r,y=Math.sin(a)*2.65*r,z=-.18+((i%5)/5)*.45;const p=new T.Vector3(x,y,z);if(occupied.some(box=>box.containsPoint(p)))continue;points.push([x,y,z]);}beadCloud(ribos,points,0x4b6b9c,.036);g.add(ribos);return g;}
export function dispose(group){const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.geometry&&o.geometry!==sphere)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());}
