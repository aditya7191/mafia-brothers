import * as THREE from './three.module.min.js';
import {XS} from './city.js';
import {halo,beamTex,poolTex,groundQuad,nightify,sigState} from './fx.js';
const sGeo=new THREE.SphereGeometry(1,10,8),bG=new THREE.BoxGeometry(1,1,1),cG=new THREE.CylinderGeometry(1,1,1,16);
const mc={},gc={},pc={};
// trim / plastics (Phong), paint + glass + chrome (physically based, picks up the scene environment map for reflections)
const M=h=>mc[h]||(mc[h]=new THREE.MeshPhongMaterial({color:h,shininess:70,specular:0x4a4f60}));
const GL=h=>gc[h]||(gc[h]=new THREE.MeshBasicMaterial({color:h}));
const PAINT=h=>pc[h]||(pc[h]=new THREE.MeshStandardMaterial({color:h,metalness:.32,roughness:.28,envMapIntensity:1.9}));
const GLASSM=new THREE.MeshStandardMaterial({color:0x0b1520,metalness:.9,roughness:.07,envMapIntensity:1.5});
const CHROME=new THREE.MeshStandardMaterial({color:0xdfe3ea,metalness:1,roughness:.16,envMapIntensity:1.3});
const TYRE=new THREE.MeshLambertMaterial({color:0x101012}),RIMD=new THREE.MeshPhongMaterial({color:0x2a2c33,shininess:60});
function part(p,mat,sx,sy,sz,x,y,z){const m=new THREE.Mesh(bG,mat);m.scale.set(sx,sy,sz);m.position.set(x,y,z);p.add(m);return m}
const DL=(g,m)=>{(g.userData.dl||(g.userData.dl=[])).push(m);return m}; // detail meshes hidden for distant traffic (LOD)
function wheel(g,x,y,z,r,w,steer){const sg=new THREE.Group();sg.position.set(x,y,z);const sp=new THREE.Group();sg.add(sp);
  const t=new THREE.Mesh(cG,TYRE);t.scale.set(r,w,r);t.rotation.z=Math.PI/2;sp.add(t);
  const rim=new THREE.Mesh(cG,CHROME);rim.scale.set(r*.64,w+.03,r*.64);rim.rotation.z=Math.PI/2;sp.add(rim);
  for(let k=0;k<3;k++){const s=new THREE.Mesh(bG,RIMD);s.scale.set(w+.05,r*1.05,r*.14);s.rotation.x=k*Math.PI/3;sp.add(DL(g,s))}
  g.add(sg);(g.userData.wh||(g.userData.wh=[])).push({sg,sp,r,steer:!!steer,sd:Math.sign(x)||1});return sg}
export function animWheels(g,spd,steer,dt){const w=g.userData.wh;if(!w)return;for(const q of w){q.sp.rotation.x+=spd*dt/q.r;if(q.steer)q.sg.rotation.y=steer*.5}}
let shadowTex;
function shadow(p,w,l){if(!shadowTex){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'rgba(0,0,0,.5)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);shadowTex=new THREE.CanvasTexture(c)}
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,l),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.1;p.add(m)}
// head + tail lights; tail lights are per-vehicle so brake lights can brighten
const tailBase=0xb01818,tailOn=0xff4a4a;
const glowSet=(g,w,y,zf,zb,bw)=>{
  [-w,w].forEach(x=>{const h=nightify(halo(0xfff0c8,2.2,.8));h.position.set(x,y,zf+.2);g.add(h);const t=halo(0xff2a2a,1.7,.7);t.material=t.material.clone();t.position.set(x,y,zb-.15);g.add(nightify(t));(g.userData.th||(g.userData.th=[])).push(t)});
  const b=nightify(groundQuad(bw||w*2+2.6,11,beamTex(),0xfff0c8,.5,.15));b.position.z=zf+5.4;g.add(b)};
const lights=(g,w,y,zf,zb)=>{part(g,GL(0xfff4c0),.5,.24,.12,-w,y,zf);part(g,GL(0xfff4c0),.5,.24,.12,w,y,zf);
  const tm=new THREE.MeshBasicMaterial({color:tailBase});g.userData.tm=tm;part(g,tm,.5,.2,.12,-w,y,zb);part(g,tm,.5,.2,.12,w,y,zb);part(g,GL(0xff8a30),.2,.1,.1,-w-.34,y,zf-.02);part(g,GL(0xff8a30),.2,.1,.1,w+.34,y,zf-.02);glowSet(g,w,y,zf,zb)};
