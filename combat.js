import * as THREE from './three.module.min.js';
const mm={},bm={};
const MM=h=>mm[h]||(mm[h]=new THREE.MeshLambertMaterial({color:h}));
const BM=h=>bm[h]||(bm[h]=new THREE.MeshBasicMaterial({color:h}));
const bG=new THREE.BoxGeometry(1,1,1),sG=new THREE.SphereGeometry(1,8,6);
const angd=(a,b)=>{let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d};
function pt(g,mat,sx,sy,sz,x,y,z,geo=bG){const m=new THREE.Mesh(geo,mat);m.scale.set(sx,sy,sz);m.position.set(x,y,z);g.add(m);return m}
export const WEAPONS={
  pistol:{name:'PISTOL',dmg:20,rate:.38,range:44,spread:.03,pellets:1,pick:24,max:120},
  smg:{name:'SMG',dmg:9,rate:.1,range:36,spread:.09,pellets:1,pick:60,max:240},
  shotgun:{name:'SHOTGUN',dmg:11,rate:.8,range:24,spread:.2,pellets:5,pick:12,max:48},
  blaster:{name:'BROTHERS BLASTER',dmg:46,rate:.7,range:62,spread:0,pellets:1,pick:8,max:30,pierce:true,blast:5.6,blastDmg:30}};
import {halo} from './fx.js';
const pm={};const PM=h=>pm[h]||(pm[h]=new THREE.MeshPhongMaterial({color:h,shininess:35,specular:0x333340}));
export function buildHuman(o){
  const g=new THREE.Group(),u=g.userData,jc=o.jacket,pc=o.pants||0x252a40,sk=o.skin,dark=0x14141a;
  const mkLeg=(x)=>{const hip=new THREE.Group();hip.position.set(x,.98,0);pt(hip,PM(pc),.29,.52,.31,0,-.26,0);
    const knee=new THREE.Group();knee.position.set(0,-.52,0);hip.add(knee);pt(knee,PM(pc),.25,.46,.28,0,-.23,0);
    pt(knee,PM(dark),.31,.17,.46,0,-.5,.07);pt(knee,PM(0xe9e9ee),.32,.05,.48,0,-.6,.07);pt(knee,PM(o.accent||0xffffff),.12,.05,.1,0,-.42,.3);
    g.add(hip);return [hip,knee]};
  [u.legL,u.kneeL]=mkLeg(.17);[u.legR,u.kneeR]=mkLeg(-.17);
  pt(g,PM(pc),.64,.22,.38,0,1.02,0);pt(g,PM(0x2a1c12),.66,.07,.4,0,1.12,0);pt(g,BM(0xe0b04a),.11,.08,.04,0,1.12,.21);
  pt(g,PM(jc),.62,.22,.4,0,1.26,0);pt(g,PM(jc),.74,.58,.44,0,1.6,0);
  pt(g,PM(o.trim||0xf2f2f2),.05,.5,.02,.2,1.58,.226);pt(g,PM(o.trim||0xf2f2f2),.05,.5,.02,-.2,1.58,.226);
  pt(g,PM(0x1c1c22),.5,.14,.26,0,1.45,-.26);pt(g,PM(jc),.4,.16,.3,0,1.97,-.12,sG).scale.set(.26,.2,.22); // hood
  pt(g,PM(sk),.17,.12,.17,0,1.93,0);
  const arm=(x)=>{const sh=new THREE.Group();sh.position.set(x,1.8,0);pt(sh,PM(jc),.2,.2,.2,0,0,0,sG);pt(sh,PM(jc),.2,.38,.22,0,-.2,0);
    const el=new THREE.Group();el.position.set(0,-.4,0);sh.add(el);pt(el,PM(jc),.18,.34,.2,0,-.17,0);pt(el,PM(0x1c1c22),.19,.07,.21,0,-.35,0);pt(el,PM(sk),.1,.1,.1,0,-.43,0,sG);g.add(sh);return [sh,el]};
  [u.armL,u.elL]=arm(.47);[u.armR,u.elR]=arm(-.47);
  pt(u.elR,PM(0x2b2d36),.1,.5,.14,0,-.66,.02);pt(u.elR,PM(0x555a66),.07,.14,.1,0,-.94,.02);u.flash=pt(u.elR,BM(0xffd070),.36,.36,.36,0,-1.12,.02,sG);u.flash.visible=false;
  // head
  pt(g,PM(sk),.21,.23,.2,0,2.12,0,sG);pt(g,PM(sk),.05,.07,.06,0,2.09,.2,sG);
  pt(g,PM(sk),.04,.07,.05,.2,2.12,0,sG);pt(g,PM(sk),.04,.07,.05,-.2,2.12,0,sG);
  for(const sd of[-1,1]){pt(g,BM(0xffffff),.045,.03,.02,sd*.075,2.16,.19);pt(g,BM(0x120c0a),.022,.025,.02,sd*.075,2.16,.205);pt(g,BM(0x1a1210),.06,.015,.02,sd*.075,2.2,.19)}
  pt(g,BM(0x5a1f1a),.07,.012,.02,0,2.03,.19);
  const st=o.hair,hy=.12;
  if(st==='spiky'){pt(g,MM(0x14100f),.4,.12,.4,0,1.99+hy,0);for(let i=-2;i<=2;i++){const c=pt(g,MM(0x14100f),.07,.2,.07,i*.08,2.12+hy,0);c.rotation.z=i*.15}pt(g,MM(o.accent||0xe63946),.42,.07,.42,0,1.94+hy,0)}
  else if(st==='cap'){pt(g,MM(0xffcc00),.42,.14,.42,0,1.99+hy,0);pt(g,MM(0xe0a800),.42,.04,.24,0,1.95+hy,-.28)}
  else if(st==='curly'){for(let i=0;i<7;i++){const a=i/7*Math.PI*2;pt(g,MM(0x3a2314),.17,.17,.17,Math.cos(a)*.15,2.0+hy,Math.sin(a)*.15,sG)}pt(g,MM(0x3a2314),.3,.14,.3,0,2.05+hy,0,sG);
    for(const sd of[-1,1]){pt(g,BM(0x1a1a22),.07,.01,.02,sd*.075,2.16,.205);}pt(g,BM(0x1a1a22),.4,.025,.03,0,2.16,.195)}
  else if(st==='bandana'){pt(g,MM(0x15151a),.4,.1,.4,0,1.99+hy,0);pt(g,MM(0xff7a00),.42,.09,.42,0,1.92+hy,0)}
  u.g=g;g.scale.setScalar(o.scale||.93);g.traverse(m=>{if(m.isMesh&&m.material&&m.material.isMeshPhongMaterial)m.castShadow=true});return g}
