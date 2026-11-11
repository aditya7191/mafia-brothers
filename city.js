import * as THREE from './three.module.min.js';
export const XS=[-288,-192,-96,0,96,192,288];
export const RW=16;
export const BOUND={x0:-322,x1:340,z0:-340,z1:340};
export const LM={ // landmark / mission positions
  arch:{x:-309,z:0}, station:{x:0,z:-144}, vada:{x:-144,z:96}, lighthouse:{x:-309,z:312}, garage:{x:240,z:-222}
};
const cellC=i=>XS[i]+48;
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

class GB{
  constructor(){this.pos=[];this.nor=[];this.col=[];this.uv=[]}
  vert(p,n,c,u,v){this.pos.push(p[0],p[1],p[2]);this.nor.push(n[0],n[1],n[2]);this.col.push(c.r,c.g,c.b);this.uv.push(u,v)}
  quad4(n,a,b,c4,d,col,uvs){const i=[a,b,c4,a,c4,d],ui=[0,1,2,0,2,3];for(let k=0;k<6;k++){const uu=uvs[ui[k]];this.vert(i[k],n,col,uu[0],uu[1])}}
  box(x,y0,z,w,h,d,hex,win=false,uo=0){
    const col=new THREE.Color(hex),x0=x-w/2,x1=x+w/2,y1=y0+h,z0=z-d/2,z1=z+d/2;
    const F=[[[1,0,0],[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],d],[[-1,0,0],[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],d],
      [[0,0,1],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],w],[[0,0,-1],[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],w],[[0,1,0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],0]];
    for(let f=0;f<5;f++){const q=F[f];let uvs;
      if(win&&f<4){const u1=uo+q[5]/12,v1=h/14;uvs=[[uo,0],[u1,0],[u1,v1],[uo,v1]]}else uvs=[[.02,.02],[.02,.02],[.02,.02],[.02,.02]];
      this.quad4(q[0],q[1],q[2],q[3],q[4],col,uvs)}
  }
  flat(x,y,z,w,d,hex){const col=new THREE.Color(hex),x0=x-w/2,x1=x+w/2,z0=z-d/2,z1=z+d/2;this.quad4([0,1,0],[x0,y,z1],[x1,y,z1],[x1,y,z0],[x0,y,z0],col,[[.02,.02],[.02,.02],[.02,.02],[.02,.02]])}
  geom(g,m,hex){g=g.index?g.toNonIndexed():g;const col=new THREE.Color(hex),p=g.attributes.position,n=g.attributes.normal,nm=new THREE.Matrix3().getNormalMatrix(m),v=new THREE.Vector3(),nn=new THREE.Vector3();
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);nn.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();this.vert([v.x,v.y,v.z],[nn.x,nn.y,nn.z],col,.02,.02)}}
  mesh(mat){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(this.col,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.uv,2));g.computeBoundingSphere();const m=new THREE.Mesh(g,mat);m.frustumCulled=false;return m}
}
const gCyl=new THREE.CylinderGeometry(1,1,1,10),gCone=new THREE.ConeGeometry(1,1,10),gSph=new THREE.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI/2),gBox=new THREE.BoxGeometry(1,1,1);
const MAT=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),S=new THREE.Vector3(),Pv=new THREE.Vector3();
function tf(x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){Q.setFromEuler(E.set(rx,ry,rz));return MAT.compose(Pv.set(x,y,z),Q,S.set(sx,sy,sz))}
function cyl(b,x,y0,z,r,h,hex){b.geom(gCyl,tf(x,y0+h/2,z,r,h,r),hex)}
function cone(b,x,y0,z,r,h,hex){b.geom(gCone,tf(x,y0+h/2,z,r,h,r),hex)}
function dome(b,x,y0,z,r,hex){b.geom(gSph,tf(x,y0,z,r,r,r),hex)}
function rbox(b,x,y,z,sx,sy,sz,rx,ry,rz,hex){b.geom(gBox,tf(x,y,z,sx,sy,sz,rx,ry,rz),hex)}