export function setBrake(g,on){const u=g.userData;if(u.tm){u.tm.color.setHex(on?tailOn:tailBase);if(u.th)for(const h of u.th){h.material.opacity=on?1:.7;h.scale.setScalar(on?2.6:1.7)}}}
const MIR={aditya:[1.0,1.05,.5],pravin:[1.14,1.72,.95],deep:[.9,.95,.4],taxi:[.97,1.0,.5],sedan:[.97,1.0,.5],police:[1.0,1.08,.5],rival:[1.06,1.3,.6],toro:[1.0,.9,.55]};
function finish(g,kind){const m=MIR[kind];
  if(m){for(const sd of[-1,1]){const a=part(g,M(0x0c0f16),.14,.14,.26,sd*(m[0]+.1),m[1],m[2]);const b=part(g,M(0x0c0f16),.05,.1,.06,sd*(m[0]-.02),m[1]-.05,m[2]-.1);DL(g,a);DL(g,b)}}
  g.traverse(o=>{if(o.isMesh&&!o.material.transparent)o.castShadow=true});return g}
export const SPEC={ // circles along z (centre offset, radius), half-length, cruise speed
  aditya:{c:[[1.15,1.05],[-1.15,1.05]],half:2.2},pravin:{c:[[1.3,1.18],[-1.3,1.18]],half:2.4},deep:{c:[[1,.95],[-1,.95]],half:1.9},
  taxi:{c:[[1.15,1.05],[-1.15,1.05]],half:2.2,cruise:9},sedan:{c:[[1.15,1.05],[-1.15,1.05]],half:2.2,cruise:10.5},
  bus:{c:[[3.2,1.4],[0,1.4],[-3.2,1.4]],half:4.8,cruise:7},auto:{c:[[.7,.85],[-.7,.85]],half:1.5,cruise:8},rival:{c:[[1.2,1.1],[-1.2,1.1]],half:2.3,cruise:20},
  toro:{c:[[1.35,1.05],[-1.35,1.05]],half:2.45},hblade:{c:[[.85,.5],[-.85,.5]],half:1.2},police:{c:[[1.15,1.05],[-1.15,1.05]],half:2.3,cruise:20},
  moto:{c:[[.6,.5],[-.6,.5]],half:1.1,cruise:11.5},suv:{c:[[1.3,1.18],[-1.3,1.18]],half:2.4,cruise:9.5},hatch:{c:[[1.15,1.05],[-1.15,1.05]],half:2.1,cruise:10}};
export const VEH={
  aditya:{name:'Aditya ki Hatchback',phys:{maxS:28,acc:11,steer:1.75,mass:1.0,grip:8},cam:[8.5,3.8]},
  pravin:{name:'Pravin ki SUV',phys:{maxS:25,acc:10,steer:1.5,mass:1.7,grip:9},cam:[9.2,4.2]},
  deep:{name:'Deep ki Compact',phys:{maxS:30,acc:13,steer:2.05,mass:0.8,grip:7},cam:[8,3.6]},
  toro:{name:'Toro V12',phys:{maxS:34,acc:14,steer:1.6,mass:1.3,grip:7.5},cam:[9.6,3.5]},
  hblade:{name:'Hyper H-Blade',phys:{maxS:38,acc:17,steer:1.9,mass:0.6,grip:14,bike:true},cam:[6.6,2.7],bike:true},
  taxi:{name:'Taxi',phys:{maxS:24,acc:10,steer:1.7,mass:1.0,grip:8},cam:[8.5,3.8]},
  sedan:{name:'Sedan',phys:{maxS:27,acc:11,steer:1.7,mass:1.1,grip:8},cam:[8.6,3.8]},
  auto:{name:'Auto Rickshaw',phys:{maxS:19,acc:9,steer:2.1,mass:.7,grip:6},cam:[7.4,3.3]},
  bus:{name:'City Bus',phys:{maxS:20,acc:7,steer:1.15,mass:3,grip:6},cam:[13,5.4]},
  suv:{name:'SUV',phys:{maxS:25,acc:10,steer:1.5,mass:1.7,grip:9},cam:[9.2,4.2]},
  hatch:{name:'Hatchback',phys:{maxS:27,acc:11,steer:1.8,mass:1.0,grip:8},cam:[8.4,3.7]},
  moto:{name:'Street Bike',phys:{maxS:30,acc:14,steer:1.9,mass:.5,grip:13,bike:true},cam:[6.2,2.6],bike:true},
  police:{name:'Police Cruiser',phys:{maxS:31,acc:13,steer:1.7,mass:1.2,grip:8},cam:[8.6,3.8]},
  rival:{name:'Rival Jeep',phys:{maxS:28,acc:11,steer:1.5,mass:1.5,grip:8},cam:[9,4]}};