export function animateHuman(g,t,sp,armed,run){const u=g.userData,k=Math.min(1,sp/4),f=run?1.35:1,s=Math.sin(t*10*f)*.85*k;
  u.legL.rotation.x=s;u.legR.rotation.x=-s;u.kneeL.rotation.x=Math.max(0,s)*1.0*k;u.kneeR.rotation.x=Math.max(0,-s)*1.0*k;
  u.armL.rotation.x=-s*.8;u.elL.rotation.x=-.25-Math.max(0,-s)*.5*k;
  if(armed){u.armR.rotation.x=-1.4;u.elR.rotation.x=-.12}else{u.armR.rotation.x=s*.8;u.elR.rotation.x=-.25-Math.max(0,s)*.5*k}}
export function pushCircle(colliders,e,r){let hit=false;
  for(const b of colliders){if(e.x<b.x0-r||e.x>b.x1+r||e.z<b.z0-r||e.z>b.z1+r)continue;
    const qx=Math.max(b.x0,Math.min(e.x,b.x1)),qz=Math.max(b.z0,Math.min(e.z,b.z1));let dx=e.x-qx,dz=e.z-qz,d=Math.hypot(dx,dz);if(d>=r)continue;
    if(d>1e-5){e.x+=dx/d*(r-d);e.z+=dz/d*(r-d)}else{const l=e.x-b.x0,rr=b.x1-e.x,t=e.z-b.z0,bm=b.z1-e.z,m=Math.min(l,rr,t,bm);if(m===l)e.x=b.x0-r;else if(m===rr)e.x=b.x1+r;else if(m===t)e.z=b.z0-r;else e.z=b.z1+r}hit=true}
  return hit}