function windowTextures(){
  const mk=(lit)=>{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
    x.fillStyle=lit?'#000':'#ffffff';x.fillRect(0,0,256,256);const r=rng(5);
    for(let j=0;j<4;j++)for(let i=0;i<4;i++){const X=i*64,Y=j*64,on=r()<0.32,warm=r()<.5;
      if(lit){if(on){x.fillStyle=warm?'#ffd27a':'#bfe4ff';x.fillRect(X+14,Y+12,36,38)}}
      else{x.fillStyle=on?'#c9a45a':'#27324a';x.fillRect(X+14,Y+12,36,38);if(!on){x.fillStyle='#3a4a6b';x.fillRect(X+14,Y+12,36,12)}
        x.fillStyle='#d6d0c6';x.fillRect(X+8,Y+52,48,5);x.fillStyle='#00000018';x.fillRect(X,Y+58,64,6)}}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t};
  return [mk(false),mk(true)];
}
export function signTex(text,w,h,bg,fg,sub){
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  x.fillStyle=bg;x.fillRect(0,0,w,h);x.strokeStyle=fg;x.lineWidth=h*.05;x.strokeRect(h*.06,h*.06,w-h*.12,h-h*.12);
  x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';x.font='900 '+(h*(sub?.46:.6))+'px Arial Black,Impact,sans-serif';x.fillText(text,w/2,sub?h*.42:h/2,w*.92);
  if(sub){x.font='700 '+h*.2+'px Arial,sans-serif';x.fillText(sub,w/2,h*.78,w*.9)}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}

