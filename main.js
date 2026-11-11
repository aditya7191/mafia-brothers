import * as THREE from './three.module.min.js';
import {buildCity,XS,LM} from './city.js';
import {Traffic,buildModel,personModel,SPEC,VEH,cpos,animWheels,setBrake} from './vehicles.js';
import {Peds} from './peds.js';
import {buildHome,HR,drawTV} from './home.js';
import {Combat,WEAPONS,buildHuman,animateHuman,pushCircle} from './combat.js';
import {Sfx} from './audio.js';
import {CHARS,portrait} from './portraits.js';
import {MISSIONS,STORY} from './missions.js';
import {ENV,applyVis} from './fx.js';
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angd=(a,b)=>{let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d};
const sfx=new Sfx();
// ---------- renderer / scene
const QS=new URLSearchParams(location.search),Q={shadows:QS.get('q')!=='low',pr:Math.min(window.devicePixelRatio||1,QS.get('q')==='low'?1:1.5),locked:QS.has('q'),slow:0,fr:0,acc:0};
const cv=$('c'),renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Q.pr);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const FOGN=0x10283d,FOGD=0xf0a47a;
const scene=new THREE.Scene();scene.fog=new THREE.Fog(FOGN,55,470);scene.background=new THREE.Color(FOGN);
const camera=new THREE.PerspectiveCamera(62,1,.5,4500);
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();fitMini()}
addEventListener('resize',resize);
const hemi=new THREE.HemisphereLight(0x5a75c0,0x241f3d,1.25);scene.add(hemi);
const sun=new THREE.DirectionalLight(0x9fb4ff,1.1);sun.position.set(-60,80,40);scene.add(sun,sun.target);
sun.castShadow=Q.shadows;sun.shadow.mapSize.set(1024,1024);{const sc=sun.shadow.camera;sc.left=sc.bottom=-38;sc.right=sc.top=38;sc.near=1;sc.far=260}sun.shadow.bias=-.0007;sun.shadow.normalBias=.06;
// sky: dusk (day) and starry night, sun and moon sprites
const mkSky=(stops,stars)=>{const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,512);stops.forEach(([o,col])=>g.addColorStop(o,col));x.fillStyle=g;x.fillRect(0,0,1024,512);
  if(stars){let sd=77;const r=()=>(sd=(sd*1664525+1013904223)>>>0)/4294967296;for(let i=0;i<900;i++){const px=r()*1024,py=Math.pow(r(),1.35)*236,a=.25+r()*.75,sz=r()<.06?2.2:r()<.3?1.4:.8;x.fillStyle=`rgba(${r()<.2?'255,230,200':'210,225,255'},${a})`;x.fillRect(px,py,sz,sz)}
    for(let i=0;i<18;i++){const px=r()*1024,py=r()*190;x.strokeStyle='rgba(255,255,255,.55)';x.lineWidth=1;x.beginPath();x.moveTo(px-4,py);x.lineTo(px+4,py);x.moveTo(px,py-4);x.lineTo(px,py+4);x.stroke()}}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};
const skyD=mkSky([[0,'#2d2a63'],[.18,'#4d3c85'],[.36,'#c1708f'],[.46,'#ffb36b'],[.5,'#ffd9a0'],[.56,'#c98a88'],[1,'#3a3260']],false);
const skyN=mkSky([[0,'#01030a'],[.14,'#040918'],[.3,'#0a1a33'],[.43,'#16405c'],[.5,'#27607a'],[.55,'#143348'],[1,'#050b13']],true);
const sky=new THREE.Mesh(new THREE.SphereGeometry(2500,24,16),new THREE.MeshBasicMaterial({map:skyN,side:THREE.BackSide,fog:false,depthWrite:false}));scene.add(sky);
const sunC=document.createElement('canvas');sunC.width=sunC.height=128;{const x=sunC.getContext('2d'),g=x.createRadialGradient(64,64,4,64,64,64);g.addColorStop(0,'#fffbe0');g.addColorStop(.2,'#ffe08a');g.addColorStop(.5,'rgba(255,150,80,.45)');g.addColorStop(1,'rgba(255,120,60,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}
const sunS=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(sunC),fog:false,depthWrite:false,transparent:true}));sunS.scale.set(700,700,1);scene.add(sunS);
const moonC=document.createElement('canvas');moonC.width=moonC.height=256;{const x=moonC.getContext('2d'),g=x.createRadialGradient(128,128,10,128,128,128);g.addColorStop(0,'rgba(220,235,255,.55)');g.addColorStop(.3,'rgba(150,185,255,.18)');g.addColorStop(1,'rgba(100,140,255,0)');x.fillStyle=g;x.fillRect(0,0,256,256);
  x.fillStyle='#eef4ff';x.beginPath();x.arc(128,128,30,0,7);x.fill();x.fillStyle='rgba(150,165,200,.45)';[[118,120,7],[138,134,5],[124,140,4]].forEach(([a,b,r])=>{x.beginPath();x.arc(a,b,r,0,7);x.fill()})}
const moonS=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(moonC),fog:false,depthWrite:false,transparent:true}));moonS.scale.set(520,520,1);scene.add(moonS);
const SUNDIR=new THREE.Vector3(-1,.06,.12).normalize(),MOONDIR=new THREE.Vector3(.45,.5,.3).normalize();
const city=buildCity(scene);
// reflection environment for glossy car paint (night neon city / dusk), baked once with PMREM
let envN=null,envD=null;
try{const pm=new THREE.PMREMGenerator(renderer);
  const mkEnv=(tex,lights)=>{const es=new THREE.Scene();es.add(new THREE.Mesh(new THREE.SphereGeometry(60,24,16),new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide})));
    lights.forEach(([a,e,c,sx,sy])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,2),new THREE.MeshBasicMaterial({color:c}));m.position.set(Math.cos(a)*46,e,Math.sin(a)*46);m.lookAt(0,0,0);es.add(m)});
    const t=pm.fromScene(es,.03).texture;return t};
  envN=mkEnv(skyN,[[0,6,0xffc27a,10,3],[.9,8,0xff4fa0,14,3],[1.8,5,0x35e0ff,12,3],[2.7,9,0xffd9a0,10,3],[3.6,6,0xff8a3a,12,3],[4.5,8,0x6dff9a,10,3],[5.4,7,0xffc27a,14,3],[2.2,40,0x9fb4ff,12,12]]);
  envD=mkEnv(skyD,[[0,12,0xffffff,24,8],[2.5,30,0xffd9a0,20,10],[4.2,10,0xfff2d0,16,6]]);
  pm.dispose()}catch(e){console.warn('env map unavailable',e)}
const colliders=city.colliders;
let night=true;
function setEnv(n){night=n;ENV.night=n;const f=scene.fog;
  if(n){f.color.setHex(FOGN);f.near=55;f.far=470;scene.background.setHex(FOGN);hemi.color.setHex(0x5a75c0);hemi.groundColor.setHex(0x241f3d);hemi.intensity=1.25;sun.color.setHex(0x9fb4ff);sun.intensity=1.1;renderer.toneMappingExposure=1.2;sky.material.map=skyN}
  else{f.color.setHex(FOGD);f.near=70;f.far=520;scene.background.setHex(FOGD);hemi.color.setHex(0xffc89a);hemi.groundColor.setHex(0x4a3f66);hemi.intensity=1.15;sun.color.setHex(0xffa860);sun.intensity=1.5;renderer.toneMappingExposure=1.0;sky.material.map=skyD}
  if(envN)scene.environment=n?envN:envD;sky.material.needsUpdate=true;sunS.visible=!n;moonS.visible=n;city.setNight(n);applyVis(scene);
  const b=document.getElementById('pEnv');if(b)b.textContent=n?'☀️ Din / Shaam karo':'🌙 Raat karo'}
// ---------- state
const combat=new Combat(scene,colliders,sfx);
const rnd=(()=>{let s=1234;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}})();
const traffic=new Traffic(scene,rnd);
const peds=new Peds(scene,56);const pedVeh=[],pedMe={x:0,z:0,th:0,speed:0,half:2,isPlayer:true,isBike:false};
const GAR={x:235,z:-203};
const STY=[{jacket:0xd62828,pants:0x23283d,skin:0xc88a5c,hair:'spiky',accent:0xe63946,trim:0xffffff},{jacket:0x1d4e89,pants:0x2b2f3d,skin:0xb57750,hair:'cap',accent:0xffcc00,trim:0xffcc00},{jacket:0x2a9d4a,pants:0x23283d,skin:0xd9a37a,hair:'curly',accent:0x7dff9a,trim:0xffffff}];
const WALK=[7.2,6.3,7.9],HPMAX=[200,260,160],WORDER=['pistol','smg','shotgun','blaster'];
const pl={x:-288,z:240,th:Math.PI,vx:0,vz:0,steer:0,lean:0,ch:0,kind:'aditya',mesh:null,half:2.2,c:SPEC.aditya.c,mass:1,speed:0,skid:0,P:VEH.aditya.phys,cam:[8.5,3.8],bike:false,foot:false};
const fp={x:0,z:0,th:0,vx:0,vz:0,mesh:null,walk:0,aim:null,shootT:0,flashT:0,half:.5};
const hero={hp:100,max:100,weapons:{pistol:true,smg:false,shotgun:false,blaster:false},ammo:{pistol:30,smg:0,shotgun:0,blaster:0},cur:'pistol',hurtT:0,armor:0,since:99};
const parked=[];traffic.obst=parked;
function updateWho(){$('who').textContent=(CHARS[pl.ch].name+' • '+VEH[pl.kind].name).toUpperCase()}
function applyVeh(kind){const V=VEH[kind],S=SPEC[kind];pl.kind=kind;pl.P=V.phys;pl.mass=V.phys.mass;pl.half=S.half;pl.c=S.c;pl.bike=!!V.bike;pl.cam=V.cam;pl.lean=0;updateWho()}
function setVehicle(kind){if(pl.mesh)scene.remove(pl.mesh);pl.mesh=buildModel(kind,{color:CHARS[pl.ch].car});pl.mesh.visible=false;scene.add(pl.mesh);applyVeh(kind)}
function setChar(i,keepVeh){pl.ch=i;hero.max=HPMAX[i];hero.hp=Math.min(hero.max,Math.max(hero.hp,1));if(fp.mesh)scene.remove(fp.mesh);fp.mesh=buildHuman(STY[i]);fp.mesh.visible=false;scene.add(fp.mesh);if(!keepVeh)setVehicle(CHARS[i].id);else updateWho()}
setChar(0);
function addParked(kind,x,z,th){const m=buildModel(kind,{color:0xe63946});m.position.set(x,.12,z);m.rotation.y=th;scene.add(m);const S=SPEC[kind];const o={kind,x,z,th,mesh:m,c:S.c,half:S.half,mass:3};parked.push(o);return o}
function resetGarage(){for(const p of parked)scene.remove(p.mesh);parked.length=0;addParked('toro',226.5,-216,0);addParked('hblade',244.5,-216,.3)}
resetGarage();
function spawnTraffic(){const kinds=['taxi','taxi','taxi','taxi','bus','bus','bus','auto','auto','auto','auto','auto','sedan','sedan','sedan','sedan','sedan','hatch','hatch','hatch','hatch','suv','suv','suv','moto','moto','moto','moto','moto','moto','taxi','taxi','sedan','hatch'];kinds.forEach(k=>traffic.spawn(k))}
spawnTraffic();
let state='splash',M=null,paused=false,mode='free',cash=0,gtime=0,addaT=0;
let prog={unlocked:1,best:{},cash:0,storySeen:false};
try{const p=JSON.parse(localStorage.getItem('mb_prog')||'null');if(p)prog=Object.assign(prog,p)}catch(e){}
const save=()=>{try{localStorage.setItem('mb_prog',JSON.stringify(prog))}catch(e){}};
setEnv(!prog.day);
cash=prog.cash||0;
const inp={l:0,r:0,gas:0,brake:0,hand:0,horn:0,shoot:0,used:{gas:0,steer:0,brake:0,horn:0,hand:0,shoot:0}};
const joy={x:0,y:0};
const T_=()=>pl.foot?fp:pl;
// ---------- pickups
[['pistol',-85,-60],['smg',11,-70],['shotgun',-306,-110],['health',-85,60],['health',107,-30],['health',178,-60],['ammo',11,70],['ammo',203,-90],['health',-306,100],['smg',-306,200],['ammo',120,-48],['pistol',210,-215],['health',210,-208],['ammo',-85,-180],['shotgun',11,-210]].forEach(([t,x,z])=>combat.addPickup(t,x,z));
(()=>{const r=(()=>{let q=99;return()=>{q=(q*1664525+1013904223)>>>0;return q/4294967296}})();const out=[];
  while(out.length<18){const i=Math.floor(r()*7),j=Math.floor(r()*6),a=XS[j]+48+(r()-.5)*30,l=XS[i]+(r()<.5?10.6:-10.6);const p=r()<.5?[a,l]:[l,a];if(Math.abs(p[0])>300||Math.abs(p[1])>300)continue;out.push(p)}
  out.forEach(p=>combat.addPickup('cash',p[0],p[1]))})();
