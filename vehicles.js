import * as THREE from './three.module.min.js';
import {XS} from './city.js';
const sGeo=new THREE.SphereGeometry(1,10,8),bG=new THREE.BoxGeometry(1,1,1),cG=new THREE.CylinderGeometry(1,1,1,14);
const mc={},gc={};
const M=h=>mc[h]||(mc[h]=new THREE.MeshLambertMaterial({color:h}));
const GL=h=>gc[h]||(gc[h]=new THREE.MeshBasicMaterial({color:h}));
function part(p,mat,sx,sy,sz,x,y,z){const m=new THREE.Mesh(bG,mat);m.scale.set(sx,sy,sz);m.position.set(x,y,z);p.add(m);return m}
function wheel(p,x,y,z,r,w){const m=new THREE.Mesh(cG,M(0x111114));m.scale.set(r,w,r);m.rotation.z=Math.PI/2;m.position.set(x,y,z);p.add(m);return m}
let shadowTex;
function shadow(p,w,l){if(!shadowTex){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);shadowTex=new THREE.CanvasTexture(c)}
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,l),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.1;p.add(m)}
const lights=(g,w,y,zf,zb)=>{part(g,GL(0xfff4c0),.45,.22,.12,-w,y,zf);part(g,GL(0xfff4c0),.45,.22,.12,w,y,zf);part(g,GL(0xff2a2a),.4,.2,.12,-w,y,zb);part(g,GL(0xff2a2a),.4,.2,.12,w,y,zb)};
export const SPEC={ // circles along z (centre offset, radius), half-length, cruise speed
  aditya:{c:[[1.15,1.05],[-1.15,1.05]],half:2.2},pravin:{c:[[1.3,1.18],[-1.3,1.18]],half:2.4},deep:{c:[[1,.95],[-1,.95]],half:1.9},
  taxi:{c:[[1.15,1.05],[-1.15,1.05]],half:2.2,cruise:9},sedan:{c:[[1.15,1.05],[-1.15,1.05]],half:2.2,cruise:10.5},
  bus:{c:[[3.2,1.4],[0,1.4],[-3.2,1.4]],half:4.8,cruise:7},auto:{c:[[.7,.85],[-.7,.85]],half:1.5,cruise:8},rival:{c:[[1.2,1.1],[-1.2,1.1]],half:2.3,cruise:20},
  toro:{c:[[1.35,1.05],[-1.35,1.05]],half:2.45},hblade:{c:[[.85,.5],[-.85,.5]],half:1.2},police:{c:[[1.15,1.05],[-1.15,1.05]],half:2.3,cruise:20}};
export const VEH={
  aditya:{name:'Aditya ki Hatchback',phys:{maxS:28,acc:11,steer:1.75,mass:1.0,grip:8},cam:[8.5,3.8]},
  pravin:{name:'Pravin ki SUV',phys:{maxS:25,acc:10,steer:1.5,mass:1.7,grip:9},cam:[9.2,4.2]},
  deep:{name:'Deep ki Compact',phys:{maxS:30,acc:13,steer:2.05,mass:0.8,grip:7},cam:[8,3.6]},
  toro:{name:'Toro V12',phys:{maxS:34,acc:14,steer:1.6,mass:1.3,grip:7.5},cam:[9.6,3.5]},
  hblade:{name:'Hyper H-Blade',phys:{maxS:38,acc:17,steer:1.9,mass:0.6,grip:14,bike:true},cam:[6.6,2.7],bike:true}};
function wedge(pts,depth,hex,x=0){const sh=new THREE.Shape();pts.forEach((p,i)=>i?sh.lineTo(p[0],p[1]):sh.moveTo(p[0],p[1]));
  const g=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:false});g.translate(0,0,-depth/2);g.rotateY(-Math.PI/2);g.translate(x,0,0);return new THREE.Mesh(g,typeof hex==='number'?M(hex):hex)}