export function buildCity(scene){
  const T=new GB(),P=new GB(),G=new GB(),colliders=[],rnd=rng(11),R=(a,b)=>a+rnd()*(b-a),pick=a=>a[Math.floor(rnd()*a.length)];
  const [wt,et]=windowTextures();
  const matW=new THREE.MeshLambertMaterial({vertexColors:true,map:wt,emissive:0xffffff,emissiveMap:et,emissiveIntensity:.95});
  const matP=new THREE.MeshLambertMaterial({vertexColors:true}),matG=new THREE.MeshBasicMaterial({vertexColors:true});
  const col=(x0,x1,z0,z1)=>colliders.push({x0,x1,z0,z1});
  const solid=(x,z,w,d,y0,h,hex)=>{P.box(x,y0,z,w,h,d,hex);col(x-w/2,x+w/2,z-d/2,z+d/2)};
  const signs=[],animated={boats:[],sea:null};
  // ---- ground, roads
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),new THREE.MeshLambertMaterial({color:0x6b6358}));ground.rotation.x=-Math.PI/2;ground.position.set(1189,-0.1,0);scene.add(ground);
  XS.forEach(a=>{P.box(a,0,0,RW,0.1,592,0x34343c);P.box(0,0,a,592,0.1,RW,0x34343c)});
  // intersections slightly lighter patch not needed. markings
  const near=t=>XS.some(k=>Math.abs(t-k)<11.5);
  XS.forEach(a=>{for(let t=-290;t<=290;t+=10){if(near(t))continue;P.flat(a,0.11,t,0.35,4,0xe8e0c8);P.flat(t,0.11,a,4,0.35,0xe8e0c8)}
    P.flat(a-7.6,0.11,0,0.25,592,0xdddddd);P.flat(a+7.6,0.11,0,0.25,592,0xdddddd);P.flat(0,0.11,a-7.6,592,0.25,0xdddddd);P.flat(0,0.11,a+7.6,592,0.25,0xdddddd)});
  XS.forEach((ax,i)=>XS.forEach((az,j)=>{
    const arms=[[-1,0,i>0],[1,0,i<6],[0,-1,j>0],[0,1,j<6]];
    arms.forEach(([dx,dz,ok])=>{if(!ok)return;for(let s=-3;s<=3;s++){const x=ax+dx*11.5+(dx?0:s*2.1),z=az+dz*11.5+(dz?0:s*2.1);P.flat(x,0.115,z,dx?3.2:1.1,dz?3.2:1.1,0xf2f2f2)}})}));
  // sidewalk slabs
  const slab=(x0,x1,z0,z1,hex=0x8d887e)=>{P.box((x0+x1)/2,0,(z0+z1)/2,x1-x0,0.2,z1-z0,hex)};
  for(let i=0;i<6;i++)for(let j=0;j<6;j++)slab(XS[i]+8,XS[i+1]-8,XS[j]+8,XS[j+1]-8);
  slab(296,340,-340,340);slab(-296,296,-340,-296);slab(-296,296,296,340);
  slab(-322,-296,-340,340,0xb8a68c); // promenade
  // ---- helpers for buildings
  const PASTEL=[0xf2e2c6,0xf5c7b8,0x9fd8d0,0xf7e07a,0xe8a9a9,0xcfe3f0],BOLD=[0xe9c46a,0xf4a261,0xe76f51,0x8ecae6,0xb5e48c,0xf28482,0xcdb4db,0xffd6a5,0x84dcc6,0xf6bd60],GLASS=[0x8fa3b8,0x6f8fa8,0x9aa8b8,0x7d93a3,0x5b7c99,0x6c8ea6];
  const building=(cx,cz,w,d,h,hex,roof=true)=>{
    T.box(cx,0.2,cz,w,h,d,hex,true,Math.floor(rnd()*4)/4);P.box(cx,h+0.2,cz,w+0.6,0.6,d+0.6,0x55534f);col(cx-w/2,cx+w/2,cz-d/2,cz+d/2);
    if(!roof)return;const y=h+0.8;
    if(rnd()<.55){cyl(P,cx+R(-w*.25,w*.25),y,cz+R(-d*.25,d*.25),1.3,2.4,0x6b4a2f);}
    if(rnd()<.5)P.box(cx+R(-w*.3,w*.3),y,cz+R(-d*.3,d*.3),2.4,1.3,1.6,0xcfcfcf);
    if(h>40){P.box(cx,y,cz,0.3,10,0.3,0x777777);G.box(cx,y+10,cz,0.8,0.8,0.8,0xff3030)}
  };
  const lots=(i,j,fn)=>{ // 2x2 lots in a cell
    const cx=cellC(i),cz=cellC(j),fx=R(.42,.58),fz=R(.42,.58),W=68,tx=-34;
    const xs=[[tx,tx+W*fx-1],[tx+W*fx+1,tx+W]],zs=[[tx,tx+W*fz-1],[tx+W*fz+1,tx+W]];
    for(const a of xs)for(const b of zs){const w=a[1]-a[0],d=b[1]-b[0];fn(cx+(a[0]+a[1])/2,cz+(b[0]+b[1])/2,w-R(2,5),d-R(2,5))}
  };
  const palm=(x,z,s=1)=>{const h=R(6,8)*s,lean=R(-.2,.2);rbox(P,x+lean*h*.4,h/2,z,.45,h,.45,0,0,lean,0x7a5a3a);
    for(let k=0;k<6;k++){const a=k*Math.PI/3+R(0,.5);rbox(P,x+Math.cos(a)*1.7*s+lean*h*.8,h-.2,z+Math.sin(a)*1.7*s,3.8*s,.14,1.1*s,0,-a,-.35,k%2?0x3f8f3a:0x2f7a35)}};
  const tree=(x,z)=>{const h=R(3,4.5);cyl(P,x,0.2,z,.3,h*.55,0x5a3d26);dome(P,x,h*.5,z,R(2.2,3),0x3f8f3a);dome(P,x+.8,h*.45,z+.5,1.8,0x4aa046)};
  const sign=(x,y,z,w,h,ry,tex)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.y=ry;scene.add(m);signs.push(m);return m};
  const special={};const S_=(i,j,n)=>special[i+','+j]=n;
  S_(3,1,'station');S_(4,2,'maidan');S_(1,4,'market');S_(2,3,'clock');S_(4,4,'towers');S_(5,4,'towers');S_(5,3,'towers');S_(5,0,'garage');
  for(let i=0;i<6;i++)for(let j=0;j<6;j++){
    const k=special[i+','+j],cx=cellC(i),cz=cellC(j);
    if(k==='station'||k==='maidan'||k==='market'||k==='clock'||k==='garage')continue;
    if(k==='towers'){lots(i,j,(x,z,w,d)=>building(x,z,Math.min(w,24),Math.min(d,24),R(60,115),pick(GLASS)));continue}
    if(i===0){ // art-deco seafront
      for(let s=0;s<3;s++){const z=cz-34+s*23+11.5;building(cx-14,z,28,21,R(18,26),pick(PASTEL));building(cx+17,z,22,20,R(8,11),pick(BOLD))}
      continue}
    const central=(i>=2&&i<=4&&j>=2&&j<=5);
    lots(i,j,(x,z,w,d)=>central?building(x,z,w,d,R(30,62),pick(GLASS)):building(x,z,w,d,R(14,30),pick(BOLD)));
    if(!central&&rnd()<.5)tree(cx+R(-30,30),cz-36.5+0);
  }
  // outer ring fillers
  const ring=(x0,x1,z0,z1,vert)=>{const L=vert?z1-z0:x1-x0;let t=0;while(t<L-8){const l=Math.min(R(20,32),L-t);const c=(vert?z0:x0)+t+l/2;
    if(vert)building((x0+x1)/2,c,x1-x0-4,l-2,R(14,34),pick(BOLD));else building(c,(z0+z1)/2,l-2,z1-z0-4,R(14,34),pick(BOLD));t+=l}};
  ring(298,340,-338,338,true);ring(-294,296,-338,-298,false);ring(-294,296,298,338,false);
  // ---- Sea promenade
  P.box(-322,0,0,1.6,1.2,680,0xc9bba4);col(-323,-321.2,-345,345);
  for(let z=-330;z<=330;z+=16){palm(-304,z+R(-2,2));}
  for(let z=-326;z<=326;z+=40){solid(-312,z,3,.8,0.2,.5,0x5a4a3a)} // benches (low, tiny colliders skipped visually)
  colliders.length-=0;
  for(let z=-336;z<=336;z+=5){const x=-326-R(0,4);rbox(P,x,.2,z,2.4,.5,.5,R(0,3),R(0,3),R(0,3),0xb4b0a8);rbox(P,x,.2,z,.5,2.4,.5,R(0,3),R(0,3),0,0xb4b0a8);rbox(P,x,.2,z,.5,.5,2.4,R(0,3),0,R(0,3),0xb4b0a8)}
  for(let z=-330;z<=330;z+=22){P.box(-296.5,0.2,z,.35,6.4,.35,0x3b3b44);P.box(-298,6.6,z,3.2,.3,.3,0x3b3b44);G.box(-299.4,6.3,z,.9,.45,.9,0xffe3a0)}
  // street lamps
  XS.forEach(a=>{for(let t=-280;t<=280;t+=48){[[a-8.4,t],[a+8.4,t],[t,a-8.4],[t,a+8.4]].forEach(([x,z],n)=>{if(x<-296.5||x>340||z<-340)return;P.box(x,.2,z,.3,7,.3,0x30303a);G.box(x,7.2,z,.9,.35,.9,0xffd9a0)})}});
  // ---- Landmark: Sea Gate Arch (drive-through)
  {const ax=LM.arch.x,az=LM.arch.z,st=0xc9a26a,dk=0xa88450;
    solid(ax,az-7.2,9,3.8,0.2,14,st);solid(ax,az+7.2,9,3.8,0.2,14,st);
    P.box(ax,14.2,az,9,6,18.2,st);P.box(ax,20.2,az,10,1,19.2,dk);P.box(ax,14.2,az,9.4,.8,18.6,dk);
    dome(P,ax,21.2,az,6,0x7f6a45);cone(P,ax,26.8,az,.5,3,0xcaa24a);
    for(const sz of[-9.4,9.4])for(const sx of[-4.6,4.6]){cyl(P,ax+sx,14.8,az+sz,1.3,8,st);dome(P,ax+sx,22.8,az+sz,1.5,0x7f6a45)}
    for(const sz of[-7.2,7.2])P.box(ax,0.2,az+sz,10,1.2,5,dk);
    P.flat(ax,.22,az,12,10,0x2d2d33);}
  // Lighthouse
  {const lx=LM.lighthouse.x,lz=LM.lighthouse.z;for(let k=0;k<5;k++)cyl(P,lx,.2+k*5,lz,3.2-k*.28,5,k%2?0xd23a2e:0xf5f1e6);cyl(P,lx,25.4,lz,2.6,1.2,0x333333);G.box(lx,26.6,lz,2.2,2.2,2.2,0xffe9a0);cone(P,lx,28.8,lz,2.8,2.4,0xd23a2e);col(lx-3.3,lx+3.3,lz-3.3,lz+3.3)}
  // ---- Station (cell 3,1)
  {const cx=cellC(3),cz=cellC(1),st=0xc79a58,dk=0x8c5a2e,lt=0xe8d9b0;
    const hx=cx-14;
    building(hx,cz,28,64,15,st,false);P.box(hx,15.3,cz,29,.6,65,dk);P.box(hx-14.3,.3,cz,.6,.5,64,lt);P.box(hx,7.2,cz,28.6,.6,64.6,lt);
    solid(hx,cz,12,12,15,22,st);P.box(hx,36.6,cz,13,1,13,dk);dome(P,hx,37.4,cz,5.5,0x7a3d22);cone(P,hx,43,cz,.5,4,0xcaa24a);
    G.box(hx-6.1,29,cz,.3,4.2,4.2,0xfff3c0);
    for(const sz of[-30,30])for(const sx of[-12,12]){cyl(P,hx+sx,15.3,cz+sz,2.2,8,st);cone(P,hx+sx,23.3,cz+sz,2.8,5,0x7a3d22)}
    sign(hx-14.4,11.8,cz,18,3.6,-Math.PI/2,signTex('RAIL STATION',512,100,'#6b1d1d','#ffe9a8','Mumbai Central'));
    // platforms and train
    P.box(cx+26,.2,cz,12,.9,70,0x8a8a90);col(cx+20,cx+32,cz-35,cz+35);
    for(let k=0;k<4;k++){const z=cz-27+k*18;P.box(cx+34,.3,z,3.4,3.4,16.5,k%2?0x3b7ea1:0xf1ede2);P.box(cx+34,2.0,z,3.5,.5,16.6,0xd23a2e);col(cx+32.2,cx+35.8,z-8.4,z+8.4)}
    for(let s=-1;s<=1;s+=2)P.flat(cx+34+s*1.1,.25,cz,.2,80,0x555555);
    solid(cx+8,cz-30,6,10,.2,5,0xb0a090);}
  // ---- Clock tower plaza (2,3)
  {const cx=cellC(2),cz=cellC(3);P.flat(cx,.22,cz,66,66,0xb7ab98);
    solid(cx,cz,9,9,.2,9,0xc79a58);solid(cx,cz,6.4,6.4,9,22,0xd8c08a);P.box(cx,31,cz,8,1,8,0x8c5a2e);cone(P,cx,32,cz,4.6,9,0x6b2d1d);
    for(const[dx,dz,ry]of[[0,3.3,0],[0,-3.3,0],[3.3,0,Math.PI/2],[-3.3,0,Math.PI/2]])G.box(cx+dx,26,cz+dz,dz?4:.3,4,dz?.3:4,0xfff6d0);
    cyl(P,cx,.2,cz-22,5,1,0xaaa192);cyl(P,cx,1.2,cz-22,4.2,.5,0x4aa3c8);cyl(P,cx,1,cz-22,.8,3,0xcfcfcf);
    for(let a=0;a<8;a++)palm(cx+Math.cos(a*.785)*28,cz+Math.sin(a*.785)*28,.9);
    for(const dx of[-26,26])for(const dz of[-26,26])solid(cx+dx,cz+dz,5,5,.2,3.5,0xe8a9a9);}
  // ---- Maidan (4,2)
  {const cx=cellC(4),cz=cellC(2);P.box(cx,0.2,cz,78,.12,78,0x4f8a3b);P.box(cx,.32,cz,3.2,.06,22,0xc9b27c);
    for(const s of[-1,1]){for(let k=-1;k<=1;k++)P.box(cx+k*.5,.32,cz+s*10.5,.14,.7,.14,0xf2f2f2)}
    for(let a=0;a<28;a++){const ang=a/28*Math.PI*2;P.box(cx+Math.cos(ang)*33,.32,cz+Math.sin(ang)*33,2.6,.2,.4,0xf5f5f5)}
    solid(cx+30,cz,7,16,.2,5,0xc9b27c);P.box(cx+30,5.2,cz,8,.5,17,0xe63946);
    [[-37,-37],[37,-37],[-37,37],[37,37]].forEach(([dx,dz])=>{P.box(cx+dx,.2,cz+dz,.5,16,.5,0x555560);G.box(cx+dx,16.2,cz+dz,3,.6,1.6,0xfff6d8)});
    for(let a=0;a<14;a++)tree(cx+R(-36,36)*(a%2?1:.2)+ (a%2?0:34), cz+(a%2?(a%4?38:-38):R(-36,36)));
    for(let k=0;k<8;k++){const px=cx+R(-14,14),pz=cz+R(-14,14),c2=k<4?0xf5f5f5:0x2a7de1;P.box(px,.4,pz,.7,1.4,.5,c2);dome(P,px,1.8,pz,.45,0xc88a5c)}}
  // ---- Market (1,4)
  {const cx=cellC(1),cz=cellC(4);P.flat(cx,.22,cz,66,66,0x9b9084);const cl=[0xe63946,0xffd166,0x2a9d8f,0xf4a261,0x7b2cbf,0x4cc9f0];
    for(let r=0;r<3;r++)for(let k=0;k<5;k++){const x=cx-27+k*13.5,z=cz-18+r*18;if(Math.abs(x-cx)<3)continue;solid(x,z,7,4,.2,2.6,0x8a5a34);
      for(let a=0;a<4;a++)P.box(x-2.6+a*1.75,3.0,z,1.75,.2,5.6,(a+k)%2?0xffffff:cl[(k+r)%6]);P.box(x,.2,z-2.2,6,.5,1,cl[(k*2+r)%6])}
    solid(cx,cz+4,9,4,.2,3,0xa4452c);P.box(cx,3.4,cz+4,10,.3,6,0xe63946);
    // Vada pav stall by the pickup
    const vx=LM.vada.x,vz=LM.vada.z+10;solid(vx,vz,10,4,.2,3.4,0xd8a24a);for(let a=0;a<5;a++)P.box(vx-4+a*2,3.7,vz,2,.2,6.4,a%2?0xffffff:0xe63946);
    sign(vx,6.4,vz+2.4,10,2.6,0,signTex('VADA PAV',400,104,'#e63946','#fff3c0','garam garam!'));G.box(vx,3.4,vz-1.6,6,.35,.35,0xffe9a0)}
  // ---- Mafia Garage (5,0): forecourt with parked supercar + hyperbike
  {const cx=cellC(5),cz=cellC(0);P.flat(cx,.22,cz,70,70,0x6f6f78);
    for(let k=-3;k<=3;k++)P.flat(cx+k*9,.24,cz+38-14,.4,14,0xf2f2f2);
    solid(cx,cz-26,58,16,.2,12,0x3c3f4c);P.box(cx,12.2,cz-26,60,1,18,0x1f2028);G.box(cx,6.2,cz-17.8,40,7,.4,0x16171c);
    for(let k=-3;k<=3;k++)G.box(cx+k*5.5,4,cz-17.7,2.6,.5,.2,k%2?0xff3b6a:0x32e6ff);
    for(const dx of[-27,27])G.box(cx+dx,13.2,cz-17.6,1.2,1.2,1.2,0xffd166);
    sign(cx,15.5,cz-17.4,26,6,0,signTex('MAFIA GARAGE',640,150,'#14091f','#ffd166','Toro V12 • Hyper H-Blade'));
    for(let a=0;a<6;a++){const px=cx-30+a*12;P.box(px,.2,cz+30,.4,3,.4,0x555560);G.box(px,3.2,cz+30,2,.3,.3,0x32e6ff)}
    palm(cx-33,cz-4,.9);palm(cx+33,cz-4,.9);}
  // ---- Billboards on rooftops
  sign(-60,52,-60,30,11,0,signTex('MAFIA BROTHERS',640,200,'#14091f','#ffd166','Aditya • Pravin • Deep'));
  P.box(-60,30,-60.4,1,42,1,0x555555);
  sign(100,44,150,22,9,Math.PI/2,signTex('MUMBAI CHAI',512,200,'#7a3b12','#ffe9a8','garam chai, fresh!'));
  sign(-180,26,-60,18,7,Math.PI,signTex('MARINE VIEW',512,200,'#0e4d64','#bff0ff','sea facing flats'));
  // ---- Elevated metro-like line along z at x=146? decorative: skipped for fairness
  // Sea bridge (decor)
  {const bx=-470,deck=11;P.box(bx,deck,0,16,1.4,1100,0x9a9aa2);for(let z=-520;z<=520;z+=40)P.box(bx,0,z,4,deck,4,0xb0b0b8);
    for(let z=-520;z<=520;z+=14){G.box(bx-7.8,deck+1.2,z,.5,.5,.5,0xffe3a0);G.box(bx+7.8,deck+1.2,z,.5,.5,.5,0xffe3a0)}
    const lines=[];for(const tz of[-40,200]){P.box(bx-6,0,tz,2.4,80,2.4,0xe8e8ee);P.box(bx+6,0,tz,2.4,80,2.4,0xe8e8ee);P.box(bx,62,tz,14,2,2.4,0xe8e8ee);G.box(bx,81,tz,2,2,2,0xff3030);
      for(let k=1;k<=10;k++)for(const s of[-1,1])for(const sx of[-6,6]){lines.push(bx+sx,76-k*0.6,tz,bx+sx*0.7,deck+1,tz+s*k*9)}}
    const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));scene.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0xf3e6e0})))}
  // boats
  for(let k=0;k<6;k++){const g=new THREE.Group(),b=new GB();b.box(0,0,0,3,1.2,9,0x7a5230);b.box(0,1.2,-2,2.4,.8,3,0xd8c6a0);b.box(0,1.2,0,.25,9,.25,0x555555);rbox(b,0,6,1.4,.12,7,4.2,0,0,0,0xf3ead2);const m=b.mesh(matP);g.add(m);g.position.set(-345-R(0,120),-.5,R(-300,300));g.rotation.y=R(0,6);scene.add(g);animated.boats.push(g)}
  // ---- Water & ground meshes
  const sc=document.createElement('canvas');sc.width=sc.height=256;{const x=sc.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,256,256);const r=rng(3);for(let i=0;i<260;i++){x.fillStyle=`rgba(${r()<.5?'255,226,170':'150,190,210'},${.15+r()*.3})`;x.fillRect(r()*256,r()*256,6+r()*26,1.5+r()*1.5)}}
  const st=new THREE.CanvasTexture(sc);st.wrapS=st.wrapT=THREE.RepeatWrapping;st.repeat.set(60,60);st.colorSpace=THREE.SRGBColorSpace;animated.sea=st;
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),new THREE.MeshBasicMaterial({map:st,color:0x3f8aa0}));sea.rotation.x=-Math.PI/2;sea.position.set(-1822,-0.6,0);scene.add(sea);
  scene.add(T.mesh(matW),P.mesh(matP),G.mesh(matG));
  // boundary
  col(340,350,-350,350);col(-350,350,-350,-340);col(-350,350,340,350);
  // ---- minimap prerender
  const MS=1.6,MW=Math.ceil(700*MS),map=document.createElement('canvas');map.width=map.height=MW;const m=map.getContext('2d');
  const wx=x=>(x+350)*MS,wz=z=>(z+350)*MS;
  m.fillStyle='#223';m.fillRect(0,0,MW,MW);m.fillStyle='#2a6a86';m.fillRect(0,0,wx(-322),MW);
  m.fillStyle='#d8c6a0';m.fillRect(wx(-322),wz(-340),26*MS,680*MS);
  m.fillStyle='#4a4756';m.fillRect(wx(-296),wz(-340),636*MS,680*MS);
  for(let i=0;i<6;i++)for(let j=0;j<6;j++){const k=special[i+','+j];m.fillStyle=k==='maidan'?'#3f7a35':k==='station'?'#8c5a2e':k==='towers'?'#3d4660':k==='garage'?'#7a3d9a':'#5d596a';m.fillRect(wx(XS[i]+8),wz(XS[j]+8),80*MS,80*MS)}
  m.fillStyle='#a5a3b5';XS.forEach(a=>{m.fillRect(wx(a-8),wz(-296),RW*MS,592*MS);m.fillRect(wx(-296),wz(a-8),592*MS,RW*MS)});
  m.fillStyle='#fff';m.font=`bold ${12*MS}px sans-serif`;m.textAlign='center';
  const lab=(t,x,z)=>m.fillText(t,wx(x),wz(z));lab('STATION',cellC(3)-8,cellC(1));lab('MAIDAN',cellC(4),cellC(2));lab('BAZAAR',cellC(1),cellC(4));lab('CLOCK',cellC(2),cellC(3)+4);lab('TOWERS',cellC(4),cellC(4));lab('ARCH',-312,-9);lab('GARAGE',cellC(5),cellC(0));
  const mapInfo={canvas:map,scale:MS,off:350};
  return {colliders,map:mapInfo,animated,update(t){st.offset.set(t*.004,t*.002);animated.boats.forEach((b,i)=>{b.position.y=-.5+Math.sin(t*.8+i)*.18;b.rotation.z=Math.sin(t*.7+i*2)*.04})},signs};
}