(()=>{const r=(()=>{let q=2024;return()=>{q=(q*1664525+1013904223)>>>0;return q/4294967296}})();let nh=0,na=0;
  while(nh<12||na<7){const i=Math.floor(r()*7),j=Math.floor(r()*6),a=XS[j]+48+(r()-.5)*40,l=XS[i]+(r()<.5?11.2:-11.2),p=r()<.5?[a,l]:[l,a];if(Math.abs(p[0])>300||Math.abs(p[1])>300)continue;
    if(nh<12&&(na>=7||r()<.6)){combat.addPickup('health',p[0],p[1]);nh++}else if(na<7){combat.addPickup('armor',p[0],p[1]);na++}}})();
function giveItem(t){
  if(t==='cash'){const n=50+Math.floor(Math.random()*5)*25;cash+=n;prog.cash=cash;save();toast('💵 +₹'+n,1300,'good');sfx.pickup();return}
  if(t==='health'){const n=Math.round(hero.max*.4);hero.hp=Math.min(hero.max,hero.hp+n);toast('➕ Health +'+n,1500,'good')}
  else if(t==='armor'){hero.armor=Math.min(50,hero.armor+30);toast('🛡️ Armor +30',1500,'good')}
  else if(t==='ammo'){for(const k of WORDER)if(hero.weapons[k])hero.ammo[k]=Math.min(WEAPONS[k].max,hero.ammo[k]+Math.ceil(WEAPONS[k].pick*.6));toast('🔫 Ammo mila!',1500,'good')}
  else{const first=!hero.weapons[t];hero.weapons[t]=true;hero.ammo[t]=Math.min(WEAPONS[t].max,hero.ammo[t]+WEAPONS[t].pick);if(first)hero.cur=t;toast('🔫 '+WEAPONS[t].name+' mila! +'+WEAPONS[t].pick+' ammo',2200,'good')}
  sfx.pickup()}
function cycleWeapon(){const own=WORDER.filter(k=>hero.weapons[k]);const i=own.indexOf(hero.cur);hero.cur=own[(i+1)%own.length];sfx.click();toast('🔫 '+WEAPONS[hero.cur].name,1200)}
// ---------- portraits
const PORT={};CHARS.forEach(c=>PORT[c.id]=portrait(c));
// ---------- UI helpers
const SCR=['splash','title','story','menu','brief','pause','result'];
function show(id){SCR.forEach(s=>$(s).classList.toggle('on',s===id));$('hud').classList.toggle('on',id==='hud');state=id}
let toastT=0;
function toast(t,ms=3200,cls=''){const e=$('toast');e.textContent=t;e.className='on '+cls;clearTimeout(toastT);toastT=setTimeout(()=>e.className='',ms)}
function hudMode(){$('hud').classList.toggle('foot',pl.foot)}
// ---------- fullscreen on first tap
let firstTap=false;
function firstGesture(){sfx.init();if(firstTap)return;firstTap=true;
  try{const el=document.documentElement,rq=el.requestFullscreen||el.webkitRequestFullscreen;if(rq){const r=rq.call(el,{navigationUI:'hide'});if(r&&r.catch)r.catch(()=>{})}}catch(e){}
  try{if(screen.orientation&&screen.orientation.lock){const r=screen.orientation.lock('landscape');if(r&&r.catch)r.catch(()=>{})}}catch(e){}}
addEventListener('pointerdown',firstGesture,{capture:true});addEventListener('touchend',firstGesture,{capture:true,passive:true});
// ---------- controls
function bindPedal(id,key){const el=$(id);let pid=null;
  const on=e=>{e.preventDefault();pid=e.pointerId;try{el.setPointerCapture(pid)}catch(_){}inp[key]=1;inp.used[key]=1;el.classList.add('on');if(key==='horn')doHorn()};
  const off=e=>{if(pid!==null&&e.pointerId!==pid)return;pid=null;inp[key]=0;el.classList.remove('on')};
  el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);el.addEventListener('lostpointercapture',off)}
bindPedal('pGas','gas');bindPedal('pBrake','brake');bindPedal('pHand','hand');bindPedal('pHorn','horn');bindPedal('pShoot','shoot');bindPedal('pRun','run');
$('pSwap').addEventListener('pointerdown',e=>{e.preventDefault();cycleWeapon()});
$('bExit').addEventListener('pointerdown',e=>{e.preventDefault();toggleVehicle()});
{const z=$('steer');let pid=null;const upd=e=>{const r=z.getBoundingClientRect(),x=e.clientX-r.left,m=r.width/2,dead=r.width*.04;inp.l=x<m-dead?1:0;inp.r=x>m+dead?1:0;inp.used.steer=1;$('aL').classList.toggle('on',!!inp.l);$('aR').classList.toggle('on',!!inp.r)};
  z.addEventListener('pointerdown',e=>{e.preventDefault();pid=e.pointerId;try{z.setPointerCapture(pid)}catch(_){}upd(e)});
  z.addEventListener('pointermove',e=>{if(e.pointerId===pid)upd(e)});
  const off=e=>{if(e.pointerId!==pid)return;pid=null;inp.l=inp.r=0;$('aL').classList.remove('on');$('aR').classList.remove('on')};
  z.addEventListener('pointerup',off);z.addEventListener('pointercancel',off);z.addEventListener('lostpointercapture',off)}
{const z=$('joy'),k=$('joyKnob');let pid=null,cx=0,cy=0,R=1;
  const upd=e=>{const dx=e.clientX-cx,dy=e.clientY-cy,m=Math.min(1,Math.hypot(dx,dy)/R),a=Math.atan2(dy,dx);let vx=Math.cos(a)*m,vy=Math.sin(a)*m;if(m<.12){vx=vy=0}joy.x=vx;joy.y=-vy;k.style.transform=`translate(${vx*R*.62}px,${vy*R*.62}px)`};
  z.addEventListener('pointerdown',e=>{e.preventDefault();const r=z.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;R=r.width/2;pid=e.pointerId;try{z.setPointerCapture(pid)}catch(_){}upd(e)});
  z.addEventListener('pointermove',e=>{if(e.pointerId===pid)upd(e)});
  const off=e=>{if(e.pointerId!==pid)return;pid=null;joy.x=joy.y=0;k.style.transform=''};
  z.addEventListener('pointerup',off);z.addEventListener('pointercancel',off);z.addEventListener('lostpointercapture',off)}
{const z=$('look');let pid=null,lx=0;
  z.addEventListener('pointerdown',e=>{if(!pl.foot)return;e.preventDefault();pid=e.pointerId;lx=e.clientX;try{z.setPointerCapture(pid)}catch(_){}});
  z.addEventListener('pointermove',e=>{if(e.pointerId!==pid)return;cam.yaw-=(e.clientX-lx)*.009;lx=e.clientX});
  const off=e=>{if(e.pointerId===pid)pid=null};z.addEventListener('pointerup',off);z.addEventListener('pointercancel',off)}
const KM={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'gas',ArrowDown:'brake',a:'l',d:'r',w:'gas',s:'brake',' ':'hand',h:'horn',f:'shoot'};
addEventListener('keydown',e=>{if(e.key==='e'){if(!e.repeat)toggleVehicle();return}if(e.key==='q'){cycleWeapon();return}const k=KM[e.key];if(k){inp[k]=1;inp.used[k==='l'||k==='r'?'steer':k]=1;if(k==='horn'&&!e.repeat)doHorn();e.preventDefault()}});
addEventListener('keyup',e=>{const k=KM[e.key];if(k)inp[k]=0});
let hornCool=0;
function doHorn(){if(state!=='hud'||hornCool>0||pl.foot)return;hornCool=.35;sfx.horn();const f=[Math.sin(pl.th),Math.cos(pl.th)];
  for(const v of traffic.list){if(v.chaser)continue;const rx=v.x-pl.x,rz=v.z-pl.z,a=rx*f[0]+rz*f[1],l=Math.abs(-rx*f[1]+rz*f[0]);if(a>0&&a<32&&l<8)v.aside=3}}
// ---------- vehicles: enter / exit
function nearParked(maxD){const p=T_();let best=null,bd=maxD||7.5;for(const o of parked){const d=Math.hypot(o.x-p.x,o.z-p.z);if(d<bd){bd=d;best=o}}return best}
function exitVehicle(){if(pl.foot)return;if(Math.abs(pl.speed)>9){toast('Pehle gaadi rokho 🛑',1800,'bad');return}
  const o={kind:pl.kind,x:pl.x,z:pl.z,th:pl.th,mesh:pl.mesh,c:pl.c,half:pl.half,mass:3};pl.mesh.position.set(pl.x,.12,pl.z);pl.mesh.rotation.y=pl.th;pl.mesh.visible=true;parked.push(o);pl.mesh=null;
  const L=[Math.cos(pl.th),-Math.sin(pl.th)],off=pl.bike?1.5:2.7;fp.x=pl.x+L[0]*off;fp.z=pl.z+L[1]*off;fp.th=pl.th;fp.vx=fp.vz=0;pushCircle(colliders,fp,.6);
  pl.foot=true;pl.vx=pl.vz=0;pl.speed=0;pl.steer=0;cam.yaw=pl.th;cam.init=false;inp.l=inp.r=inp.gas=inp.brake=inp.hand=0;hudMode();toast('Paidal mode: joystick + SHOOT. ENTER se gaadi mein wapas',2800)}
function enterVehicle(o){parked.splice(parked.indexOf(o),1);if(pl.mesh)scene.remove(pl.mesh);pl.mesh=o.mesh;applyVeh(o.kind);pl.x=o.x;pl.z=o.z;pl.th=o.th;pl.vx=pl.vz=0;pl.speed=0;pl.foot=false;cam.yaw=o.th;cam.init=false;joy.x=joy.y=0;inp.shoot=0;hudMode();toast('🚗 '+VEH[o.kind].name,1800,'good')}
function nearCivCar(maxD){let best=null,bd=maxD;for(const v of traffic.list){if(v.chaser)continue;const d=Math.hypot(v.x-fp.x,v.z-fp.z)-v.half*.5;if(d<bd){bd=d;best=v}}return best}
peds.onHit=(p,w)=>{addHeat(.6);toast('Pedestrian ko mat maaro! 🚔',1500,'bad');sfx.farHorn()};
function carjack(v){const i=traffic.list.indexOf(v);if(i>=0)traffic.list.splice(i,1);
  const L=[Math.cos(v.th),-Math.sin(v.th)];peds.spawnAt(v.x+L[0]*2.4,v.z+L[1]*2.4,'flee',[fp.x,fp.z]);
  v.mesh.visible=true;v.mesh.rotation.set(0,v.th,0);{const u=v.mesh.userData;if(u.dl)for(const m of u.dl)m.visible=true;u.detail=true}const o={kind:v.kind,x:v.x,z:v.z,th:v.th,mesh:v.mesh,c:v.c,half:v.half,mass:3};parked.push(o);enterVehicle(o);addHeat(.6);sfx.horn();toast('🚗 Carjack! '+VEH[o.kind].name+' tumhari ho gayi',2200,'good')}