export function buildModel(kind,opt={}){
  const g=new THREE.Group();
  if(kind==='aditya'){ // red hatchback with white stripe
    part(g,M(0xe63946),2,.62,4.1,0,.62,0);part(g,M(0xe63946),1.9,.2,1.1,0,.98,1.35);part(g,M(0x1e2a38),1.76,.62,2.1,0,1.2,-.35);part(g,M(0xe63946),1.82,.1,2.2,0,1.54,-.35);
    part(g,M(0xffffff),.35,.04,4.1,.3,.95,0);part(g,M(0xffffff),.35,.04,4.1,-.3,.95,0);part(g,M(0xffffff),.35,.02,2.2,.3,1.6,-.35);part(g,M(0xffffff),.35,.02,2.2,-.3,1.6,-.35);
    part(g,M(0x222228),2.05,.28,.3,0,.42,2.05);part(g,M(0x222228),2.05,.28,.3,0,.42,-2.05);part(g,M(0xe63946),1.9,.08,.6,0,1.66,-1.7);
    [[-1.02,1.3],[1.02,1.3],[-1.02,-1.3],[1.02,-1.3]].forEach(([x,z])=>wheel(g,x,.4,z,.4,.3));lights(g,.7,.72,2.06,-2.06);shadow(g,2.8,5.2)}
  else if(kind==='pravin'){ // blue SUV
    part(g,M(0x2a6fdb),2.2,.85,4.5,0,.85,0);part(g,M(0x1e2a38),2.02,.75,2.9,0,1.62,-.35);part(g,M(0x2a6fdb),2.08,.12,3,0,2.05,-.35);
    part(g,M(0x222228),2.1,.12,2.4,0,2.16,-.35);part(g,M(0x222228),2.3,.4,.4,0,.55,2.3);part(g,M(0x222228),2.3,.4,.3,0,.55,-2.3);part(g,M(0xffcc00),.3,.08,4.5,0,1.3,0);
    [[-1.12,1.45],[1.12,1.45],[-1.12,-1.45],[1.12,-1.45]].forEach(([x,z])=>wheel(g,x,.52,z,.52,.4));lights(g,.8,.95,2.26,-2.26);shadow(g,3,5.5)}
  else if(kind==='deep'){ // green compact
    part(g,M(0x29b765),1.8,.58,3.5,0,.55,0);part(g,M(0x1e2a38),1.62,.6,1.9,0,1.1,-.2);part(g,M(0x29b765),1.66,.1,2,0,1.43,-.2);part(g,M(0xffffff),.5,.02,2,0,1.49,-.2);
    part(g,M(0x222228),1.85,.2,.3,0,.4,1.75);part(g,M(0x222228),1.5,.08,.6,0,1.5,-1.5);part(g,M(0x222228),.1,.3,.1,.6,1.34,-1.5);part(g,M(0x222228),.1,.3,.1,-.6,1.34,-1.5);
    [[-.92,1.1],[.92,1.1],[-.92,-1.1],[.92,-1.1]].forEach(([x,z])=>wheel(g,x,.36,z,.36,.26));lights(g,.6,.62,1.76,-1.76);shadow(g,2.6,4.4)}
  else if(kind==='taxi'||kind==='sedan'){
    const t=kind==='taxi',up=t?0xf2b705:0xeeeeee+Math.floor(Math.random()*0x111111)*0,lo=t?0x15151a:[0xb71c1c,0x1565c0,0xdddddd,0x6d4c41][Math.floor(Math.random()*4)];
    part(g,M(lo),1.9,.5,4.1,0,.5,0);part(g,M(t?0xf2b705:lo),1.88,.2,1.3,0,.85,1.3);part(g,M(0x1e2a38),1.7,.55,2.1,0,1.1,-.3);part(g,M(up),1.74,.12,2.2,0,1.44,-.3);
    if(t){part(g,M(0xf2b705),1.9,.3,2.1,0,.88,-.3);part(g,GL(0xffffff),.7,.22,.3,0,1.62,-.3)}
    [[-.98,1.3],[.98,1.3],[-.98,-1.3],[.98,-1.3]].forEach(([x,z])=>wheel(g,x,.38,z,.38,.28));lights(g,.65,.68,2.06,-2.06);shadow(g,2.6,5)}
  else if(kind==='bus'){
    part(g,M(0xc62828),2.6,1.5,9.6,0,1.1,0);part(g,M(0x1e2a38),2.62,1.0,8.8,0,2.35,-.1);part(g,M(0xf3e5c0),2.6,.35,9.6,0,3.02,0);part(g,M(0xc62828),2.6,.9,9.6,0,.55,0);
    part(g,GL(0xffc04a),1.6,.4,.1,0,2.9,4.83);part(g,M(0x555555),2.2,.1,6,0,3.25,-.5);
    [[-1.3,3.2],[1.3,3.2],[-1.3,-3],[1.3,-3]].forEach(([x,z])=>wheel(g,x,.55,z,.55,.4));lights(g,.95,.7,4.82,-4.82);shadow(g,3.4,10.6)}
  else if(kind==='auto'){
    part(g,M(0x15151a),1.4,.55,2.5,0,.55,-.1);part(g,M(0xf2b705),1.4,.9,1.7,0,1.2,-.5);part(g,M(0x15151a),1.5,.12,2.4,0,1.72,-.2);part(g,M(0x1e2a38),1.3,.55,.1,0,1.35,.4);
    part(g,M(0x15151a),.9,.5,.9,0,.5,1.1);part(g,M(0x333333),1.1,.08,.1,0,1.1,1.05);part(g,GL(0xfff4c0),.3,.2,.1,0,.7,1.58);
    wheel(g,0,.33,1.15,.33,.2);wheel(g,-.78,.33,-.8,.33,.24);wheel(g,.78,.33,-.8,.33,.24);part(g,GL(0xff2a2a),.3,.15,.1,0,.7,-1.4);shadow(g,2,3.4)}
  else if(kind==='toro'){ // original wedge supercar
    const body=0xffb000;
    g.add(wedge([[-2.3,.3],[2.3,.3],[2.45,.5],[1.05,.8],[-.2,1.16],[-1.0,1.16],[-1.95,1.0],[-2.3,.93]],1.95,body));
    const sw=wedge([[.85,.84],[-.2,1.1],[-1.4,1.04],[-1.75,.9],[-1.2,.82]],2.0,0x151b26);g.add(sw);
    const ws=part(g,M(0x151b26),1.7,.05,1.45,0,.98,.5);ws.rotation.x=-.27;
    part(g,M(0x111114),2.2,.07,.55,0,.3,2.35);part(g,M(0x111114),1.9,.1,.5,0,.35,-2.3);
    part(g,M(0x111114),.34,.26,1.1,1.0,.66,-1.15);part(g,M(0x111114),.34,.26,1.1,-1.0,.66,-1.15);
    part(g,M(0x111114),.1,.35,.1,.7,1.15,-2.1);part(g,M(0x111114),.1,.35,.1,-.7,1.15,-2.1);part(g,M(0x111114),2.1,.07,.55,0,1.36,-2.2);
    part(g,M(0x111114),.5,.04,1.0,0,1.17,-.6);part(g,M(0x111114),1.2,.03,.04,0,.52,2.43);
    const hl=part(g,GL(0xf4fbff),.62,.07,.1,.62,.6,2.35);hl.rotation.z=.18;const hr=part(g,GL(0xf4fbff),.62,.07,.1,-.62,.6,2.35);hr.rotation.z=-.18;
    part(g,GL(0xff2222),1.7,.07,.05,0,.85,-2.31);part(g,M(0xbbbbbb),.2,.2,.2,.45,.4,-2.35);part(g,M(0xbbbbbb),.2,.2,.2,-.45,.4,-2.35);
    [[-1.05,1.45,.38,.32],[1.05,1.45,.38,.32],[-1.08,-1.45,.42,.4],[1.08,-1.45,.42,.4]].forEach(([x,z,r,w])=>{wheel(g,x,r,z,r,w);const h=wheel(g,x+Math.sign(x)*.03,r,z,r*.6,w+.02);h.material=M(0xcfd2d8)});
    shadow(g,2.8,5.4)}
  else if(kind==='hblade'){ // original supercharged hyperbike
    const lean=new THREE.Group();g.add(lean);g.userData.lean=lean;const grn=0x6dff2a,blk=0x16161c,gm=0x3a3d46;
    const wh=(z,r,w)=>{const m=new THREE.Mesh(cG,M(0x0e0e10));m.scale.set(r,w,r);m.rotation.z=Math.PI/2;m.position.set(0,r,z);lean.add(m);const rim=new THREE.Mesh(cG,M(0xc9ccd2));rim.scale.set(r*.62,w+.02,r*.62);rim.rotation.z=Math.PI/2;rim.position.set(0,r,z);lean.add(rim)};
    wh(1.0,.37,.2);wh(-.95,.38,.3);
    part(lean,M(grn),.2,.34,1.3,0,.58,0);part(lean,M(gm),.42,.4,.75,0,.48,-.05);part(lean,M(0xcfd2d8),.18,.18,.3,.0,.78,.35);
    part(lean,M(blk),.44,.3,.75,0,.98,.2);part(lean,M(grn),.46,.05,.5,0,1.14,.2);
    const nose=part(lean,M(blk),.52,.34,.75,0,.9,.85);nose.rotation.x=-.28;part(lean,M(grn),.54,.04,.4,0,1.08,.85).rotation.x=-.28;
    const wsr=part(lean,GL(0x203040),.3,.3,.05,0,1.22,.55);wsr.rotation.x=-.5;
    [-1,1].forEach(sd=>{const f=part(lean,M(0xb8bcc6),.07,.75,.07,sd*.12,.72,.95);f.rotation.x=.3});
    part(lean,M(0x222226),.8,.05,.05,0,1.18,.45);part(lean,M(blk),.32,.1,.65,0,.97,-.5);
    const tail=part(lean,M(blk),.34,.2,.7,0,1.03,-1.05);tail.rotation.x=.18;part(lean,M(grn),.36,.04,.5,0,1.14,-1.0).rotation.x=.18;
    part(lean,M(0xb8bcc6),.14,.14,.7,.24,.38,-.8);part(lean,GL(0xfff7d0),.32,.16,.06,0,.9,1.22);part(lean,GL(0xff2222),.26,.06,.05,0,1.04,-1.42);
    const rc=opt.color||0xe63946,rd=new THREE.Group();lean.add(rd);rd.position.set(0,1.0,-.45);
    const tor=part(rd,M(rc),.46,.62,.3,0,.42,0);tor.rotation.x=.75;const hd=new THREE.Mesh(sGeo,M(rc));hd.scale.set(.23,.24,.25);hd.position.set(0,.88,.42);rd.add(hd);part(rd,GL(0x22323f),.3,.1,.1,0,.9,.65);
    [-1,1].forEach(sd=>{const a=part(rd,M(rc),.14,.14,.75,sd*.28,.5,.62);a.rotation.x=.25;const l=part(rd,M(0x23283d),.16,.2,.8,sd*.3,.0,.1);l.rotation.x=-.15});
    const sh=new THREE.Mesh(new THREE.PlaneGeometry(1.1,3.2),new THREE.MeshBasicMaterial({map:shadowTex||(shadow(new THREE.Group(),1,1),shadowTex),transparent:true,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.1;g.add(sh)}
  else if(kind==='police'){
    part(g,M(0xf4f6fa),2,.62,4.2,0,.6,0);part(g,M(0x1d3f8f),2.02,.28,4.2,0,.5,0);part(g,M(0x1e2a38),1.76,.6,2.2,0,1.18,-.3);part(g,M(0xf4f6fa),1.8,.1,2.3,0,1.52,-.3);
    const bR=new THREE.MeshBasicMaterial({color:0xff2020}),bB=new THREE.MeshBasicMaterial({color:0x2060ff});g.userData.lr=bR;g.userData.lb=bB;
    part(g,bR,.7,.14,.3,.4,1.64,-.3);part(g,bB,.7,.14,.3,-.4,1.64,-.3);part(g,M(0x222228),2.05,.28,.3,0,.42,2.1);
    [[-1.02,1.35],[1.02,1.35],[-1.02,-1.35],[1.02,-1.35]].forEach(([x,z])=>wheel(g,x,.4,z,.4,.3));lights(g,.7,.72,2.12,-2.12);shadow(g,2.8,5.2)}
  else if(kind==='rival'){
    part(g,M(0x2b1d3a),2.1,.8,4.2,0,.8,0);part(g,M(0xff7a00),.5,.05,4.2,.45,1.22,0);part(g,M(0xff7a00),.5,.05,4.2,-.45,1.22,0);part(g,M(0x1e2a38),1.9,.6,1.4,0,1.45,-.4);
    part(g,M(0x222228),.12,.8,.12,.9,1.6,-1.4);part(g,M(0x222228),.12,.8,.12,-.9,1.6,-1.4);part(g,M(0x222228),1.9,.1,.1,0,2,-1.4);part(g,M(0x222228),2.2,.35,.35,0,.5,2.15);
    part(g,GL(0xff3b3b),.5,.2,.2,0,1.9,-.3);
    [[-1.1,1.4],[1.1,1.4],[-1.1,-1.4],[1.1,-1.4]].forEach(([x,z])=>wheel(g,x,.5,z,.5,.4));lights(g,.75,.9,2.12,-2.12);shadow(g,3,5)}
  return g;
}
export function personModel(color,skin){const g=new THREE.Group();part(g,M(color),.55,.9,.4,0,.9,0);part(g,M(skin),.38,.38,.38,0,1.55,0);part(g,M(0x222222),.5,.14,.45,0,1.8,0);part(g,M(0x222233),.4,.6,.32,0,.3,0);return g}
const ang=(a,b)=>{let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d};
export class Traffic{
  constructor(scene,rnd){this.scene=scene;this.list=[];this.obst=[];this.rnd=rnd;this.player=null;this.chaser=null;this.target=null;}
  spawn(kind,opt={}){
    const sp=SPEC[kind],rnd=this.rnd,axis=opt.axis||(rnd()<.5?'x':'z'),dir=opt.dir||(rnd()<.5?1:-1),idx=opt.idx!==undefined?opt.idx:Math.floor(rnd()*7);
    const mesh=buildModel(kind);this.scene.add(mesh);
    const v={kind,mesh,axis,dir,idx,half:sp.half,c:sp.c,cruise:(sp.cruise||9)*(0.9+rnd()*.2),v:0,kx:0,kz:0,stun:0,blk:0,ghost:0,aside:0,th:0,x:0,z:0,chaser:!!opt.chaser,hornT:0,mass:kind==='bus'?3:kind==='auto'?.7:1};
    this.place(v,opt.along!==undefined?opt.along:(rnd()*560-280));this.list.push(v);v.px=v.x;v.pz=v.z;return v}
  laneT(v){const o=v.chaser?0:4;return v.axis==='x'?XS[v.idx]-v.dir*o:XS[v.idx]+v.dir*o}
  place(v,along){const lt=this.laneT(v);if(v.axis==='x'){v.x=along;v.z=lt}else{v.z=along;v.x=lt}v.th=v.axis==='x'?(v.dir>0?Math.PI/2:-Math.PI/2):(v.dir>0?0:Math.PI);this.sync(v)}
  sync(v){v.mesh.position.set(v.x,.12,v.z);v.mesh.rotation.y=v.th}
  placeFar(v,from,minD=120){for(let t=0;t<40;t++){v.axis=this.rnd()<.5?'x':'z';v.dir=this.rnd()<.5?1:-1;v.idx=Math.floor(this.rnd()*7);this.place(v,this.rnd()*560-280);if(Math.hypot(v.x-from.x,v.z-from.z)>minD)break}v.v=0;v.kx=v.kz=0;v.px=v.x;v.pz=v.z}
  update(dt,pl){
    const L=this.list;
    for(const v of L){
      const ax=v.axis==='x',dir=v.dir;v.px=v.x;v.pz=v.z;
      let along=ax?v.x:v.z,lat=ax?v.z:v.x;
      let tgt=v.cruise;
      if(v.chaser){const d=Math.hypot(pl.x-v.x,pl.z-v.z);tgt=v.chaseFn?v.chaseFn(d):this.chaseSpeed?this.chaseSpeed(d):20}
      const dx=ax?dir:0,dz=ax?0:dir,look=14+v.v*.8;
      if(v.ghost>0)v.ghost-=dt;
      if(!v.chaser&&v.ghost<=0){
        const chk=o=>{const rx=o.x-v.x,rz=o.z-v.z,a=rx*dx+rz*dz;if(a>0&&a<look){const l=Math.abs(-rx*dz+rz*dx);if(l<3.1){const gap=a-v.half-o.half-1.2;tgt=Math.min(tgt,Math.max(0,gap*.7))}}};
        for(const o of L)if(o!==v&&!o.chaser)chk(o);for(const o of this.obst)chk(o);chk({x:pl.x,z:pl.z,half:pl.half});}
      if(v.stun>0){v.stun-=dt;tgt=0}
      if(tgt<1&&v.stun<=0){v.blk+=dt;if(v.blk>3.5){v.ghost=3;v.blk=0}}else v.blk=Math.max(0,v.blk-dt);
      if(v.hornT>0)v.hornT-=dt;
      const dv=tgt-v.v;v.v+=Math.max(-16*dt,Math.min(6*dt,dv));
      if(v.aside>0)v.aside-=dt;
      along+=dir*v.v*dt;
      let lt=this.laneT(v);if(v.aside>0&&!v.chaser){lt+=(ax?-dir:dir)*2.4}
      lat+=(lt-lat)*Math.min(1,dt*3);
      // crossings
      const prevAlong=ax?v.px:v.pz;
      for(let k=0;k<7;k++){const c=XS[k];if((prevAlong-c)*(along-c)<0){ if(Math.sign(along-prevAlong)!==dir)continue;
        const na=ax?'z':'x',opts=[];
        if(k+dir>=0&&k+dir<=6)opts.push({axis:v.axis,dir,idx:v.idx,w:.6});
        for(const nd of[-1,1])if(v.idx+nd>=0&&v.idx+nd<=6)opts.push({axis:na,dir:nd,idx:k,w:.2});
        let ch;
        if(v.chaser){let best=1e9;const cx=ax?XS[k]:XS[v.idx],cz=ax?XS[v.idx]:XS[k];for(const o of opts){const qx=cx+(o.axis==='x'?o.dir*60:0),qz=cz+(o.axis==='z'?o.dir*60:0);const d=Math.hypot(pl.x-qx,pl.z-qz);if(d<best){best=d;ch=o}}}
        else{let sum=0;opts.forEach(o=>sum+=o.w);let r=this.rnd()*sum;for(const o of opts){r-=o.w;if(r<=0){ch=o;break}}ch=ch||opts[0]}
        if(ch&&(ch.axis!==v.axis||ch.dir!==v.dir)){ // turn: convert coordinates
          if(ax){v.x=XS[k];v.z=lat;along=lat;lat=XS[k]}else{v.z=XS[k];v.x=lat;along=lat;lat=XS[k]}
          v.axis=ch.axis;v.dir=ch.dir;v.idx=ch.idx;v.v*=.7;
          if(v.axis==='x'){v.x=along;v.z=lat}else{v.z=along;v.x=lat}
          // re-evaluate remaining loop with new axis
          break}
        else if(!ch){v.dir=-v.dir}
      }}
      if(v.axis==='x'){v.x=along;v.z=lat}else{v.z=along;v.x=lat}
      v.x+=v.kx*dt;v.z+=v.kz*dt;const kd=Math.exp(-3*dt);v.kx*=kd;v.kz*=kd;
      // hard clamp
      v.x=Math.max(-296,Math.min(296,v.x));v.z=Math.max(-296,Math.min(296,v.z));
      const ddx=v.x-v.px,ddz=v.z-v.pz;if(ddx*ddx+ddz*ddz>1e-6){const t=Math.atan2(ddx,ddz);v.th+=ang(v.th,t)*Math.min(1,dt*(v.chaser?9:6))}
    }
    // traffic-traffic soft separation
    for(let a=0;a<L.length;a++)for(let b=a+1;b<L.length;b++){const p=L[a],q=L[b];if(Math.abs(p.x-q.x)>10||Math.abs(p.z-q.z)>10)continue;
      if(p.chaser||q.chaser)continue;
      for(const ca of p.c)for(const cb of q.c){const ap=cpos(p,ca),bp=cpos(q,cb),dx=bp[0]-ap[0],dz=bp[1]-ap[1],d=Math.hypot(dx,dz),r=ca[1]+cb[1];if(d<r&&d>1e-4){const o=(r-d)/2,nx=dx/d,nz=dz/d;p.x-=nx*o;p.z-=nz*o;q.x+=nx*o;q.z+=nz*o}}}
    const near=pl;
    for(const v of L){this.sync(v);v.mesh.visible=Math.abs(v.x-near.x)<380&&Math.abs(v.z-near.z)<380}
  }
}
export const cpos=(e,c)=>[e.x+Math.sin(e.th)*c[0],e.z+Math.cos(e.th)*c[0]];