// bevelled side-profile extrusion: pts are (z,y) pairs, depth is the car width
const gcache={};
function prof(pts,depth,bev=.08){const k=pts.join(',')+'|'+depth+'|'+bev;if(gcache[k])return gcache[k];const sh=new THREE.Shape();pts.forEach((p,i)=>i?sh.lineTo(p[0],p[1]):sh.moveTo(p[0],p[1]));
  const d=Math.max(.05,depth-2*bev),g=new THREE.ExtrudeGeometry(sh,{depth:d,bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:2,curveSegments:2});g.translate(0,0,-d/2);g.rotateY(-Math.PI/2);g.computeVertexNormals();return gcache[k]=g}
const PAL=[0xe53935,0x1e88e5,0xfdd835,0x43a047,0x8e24aa,0xfb8c00,0x00acc1,0xeeeeee,0x212121,0xe91e63,0x3949ab,0x7cb342];
// generic road-car builder
function car(g,K){const W=K.w,paint=PAINT(K.color);
  g.add(new THREE.Mesh(prof(K.body,W),paint));
  const cab=new THREE.Mesh(prof(K.cab,W*.9,.06),GLASSM);g.add(cab);
  const rf=K.roof;part(g,K.roofColor?PAINT(K.roofColor):paint,W*.84,.07,rf[1],0,rf[0],rf[2]);
  part(g,M(0x15161a),W*.99,.3,.28,0,.44,K.len/2+.02);part(g,M(0x15161a),W*.99,.3,.28,0,.44,-K.len/2-.02);          // bumpers
  part(g,CHROME,W*.5,.14,.06,0,.62,K.len/2+.14);part(g,M(0x0a0a0c),W*.52,.12,.05,0,.82,K.len/2-.02);                  // grille + plate area
  part(g,M(0xf4f4f4),.5,.14,.03,0,.5,-K.len/2-.18);part(g,M(0xf4f4f4),.5,.14,.03,0,.5,K.len/2+.18);               // plates (blank)
  for(const sd of[-1,1]){DL(g,part(g,M(0x0a0a0c),.02,.5,.03,sd*(W/2+.01),.78,K.seam||.2));DL(g,part(g,M(0x0a0a0c),.02,.5,.03,sd*(W/2+.01),.78,K.seam?K.seam-1.3:-1.1));DL(g,part(g,CHROME,.03,.04,.22,sd*(W/2+.03),.96,K.seam?K.seam+.45:.5));
    part(g,M(0x15161a),.1,.12,K.len*.62,sd*(W/2-.02),.36,0)}                                                         // skirts
  if(K.spoiler){part(g,M(0x111114),W*.86,.07,.5,0,K.spoiler[0],K.spoiler[1]);for(const sd of[-1,1])part(g,M(0x111114),.08,.3,.3,sd*W*.3,K.spoiler[0]-.17,K.spoiler[1])}
  const wy=K.wr;[[-1,K.wf],[1,K.wf],[-1,K.wb],[1,K.wb]].forEach(([sd,z],i)=>wheel(g,sd*(W/2-.03),wy,z,wy,K.ww||.3,i<2));
  lights(g,K.lx||W*.34,K.ly||.74,K.len/2+.03,-K.len/2-.03);shadow(g,W+.9,K.len+1.1);return g}