function toggleVehicle(){if(state!=='hud'||paused)return;if(home.on){const Z=homeR.zones;if(hNear(Z.door))homeAct('exit');return}if(pl.foot){const hh=nearHome();if(hh){enterHome(hh);return}const e=nearParked(7.5),v=nearCivCar(5.5);const de=e?Math.hypot(e.x-fp.x,e.z-fp.z):1e9,dv=v?Math.hypot(v.x-fp.x,v.z-fp.z)-v.half*.5:1e9;if(e&&de<=dv){enterVehicle(e);sfx.click()}else{if(v)carjack(v);else toast('Paas mein koi gaadi nahi — kisi bhi gaadi ke paas jao (carjack!)',2200,'bad')}}else exitVehicle()}
function chooseVehicle(kind){if(pl.foot){const o=addParked(kind,fp.x+Math.sin(fp.th)*6,fp.z+Math.cos(fp.th)*6,fp.th);enterVehicle(o)}else setVehicle(kind);pl.mesh.visible=true}
function teleportGarage(){if(pl.foot){fp.x=GAR.x;fp.z=GAR.z;fp.th=0}else{pl.x=240;pl.z=-192;pl.th=-Math.PI/2;pl.vx=pl.vz=0;cam.init=false;cam.yaw=pl.th}}
// ---------- physics (vehicle)
let civImp=0,heatCool=0;
function collideStatic(e){let imp=0;
  for(const c of e.c){const r=c[1];for(const b of colliders){let p=cpos(e,c);
    if(p[0]<b.x0-r||p[0]>b.x1+r||p[1]<b.z0-r||p[1]>b.z1+r)continue;
    const qx=clamp(p[0],b.x0,b.x1),qz=clamp(p[1],b.z0,b.z1);let dx=p[0]-qx,dz=p[1]-qz,d=Math.hypot(dx,dz),nx,nz,pen;
    if(d>=r)continue;
    if(d>1e-5){nx=dx/d;nz=dz/d;pen=r-d}else{const l=p[0]-b.x0,rr=b.x1-p[0],t=p[1]-b.z0,bm=b.z1-p[1],m=Math.min(l,rr,t,bm);if(m===l){nx=-1;nz=0}else if(m===rr){nx=1;nz=0}else if(m===t){nx=0;nz=-1}else{nx=0;nz=1}pen=m+r}
    e.x+=nx*pen;e.z+=nz*pen;
    const vn=e.vx*nx+e.vz*nz;if(vn<0){e.vx-=1.25*vn*nx;e.vz-=1.25*vn*nz;imp=Math.max(imp,-vn);const tx=-nz,tz=nx,vt=e.vx*tx+e.vz*tz;e.vx-=vt*tx*.06;e.vz-=vt*tz*.06;
      const f=[Math.sin(e.th),Math.cos(e.th)],side=-nx*f[1]+nz*f[0];if(Math.abs(vn)>2)e.th+=clamp(side,-1,1)*.02*Math.min(1,-vn/8)*(c[0]>0?1:-1)*-1}}}
  return imp}
function collideTraffic(dt){let imp=0;civImp=0;
  for(const v of traffic.list){if(Math.abs(v.x-pl.x)>10||Math.abs(v.z-pl.z)>10)continue;
    for(const ca of pl.c)for(const cb of v.c){const p=cpos(pl,ca),q=cpos(v,cb),dx=p[0]-q[0],dz=p[1]-q[1],d=Math.hypot(dx,dz),r=ca[1]+cb[1];if(d>=r||d<1e-4)continue;
      const nx=dx/d,nz=dz/d,pen=r-d,mp=pl.mass,mv=v.mass,tot=mp+mv;
      pl.x+=nx*pen*mv/tot;pl.z+=nz*pen*mv/tot;v.x-=nx*pen*mp/tot;v.z-=nz*pen*mp/tot;
      const tvx=(v.x-v.px)/Math.max(dt,.001),tvz=(v.z-v.pz)/Math.max(dt,.001),rel=(pl.vx-tvx)*nx+(pl.vz-tvz)*nz;
      if(rel<0){const j=-1.25*rel/(1/mp+1/mv);pl.vx+=j*nx/mp;pl.vz+=j*nz/mp;v.kx=clamp(v.kx-j*nx/mv*.8,-14,14);v.kz=clamp(v.kz-j*nz/mv*.8,-14,14);v.stun=v.chaser?0:1.4;imp=Math.max(imp,-rel);if(!v.chaser){civImp=Math.max(civImp,-rel);if(v.hornT<=0){v.hornT=3;sfx.farHorn()}}}}}
  return imp}
function collideParked(){let imp=0;
  for(const o of parked){if(Math.abs(o.x-pl.x)>9||Math.abs(o.z-pl.z)>9)continue;
    for(const ca of pl.c)for(const cb of o.c){const p=cpos(pl,ca),q=cpos(o,cb),dx=p[0]-q[0],dz=p[1]-q[1],d=Math.hypot(dx,dz),r=ca[1]+cb[1];if(d>=r||d<1e-4)continue;
      const nx=dx/d,nz=dz/d;pl.x+=nx*(r-d);pl.z+=nz*(r-d);const vn=pl.vx*nx+pl.vz*nz;if(vn<0){pl.vx-=1.3*vn*nx;pl.vz-=1.3*vn*nz;imp=Math.max(imp,-vn)}}}
  return imp}
function physics(dt){
  const P=pl.P;let f=[Math.sin(pl.th),Math.cos(pl.th)],L=[Math.cos(pl.th),-Math.sin(pl.th)];
  let s=pl.vx*f[0]+pl.vz*f[1];
  const st=(inp.l?1:0)-(inp.r?1:0);pl.steer+=(st-pl.steer)*Math.min(1,dt*(st?9:12));
  const spd=Math.abs(s);let yaw;
  if(P.bike){const tl=pl.steer*.62*clamp(spd/9,.3,1);pl.lean+=(tl-pl.lean)*Math.min(1,dt*5);const sg=s>=0?1:-1;
    yaw=Math.tan(pl.lean)*9.8/Math.max(spd*.6,7)*2.3*sg+pl.steer*1.3*clamp(1-spd/9,0,1)*clamp(spd/1.5,0,1)*sg;if(inp.hand)yaw*=1.3}
  else yaw=pl.steer*P.steer*clamp(s/5,-1,1)*(1-.5*clamp(spd/P.maxS,0,1))*(inp.hand?1.55:1);
  pl.th+=yaw*dt;f=[Math.sin(pl.th),Math.cos(pl.th)];L=[Math.cos(pl.th),-Math.sin(pl.th)];
  s=pl.vx*f[0]+pl.vz*f[1];let l=pl.vx*L[0]+pl.vz*L[1];
  if(inp.gas&&!inp.brake){s+=P.acc*(1-Math.pow(Math.max(0,s)/P.maxS,2))*dt*(s<0?2.2:1)}
  if(inp.brake){if(s>1.2)s-=(P.bike?26:22)*dt;else s=Math.max(-9,s-P.acc*.7*dt)}
  if(inp.hand){s-=s*1.1*dt}
  if(!inp.gas&&!inp.brake)s-=s*.35*dt+Math.sign(s)*Math.min(Math.abs(s),1.2*dt);
  s-=s*.003*Math.abs(s)*dt;
  const grip=inp.hand?(P.bike?5:1.6):P.grip;l*=Math.exp(-grip*dt);
  pl.skid=clamp(Math.abs(l)/6,0,1)*(spd>6?1:0);
  pl.vx=f[0]*s+L[0]*l;pl.vz=f[1]*s+L[1]*l;
  pl.x+=pl.vx*dt;pl.z+=pl.vz*dt;
  const i1=collideStatic(pl),i2=collideTraffic(dt),i4=collideParked(),i3=collideStatic(pl);
  const imp=Math.max(i1,i2,i3,i4);if(imp>3.5&&crashCool<=0){sfx.crash(imp/18);crashCool=.25;shake=Math.min(1,imp/16)}
  if(civImp>7&&heatCool<=0){addHeat(.35);heatCool=.8}
  pl.speed=pl.vx*f[0]+pl.vz*f[1];
}
let crashCool=0,shake=0;
// ---------- on foot
function footCircles(dt){
  pushCircle(colliders,fp,.5);
  for(const o of parked){if(Math.abs(o.x-fp.x)>8||Math.abs(o.z-fp.z)>8)continue;for(const c of o.c){const q=cpos(o,c),dx=fp.x-q[0],dz=fp.z-q[1],d=Math.hypot(dx,dz),r=c[1]+.5;if(d<r&&d>1e-4){fp.x+=dx/d*(r-d);fp.z+=dz/d*(r-d)}}}
  for(const v of traffic.list){if(Math.abs(v.x-fp.x)>8||Math.abs(v.z-fp.z)>8)continue;for(const c of v.c){const q=cpos(v,c),dx=fp.x-q[0],dz=fp.z-q[1],d=Math.hypot(dx,dz),r=c[1]+.5;if(d<r&&d>1e-4){fp.x+=dx/d*(r-d);fp.z+=dz/d*(r-d)}}}
  fp.x=clamp(fp.x,-318,336);fp.z=clamp(fp.z,-336,336)}
function fireNow(){const k=hero.cur,W=WEAPONS[k];
  if(hero.ammo[k]<=0){const alt=WORDER.find(q=>hero.weapons[q]&&hero.ammo[q]>0);if(alt){hero.cur=alt;toast('🔫 '+WEAPONS[alt].name,1000)}else toast('Ammo khatam! Pickup dhundo 🔫',1400,'bad');sfx.dry();fp.shootT=.35;return}
  hero.ammo[k]--;fp.shootT=W.rate;inp.used.shoot=1;
  if(fp.aim)fp.th=Math.atan2(fp.aim.x-fp.x,fp.aim.z-fp.z);
  const mx=fp.x+Math.sin(fp.th)*.9,mz=fp.z+Math.cos(fp.th)*.9;
  peds.alarm(fp.x,fp.z,48);
  {const dx=Math.sin(fp.th),dz=Math.cos(fp.th),h=peds.ray(mx,mz,dx,dz,W.range||40);if(h){peds.knock(h.p);addHeat(.8);toast('Aam logon ko mat maaro! 🚔',1400,'bad')}}
  const O={traffic,onTraffic:v=>{v.stun=2;if(v.hornT<=0){v.hornT=2;sfx.farHorn()}addHeat(.7)}};
  if(W.pierce){combat.fireBlaster(mx,mz,fp.th,W,O);fp.flashT=.12;sfx.blaster();shake=Math.max(shake,.4)}
  else{combat.fire(mx,mz,fp.th,W,O);fp.flashT=.06;sfx.gun(k);shake=Math.max(shake,.15)}}