export class Combat{
  constructor(scene,colliders,sfx){this.scene=scene;this.colliders=colliders;this.sfx=sfx;this.enemies=[];this.pickups=[];this.tr=[];this.sp=[];this.kills=0;this.onKill=null;this.onHero=null;
    for(let i=0;i<24;i++){const m=new THREE.Mesh(bG,BM(0xffe9a0));m.visible=false;m.userData.t=0;scene.add(m);this.tr.push(m)}
    for(let i=0;i<24;i++){const m=new THREE.Mesh(bG,BM(0xffd070));m.visible=false;m.userData.t=0;scene.add(m);this.sp.push(m)}
    
    // Brothers Blaster visuals: pooled plasma bolts (tapered gold core + neon trail + halo head) and shockwave rings
    const AD=(hex,op)=>new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
    this.bolts=[];for(let i=0;i<6;i++){const g=new THREE.Group(),mk=(r1,r0,hex,op)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r0,1,10),AD(hex,op));m.rotation.x=Math.PI/2;g.add(m);return m};
      const core=mk(.16,.04,0xfff6d0,1),mid=mk(.55,.06,0xffb020,.6),out=mk(1.15,.08,0x32e6ff,.26);const head=halo(0xffd24a,6.5,1);head.material=head.material.clone();
      g.visible=false;head.visible=false;scene.add(g,head);this.bolts.push({g,head,mats:[core.material,mid.material,out.material],ops:[1,.55,.2],t:0,on:false})}
    this.rings=[];for(let i=0;i<8;i++){const m=new THREE.Mesh(new THREE.RingGeometry(.82,1,40),AD(0xffc83a,.9));m.rotation.x=-Math.PI/2;m.visible=false;const f=halo(0xffe08a,9,.95);f.material=f.material.clone();f.visible=false;scene.add(m,f);this.rings.push({m,f,t:0,on:false,R:5})}
    this.ring=new THREE.Mesh(new THREE.RingGeometry(.8,1.1,24),new THREE.MeshBasicMaterial({color:0xff3b3b,side:THREE.DoubleSide,transparent:true,opacity:.9,depthWrite:false}));this.ring.rotation.x=-Math.PI/2;this.ring.visible=false;scene.add(this.ring)}
  tracer(x0,y0,z0,x1,y1,z1,col){const m=this.tr.find(t=>!t.visible);if(!m)return;const dx=x1-x0,dy=y1-y0,dz=z1-z0,len=Math.hypot(dx,dy,dz);if(len<.2)return;
    m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);m.lookAt(x1,y1,z1);m.scale.set(.07,.07,len);m.material=BM(col||0xffe9a0);m.userData.t=.09;m.visible=true}
  spark(x,y,z,col=0xffd070){const m=this.sp.find(t=>!t.visible);if(!m)return;m.position.set(x,y,z);m.scale.setScalar(.2);m.userData.t=.18;m.material=BM(col);m.visible=true}
  wallT(x,z,dx,dz,maxT){let best=maxT;
    for(const b of this.colliders){let t0=0,t1=best;
      if(Math.abs(dx)<1e-7){if(x<b.x0||x>b.x1)continue}else{let a=(b.x0-x)/dx,c=(b.x1-x)/dx;if(a>c){const q=a;a=c;c=q}t0=Math.max(t0,a);t1=Math.min(t1,c)}
      if(Math.abs(dz)<1e-7){if(z<b.z0||z>b.z1)continue}else{let a=(b.z0-z)/dz,c=(b.z1-z)/dz;if(a>c){const q=a;a=c;c=q}t0=Math.max(t0,a);t1=Math.min(t1,c)}
      if(t0<=t1&&t0<best)best=t0}
    return best}
  fire(x,z,th,W,o){ // o:{traffic,onTraffic}
    let hitAny=false;
    for(let p=0;p<W.pellets;p++){const a=th+(Math.random()-.5)*2*W.spread,dx=Math.sin(a),dz=Math.cos(a);
      let best=this.wallT(x,z,dx,dz,W.range),kind=best<W.range?'wall':'',tgt=null;
      for(const e of this.enemies){if(e.dead)continue;const rx=e.x-x,rz=e.z-z,al=rx*dx+rz*dz;if(al<0||al>best)continue;const pr=Math.abs(rx*dz-rz*dx);if(pr<.8){best=al;kind='enemy';tgt=e}}
      if(o&&o.traffic){for(const v of o.traffic.list){if(v.chaser)continue;if(Math.abs(v.x-x)>W.range||Math.abs(v.z-z)>W.range)continue;for(const c of v.c){const cx=v.x+Math.sin(v.th)*c[0],cz=v.z+Math.cos(v.th)*c[0],rx=cx-x,rz=cz-z,al=rx*dx+rz*dz;if(al<0||al>best)continue;const pr=Math.abs(rx*dz-rz*dx);if(pr<c[1]){best=al;kind='veh';tgt=v}}}}
      this.tracer(x,1.35,z,x+dx*best,1.35,z+dz*best);
      if(kind==='enemy'){this.damage(tgt,W.dmg,x,z);this.spark(x+dx*best,1.4,z+dz*best,0xffffff);hitAny=true}
      else if(kind==='veh'){this.spark(x+dx*best,1.0,z+dz*best,0xffd070);if(o.onTraffic)o.onTraffic(tgt)}
      else if(kind==='wall')this.spark(x+dx*best,1.2+Math.random()*2,z+dz*best,0xfff0c0)}
    return hitAny}
  addRing(x,z,R){const r=this.rings.find(q=>!q.on)||this.rings[0];r.on=true;r.t=0;r.R=R;r.m.position.set(x,.2,z);r.f.position.set(x,1.3,z);r.m.visible=r.f.visible=true}
  addBolt(x0,y0,z0,x1,y1,z1){const b=this.bolts.find(q=>!q.on)||this.bolts[0];const dx=x1-x0,dy=y1-y0,dz=z1-z0;b.len=Math.hypot(dx,dy,dz)||.1;b.d=[dx/b.len,dy/b.len,dz/b.len];b.o=[x0,y0,z0];b.t=0;b.on=true;b.fade=0;b.g.visible=b.head.visible=true;b.g.lookAt(x1,y1,z1)}
  blast(x,z,r,dmg,skip){for(const e of this.enemies){if(e.dead||e===skip)continue;const d=Math.hypot(e.x-x,e.z-z);if(d<r){this.damage(e,dmg*(1-d/r*.45));const k=(r-d)/r*2.4,nx=(e.x-x)/(d||1),nz=(e.z-z)/(d||1);e.x+=nx*k;e.z+=nz*k;pushCircle(this.colliders,e,.55)}}}
  fireBlaster(x,z,th,W,o){const dx=Math.sin(th),dz=Math.cos(th);const end=this.wallT(x,z,dx,dz,W.range);let hit=0;
    for(const e of this.enemies){if(e.dead)continue;const rx=e.x-x,rz=e.z-z,al=rx*dx+rz*dz;if(al<0||al>end)continue;const pr=Math.abs(rx*dz-rz*dx);if(pr<1.2){this.damage(e,W.dmg);hit++;this.addRing(e.x,e.z,2.8);this.blast(e.x,e.z,2.8,14,e);this.spark(e.x,1.4,e.z,0xffd24a)}}
    if(o&&o.traffic){for(const v of o.traffic.list){if(v.chaser)continue;if(Math.abs(v.x-x)>W.range||Math.abs(v.z-z)>W.range)continue;const rx=v.x-x,rz=v.z-z,al=rx*dx+rz*dz;if(al<0||al>end)continue;if(Math.abs(rx*dz-rz*dx)<1.8){if(o.onTraffic)o.onTraffic(v);break}}}
    const ex=x+dx*end,ez=z+dz*end;this.addBolt(x,1.35,z,ex,1.35,ez);this.addRing(ex,ez,W.blast);this.blast(ex,ez,W.blast,W.blastDmg);
    for(let i=0;i<5;i++)this.spark(ex+(Math.random()-.5)*2,1+Math.random()*1.5,ez+(Math.random()-.5)*2,i%2?0xffd24a:0x32e6ff);
    if(this.sfx)setTimeout(()=>this.sfx.boom(),Math.min(300,end/62*350));return hit>0}
  damage(e,d){if(e.dead)return;e.hp-=d;e.hit=.1;if(e.hp<=0){e.dead=.001;this.kills++;if(this.onKill)this.onKill(e)}}
  spawn(x,z,o={}){const sk=[0xc88a5c,0xb57750,0xd9a37a,0x9c6b4a][Math.floor(Math.random()*4)];
    const m=buildHuman({jacket:0x4a2475,pants:0x1c1c28,skin:sk,hair:'bandana',accent:0xff7a00,trim:0xff9a3d});m.position.set(x,0,z);this.scene.add(m);
    const e={x,z,th:Math.random()*6,hp:o.hp||55,mesh:m,fireT:1+Math.random()*1.5,sd:Math.random()<.5?1:-1,sT:2,dead:0,hit:0,walk:0,flash:0,aggro:o.aggro||44,home:{x,z}};this.enemies.push(e);return e}
  alive(){return this.enemies.filter(e=>!e.dead).length}
  clear(){for(const e of this.enemies)this.scene.remove(e.mesh);this.enemies.length=0}
  aimTarget(x,z,maxD){let best=null,bd=maxD;for(const e of this.enemies){if(e.dead)continue;const d=Math.hypot(e.x-x,e.z-z);if(d<bd){const dx=(e.x-x)/d,dz=(e.z-z)/d;if(this.wallT(x,z,dx,dz,d)>=d-.6){bd=d;best=e}}}return best}
  addPickup(type,x,z,ttl){const g=new THREE.Group(),col={pistol:0xffd166,smg:0xff9a3d,shotgun:0xff5d5d,ammo:0xffe27a,health:0xffffff,cash:0x3ddc84}[type];
    if(type==='cash'){pt(g,BM(0x2fbf6a),.8,.14,.45,0,.35,0);pt(g,BM(0x38d77a),.8,.14,.45,.05,.5,.04).rotation.y=.2;pt(g,BM(0xffd24a),.22,.16,.5,0,.64,0);pt(g,BM(0x2fbf6a),.8,.14,.45,-.04,.2,-.03)}
    else pt(g,MM(type==='health'?0xffffff:0x2a2a33),.9,.55,.9,0,.4,0);
    if(type==='cash'){}
    else if(type==='health'){pt(g,BM(0x22cc55),.7,.12,.2,0,.69,0);pt(g,BM(0x22cc55),.2,.12,.7,0,.69,0)}
    else if(type==='ammo'){pt(g,BM(0xffe27a),.6,.12,.6,0,.69,0);pt(g,MM(0xb88a2a),.2,.35,.2,.2,.9,0)}
    else{pt(g,MM(0x222226),.18,.2,.8,0,.78,0);pt(g,BM(col),.22,.08,.5,0,.9,0)}
    const ring=new THREE.Mesh(new THREE.RingGeometry(.9,1.15,20),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.1;g.add(ring);
    g.position.set(x,0,z);g.scale.setScalar(1.3);this.scene.add(g);this.pickups.push({type,x,z,mesh:g,wait:0,ttl:ttl||0});}
  drop(x,z){const n=this.pickups.filter(p=>p.ttl>0).length;if(n>=14){const o=this.pickups.find(p=>p.ttl>0);this.scene.remove(o.mesh);this.pickups.splice(this.pickups.indexOf(o),1)}this.addPickup('cash',x,z,30)}
  update(dt,T,t){
    for(const m of this.tr)if(m.visible){m.userData.t-=dt;if(m.userData.t<=0)m.visible=false}
    for(const m of this.sp)if(m.visible){m.userData.t-=dt;m.scale.multiplyScalar(1+dt*7);if(m.userData.t<=0)m.visible=false}
    for(const b of this.bolts){if(!b.on)continue;b.t+=dt;const sp=230,hd=Math.min(b.len,sp*b.t),tl=Math.max(0,hd-18),L=Math.max(.05,hd-tl),mid=(hd+tl)/2;
      b.g.position.set(b.o[0]+b.d[0]*mid,b.o[1]+b.d[1]*mid,b.o[2]+b.d[2]*mid);b.g.scale.set(1,1,L);b.head.position.set(b.o[0]+b.d[0]*hd,b.o[1]+b.d[1]*hd,b.o[2]+b.d[2]*hd);
      if(hd>=b.len){b.fade+=dt;const k=Math.max(0,1-b.fade/.22);b.mats.forEach((m,i)=>m.opacity=b.ops[i]*k);b.head.material.opacity=k;if(k<=0){b.on=false;b.g.visible=b.head.visible=false;b.mats.forEach((m,i)=>m.opacity=b.ops[i]);b.head.material.opacity=1}}}
    for(const r of this.rings){if(!r.on)continue;r.t+=dt;const k=r.t/.42;if(k>=1){r.on=false;r.m.visible=r.f.visible=false;continue}const e=1-Math.pow(1-k,3);r.m.scale.set(r.R*e+.3,r.R*e+.3,1);r.m.material.opacity=.9*(1-k);r.f.scale.setScalar(r.R*1.6*(.4+e*.6));r.f.material.opacity=.9*(1-k)}
    for(let i=this.enemies.length-1;i>=0;i--){const e=this.enemies[i];
      if(e.dead){e.dead+=dt;const k=Math.min(1,e.dead/.45);e.mesh.rotation.x=-k*1.45;e.mesh.position.y=-k*.3;if(e.dead>1.0)e.mesh.scale.setScalar(Math.max(.01,1-(e.dead-1.0)*2.2));if(e.dead>1.5){this.scene.remove(e.mesh);this.enemies.splice(i,1)}continue}
      const dx=T.x-e.x,dz=T.z-e.z,d=Math.hypot(dx,dz)||1;
      if(d<80)e.th+=angd(e.th,Math.atan2(dx,dz))*Math.min(1,dt*7);
      let moving=0;
      if(d<e.aggro){let mx=0,mz=0;e.sT-=dt;if(e.sT<=0){e.sd=-e.sd;e.sT=1.5+Math.random()*2}
        if(d>16){mx=dx/d;mz=dz/d}else if(d<8){mx=-dx/d;mz=-dz/d}else{mx=-dz/d*e.sd;mz=dx/d*e.sd}
        const sp=d>16?3.6:2.4;e.x+=mx*sp*dt;e.z+=mz*sp*dt;moving=sp;pushCircle(this.colliders,e,.55);
        for(const o of this.enemies){if(o===e||o.dead)continue;const ox=e.x-o.x,oz=e.z-o.z,od=Math.hypot(ox,oz);if(od<1.1&&od>1e-3){e.x+=ox/od*.05;e.z+=oz/od*.05}}
        e.fireT-=dt;if(e.fireT<=0&&d<36){const los=this.wallT(e.x,e.z,dx/d,dz/d,d)>=d-.5;if(los)this.enemyShoot(e,T,d);e.fireT=1.2+Math.random()*1.1}}
      e.walk+=dt*moving;animateHuman(e.mesh,e.walk,moving,true);e.mesh.userData.flash.visible=e.flash>0;if(e.flash>0)e.flash-=dt;
      e.hit-=dt;e.mesh.position.set(e.x,0,e.z);e.mesh.rotation.y=e.th;e.mesh.scale.setScalar(e.hit>0?1.07:1)}
    for(let i=this.pickups.length-1;i>=0;i--){const p=this.pickups[i];if(p.ttl>0){p.ttl-=dt;if(p.ttl<=0){this.scene.remove(p.mesh);this.pickups.splice(i,1);continue}}if(p.wait>0){p.wait-=dt;if(p.wait<=0)p.mesh.visible=true;continue}p.mesh.rotation.y=t*1.8;p.mesh.position.y=.15+Math.sin(t*3+p.x)*.12}
    // aim ring
    if(T.aim&&!T.aim.dead){this.ring.visible=true;this.ring.position.set(T.aim.x,.15,T.aim.z);const s=1+Math.sin(t*8)*.12;this.ring.scale.set(s,s,1)}else this.ring.visible=false}
  enemyShoot(e,T,d){const p=Math.max(.14,Math.min(.5,.62-d/55))*(T.armor||1),hit=Math.random()<p,sx=e.x+Math.sin(e.th)*.9,sz=e.z+Math.cos(e.th)*.9;
    let tx=T.x,tz=T.z;if(!hit){tx+=(Math.random()-.5)*5;tz+=(Math.random()-.5)*5}
    this.tracer(sx,1.35,sz,tx,1.1,tz,0xff9a6a);e.flash=.07;this.sfx.gun('enemy',Math.max(.05,1-d/45));
    if(hit&&this.onHero)this.onHero(6)}
  collect(T,out){const res=[];for(const p of this.pickups){if(p.wait>0)continue;if(Math.hypot(p.x-T.x,p.z-T.z)<(T.pr||2.8)){if(p.ttl>0){p.ttl=.001;p.wait=0;p.mesh.visible=false;p.x=p.z=1e5}else{p.wait=p.type==='cash'?100:45;p.mesh.visible=false}res.push(p.type)}}return res}
}