const HATCH={len:4.1,w:1.95,color:0xe63946,wr:.4,wf:1.3,wb:-1.3,body:[[-2.05,.34],[2.05,.34],[2.1,.62],[1.6,.8],[.6,.92],[-1.3,.96],[-1.95,.9],[-2.1,.6]],cab:[[.95,.9],[.45,1.5],[-1.0,1.52],[-1.75,1.0]],roof:[1.53,-.3,2.0],seam:.3,spoiler:[1.55,-1.85]};
const SEDAN={len:4.4,w:1.9,color:0xeeeeee,wr:.38,wf:1.4,wb:-1.4,body:[[-2.2,.34],[2.2,.34],[2.25,.62],[1.55,.8],[.7,.92],[-1.6,.94],[-2.2,.85]],cab:[[.8,.9],[.15,1.46],[-1.0,1.48],[-1.6,.93]],roof:[1.49,-.45,1.2],seam:.2};
const SUV={len:4.5,w:2.2,color:0x2a6fdb,wr:.52,wf:1.45,wb:-1.45,ww:.4,body:[[-2.25,.4],[2.25,.4],[2.3,.8],[1.7,1.02],[-2.2,1.05]],cab:[[1.2,1.0],[.85,1.78],[-1.95,1.82],[-2.2,1.05]],roof:[1.84,-.5,2.9],seam:.35,lx:.8,ly:.95};
const COMP={len:3.5,w:1.8,color:0x29b765,wr:.36,wf:1.1,wb:-1.1,ww:.26,body:[[-1.75,.32],[1.75,.32],[1.8,.58],[1.3,.72],[.4,.84],[-1.0,.88],[-1.7,.82]],cab:[[.7,.84],[.35,1.44],[-.85,1.46],[-1.55,.9]],roof:[1.47,-.25,1.5],seam:.2,lx:.6,ly:.66};
export function buildModel(kind,opt={}){
  const g=new THREE.Group();g.userData.kind=kind;
  if(kind==='aditya'){car(g,Object.assign({},HATCH,{color:0xe63946}));part(g,M(0xffffff),.34,.03,4.0,.3,.97,0);part(g,M(0xffffff),.34,.03,4.0,-.3,.97,0);part(g,M(0xffffff),.34,.02,2.0,.3,1.6,-.3);part(g,M(0xffffff),.34,.02,2.0,-.3,1.6,-.3)}
  else if(kind==='suv'){car(g,Object.assign({},SUV,{color:opt.color||PAL[Math.floor(Math.random()*PAL.length)]}))}
  else if(kind==='hatch'){car(g,Object.assign({},HATCH,{color:opt.color||PAL[Math.floor(Math.random()*PAL.length)],spoiler:null}))}
  else if(kind==='pravin'){car(g,SUV);for(const sd of[-1,1])part(g,CHROME,.05,.05,2.8,sd*.8,1.9,-.5);part(g,M(0xffcc00),.3,.06,4.4,0,1.06,0)}
  else if(kind==='deep'){car(g,COMP);part(g,M(0xffffff),.5,.02,1.5,0,1.52,-.25)}
  else if(kind==='taxi'){car(g,Object.assign({},SEDAN,{color:0xf2b705,roofColor:0xf2b705}));part(g,GL(0xffffff),.7,.22,.3,0,1.64,-.35);part(g,M(0x15151a),1.92,.08,3.6,0,.62,0);for(let k=0;k<8;k++)part(g,M(k%2?0x15151a:0xf5f5f5),.2,.14,.26,-.85+k*.24,.78,.2).scale.x=.24}
  else if(kind==='sedan'){car(g,Object.assign({},SEDAN,{color:opt.color||PAL[Math.floor(Math.random()*PAL.length)]}))}
  else if(kind==='police'){car(g,Object.assign({},SEDAN,{color:0xf4f6fa,roofColor:0xf4f6fa}));part(g,PAINT(0x1d3f8f),1.93,.28,4.3,0,.5,0);
    const bR=new THREE.MeshBasicMaterial({color:0xff2020}),bB=new THREE.MeshBasicMaterial({color:0x2060ff});g.userData.lr=bR;g.userData.lb=bB;
    part(g,bR,.7,.14,.3,.4,1.62,-.45);part(g,bB,.7,.14,.3,-.4,1.62,-.45);{const hr=halo(0xff2020,3.4,.9),hb=halo(0x2a60ff,3.4,.9);hr.material=hr.material.clone();hb.material=hb.material.clone();hr.position.set(.4,1.9,-.45);hb.position.set(-.4,1.9,-.45);g.add(hr,hb);g.userData.hr=hr;g.userData.hb=hb}}
  else if(kind==='rival'){car(g,Object.assign({},SUV,{color:0x2b1d3a,len:4.4}));part(g,M(0xff7a00),.5,.05,4.2,.45,1.88,-.5);part(g,M(0xff7a00),.5,.05,4.2,-.45,1.88,-.5);part(g,GL(0xff3b3b),.5,.2,.2,0,2.0,-.5)}
  else if(kind==='bus'){
    part(g,PAINT(0xc62828),2.6,1.5,9.6,0,1.1,0);part(g,GLASSM,2.62,1.0,8.8,0,2.35,-.1);part(g,PAINT(0xf3e5c0),2.6,.35,9.6,0,3.02,0);part(g,PAINT(0xc62828),2.62,.9,9.6,0,.55,0);
    for(let k=0;k<6;k++)for(const sd of[-1,1])DL(g,part(g,M(0x0a0a0c),.03,.95,.06,sd*1.31,2.35,-3.9+k*1.6));
    part(g,GL(0xffc04a),1.6,.4,.1,0,2.9,4.83);part(g,M(0x555555),2.2,.1,6,0,3.25,-.5);
    [[-1.3,3.2],[1.3,3.2],[-1.3,-3],[1.3,-3]].forEach(([x,z],i)=>wheel(g,x,.55,z,.55,.4,i<2));lights(g,.95,.7,4.82,-4.82);shadow(g,3.4,10.6)}
  else if(kind==='auto'){
    const au=0xf2b705;part(g,PAINT(0x15151a),1.4,.55,2.5,0,.55,-.1);part(g,PAINT(au),1.4,.9,1.7,0,1.2,-.5);part(g,M(0x15151a),1.5,.12,2.4,0,1.72,-.2);part(g,GLASSM,1.3,.55,.1,0,1.35,.4);
    part(g,M(0x15151a),.9,.5,.9,0,.5,1.1);part(g,CHROME,1.1,.08,.1,0,1.1,1.05);part(g,GL(0xfff4c0),.3,.2,.1,0,.7,1.58);
    wheel(g,0,.33,1.15,.33,.2,true);wheel(g,-.78,.33,-.8,.33,.24);wheel(g,.78,.33,-.8,.33,.24);{const tm=new THREE.MeshBasicMaterial({color:tailBase});g.userData.tm=tm;part(g,tm,.3,.15,.1,0,.7,-1.4);const h=nightify(halo(0xfff0c8,2.2,.8));h.position.set(0,.7,1.7);g.add(h);const b=nightify(groundQuad(2,9,beamTex(),0xfff0c8,.45,.15));b.position.z=6;g.add(b)}
    shadow(g,2,3.4)}
  else if(kind==='moto'){ // commuter motorbike with rider
    const lean=new THREE.Group();g.add(lean);g.userData.lean=lean;const col=opt.color||PAL[Math.floor(Math.random()*PAL.length)];
    const wh=(z,r,w,st)=>{const s=new THREE.Group();s.position.set(0,r,z);const sp=new THREE.Group();s.add(sp);const t=new THREE.Mesh(cG,TYRE);t.scale.set(r,w,r);t.rotation.z=Math.PI/2;sp.add(t);const rm=new THREE.Mesh(cG,CHROME);rm.scale.set(r*.6,w+.02,r*.6);rm.rotation.z=Math.PI/2;sp.add(rm);const sk=new THREE.Mesh(bG,RIMD);sk.scale.set(w+.04,r*1.1,r*.14);sp.add(DL(g,sk));lean.add(s);(g.userData.wh||(g.userData.wh=[])).push({sg:s,sp,r,steer:st,sd:1})};
    wh(.85,.34,.14,true);wh(-.8,.34,.16,false);
    part(lean,PAINT(col),.34,.36,.9,0,.62,.1);part(lean,M(0x1a1a20),.3,.1,.8,0,.9,-.35);part(lean,PAINT(col),.4,.28,.5,0,.84,.55);part(lean,M(0x2a2a30),.22,.25,.4,0,.45,-.1);
    part(lean,CHROME,.1,.1,.5,.17,.36,-.7).rotation.x=.1;part(lean,M(0x333333),.7,.06,.06,0,1.12,.6);part(lean,GL(0xfff7d0),.24,.16,.08,0,.95,.92);{const tm=new THREE.MeshBasicMaterial({color:tailBase});g.userData.tm=tm;part(lean,tm,.22,.1,.06,0,.85,-.78);const h=nightify(halo(0xfff0c8,2,.85));h.position.set(0,.95,1.05);g.add(h);const t=halo(0xff2a2a,1.3,.7);t.material=t.material.clone();t.position.set(0,.85,-.9);g.add(nightify(t));g.userData.th=[t];const b=nightify(groundQuad(1.8,9,beamTex(),0xfff0c8,.45,.15));b.position.z=5.6;g.add(b)}
    const rc=PAL[Math.floor(Math.random()*PAL.length)],rd=new THREE.Group();lean.add(rd);rd.position.set(0,.95,-.3);part(rd,M(rc),.4,.55,.28,0,.42,0).rotation.x=.3;const hd=new THREE.Mesh(sGeo,M(0x222222));hd.scale.set(.2,.22,.22);hd.position.set(0,.88,.1);rd.add(hd);
    for(const sd of[-1,1]){part(rd,M(rc),.12,.12,.55,sd*.24,.5,.35).rotation.x=.3;part(rd,M(0x23283d),.14,.5,.18,sd*.2,.0,.1)}
    shadow(g,1.1,2.6)}
  else if(kind==='toro'){ // original wedge supercar with scissor doors
    const body=0xffb000,P=PAINT(body);
    const mk=(pts,depth,mat,bev=.05)=>{const m=new THREE.Mesh(prof(pts,depth,bev),mat);g.add(m);return m};
    mk([[-2.3,.3],[2.3,.3],[2.45,.5],[1.05,.8],[-.2,1.16],[-1.0,1.16],[-1.95,1.0],[-2.3,.93]],1.95,P,.06);
    mk([[.85,.84],[-.2,1.1],[-1.4,1.04],[-1.75,.9],[-1.2,.82]],1.9,GLASSM,.04);
    const ws=part(g,GLASSM,1.7,.05,1.45,0,.98,.5);ws.rotation.x=-.27;
    part(g,M(0x111114),2.2,.07,.55,0,.3,2.35);part(g,M(0x111114),1.9,.1,.5,0,.35,-2.3);
    for(const sd of[-1,1]){part(g,M(0x111114),.34,.26,1.1,sd*1.0,.66,-1.15);{const dg=new THREE.Group();dg.position.set(sd*.99,.5,.95);const dp=part(dg,PAINT(body),.07,.34,1.15,0,.12,-.58);g.add(dg);(g.userData.doors||(g.userData.doors=[])).push(dg)}DL(g,part(g,M(0x0a0a0c),.02,.34,.05,sd*1.0,.62,.9))}
    part(g,M(0x111114),.1,.35,.1,.7,1.15,-2.1);part(g,M(0x111114),.1,.35,.1,-.7,1.15,-2.1);part(g,PAINT(0x111114),2.1,.07,.55,0,1.36,-2.2);
    part(g,M(0x111114),.5,.04,1.0,0,1.17,-.6);part(g,M(0x111114),1.2,.03,.04,0,.52,2.43);
    const hl=part(g,GL(0xf4fbff),.62,.07,.1,.62,.6,2.35);hl.rotation.z=.18;const hr=part(g,GL(0xf4fbff),.62,.07,.1,-.62,.6,2.35);hr.rotation.z=-.18;
    const tm=new THREE.MeshBasicMaterial({color:tailBase});g.userData.tm=tm;part(g,tm,1.7,.07,.05,0,.85,-2.31);
    for(const sd of[-1,1])part(g,CHROME,.2,.2,.3,sd*.45,.4,-2.4);
    // exhaust flame (visible on full throttle)
    g.userData.flames=[];for(const sd of[-1,1]){const f=new THREE.Mesh(new THREE.ConeGeometry(.14,1.6,8),new THREE.MeshBasicMaterial({color:0xff9a2a,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));f.rotation.x=-Math.PI/2;f.position.set(sd*.45,.4,-3.2);f.visible=false;g.add(f);g.userData.flames.push(f)}
    [-1,1].forEach(sd=>{const h=nightify(halo(0xe8f6ff,2.4,.85));h.position.set(sd*.62,.6,2.55);g.add(h);const t=halo(0xff2a2a,1.9,.75);t.material=t.material.clone();t.position.set(sd*.7,.85,-2.5);g.add(nightify(t));(g.userData.th||(g.userData.th=[])).push(t)});
    {const b=nightify(groundQuad(3.2,11,beamTex(),0xe8f6ff,.5,.15));b.position.z=7.6;g.add(b);const ug=nightify(groundQuad(4.6,7.4,poolTex(),0x20d8ff,.6,.14));g.add(ug)}
    [[-1.05,1.45,.38,.32],[1.05,1.45,.38,.32],[-1.08,-1.45,.42,.4],[1.08,-1.45,.42,.4]].forEach(([x,z,r,w],i)=>wheel(g,x,r,z,r,w,i<2));
    shadow(g,2.8,5.4)}
  else if(kind==='hblade'){ // original supercharged hyperbike
    const lean=new THREE.Group();g.add(lean);g.userData.lean=lean;const grn=0x6dff2a,blk=0x16161c,gm=0x3a3d46;
    const wh=(z,r,w,st)=>{const s=new THREE.Group();s.position.set(0,r,z);const sp=new THREE.Group();s.add(sp);const t=new THREE.Mesh(cG,TYRE);t.scale.set(r,w,r);t.rotation.z=Math.PI/2;sp.add(t);const rm=new THREE.Mesh(cG,CHROME);rm.scale.set(r*.62,w+.02,r*.62);rm.rotation.z=Math.PI/2;sp.add(rm);for(let k=0;k<3;k++){const sk=new THREE.Mesh(bG,RIMD);sk.scale.set(w+.04,r*1.1,r*.12);sk.rotation.x=k*Math.PI/3;sp.add(DL(g,sk))}lean.add(s);(g.userData.wh||(g.userData.wh=[])).push({sg:s,sp,r,steer:st,sd:1})};
    wh(1.0,.37,.2,true);wh(-.95,.38,.3,false);
    part(lean,PAINT(grn),.2,.34,1.3,0,.58,0);part(lean,M(gm),.42,.4,.75,0,.48,-.05);part(lean,CHROME,.18,.18,.3,0,.78,.35);
    part(lean,PAINT(blk),.44,.3,.75,0,.98,.2);part(lean,PAINT(grn),.46,.05,.5,0,1.14,.2);
    const nose=part(lean,PAINT(blk),.52,.34,.75,0,.9,.85);nose.rotation.x=-.28;part(lean,PAINT(grn),.54,.04,.4,0,1.08,.85).rotation.x=-.28;
    const wsr=part(lean,GLASSM,.3,.3,.05,0,1.22,.55);wsr.rotation.x=-.5;
    [-1,1].forEach(sd=>{const f=part(lean,CHROME,.07,.75,.07,sd*.12,.72,.95);f.rotation.x=.3});
    part(lean,M(0x222226),.8,.05,.05,0,1.18,.45);part(lean,M(blk),.32,.1,.65,0,.97,-.5);
    const tail=part(lean,PAINT(blk),.34,.2,.7,0,1.03,-1.05);tail.rotation.x=.18;part(lean,PAINT(grn),.36,.04,.5,0,1.14,-1.0).rotation.x=.18;
    for(const sd of[-1,1])part(lean,CHROME,.14,.14,.8,sd*.24,.38,-.85);part(lean,GL(0xfff7d0),.34,.18,.06,0,.9,1.22);
    const tm=new THREE.MeshBasicMaterial({color:tailBase});g.userData.tm=tm;part(lean,tm,.3,.07,.05,0,1.04,-1.42);
    g.userData.flames=[];for(const sd of[-1,1]){const f=new THREE.Mesh(new THREE.ConeGeometry(.1,1.3,8),new THREE.MeshBasicMaterial({color:0xff9a2a,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));f.rotation.x=-Math.PI/2;f.position.set(sd*.24,.38,-2.0);f.visible=false;lean.add(f);g.userData.flames.push(f)}
    {const h=nightify(halo(0xfff0c8,2.3,.85));h.position.set(0,.9,1.35);g.add(h);const t=halo(0xff2a2a,1.5,.75);t.material=t.material.clone();t.position.set(0,1.04,-1.55);g.add(nightify(t));g.userData.th=[t];const b=nightify(groundQuad(2.4,10,beamTex(),0xfff0c8,.5,.15));b.position.z=6.4;g.add(b);const ug=nightify(groundQuad(2.2,3.6,poolTex(),0x6dff2a,.5,.14));g.add(ug)}
    const rc=opt.color||0xe63946,rd=new THREE.Group();lean.add(rd);rd.position.set(0,1.0,-.45);
    const tor=part(rd,M(rc),.46,.62,.3,0,.42,0);tor.rotation.x=.75;const hd=new THREE.Mesh(sGeo,M(rc));hd.scale.set(.23,.24,.25);hd.position.set(0,.88,.42);rd.add(hd);part(rd,GLASSM,.3,.1,.1,0,.9,.65);
    [-1,1].forEach(sd=>{const a=part(rd,M(rc),.14,.14,.75,sd*.28,.5,.62);a.rotation.x=.25;const l=part(rd,M(0x23283d),.16,.2,.8,sd*.3,.0,.1);l.rotation.x=-.15});
    shadow(g,1.1,3.2)}
  else{car(g,SEDAN)}
  return finish(g,kind);
}
export function personModel(color,skin){const g=new THREE.Group();part(g,M(color),.55,.9,.4,0,.9,0);part(g,M(skin),.38,.38,.38,0,1.55,0);part(g,M(0x222222),.5,.14,.45,0,1.8,0);part(g,M(0x222233),.4,.6,.32,0,.3,0);return g}
const ang=(a,b)=>{let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d};
export class Traffic{
  constructor(scene,rnd){this.scene=scene;this.list=[];this.obst=[];this.rnd=rnd;this.player=null;this.chaser=null;this.target=null;this.t=0;this.extra=[];this.cullR=215}
  spawn(kind,opt={}){
    const sp=SPEC[kind],rnd=this.rnd,axis=opt.axis||(rnd()<.5?'x':'z'),dir=opt.dir||(rnd()<.5?1:-1),idx=opt.idx!==undefined?opt.idx:Math.floor(rnd()*7);
    const mesh=buildModel(kind,{color:opt.color});this.scene.add(mesh);
    const v={kind,mesh,axis,dir,idx,half:sp.half,c:sp.c,cruise:(sp.cruise||9)*(0.9+rnd()*.2),steer:0,brk:0,sig:0,v:0,kx:0,kz:0,stun:0,blk:0,ghost:0,aside:0,th:0,x:0,z:0,chaser:!!opt.chaser,hornT:0,mass:kind==='bus'?3:kind==='auto'||kind==='moto'?.7:1};
    this.place(v,opt.along!==undefined?opt.along:(rnd()*560-280));this.list.push(v);v.px=v.x;v.pz=v.z;return v}
  laneT(v){const o=v.chaser?0:4;return v.axis==='x'?XS[v.idx]-v.dir*o:XS[v.idx]+v.dir*o}
  place(v,along){const lt=this.laneT(v);if(v.axis==='x'){v.x=along;v.z=lt}else{v.z=along;v.x=lt}v.th=v.axis==='x'?(v.dir>0?Math.PI/2:-Math.PI/2):(v.dir>0?0:Math.PI);this.sync(v)}
  sync(v){v.mesh.position.set(v.x,.12,v.z);v.mesh.rotation.y=v.th}
  placeFar(v,from,minD=120){for(let t=0;t<40;t++){v.axis=this.rnd()<.5?'x':'z';v.dir=this.rnd()<.5?1:-1;v.idx=Math.floor(this.rnd()*7);this.place(v,this.rnd()*560-280);if(Math.hypot(v.x-from.x,v.z-from.z)>minD)break}v.v=0;v.kx=v.kz=0;v.px=v.x;v.pz=v.z}
  update(dt,pl){
    const L=this.list;this.t=pl.t!==undefined?pl.t:this.t+dt;
    for(const v of L){
      const ax=v.axis==='x',dir=v.dir;v.px=v.x;v.pz=v.z;
      let along=ax?v.x:v.z,lat=ax?v.z:v.x;
      let tgt=v.cruise;
      if(v.chaser){const d=Math.hypot(pl.x-v.x,pl.z-v.z);tgt=v.chaseFn?v.chaseFn(d):this.chaseSpeed?this.chaseSpeed(d):20}
      const dx=ax?dir:0,dz=ax?0:dir,look=14+v.v*.8;
      if(v.ghost>0)v.ghost-=dt;
      if(!v.chaser&&v.ghost<=0){
        const chk=o=>{const rx=o.x-v.x,rz=o.z-v.z,a=rx*dx+rz*dz;if(a>0&&a<look){const l=Math.abs(-rx*dz+rz*dx);if(l<3.1){const gap=a-v.half-o.half-1.2;tgt=Math.min(tgt,Math.max(0,gap*.7))}}};
        for(const o of L)if(o!==v&&!o.chaser)chk(o);for(const o of this.obst)chk(o);chk({x:pl.x,z:pl.z,half:pl.half});for(const o of this.extra)chk(o);
        v.sig=0;if(this.t>0){const st=sigState(v.axis,this.t);if(st!=='g'){for(const c of XS){const rel=(c-along)*dir;if(rel>0&&rel<look+14){const gap=rel-10.8-v.half;if(gap>-.8&&!(st==='y'&&gap<v.v*.55)){tgt=Math.min(tgt,Math.max(0,gap*.8));v.sig=1}}}}}}
      if(v.stun>0){v.stun-=dt;tgt=0}
      if(tgt<1&&v.stun<=0&&!v.sig){v.blk+=dt;if(v.blk>3.5){v.ghost=3;v.blk=0}}else v.blk=Math.max(0,v.blk-dt);
      if(v.hornT>0)v.hornT-=dt;
      const dv=tgt-v.v;v.brk=dv<-1.2||(v.sig&&v.v<2)?1:0;v.v+=Math.max(-16*dt,Math.min(6*dt,dv));
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
      const ddx=v.x-v.px,ddz=v.z-v.pz;if(ddx*ddx+ddz*ddz>1e-6){const t=Math.atan2(ddx,ddz);const da=ang(v.th,t);v.th+=da*Math.min(1,dt*(v.chaser?9:6));v.steer=Math.max(-1,Math.min(1,-da*3))}else v.steer*=.9
    }
    // traffic-traffic soft separation
    for(let a=0;a<L.length;a++)for(let b=a+1;b<L.length;b++){const p=L[a],q=L[b];if(Math.abs(p.x-q.x)>10||Math.abs(p.z-q.z)>10)continue;
      if(p.chaser||q.chaser)continue;
      for(const ca of p.c)for(const cb of q.c){const ap=cpos(p,ca),bp=cpos(q,cb),dx=bp[0]-ap[0],dz=bp[1]-ap[1],d=Math.hypot(dx,dz),r=ca[1]+cb[1];if(d<r&&d>1e-4){const o=(r-d)/2,nx=dx/d,nz=dz/d;p.x-=nx*o;p.z-=nz*o;q.x+=nx*o;q.z+=nz*o}}}
    const near=pl;
    for(const v of L){this.sync(v);const dx=v.x-near.x,dz=v.z-near.z,d2=dx*dx+dz*dz,R=v.chaser?380:this.cullR;v.mesh.visible=d2<R*R;
      if(v.mesh.visible){const u=v.mesh.userData;if(d2<130*130){animWheels(v.mesh,v.v,v.steer,dt);if(u.tm!==undefined&&v.bk!==v.brk){v.bk=v.brk;setBrake(v.mesh,v.brk)}}
        const det=d2<80*80;if(u.dl&&u.detail!==det){u.detail=det;for(const m of u.dl)m.visible=det}}}
  }
}
export const cpos=(e,c)=>[e.x+Math.sin(e.th)*c[0],e.z+Math.cos(e.th)*c[0]];