function footUpdate(dt){
  let jx=joy.x+(inp.r-inp.l),jy=joy.y+(inp.gas-inp.brake);const mag=Math.min(1,Math.hypot(jx,jy));
  const cy=cam.yaw,f=[Math.sin(cy),Math.cos(cy)],r=[-Math.cos(cy),Math.sin(cy)];
  let wx=f[0]*jy+r[0]*jx,wz=f[1]*jy+r[1]*jx;const wl=Math.hypot(wx,wz)||1,sp=WALK[pl.ch]*mag*(inp.shoot?.75:inp.run?1.55:1);
  const k=Math.min(1,dt*12);fp.vx+=(wx/wl*sp-fp.vx)*k;fp.vz+=(wz/wl*sp-fp.vz)*k;fp.x+=fp.vx*dt;fp.z+=fp.vz*dt;footCircles(dt);
  const mv=Math.hypot(fp.vx,fp.vz);
  fp.aim=combat.aimTarget(fp.x,fp.z,40);
  if(fp.shootT>0)fp.shootT-=dt;if(inp.shoot&&fp.shootT<=0)fireNow();
  if(fp.aim&&(inp.shoot||fp.shootT>0))fp.th+=angd(fp.th,Math.atan2(fp.aim.x-fp.x,fp.aim.z-fp.z))*Math.min(1,dt*18);
  else if(mv>.6)fp.th+=angd(fp.th,Math.atan2(fp.vx,fp.vz))*Math.min(1,dt*12);
  fp.walk+=dt*mv;animateHuman(fp.mesh,fp.walk,mv,true,inp.run&&mv>5);fp.mesh.userData.flash.visible=fp.flashT>0;if(fp.flashT>0)fp.flashT-=dt;
  fp.mesh.position.set(fp.x,0,fp.z);fp.mesh.rotation.y=fp.th;pl.speed=0}
// ---------- camera
const cam={yaw:0,f:1,init:false};
function placeCam(tx,tz,dist,h,ahead,lookY,dt){
  const dx=-Math.sin(cam.yaw),dz=-Math.cos(cam.yaw),want=dist+1.2,t=combat.wallT(tx,tz,dx,dz,want);
  const f=t<want?clamp(t-1.1,2.0,dist)/dist:1;if(f<cam.f)cam.f=f;else cam.f+=(f-cam.f)*Math.min(1,dt*2.5);
  camera.position.set(tx+dx*dist*cam.f+(Math.random()-.5)*shake*.5,h,tz+dz*dist*cam.f+(Math.random()-.5)*shake*.5);shake*=.9;
  camera.lookAt(tx+Math.sin(cam.yaw)*ahead,lookY,tz+Math.cos(cam.yaw)*ahead)}
function followCam(dt){
  if(home.on){homeCam(dt);return}
  if(pl.foot){placeCam(fp.x,fp.z,5.8,2.9,4.5,1.5,dt);if(camera.fov!==62){camera.fov=62;camera.updateProjectionMatrix()}return}
  cam.yaw+=angd(cam.yaw,pl.th)*Math.min(1,dt*3.2);
  const sp=Math.abs(pl.speed),dist=pl.cam[0]+sp*.08,h=pl.cam[1]+sp*.03;
  placeCam(pl.x,pl.z,dist,h,7,1.6,dt);
  const fov=60+clamp(sp/36,0,1)*16;if(Math.abs(camera.fov-fov)>.1){camera.fov+=(fov-camera.fov)*.1;camera.updateProjectionMatrix()}
}
function titleCam(t){const x=-296+Math.sin(t*.07)*3,z=-130+Math.sin(t*.05)*110;camera.position.set(x,13+Math.sin(t*.1)*2,z);camera.lookAt(-420,10,z+70+Math.cos(t*.06)*20);if(camera.fov!==58){camera.fov=58;camera.updateProjectionMatrix()}}
// ---------- mission markers
const marker=new THREE.Group();
{const ring=new THREE.Mesh(new THREE.RingGeometry(7.2,9,40),new THREE.MeshBasicMaterial({color:0xffd166,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.4;marker.add(ring);marker.userData.ring=ring;
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.4,70,16,1,true),new THREE.MeshBasicMaterial({color:0xffd166,transparent:true,opacity:.28,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));beam.position.y=35;marker.add(beam);marker.userData.beam=beam;
  const disc=new THREE.Mesh(new THREE.CircleGeometry(7,32),new THREE.MeshBasicMaterial({color:0xffd166,transparent:true,opacity:.18,depthWrite:false}));disc.rotation.x=-Math.PI/2;disc.position.y=.35;marker.add(disc);marker.userData.disc=disc;
  marker.visible=false;scene.add(marker)}
function setMarkerColor(c){['ring','beam','disc'].forEach(k=>marker.userData[k].material.color.setHex(c))}
let personM=null;
function setPerson(x,z,col,skin,vis=true){if(personM){scene.remove(personM);personM=null}if(!vis)return;personM=personModel(col,skin);personM.position.set(x+3,.15,z+4);personM.scale.setScalar(1.6);scene.add(personM)}
// ---------- wanted / police
const W={heat:0,bust:0,cars:[],lvl:0};
const wantedOn=()=>mode==='free'||!!(M&&M.def.forceHeat);
function updLvl(){W.lvl=Math.min(3,Math.ceil(W.heat-.001))}
function addHeat(h){if(!wantedOn())return;const o=W.lvl;W.heat=Math.min(3,W.heat+h);updLvl();if(W.lvl>o){toast('🚔 Police peeche lag gayi! '+'★'.repeat(W.lvl),2600,'bad')}}
function spawnPolice(spec){const v=traffic.spawn('police',Object.assign({chaser:true},spec||{}));if(!spec)traffic.placeFar(v,T_(),90);v.chaseFn=d=>d>90?27:d>45?24:21.5;W.cars.push(v);return v}
function removePolice(v){scene.remove(v.mesh);const i=traffic.list.indexOf(v);if(i>=0)traffic.list.splice(i,1);const j=W.cars.indexOf(v);if(j>=0)W.cars.splice(j,1)}
function clearPolice(){while(W.cars.length)removePolice(W.cars[0]);W.heat=0;W.bust=0;W.lvl=0}
function updateWanted(dt){
  if(!wantedOn()){if(W.cars.length)clearPolice();return}
  const T=T_();let near=false,close=false,mind=999;
  for(const v of W.cars){const d=Math.hypot(v.x-T.x,v.z-T.z);mind=Math.min(mind,d);if(d<70)near=true;if(d<11)close=true}
  if(M&&M.def.forceHeat)W.heat=M.def.forceHeat;else if(!near&&W.heat>0)W.heat=Math.max(0,W.heat-.1*dt);
  updLvl();while(W.cars.length<W.lvl)spawnPolice();
  if(W.lvl===0)for(const v of W.cars.slice())if(Math.hypot(v.x-T.x,v.z-T.z)>150)removePolice(v);
  W.bust=close?W.bust+dt/5.5:Math.max(0,W.bust-dt/4);W.minD=mind;
  if(W.bust>=1)onBusted()}
function onBusted(){if(M&&!M.done){W.bust=0;const f=Math.min(cash,50);cash-=f;prog.cash=cash;toast('Police ne roka — ₹'+f+' jurmana, mission chalta raho 🚔',2400,'bad');sfx.warn();return}
  const fine=Math.min(cash,150);cash-=fine;prog.cash=cash;save();toast('BUSTED! ₹'+fine+' jurmana. Garage pe wapas',3000,'bad');clearPolice();teleportGarage();sfx.fail()}
function damageHero(d){if(!playing_()||(M&&M.done))return;hero.since=0;if(hero.armor>0){const ab=Math.min(hero.armor,d*.75);hero.armor-=ab;d-=ab}hero.hp-=d;hero.hurtT=.12;if(sfxHurtCool<=0){sfx.hurt();sfxHurtCool=.2}
  if(hero.hp<=0){hero.hp=0;heroDead()}}
let sfxHurtCool=0;
function playing_(){return state==='hud'&&!paused}
function heroDead(){if(M&&!M.done){failMission('Health khatam! Dobara try karo 💥');return}
  hero.hp=hero.max;cash=Math.max(0,cash-100);prog.cash=cash;save();teleportGarage();toast('Hospital se wapas! ₹100 kharcha',3000,'bad')}
combat.onHero=damageHero;
// ---------- enterable homes (interior dollhouse far from the city; TV, fridge, bed, exit door)
const homeR=buildHome(scene);
const home={on:false,h:null,tv:false,ch:0,tvAcc:0,tvT:0,act:null,back:null,hidden:[],lastPh:0,lastHop:1,beat:0,cool:0,near:{}};
const HLOOK={aditya:{wall:'#f3d9b8',sofa:0xc23a4a},pravin:{wall:'#cfe3f2',sofa:0x2f6db5},deep:{wall:'#d8efd2',sofa:0x2f9f55},flat1:{wall:'#f6e3a8',sofa:0x8a5a9e},flat2:{wall:'#e8d0e8',sofa:0xd9822b}};
function nearHome(){if(mode!=='free'||home.on||!pl.foot)return null;for(const h of city.homes)if(Math.hypot(fp.x-h.sx,fp.z-h.sz)<3.4)return h;return null}
function hideWorld(){const keep=new Set([homeR.group,sky,sunS,moonS,fp.mesh,sun.target]);for(const c of scene.children){if(c.isLight||keep.has(c))continue;if(c.visible){c.visible=false;if(!home.hidden.includes(c))home.hidden.push(c)}}}
function homeLight(){hemi.color.setHex(0xffe2b8);hemi.groundColor.setHex(0x9a7a5a);hemi.intensity=night?1.55:1.35;sun.intensity=.2;renderer.toneMappingExposure=1.1}
function enterHome(h){if(home.on)return;home.on=true;home.h=h;home.back={x:h.sx,z:h.sz,th:Math.atan2(h.nx,h.nz)};home.act=null;home.tv=false;home.ch=0;
  hideWorld();homeR.group.visible=true;homeR.set.home(HLOOK[h.id]||HLOOK.flat1);homeR.set.day(!night);homeLight();
  fp.x=homeR.spawn.x;fp.z=homeR.spawn.z;fp.th=-Math.PI/2;fp.vx=fp.vz=0;pl.speed=0;pl.vx=pl.vz=0;joy.x=joy.y=0;inp.shoot=0;
  camera.fov=54;camera.updateProjectionMatrix();camera.position.set(HR.OX+2,4.1,HR.OZ+6.6);camera.lookAt(HR.OX,.9,HR.OZ);
  $('hud').classList.add('home');$('bnTitle').textContent='🏠 '+h.name.toUpperCase();$('bnObj').textContent='TV • Fridge • Bed • Door ke paas jao';$('arrow').style.visibility='hidden';$('dist').textContent='';
  sfx.door();sfx.home(true);toast(h.name+' mein aapka swagat hai 🏠',2600,'good')}
function exitHome(silent){if(!home.on)return;home.on=false;home.act=null;homeR.can.visible=false;homeR.bubs.forEach(b=>b.position.y=-9);homeR.fdoor.rotation.y=0;
  if(home.tv){home.tv=false;sfx.tvOff()}homeR.group.visible=false;for(const c of home.hidden)c.visible=true;home.hidden.length=0;
  $('hud').classList.remove('home');['hTV','hCh','hDrink','hSleep','hExit'].forEach(i=>$(i).classList.remove('show'));$('fade').style.opacity=0;
  setEnv(night);camera.fov=62;camera.updateProjectionMatrix();sfx.home(false);
  if(!silent){fp.x=home.back.x;fp.z=home.back.z;fp.th=home.back.th;fp.vx=fp.vz=0;cam.yaw=home.back.th;cam.init=false;sfx.door();
    $('bnTitle').textContent='🌆 FREE ROAM';$('bnObj').textContent='Maidan • Mafia Garage • Sea Gate Arch';toast('Bahar aa gaye 🌆',1600)}}
function homeCam(dt){const tx=HR.OX+clamp((fp.x-HR.OX)*.5,-2.2,2.2),k=Math.min(1,(dt||1)*5);
  camera.position.x+=(tx-camera.position.x)*k;camera.position.y=4.1;camera.position.z=HR.OZ+6.6;camera.lookAt(camera.position.x*.7+HR.OX*.3,.9,HR.OZ-.4)}
const hNear=(z)=>Math.hypot(fp.x-z.x,fp.z-z.z)<z.r;
function homeAct(k){if(!home.on||home.act)return;
  if(k==='exit'){exitHome(false);return}
  if(k==='tv'){home.tv=!home.tv;if(home.tv){sfx.tvOn(home.ch);sfx.click()}else{sfx.tvOff();sfx.click()}return}
  if(k==='ch'){home.ch=(home.ch+1)%3;sfx.tvSet(home.ch);sfx.click();home.tvAcc=1;toast(['📺 Channel 1: Cricket Live','📺 Channel 2: Chotu Toons','📺 Channel 3: Gaane On'][home.ch],1400);return}
  if(k==='drink'){if(home.cool>0){toast('Thoda ruko, abhi pi chuke ho 😄',1400);return}home.act={k:'drink',t:0,did:0};sfx.click();return}
  if(k==='sleep'){home.act={k:'sleep',t:0,did:0};sfx.click()}}
function homeUpdate(dt){const Z=homeR.zones;home.cool-=dt;
  const a=home.act;
  // walking
  let jx=joy.x+(inp.r-inp.l),jy=joy.y+(inp.gas-inp.brake);const mag=a?0:Math.min(1,Math.hypot(jx,jy));
  const wl=Math.hypot(jx,jy)||1,sp=3.4*mag,kk=Math.min(1,dt*12);fp.vx+=(jx/wl*sp-fp.vx)*kk;fp.vz+=(-jy/wl*sp-fp.vz)*kk;fp.x+=fp.vx*dt;fp.z+=fp.vz*dt;
  fp.x=clamp(fp.x,HR.OX-4.5,HR.OX+4.5);fp.z=clamp(fp.z,HR.OZ-3.55,HR.OZ+3.55);
  for(const o of homeR.solids){const m=.32;if(fp.x>o.x0-m&&fp.x<o.x1+m&&fp.z>o.z0-m&&fp.z<o.z1+m){const dl=fp.x-(o.x0-m),dr=(o.x1+m)-fp.x,dt2=fp.z-(o.z0-m),db=(o.z1+m)-fp.z,mn=Math.min(dl,dr,dt2,db);if(mn===dl)fp.x=o.x0-m;else if(mn===dr)fp.x=o.x1+m;else if(mn===dt2)fp.z=o.z0-m;else fp.z=o.z1+m}}
  const mv=Math.hypot(fp.vx,fp.vz);if(mv>.5)fp.th+=angd(fp.th,Math.atan2(fp.vx,fp.vz))*Math.min(1,dt*12);
  // action animations
  if(a){a.t+=dt;
    if(a.k==='drink'){const fz=Z.fridge,tx=Math.atan2(HR.OX-4.25-fp.x,HR.OZ-3.2-fp.z);fp.th+=angd(fp.th,tx)*Math.min(1,dt*10);
      const open=a.t<.7?a.t/.7:a.t<1.6?1:Math.max(0,1-(a.t-1.6)/.5);homeR.fdoor.rotation.y=-1.7*open;
      if(!a.did){a.did=1;sfx.fizz()}
      const f=[Math.sin(fp.th),Math.cos(fp.th)],r=[Math.cos(fp.th),-Math.sin(fp.th)];let px,py,pz,rx=0;
      if(a.t<.6){const k=a.t/.6;px=HR.OX-4.25+(fp.x+f[0]*.3+r[0]*.3-(HR.OX-4.25))*k;pz=HR.OZ-3.1+(fp.z+f[1]*.3+r[1]*.3-(HR.OZ-3.1))*k;py=1.3-(.3*k)}
      else if(a.t<1.1){const k=(a.t-.6)/.5;px=fp.x+f[0]*(.3-.05*k)+r[0]*(.3-.2*k);pz=fp.z+f[1]*(.3-.05*k)+r[1]*(.3-.2*k);py=1.0+.55*k;rx=-.3*k}
      else{const k=Math.min(1,(a.t-1.1)/.3);px=fp.x+f[0]*.22+r[0]*.1;pz=fp.z+f[1]*.22+r[1]*.1;py=1.55;rx=-.3-.9*k+Math.sin(a.t*14)*.04}
      homeR.can.visible=a.t<2.3;homeR.can.position.set(px-HR.OX,py,pz-HR.OZ);homeR.can.rotation.set(rx,fp.th,0);
      if(a.t>1.1&&a.t<2.3)homeR.bubs.forEach((b,i)=>{const q=((a.t*1.6+i*.17)%1);b.position.set(px-HR.OX+Math.sin(i*2+a.t*3)*.12,py+.25+q*.5,pz-HR.OZ+f[1]*.08);b.material.opacity=.8*(1-q)});
      if(a.t>1.15&&a.did===1){a.did=2;sfx.gulp()}
      if(a.t>2.4){homeR.can.visible=false;homeR.bubs.forEach(b=>b.position.y=-9);homeR.fdoor.rotation.y=0;hero.hp=Math.min(hero.max,hero.hp+45);home.cool=3;home.act=null;toast('Aaah, thanda! Health +45 🥤',2000,'good');sfx.pickup()}}
    else if(a.k==='sleep'){const fd=$('fade');
      if(a.t<.1)fd.style.opacity=1;
      if(a.t>1.0&&!a.did){a.did=1;hero.hp=hero.max;W.heat=0;W.bust=0;clearPolice();setEnv(!night);prog.day=!night;save();homeR.set.day(!night);homeLight();hideWorld();sfx.sleepTune();$('hpBar').style.width='100%'}
      if(a.t>2.6&&a.did===1){a.did=2;fd.style.opacity=0;toast(night?'🌙 Raat ho gayi — poori health, wanted saaf!':'☀️ Subah ho gayi — poori health, wanted saaf!',3000,'good')}
      if(a.t>3.4)home.act=null}}
  // TV
  home.tvAcc+=dt;home.tvT+=dt;if(home.tv){if(home.tvAcc>1/14){home.tvAcc=0;const sg=homeR.sg,t=home.tvT,ph=drawTV(sg,t,home.ch);homeR.stex.needsUpdate=true;
      if(home.ch===0){const cyc=Math.floor(t/5.2);if(home.lastPh<.46&&ph>=.46)sfx.tvEvt(cyc%3===0?'six':'hit');home.lastPh=ph}
      else if(home.ch===1){if(home.lastHop>.08&&ph<=.08)sfx.tvEvt('boing');home.lastHop=ph}
      else{home.beat+=1;if(home.beat%7===0)sfx.tvEvt('beat');if(home.beat%3===0)sfx.tvEvt('note')}}}
  else if(home.tvAcc>.2){home.tvAcc=0;homeR.sg.fillStyle='#07090d';homeR.sg.fillRect(0,0,320,180);homeR.stex.needsUpdate=true}
  homeR.smat.color.setHex(home.tv?0xffffff:0x333a44);homeR.tvGlow.material.opacity=home.tv?.55+Math.sin(home.tvT*9)*.08:0;
  homeR.hand.parent.rotation.z=-home.tvT*.2;
  // player model
  animateHuman(fp.mesh,fp.walk,mv,false,false);fp.walk+=dt*mv;fp.mesh.userData.flash&&(fp.mesh.userData.flash.visible=false);fp.mesh.position.set(fp.x,0,fp.z);fp.mesh.rotation.y=fp.th;
  // context buttons
  const nt=hNear(Z.tv),nf=hNear(Z.fridge),nb=hNear(Z.bed),nd=hNear(Z.door),busy=!!home.act;
  $('hTV').classList.toggle('show',nt&&!busy);$('hTV').textContent=home.tv?'📺 TV OFF':'📺 TV ON';$('hCh').classList.toggle('show',nt&&home.tv&&!busy);
  $('hDrink').classList.toggle('show',nf&&!busy);$('hSleep').classList.toggle('show',nb&&!busy);$('hExit').classList.toggle('show',nd&&!busy);
  $('hudCash').textContent='₹'+cash;$('hpBar').style.width=(hero.hp/hero.max*100)+'%';$('hpBar').classList.toggle('low',hero.hp/hero.max<.3);$('hpTxt').textContent=Math.ceil(hero.hp);$('arBar').style.width=(hero.armor/50*100)+'%';$('arBox').style.visibility=hero.armor>0?'visible':'hidden'}
[['hTV','tv'],['hCh','ch'],['hDrink','drink'],['hSleep','sleep'],['hExit','exit']].forEach(([id,k])=>$(id).addEventListener('pointerdown',e=>{e.preventDefault();homeAct(k)}));
// ---------- random gang ambush (free roam, and driving missions that are not vehOnly/shootout)
const amb={t:60+Math.random()*60,list:[],car:null,pend:null,active:false,kills:0,skid:0,count:0};
const onRoad=(x,z)=>Math.abs(x)<300&&Math.abs(z)<300&&(XS.some(k=>Math.abs(x-k)<11)||XS.some(k=>Math.abs(z-k)<11));
function ambushSpot(T,rmin,rmax){for(let n=0;n<24;n++){const a=Math.random()*6.283,r=rmin+Math.random()*(rmax-rmin),x=T.x+Math.cos(a)*r,z=T.z+Math.sin(a)*r;if(onRoad(x,z))return[x,z]}return null}
function ambushSpawn(x,z,n){let k=0;for(let i=0;i<n;i++){const a=i/n*6.283+Math.random(),r=1.6+Math.random()*2.2,ex=x+Math.cos(a)*r,ez=z+Math.sin(a)*r;
  if(!onRoad(ex,ez))continue;const e=combat.spawn(ex,ez,{aggro:75,hp:46});e.amb=true;pushCircle(colliders,e,.6);amb.list.push(e);k++}return k}
function clearAmbush(){for(const e of amb.list){if(combat.enemies.includes(e)){combat.scene.remove(e.mesh);combat.enemies.splice(combat.enemies.indexOf(e),1)}}amb.list.length=0;amb.pend=null;amb.active=false;
  if(amb.car){scene.remove(amb.car.mesh);const i=traffic.list.indexOf(amb.car);if(i>=0)traffic.list.splice(i,1);amb.car=null}}
function startAmbush(type){const T=T_();if(amb.active||combat.alive()>5)return false;if(amb.car)clearAmbush();
  if(type==='car'){ // a gang car screeches in ahead of the player and stops; gang hops out
    const ax=Math.abs(T.x-XS[nearIdx(T.x)])<Math.abs(T.z-XS[nearIdx(T.z)])?'z':'x',idx=nearIdx(ax==='z'?T.x:T.z),pa=ax==='z'?T.z:T.x,dir=Math.random()<.5?1:-1,along=Math.max(-280,Math.min(280,pa-dir*(36+Math.random()*8)));
    const v=traffic.spawn('rival',{axis:ax,dir,idx,along,chaser:true});v.chaseFn=()=>0;v.v=17;v.ghost=0;amb.car=v;amb.pend={t:1.0};amb.skid=1;sfx.farHorn()}
  else{const sp=ambushSpot(T,24,38);if(!sp)return false;if(!ambushSpawn(sp[0],sp[1],2+Math.floor(Math.random()*3)))return false}
  amb.active=true;amb.count++;toast('Gang aa gayi! 🔫',2800,'bad');sfx.fail&&0;return true}
const nearIdx=t=>{let b=0;for(let i=1;i<7;i++)if(Math.abs(XS[i]-t)<Math.abs(XS[b]-t))b=i;return b};
function updateAmbush(dt,playing){const T=T_();amb.skid=Math.max(0,amb.skid-dt*.8);
  if(amb.pend){amb.pend.t-=dt;if(amb.pend.t<=0&&amb.car){const v=amb.car;amb.pend=null;if(!ambushSpawn(v.x,v.z,3+Math.floor(Math.random()*2))&&!amb.list.length){clearAmbush()}else sfx.click()}}
  for(let i=amb.list.length-1;i>=0;i--){const e=amb.list[i];if(!combat.enemies.includes(e)){amb.list.splice(i,1);continue}if(!e.dead&&Math.hypot(e.x-T.x,e.z-T.z)>115){combat.scene.remove(e.mesh);combat.enemies.splice(combat.enemies.indexOf(e),1);amb.list.splice(i,1)}}
  if(amb.active&&!amb.pend&&!amb.list.length&&!amb.car)amb.active=false;
  if(amb.car&&!amb.pend&&(Math.hypot(amb.car.x-T.x,amb.car.z-T.z)>130||(!amb.list.length&&Math.hypot(amb.car.x-T.x,amb.car.z-T.z)>45))){clearAmbush()}
  if(!playing){return}
  const ok=mode==='free'||(mode==='mission'&&M&&!M.done&&!M.def.vehOnly&&!M.def.arm&&!M.def.chase);
  amb.t-=dt;if(amb.t<=0){amb.t=60+Math.random()*60;if(ok&&hero.hp>0&&(mode==='free'||Math.random()<.45))startAmbush(Math.random()<.5?'car':'alley')}}
combat.onKill=e=>{if(e.amb){combat.drop(e.x,e.z);if(Math.random()<.6)combat.drop(e.x+1.2,e.z+.8,'ammo');amb.kills++;if(!amb.list.some(q=>q!==e&&!q.dead)&&amb.active){amb.active=false;toast('Gang bhaag gayi! 💵 Cash & ammo utha lo',2400,'good')}}else if(Math.random()<.65)combat.drop(e.x,e.z);sfx.checkpoint();if(M&&M.k&&!e.amb)M.k.killed++}
function spawnAdda(){const cx=144,cz=-48;for(let i=0;i<4;i++){const a=i/4*6.28+Math.random(),r=12+Math.random()*10;combat.spawn(cx+Math.cos(a)*r,cz+Math.sin(a)*r,{aggro:36})}}
// ---------- missions
let chaser=null;
function removeChaser(){if(chaser){scene.remove(chaser.mesh);traffic.list.splice(traffic.list.indexOf(chaser),1);chaser=null;traffic.chaseSpeed=null}}
function placePlayer(s){pl.x=s.x;pl.z=s.z;pl.th=s.th;pl.vx=pl.vz=0;pl.steer=0;pl.lean=0;cam.yaw=s.th;cam.f=1;cam.init=false;pl.speed=0;
  for(const v of traffic.list)if(!v.chaser&&Math.hypot(v.x-s.x,v.z-s.z)<50)traffic.placeFar(v,s,140)}
const HINTS=[
 ['t>0.6','🟢 Hara GAS button dabao — gaadi chalegi'],
 ['inp.used.gas&&t>5','⬅ ➡ se steer karo. Upar peela ➤ arrow marker ki taraf dikhata hai'],
 ['t>16','🔴 BRAKE dabao toh ruko — aur ruk ke dabate raho toh gaadi REVERSE jayegi'],
 ['t>26','📣 HORN dabao — aage ka traffic side ho jayega'],
 ['t>38','🟡 DRIFT (handbrake) dabake mod tez kato']];
function startMission(def,ch){
  paused=false;if(home.on)exitHome(true);removeChaser();clearAmbush();combat.clear();clearPolice();resetGarage();joy.x=joy.y=0;
  M={def,step:0,t:0,left:def.time,done:false,meter:0,peak:0,hint:0,hintT:0,fail:null,k:null};mode='mission';
  pl.foot=false;setChar(ch,true);setVehicle(def.veh||CHARS[ch].id);pl.mesh.visible=true;hero.hp=hero.max;if(def.arm){hero.weapons.pistol=true;hero.ammo.pistol=Math.max(hero.ammo.pistol,40)}
  hero.weapons.blaster=!!def.blaster;if(def.blaster){hero.ammo.blaster=def.blaster;hero.cur='blaster'}else if(hero.cur==='blaster')hero.cur='pistol';
  placePlayer(def.start);hudMode();
  if(def.chase){chaser=traffic.spawn('rival',{axis:'x',dir:1,idx:XS.indexOf(def.start.z)>=0?XS.indexOf(def.start.z):4,along:def.start.x-52,chaser:true});chaser.cruise=20;
    traffic.chaseSpeed=d=>d>110?27.5:d>60?24:d<18?20.5:21.5}
  if(def.police){W.heat=def.forceHeat||3;updLvl();def.police.forEach(p=>spawnPolice(p))}
  const fn=(def.hints||(def.tutorial?HINTS:null));M.hf=fn?fn.map(h=>[new Function('t','inp','pl','M',`return ${h[0]}`),h[1]]):null;
  inp.used={gas:0,steer:0,brake:0,horn:0,hand:0,shoot:0};inp.l=inp.r=inp.gas=inp.brake=inp.hand=inp.shoot=0;
  show('hud');$('chase').classList.toggle('on',!!def.chase);$('bnTitle').textContent=(def.icon+' '+def.title).toUpperCase();
  applyStep();sfx.click();
  toast(def.tutorial?'Tutorial: neeche ke buttons se gaadi chalao 👇':def.veh?('🚘 '+VEH[def.veh].name+' — mission shuru!'):'Mission shuru! Minimap aur ➤ arrow follow karo',3500)}
function applyStep(){const d=M.def,s=d.steps[M.step];marker.visible=!s.kill;marker.position.set(s.x,0,s.z);setMarkerColor(s.color||0xffd166);$('bnObj').textContent=s.label;
  if(d.id==='m1')setPerson(s.pick?s.x:0,s.pick?s.z:0,0x1d4e89,0xb57750,!!s.pick);
  if(d.id==='m2'&&M.step===0)setPerson(s.x,s.z,0xffcc00,0xd8a24a,true);else if(d.id==='m2')setPerson(0,0,0,0,false);
  if(s.kill){M.k={spawned:0,killed:0};spawnWave(s,M.def.blaster?5:4);toast('Rival gang aa gayi! SHOOT dabao 🔫',2800,'bad')}}
function spawnWave(s,n){const k=M.k;n=Math.min(n,s.kill-k.spawned);for(let i=0;i<n;i++){const a=Math.random()*6.28,r=18+Math.random()*10,e=combat.spawn(s.x+Math.cos(a)*r,s.z+Math.sin(a)*r,{aggro:70,hp:M.def.blaster?72:55});pushCircle(colliders,e,.6)}k.spawned+=n}
function stepDone(){const d=M.def,s=d.steps[M.step];
  if(s.pick){sfx.pickup();toast(d.id==='m1'?'Pravin gaadi mein baith gaya! ✔':'Parcel mil gaya! ✔',2600,'good');setPerson(0,0,0,0,false)}
  else if(s.cp){sfx.checkpoint();toast(s.label+' ✔',1400,'good')}
  else if(s.drop){sfx.pickup();toast((d.id==='m1'?'Pravin ko drop kar diya':'Delivery '+s.drop)+' ✔',2200,'good')}
  else if(s.kill){sfx.win();toast('Gang bhaag gayi! ✔',2000,'good')}
  else if(d.id==='m5'){sfx.checkpoint();toast('Pahunch gaye! Ab gaadi se EXIT dabao 🚪',3000,'good')}
  M.step++;if(M.step>=d.steps.length){endMission(true)}else{if(d.id==='m2'){M.left+=8}applyStep();
    if(d.id==='m1'&&M.step===1)toast('Ab Sea Gate Arch (samundar kinare) ➜ minimap dekho',3200)}}
function runHints(dt){if(!M.hf||M.hint>=M.hf.length)return;M.hintT-=dt;if(M.hintT>0)return;const h=M.hf[M.hint];let ok=false;try{ok=h[0](M.t,inp,pl,M)}catch(e){}
  if(ok){toast(h[1],4200);M.hint++;M.hintT=4.6}}
function endMission(win){if(M.done)return;M.done=true;marker.visible=false;setPerson(0,0,0,0,false);inp.l=inp.r=inp.gas=inp.brake=inp.hand=inp.horn=inp.shoot=0;joy.x=joy.y=0;
  const d=M.def;let stars=0,reward=0;
  if(win){const par=d.time||180;stars=M.t<=par*.7?3:M.t<=par*1.3?2:1;reward=Math.round(d.reward*(0.6+stars*.2));cash+=reward;prog.cash=cash;
    if(d.blaster&&!prog.blaster){prog.blaster=true;setTimeout(()=>toast('⚡ Brothers Blaster Free Roam mein unlock ho gaya!',3600,'good'),1400)}
    const idx=MISSIONS.indexOf(d);prog.unlocked=Math.max(prog.unlocked,idx+2);const b=prog.best[d.id]||{stars:0,time:0};if(stars>=b.stars){prog.best[d.id]={stars,time:Math.round(M.t)}}save();sfx.win()}
  else sfx.fail();
  setTimeout(()=>{clearAmbush();combat.clear();clearPolice();
    $('rTitle').textContent=win?'MISSION PASSED! 🎉':'MISSION FAILED 😕';$('rTitle').style.color=win?'#7CFC8A':'#ff6b6b';
    $('rStars').textContent=win?'★'.repeat(stars)+'☆'.repeat(3-stars):'☆☆☆';
    $('rLine').textContent=win?d.win.map(w=>CHARS.find(c=>c.id===w[0]).name+': '+w[1]).join('  '):M.fail||'Phir try karo!';
    $('rStats').textContent=win?`Time: ${Math.round(M.t)}s   •   Reward: +₹${reward}   •   Total: ₹${cash}`:'Koi baat nahi — dobara try karo, ab aur aasaan lagega!';
    $('rNext').style.display=win&&MISSIONS.indexOf(d)<MISSIONS.length-1?'':'none';
    mode='result';show('result')},900)}
function failMission(why){if(M&&!M.done){M.fail=why;toast(why,2400,'bad');endMission(false)}}
function startFree(){if(home.on)exitHome(true);removeChaser();clearAmbush();combat.clear();clearPolice();resetGarage();M=null;mode='free';marker.visible=false;setPerson(0,0,0,0,false);pl.foot=false;setChar(pl.ch,true);if(!pl.mesh)setVehicle(CHARS[pl.ch].id);pl.mesh.visible=true;hero.hp=hero.max;hero.ammo.pistol=Math.max(hero.ammo.pistol,30);hero.weapons.blaster=!!prog.blaster;if(prog.blaster)hero.ammo.blaster=Math.max(hero.ammo.blaster,16);else if(hero.cur==='blaster')hero.cur='pistol';placePlayer({x:-192,z:-96,th:Math.PI/2});hudMode();show('hud');$('chase').classList.remove('on');
  $('bnTitle').textContent='🌆 FREE ROAM';$('bnObj').textContent='Maidan • Mafia Garage • Sea Gate Arch';$('arrow').style.visibility='hidden';$('dist').textContent='';$('timer').textContent='';addaT=0;spawnAdda();
  toast('Free Roam: EXIT se paidal, Mafia Garage mein Toro V12 aur Hyper H-Blade! Pause mein gaadi badlo',4200)}
function updateMission(dt){
  M.t+=dt;runHints(dt);
  const s=M.def.steps[M.step];if(!s||M.done)return;
  if(s.kill){const k=M.k;if(k){if(k.spawned<s.kill&&combat.alive()<=1)spawnWave(s,M.def.blaster?5:4);if(k.killed>=s.kill)stepDone()}}
  else{const dx=s.x-pl.x,dz=s.z-pl.z;const T=T_(),d=Math.hypot(s.x-T.x,s.z-T.z);if(d<(s.r||10)+1.5)stepDone()}
  if(M.done)return;
  if(chaser){const cd=Math.hypot(chaser.x-pl.x,chaser.z-pl.z);
    M.meter=0}
}
// ---------- HUD
const mini=$('mini'),mx=mini.getContext('2d');let MW=150;
function fitMini(){const w=$('mapwrap').clientWidth||150,d=Math.min(devicePixelRatio||1,2);mini.width=mini.height=Math.round(w*d);MW=mini.width}
function drawMini(){
  const T=T_(),vy=pl.foot?cam.yaw:pl.th,W_=MW,s=W_/250,a=vy-Math.PI,ca=Math.cos(a),sa=Math.sin(a),off=city.map.off;
  mx.setTransform(1,0,0,1,0,0);mx.fillStyle='#0e2234';mx.fillRect(0,0,W_,W_);
  mx.save();mx.translate(W_/2,W_/2);mx.scale(s,s);mx.rotate(a);mx.translate(-T.x,-T.z);mx.imageSmoothingEnabled=true;mx.drawImage(city.map.canvas,-off,-off,700,700);mx.restore();
  const P=(x,z)=>{const dx=x-T.x,dz=z-T.z;return[W_/2+(dx*ca-dz*sa)*s,W_/2+(dx*sa+dz*ca)*s]};
  const k=W_/150;
  const dot=(x,z,col,r,clampEdge,shape)=>{let [px,py]=P(x,z);const cx=px-W_/2,cy=py-W_/2,dd=Math.hypot(cx,cy),lim=W_/2-r-3;if(dd>lim){if(!clampEdge)return;px=W_/2+cx/dd*lim;py=W_/2+cy/dd*lim}
    if(shape==='dia'){mx.beginPath();mx.moveTo(px,py-r*1.5);mx.lineTo(px+r*1.3,py);mx.lineTo(px,py+r*1.5);mx.lineTo(px-r*1.3,py);mx.closePath()}else mx.arc(px,py,r,0,7);
    if(shape==='pulse'){mx.save();mx.beginPath();mx.arc(px,py,r*(1.6+.5*Math.sin(gtime*5)),0,7);mx.strokeStyle=col;mx.globalAlpha=.55;mx.lineWidth=2*k;mx.stroke();mx.restore();mx.beginPath();mx.arc(px,py,r,0,7)}
    mx.shadowColor=col;mx.shadowBlur=6*k;mx.fillStyle=col;mx.fill();mx.shadowBlur=0;mx.lineWidth=2*k;mx.strokeStyle='#fff';mx.stroke()};
  for(const o of parked)dot(o.x,o.z,o.kind==='toro'||o.kind==='hblade'?'#32e6ff':'#ccc',3*k,false,'dia');
  for(const e of combat.enemies)if(!e.dead)dot(e.x,e.z,'#ff3b3b',3*k,false);
  for(const v of W.cars)dot(v.x,v.z,'#3a7bff',4*k,true,'pulse');
  if(chaser)dot(chaser.x,chaser.z,'#ff3b3b',4*k,true);
  if(M&&!M.done&&marker.visible){const st=M.def.steps[M.step];dot(st.x,st.z,'#ffd166',6*k,true,'pulse')}
  mx.save();mx.translate(W_/2,W_/2);if(pl.foot)mx.rotate(-angd(vy,fp.th));mx.fillStyle='#fff';mx.strokeStyle='#2ad8ee';mx.lineWidth=2;mx.beginPath();mx.moveTo(0,-8*k);mx.lineTo(6*k,7*k);mx.lineTo(0,4*k);mx.lineTo(-6*k,7*k);mx.closePath();mx.fill();mx.stroke();mx.restore();
}
let wShown='';
const ICO_CAR='<svg viewBox="0 0 48 48"><path d="M6 28l4-10c1-3 3-4 6-4h16c3 0 5 1 6 4l4 10v8h-6v-4H12v4H6z" fill="currentColor"/><circle cx="14" cy="30" r="3" fill="#0a1a2a"/><circle cx="34" cy="30" r="3" fill="#0a1a2a"/></svg>',ICO_DOOR='<svg viewBox="0 0 48 48"><path d="M10 6h18v36H10z" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M28 24h14M36 17l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="22" cy="24" r="2" fill="currentColor"/></svg>';
const WICON={pistol:'<svg viewBox="0 0 64 40"><path d="M6 8h36l4 4h12v8h-14l-3 4-3 10H22l3-14H6z" fill="currentColor"/></svg>',
  smg:'<svg viewBox="0 0 64 40"><path d="M2 12h34l4-4h12l2 4h8v7H52l-2 4H40l-3 4-2 9h-9l3-13H12l-4 7H2z" fill="currentColor"/></svg>',
  shotgun:'<svg viewBox="0 0 64 40"><path d="M1 14h42l4-3h10l3 3v6H55l-3 3H44l-6 3H20l-3 6h-8l4-9H1z" fill="currentColor"/></svg>',
  blaster:'<svg viewBox="0 0 64 40"><path d="M3 13h22l5-5h20l8 6v7l-8 3H38l-4 9H22l3-9H3z" fill="currentColor"/><circle cx="50" cy="17" r="4" fill="#fff"/><path d="M10 17h10M10 21h14" stroke="#6b3a00" stroke-width="2"/></svg>'};
function updateHud(dt){
  const T=T_();
  $('spd').textContent=Math.round(Math.abs(pl.speed)*3.6);
  $('hudCash').textContent='₹'+cash;
  $('hpBar').style.width=(hero.hp/hero.max*100)+'%';$('hpBar').classList.toggle('low',hero.hp/hero.max<.3);$('hpTxt').textContent=Math.ceil(hero.hp);$('arBar').style.width=(hero.armor/50*100)+'%';$('arBox').style.visibility=hero.armor>0?'visible':'hidden';
  const wk=WEAPONS[hero.cur];$('wpn').textContent='';if(wShown!==hero.cur){wShown=hero.cur;$('wIcon').innerHTML=WICON[hero.cur]}$('wAmmo').innerHTML=`<b>${hero.ammo[hero.cur]}</b> / ${wk.max}`;$('wName').textContent=wk.name;$('wbox').classList.toggle('show',pl.foot);$('wbox').classList.toggle('bb',hero.cur==='blaster');
  const wl=$('wanted');wl.textContent=W.lvl?'🚔'+'★'.repeat(W.lvl)+'☆'.repeat(3-W.lvl):'';wl.classList.toggle('on',W.lvl>0);
  $('dmg').classList.toggle('on',hero.hurtT>0);
  const eb=$('bExit');if(pl.foot){const e=nearParked(7.5),cj=!e&&nearCivCar(5.5);eb.classList.toggle('hide',!e&&!cj);$('exitI').innerHTML=ICO_CAR;$('exitT').textContent=cj?'CARJACK':'ENTER'}else{eb.classList.remove('hide');eb.classList.remove('dim');$('exitI').innerHTML=ICO_DOOR;$('exitT').textContent='EXIT'}
  if(pl.foot&&nearHome()){eb.classList.remove('hide');$('exitI').innerHTML=ICO_DOOR;$('exitT').textContent='GHAR'}
  const police=W.lvl>0;$('chase').classList.toggle('on',police);
  if(police){$('chaseTxt').textContent='BUSTED METER 🚔';$('chaseBar').style.width=Math.min(100,W.bust*100)+'%'}
  if(M&&!M.done){const s=M.def.steps[M.step];let tx=s.x,tz=s.z,lab=s.label,dtxt;
    if(s.kill){let b=null,bd=1e9;for(const e of combat.enemies){if(e.dead)continue;const d=Math.hypot(e.x-T.x,e.z-T.z);if(d<bd){bd=d;b=e}}if(b){tx=b.x;tz=b.z}lab=`${s.label}: ${M.k?M.k.killed:0}/${s.kill}`;dtxt=b?Math.round(bd)+' m':''}
    const d=Math.hypot(tx-T.x,tz-T.z),ref=pl.foot?cam.yaw:pl.th;
    $('arrow').style.visibility='visible';$('arrow').style.transform=`rotate(${-90-angd(ref,Math.atan2(tx-T.x,tz-T.z))*180/Math.PI}deg)`;
    $('dist').textContent=dtxt!==undefined?dtxt:Math.round(d)+' m';const t=$('timer');t.textContent='';
    $('bnObj').textContent=(M.def.steps.length>1&&!M.def.steps[0].cp||s.kill)?lab:$('bnObj').textContent}
}
// ---------- screens
const trio=$('trio');CHARS.forEach(c=>{const i=new Image();i.src=PORT[c.id];trio.appendChild(i)});
function dialog(lines){return lines.map(([w,t])=>{const c=CHARS.find(x=>x.id===w);return `<div class="dl"><img src="${PORT[w]}"><div><b>${c.name}</b>${t}</div></div>`}).join('')}
let storyI=0;
function showStory(){storyI=0;renderStory();show('story')}
function renderStory(){const s=STORY[storyI];$('storyArt').innerHTML=s.who.map(w=>`<img src="${PORT[w]}">`).join('');$('storyTxt').textContent=s.text;$('storyNext').textContent=storyI===STORY.length-1?'Chalo! ▶':'Aage ▶'}
$('storyNext').onclick=()=>{sfx.click();if(storyI<STORY.length-1){storyI++;renderStory()}else{prog.storySeen=true;save();openMenu()}};
$('storySkip').onclick=()=>{sfx.click();prog.storySeen=true;save();openMenu()};
function openMenu(){mode='menu';$('menuCash').textContent='₹'+cash;
  $('mlist').innerHTML=MISSIONS.map((m,i)=>{const lock=i>=prog.unlocked,b=prog.best[m.id];return `<div class="mc ${lock?'lock':''} ${i===prog.unlocked-1?'rec':''}" data-i="${i}"><div class="rw">₹${m.reward}</div><div class="mi">${lock?'🔒':m.icon}</div><div class="mt">${i+1}. ${m.title}</div><div class="ms">${m.sub}</div><div class="st">${b?'★'.repeat(b.stars)+'☆'.repeat(3-b.stars):'☆☆☆'}</div></div>`}).join('');
  $('mlist').querySelectorAll('.mc').forEach(e=>e.onclick=()=>{const i=+e.dataset.i;sfx.click();if(i>=prog.unlocked){toast2('Pehle pichla mission poora karo 🔒');return}openBrief(i)});show('menu')}
function toast2(t){const e=document.createElement('div');e.textContent=t;e.style.cssText='position:fixed;left:50%;bottom:10vh;transform:translateX(-50%);background:#000c;border:2px solid #ffd166;border-radius:12px;padding:8px 16px;z-index:70;font:800 14px system-ui';document.body.appendChild(e);setTimeout(()=>e.remove(),1600)}
let bi=0,bch=0;
function openBrief(i){bi=i;const m=MISSIONS[i];bch=m.rec;$('bTitle').textContent=m.icon+' '+m.title.toUpperCase();$('bSub').textContent=m.sub+'  •  Reward ₹'+m.reward+(m.veh?'  •  Gaadi: '+VEH[m.veh].name:'');$('bDialog').innerHTML=dialog(m.brief);$('bObj').textContent='🎯 '+m.obj+(m.time?'  •  ⏱ '+m.time+'s':'');renderChars(m);show('brief')}
function renderChars(m){$('bChars').innerHTML=CHARS.map((c,i)=>{const s=c.stats,bar=(l,v)=>`<span>${l}</span><i style="width:${v*100}%"></i>`;return `<div class="cc ${i===bch?'sel':''}" data-i="${i}">${i===m.rec?'<div class="bd">BEST FOR THIS</div>':''}<img src="${PORT[c.id]}"><div class="nm" style="color:${c.color}">${c.name}</div><div class="stt">${bar('Speed',s.speed)}${bar('Turn',s.handle)}${bar('Tough',s.tough)}</div></div>`}).join('');
  $('bChars').querySelectorAll('.cc').forEach(e=>e.onclick=()=>{bch=+e.dataset.i;sfx.click();renderChars(m)})}
$('bGo').onclick=()=>{sfx.click();startMission(MISSIONS[bi],bch)};$('bBack').onclick=()=>{sfx.click();openMenu()};
$('menuBack').onclick=()=>{sfx.click();toTitle()};
$('btnPlay').onclick=()=>{sfx.click();if(!prog.storySeen)showStory();else openMenu()};
$('btnStory').onclick=()=>{sfx.click();showStory()};
$('btnFree').onclick=()=>{sfx.click();startFree()};
function toTitle(){mode='title';if(home.on)exitHome(true);removeChaser();clearAmbush();combat.clear();clearPolice();M=null;pl.foot=false;hudMode();show('title')}
function pause(on){if(state!=='hud'&&state!=='pause')return;paused=on;if(on){inp.l=inp.r=inp.gas=inp.brake=inp.hand=inp.shoot=0;joy.x=joy.y=0;$('pSwitch').style.display=mode==='free'?'':'none';$('pVeh').style.display=mode==='free'?'':'none';$('pGar').style.display=mode==='free'?'':'none';$('pVeh').textContent='🚘 Gaadi: '+VEH[pl.kind].name+' (badlo)';$('pRestart').style.display=mode==='mission'?'':'none';show('pause');$('hud').classList.add('on')}else{show('hud')}}
$('btnPause').onclick=()=>{sfx.click();pause(true)};$('pResume').onclick=()=>{sfx.click();pause(false)};
$('pRestart').onclick=()=>{sfx.click();const d=M.def,c=pl.ch;startMission(d,c)};
$('pSwitch').onclick=()=>{sfx.click();const c=(pl.ch+1)%3;setChar(c,pl.kind==='toro'||pl.kind==='hblade');if(pl.mesh&&!pl.foot)pl.mesh.visible=true;toast('Ab '+CHARS[c].name+' 🎮',2000);pause(false)};
$('pQuit').onclick=()=>{sfx.click();paused=false;marker.visible=false;setPerson(0,0,0,0,false);toTitle()};
{const mkb=(id,txt,fn)=>{const b=document.createElement('button');b.id=id;b.className='btn sm';b.textContent=txt;b.onclick=fn;$('pause').firstElementChild.insertBefore(b,$('pQuit'));return b};
  mkb('pRoad','🛣 Gaadi sadak pe laao',()=>{sfx.click();snapRoad();pause(false)});
  mkb('pVeh','🚘 Gaadi',()=>{sfx.click();const O=['aditya','pravin','deep','toro','hblade'];const k=O[(O.indexOf(pl.kind)+1)%O.length];chooseVehicle(k);toast('🚘 '+VEH[k].name,2200,'good');pause(false)});
  mkb('pEnv','🌙',()=>{sfx.click();prog.day=night;save();setEnv(!night);pause(false);toast(night?'🌙 Raat mode':'☀️ Shaam mode',1800)});
  mkb('pGar','🏁 Mafia Garage pe jao',()=>{sfx.click();teleportGarage();pause(false);toast('Mafia Garage: Toro V12 aur Hyper H-Blade yahin khadi hain',3000)})}
function snapRoad(){if(pl.foot)return;let best=1e9,bx=pl.x,bz=pl.z,bt=pl.th;for(const a of XS){const dx=Math.abs(pl.x-a);if(dx<best){best=dx;bx=a;bz=pl.z;bt=Math.cos(pl.th)>=0?0:Math.PI}const dz=Math.abs(pl.z-a);if(dz<best){best=dz;bz=a;bx=pl.x;bt=Math.sin(pl.th)>=0?Math.PI/2:-Math.PI/2}}
  pl.x=clamp(bx,-290,290);pl.z=clamp(bz,-290,290);pl.th=bt;pl.vx=pl.vz=0;cam.init=false;cam.yaw=bt}
$('rMenu').onclick=()=>{sfx.click();M=null;openMenu()};$('rRetry').onclick=()=>{sfx.click();startMission(M.def,pl.ch)};
$('rNext').onclick=()=>{sfx.click();const i=MISSIONS.indexOf(M.def)+1;if(i<MISSIONS.length)openBrief(i);else openMenu()};
$('btnMute').onclick=()=>{sfx.setMuted(!sfx.muted);$('btnMute').textContent=sfx.muted?'🔇':'🔊';$('pSound').textContent='🔊 Sound: '+(sfx.muted?'OFF':'ON')};
$('pSound').onclick=()=>$('btnMute').onclick();
$('pMusic').onclick=()=>{sfx.setMusic(!sfx.musicOn);$('pMusic').textContent='🎵 Music: '+(sfx.musicOn?'ON':'OFF')};
$('splash').addEventListener('pointerdown',()=>{if(state==='splash')endSplash()});
function endSplash(){if(state==='splash'){show('title');mode='title'}}
// ---------- main loop
let last=performance.now(),frameN=0;
function frame(now){
  requestAnimationFrame(frame);
  let dt=Math.min(.05,(now-last)/1000);last=now;gtime+=dt;crashCool-=dt;hornCool-=dt;heatCool-=dt;sfxHurtCool-=dt;if(hero.hurtT>0)hero.hurtT-=dt;hero.since+=dt;
  const playing=state==='hud'&&!paused&&(mode==='mission'||mode==='free');
  if(playing&&hero.since>4&&hero.hp>0&&hero.hp<hero.max)hero.hp=Math.min(hero.max,hero.hp+hero.max*.04*dt);
  if(playing&&home.on){homeUpdate(dt);followCam(dt)}
  else if(playing){
    if(pl.foot)footUpdate(dt);else{const n=dt>.026?2:1;for(let i=0;i<n;i++)physics(dt/n)}
    const T=T_();traffic.extra=peds.roadPeds().map(p=>({x:p.x,z:p.z,half:.5}));traffic.update(dt,{x:T.x,z:T.z,half:T.half||pl.half,t:gtime});
    pedVeh.length=0;if(!pl.foot){pedMe.x=pl.x;pedMe.z=pl.z;pedMe.th=pl.th;pedMe.speed=pl.speed;pedMe.half=pl.half;pedMe.isBike=pl.bike;pedVeh.push(pedMe)}for(const v of traffic.list)pedVeh.push(v);
    peds.update(dt,T,pedVeh,gtime);
    combat.update(dt,{x:T.x,z:T.z,aim:pl.foot?fp.aim:null,armor:pl.foot?1:.5},gtime);
    for(const t of combat.collect({x:T.x,z:T.z,pr:pl.foot?2.8:3.6}))giveItem(t);
    updateWanted(dt);updateAmbush(dt,true);
    if(mode==='mission'&&M)updateMission(dt);
    if(mode==='free'){if(combat.alive()===0){addaT+=dt;if(addaT>45){addaT=0;spawnAdda()}}}
    updateHud(dt);followCam(dt)}
  else if(state==='pause'){followCam(0)}
  else{traffic.update(dt,{x:-9999,z:-9999,half:2,t:gtime});titleCam(gtime);combat.update(dt,{x:-9999,z:-9999,aim:null},gtime)}
  // visuals
  if(pl.mesh){pl.mesh.visible=!pl.foot&&(playing||state==='pause');if(pl.mesh.visible){pl.mesh.position.set(pl.x,.12,pl.z);pl.mesh.rotation.y=pl.th;
    if(pl.bike){pl.mesh.userData.lean.rotation.z=-pl.lean;pl.mesh.rotation.z=0}else pl.mesh.rotation.z=playing?-pl.steer*Math.min(1,Math.abs(pl.speed)/30)*.05:0;
    const u=pl.mesh.userData;animWheels(pl.mesh,pl.speed,playing?pl.steer:0,dt);if(u.tm)setBrake(pl.mesh,playing&&(inp.brake||inp.hand)&&Math.abs(pl.speed)>1);
    if(u.flames){const on=playing&&inp.gas&&Math.abs(pl.speed)>pl.P.maxS*.78;for(const f of u.flames){f.visible=on;if(on){f.scale.set(1,.6+Math.random()*.9,1);f.material.opacity=.55+Math.random()*.4}}}}}
  for(const o of parked){const dr=o.mesh.userData.doors;if(dr){const near=pl.foot&&Math.hypot(o.x-fp.x,o.z-fp.z)<9;for(const d of dr){const tg=near?1.05:0;d.rotation.x+=(tg-d.rotation.x)*Math.min(1,dt*5)}}}
  if(fp.mesh)fp.mesh.visible=pl.foot&&(playing||state==='pause');
  for(const v of W.cars){const u=v.mesh.userData;if(u.lr){const on=Math.floor(gtime*7)%2;u.lr.color.setHex(on?0xff2020:0x300505);u.lb.color.setHex(on?0x050a30:0x2060ff);if(u.hr){u.hr.material.opacity=on?.95:.06;u.hb.material.opacity=on?.06:.95}}}
  city.update(gtime);city.updateSignals(gtime);
  if(marker.visible){const p=1+Math.sin(gtime*4)*.06;marker.userData.ring.scale.set(p,p,1);marker.userData.beam.material.opacity=.22+Math.sin(gtime*3)*.07}
  if(personM)personM.rotation.y=gtime;
  sky.position.copy(camera.position);sunS.position.copy(camera.position).addScaledVector(SUNDIR,2100);moonS.position.copy(camera.position).addScaledVector(MOONDIR,2100);
  {const Tt=T_();sun.target.position.set(Tt.x,0,Tt.z);if(night)sun.position.set(Tt.x-50,85,Tt.z+45);else sun.position.set(Tt.x-100,50,Tt.z+15)}
  if(playing&&!Q.locked){Q.acc+=dt;Q.fr++;if(Q.fr>=150){const avg=Q.acc/Q.fr;Q.acc=0;Q.fr=0;if(avg>.034){Q.slow++;if(Q.slow===1&&Q.shadows){Q.shadows=false;sun.castShadow=false}else if(Q.slow<=3&&Q.pr>1){Q.pr=1;renderer.setPixelRatio(1);resize()}}else Q.slow=Math.max(0,Q.slow-1)}}
  renderer.render(scene,camera);
  if(playing&&!home.on&&((frameN++)&1))drawMini();
  const ratio=Math.abs(pl.speed)/pl.P.maxS,Tt=T_();
  sfx.update({ratio,throttle:playing&&inp.gas&&!pl.foot?1:0,skid:Math.max(pl.skid*(playing?1:0),amb.car&&amb.skid>0&&playing?amb.skid:0),sea:clamp(1-(Tt.x+322)/260,0,1),active:playing&&!pl.foot,siren:playing&&W.cars.length?clamp(1-(W.minD||200)/160,0,1):0});
}
resize();
window.__mb={damageHero,giveItem,combat,homes:city.homes,home,homeR,enterHome,exitHome,homeAct,nearHome,amb,startAmbush,updateAmbush,peds,carjack,Q,sun,renderer,scene,setEnv,get night(){return night},setQuality:(q)=>{Q.locked=true;Q.shadows=q!=='low';sun.castShadow=Q.shadows;Q.pr=q==='low'?1:Math.min(window.devicePixelRatio||1,1.5);renderer.setPixelRatio(Q.pr);resize()},get state(){return state},get mode(){return mode},get M(){return M},pl,fp,hero,inp,joy,traffic,combat,W,parked,MISSIONS,CHARS,VEH,prog,camera,setLeft:t=>{if(M)M.left=t},startMission,startFree,openMenu,show,get paused(){return paused},get cash(){return cash},colliders,failMission,get chaser(){return chaser},toggleVehicle,chooseVehicle,teleportGarage,addHeat,exitVehicle,nearParked,cam,giveItem};
requestAnimationFrame(t=>{last=t;$('loading').classList.add('off');$('splash').classList.add('on');state='splash';setTimeout(endSplash,2500);frame(t)});
