import * as THREE from './three.module.min.js';
import {buildCity,XS,LM} from './city.js';
import {Traffic,buildModel,personModel,SPEC,cpos} from './vehicles.js';
import {Sfx} from './audio.js';
import {CHARS,portrait} from './portraits.js';
import {MISSIONS,STORY} from './missions.js';
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angd=(a,b)=>{let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d};
const sfx=new Sfx();
// ---------- renderer / scene
const cv=$('c'),renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
const scene=new THREE.Scene(),FOG=0xf0a47a;scene.fog=new THREE.Fog(FOG,70,520);scene.background=new THREE.Color(FOG);
const camera=new THREE.PerspectiveCamera(62,1,.5,4500);
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();fitMini()}
addEventListener('resize',resize);
scene.add(new THREE.HemisphereLight(0xffc89a,0x4a3f66,1.15));
const sun=new THREE.DirectionalLight(0xffa860,1.5);sun.position.set(-100,45,15);scene.add(sun);
// sky dome + sun disc
const skyC=document.createElement('canvas');skyC.width=4;skyC.height=256;{const x=skyC.getContext('2d'),g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#2d2a63');g.addColorStop(.35,'#6d4f97');g.addColorStop(.62,'#e8808a');g.addColorStop(.82,'#ffb36b');g.addColorStop(1,'#ffd9a0');x.fillStyle=g;x.fillRect(0,0,4,256)}
const sky=new THREE.Mesh(new THREE.SphereGeometry(2500,16,12),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(skyC),side:THREE.BackSide,fog:false,depthWrite:false}));scene.add(sky);
const sunC=document.createElement('canvas');sunC.width=sunC.height=128;{const x=sunC.getContext('2d'),g=x.createRadialGradient(64,64,4,64,64,64);g.addColorStop(0,'#fffbe0');g.addColorStop(.2,'#ffe08a');g.addColorStop(.5,'rgba(255,150,80,.45)');g.addColorStop(1,'rgba(255,120,60,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}
const sunS=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(sunC),fog:false,depthWrite:false,transparent:true}));sunS.scale.set(700,700,1);scene.add(sunS);
const SUNDIR=new THREE.Vector3(-1,.06,.12).normalize();
const city=buildCity(scene);
const colliders=city.colliders;
// ---------- state
const rnd=(()=>{let s=1234;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}})();
const traffic=new Traffic(scene,rnd);
const pl={x:-288,z:240,th:Math.PI,vx:0,vz:0,steer:0,ch:0,mesh:null,half:2.2,c:SPEC.veer.c,mass:1,speed:0,skid:0,P:CHARS[0].phys};
function setChar(i){pl.ch=i;if(pl.mesh)scene.remove(pl.mesh);const k=CHARS[i].id;pl.mesh=buildModel(k);scene.add(pl.mesh);pl.half=SPEC[k].half;pl.c=SPEC[k].c;pl.P=CHARS[i].phys;pl.mass=pl.P.mass;$('who').textContent=CHARS[i].name.toUpperCase()}
setChar(0);
function spawnTraffic(){const kinds=['taxi','taxi','taxi','taxi','taxi','bus','bus','bus','auto','auto','auto','auto','sedan','sedan','auto','taxi'];kinds.forEach(k=>traffic.spawn(k))}
spawnTraffic();
let state='splash',M=null,paused=false,mode='free',cash=0,gtime=0;
let prog={unlocked:1,best:{},cash:0,storySeen:false};
try{const p=JSON.parse(localStorage.getItem('mb_prog')||'null');if(p)prog=Object.assign(prog,p)}catch(e){}
const save=()=>{try{localStorage.setItem('mb_prog',JSON.stringify(prog))}catch(e){}};
cash=prog.cash||0;
const inp={l:0,r:0,gas:0,brake:0,hand:0,horn:0,used:{gas:0,steer:0,brake:0,horn:0,hand:0}};
// ---------- portraits
const PORT={};CHARS.forEach(c=>PORT[c.id]=portrait(c));
// ---------- UI helpers
const SCR=['splash','title','story','menu','brief','pause','result'];
function show(id){SCR.forEach(s=>$(s).classList.toggle('on',s===id));$('hud').classList.toggle('on',id==='hud');state=id}
let toastT=0;
function toast(t,ms=3200,cls=''){const e=$('toast');e.textContent=t;e.className='on '+cls;clearTimeout(toastT);toastT=setTimeout(()=>e.className='',ms)}
// ---------- fullscreen on first tap
let firstTap=false;
function firstGesture(){sfx.init();if(firstTap)return;firstTap=true;
  try{const el=document.documentElement,rq=el.requestFullscreen||el.webkitRequestFullscreen;if(rq){const r=rq.call(el,{navigationUI:'hide'});if(r&&r.catch)r.catch(()=>{})}}catch(e){}
  try{if(screen.orientation&&screen.orientation.lock){const r=screen.orientation.lock('landscape');if(r&&r.catch)r.catch(()=>{})}}catch(e){}}
addEventListener('pointerdown',firstGesture,{capture:true});addEventListener('touchend',firstGesture,{capture:true,passive:true});
// ---------- controls
function bindPedal(id,key,barrier){const el=$(id);let pid=null;
  const on=e=>{e.preventDefault();pid=e.pointerId;try{el.setPointerCapture(pid)}catch(_){}inp[key]=1;inp.used[key]=1;el.classList.add('on');if(key==='horn')doHorn()};
  const off=e=>{if(pid!==null&&e.pointerId!==pid)return;pid=null;inp[key]=0;el.classList.remove('on')};
  el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);el.addEventListener('lostpointercapture',off)}
bindPedal('pGas','gas');bindPedal('pBrake','brake');bindPedal('pHand','hand');bindPedal('pHorn','horn');
{const z=$('steer');let pid=null;const upd=e=>{const r=z.getBoundingClientRect(),x=e.clientX-r.left,m=r.width/2,dead=r.width*.04;inp.l=x<m-dead?1:0;inp.r=x>m+dead?1:0;inp.used.steer=1;$('aL').classList.toggle('on',!!inp.l);$('aR').classList.toggle('on',!!inp.r)};
  z.addEventListener('pointerdown',e=>{e.preventDefault();pid=e.pointerId;try{z.setPointerCapture(pid)}catch(_){}upd(e)});
  z.addEventListener('pointermove',e=>{if(e.pointerId===pid)upd(e)});
  const off=e=>{if(e.pointerId!==pid)return;pid=null;inp.l=inp.r=0;$('aL').classList.remove('on');$('aR').classList.remove('on')};
  z.addEventListener('pointerup',off);z.addEventListener('pointercancel',off);z.addEventListener('lostpointercapture',off)}
const KM={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'gas',ArrowDown:'brake',a:'l',d:'r',w:'gas',s:'brake',' ':'hand',h:'horn'};
addEventListener('keydown',e=>{const k=KM[e.key];if(k){inp[k]=1;inp.used[k==='l'||k==='r'?'steer':k]=1;if(k==='horn'&&!e.repeat)doHorn();e.preventDefault()}});
addEventListener('keyup',e=>{const k=KM[e.key];if(k)inp[k]=0});
let hornCool=0;
function doHorn(){if(state!=='hud'||hornCool>0)return;hornCool=.35;sfx.horn();const f=[Math.sin(pl.th),Math.cos(pl.th)];
  for(const v of traffic.list){if(v.chaser)continue;const rx=v.x-pl.x,rz=v.z-pl.z,a=rx*f[0]+rz*f[1],l=Math.abs(-rx*f[1]+rz*f[0]);if(a>0&&a<32&&l<8)v.aside=3}}
// ---------- physics
function collideStatic(e){let imp=0;
  for(const c of e.c){const r=c[1];for(const b of colliders){let p=cpos(e,c);
    if(p[0]<b.x0-r||p[0]>b.x1+r||p[1]<b.z0-r||p[1]>b.z1+r)continue;
    const qx=clamp(p[0],b.x0,b.x1),qz=clamp(p[1],b.z0,b.z1);let dx=p[0]-qx,dz=p[1]-qz,d=Math.hypot(dx,dz),nx,nz,pen;
    if(d>=r)continue;
    if(d>1e-5){nx=dx/d;nz=dz/d;pen=r-d}else{const l=p[0]-b.x0,rr=b.x1-p[0],t=p[1]-b.z0,bm=b.z1-p[1],m=Math.min(l,rr,t,bm);if(m===l){nx=-1;nz=0}else if(m===rr){nx=1;nz=0}else if(m===t){nx=0;nz=-1}else{nx=0;nz=1}pen=m+r}
    e.x+=nx*pen;e.z+=nz*pen;
    const vn=e.vx*nx+e.vz*nz;if(vn<0){e.vx-=1.25*vn*nx;e.vz-=1.25*vn*nz;imp=Math.max(imp,-vn);const tx=-nz,tz=nx,vt=e.vx*tx+e.vz*tz;e.vx-=vt*tx*.06;e.vz-=vt*tz*.06;
      // steer the nose away a little so players don't get pinned
      const f=[Math.sin(e.th),Math.cos(e.th)],side=-nx*f[1]+nz*f[0];if(Math.abs(vn)>2)e.th+=clamp(side,-1,1)*.02*Math.min(1,-vn/8)*(c[0]>0?1:-1)*-1}}}
  return imp}
function collideTraffic(dt){let imp=0;
  for(const v of traffic.list){if(Math.abs(v.x-pl.x)>10||Math.abs(v.z-pl.z)>10)continue;
    for(const ca of pl.c)for(const cb of v.c){const p=cpos(pl,ca),q=cpos(v,cb),dx=p[0]-q[0],dz=p[1]-q[1],d=Math.hypot(dx,dz),r=ca[1]+cb[1];if(d>=r||d<1e-4)continue;
      const nx=dx/d,nz=dz/d,pen=r-d,mp=pl.mass,mv=v.mass,tot=mp+mv;
      pl.x+=nx*pen*mv/tot;pl.z+=nz*pen*mv/tot;v.x-=nx*pen*mp/tot;v.z-=nz*pen*mp/tot;
      const tvx=(v.x-v.px)/Math.max(dt,.001),tvz=(v.z-v.pz)/Math.max(dt,.001),rel=(pl.vx-tvx)*nx+(pl.vz-tvz)*nz;
      if(rel<0){const j=-1.25*rel/(1/mp+1/mv);pl.vx+=j*nx/mp;pl.vz+=j*nz/mp;v.kx=clamp(v.kx-j*nx/mv*.8,-14,14);v.kz=clamp(v.kz-j*nz/mv*.8,-14,14);v.stun=v.chaser?0:1.4;imp=Math.max(imp,-rel);if(!v.chaser&&v.hornT<=0){v.hornT=3;sfx.farHorn()}}}}
  return imp}
function physics(dt){
  const P=pl.P;let f=[Math.sin(pl.th),Math.cos(pl.th)],L=[Math.cos(pl.th),-Math.sin(pl.th)];
  let s=pl.vx*f[0]+pl.vz*f[1];
  const st=(inp.l?1:0)-(inp.r?1:0);pl.steer+=(st-pl.steer)*Math.min(1,dt*(st?9:12));
  const spd=Math.abs(s),yaw=pl.steer*P.steer*clamp(s/5,-1,1)*(1-.5*clamp(spd/P.maxS,0,1))*(inp.hand?1.55:1);
  pl.th+=yaw*dt;f=[Math.sin(pl.th),Math.cos(pl.th)];L=[Math.cos(pl.th),-Math.sin(pl.th)];
  s=pl.vx*f[0]+pl.vz*f[1];let l=pl.vx*L[0]+pl.vz*L[1];
  if(inp.gas&&!inp.brake){s+=P.acc*(1-Math.pow(Math.max(0,s)/P.maxS,2))*dt*(s<0?2.2:1)}
  if(inp.brake){if(s>1.2)s-=22*dt;else s=Math.max(-9,s-P.acc*.7*dt)}
  if(inp.hand){s-=s*1.1*dt}
  if(!inp.gas&&!inp.brake)s-=s*.35*dt+Math.sign(s)*Math.min(Math.abs(s),1.2*dt);
  s-=s*.003*Math.abs(s)*dt;
  const grip=inp.hand?1.6:P.grip;l*=Math.exp(-grip*dt);
  pl.skid=clamp(Math.abs(l)/6,0,1)*(spd>6?1:0);
  pl.vx=f[0]*s+L[0]*l;pl.vz=f[1]*s+L[1]*l;
  pl.x+=pl.vx*dt;pl.z+=pl.vz*dt;
  const i1=collideStatic(pl),i2=collideTraffic(dt),i3=collideStatic(pl);
  const imp=Math.max(i1,i2,i3);if(imp>3.5&&crashCool<=0){sfx.crash(imp/18);crashCool=.25;shake=Math.min(1,imp/16)}
  pl.speed=pl.vx*f[0]+pl.vz*f[1];
}
let crashCool=0,shake=0;
// ---------- camera
const cam={yaw:0,x:0,z:0,y:0,init:false};
function followCam(dt){
  cam.yaw+=angd(cam.yaw,pl.th)*Math.min(1,dt*3.2);
  const sp=Math.abs(pl.speed),dist=8.5+sp*.08,h=3.8+sp*.03;
  const tx=pl.x-Math.sin(cam.yaw)*dist,tz=pl.z-Math.cos(cam.yaw)*dist;
  if(!cam.init){cam.x=tx;cam.z=tz;cam.init=true}
  const k=Math.min(1,dt*7);cam.x+=(tx-cam.x)*k;cam.z+=(tz-cam.z)*k;
  camera.position.set(cam.x+(Math.random()-.5)*shake*.5,h,cam.z+(Math.random()-.5)*shake*.5);shake*=.9;
  camera.lookAt(pl.x+Math.sin(cam.yaw)*7,1.6,pl.z+Math.cos(cam.yaw)*7);
  const fov=60+clamp(sp/30,0,1)*14;if(Math.abs(camera.fov-fov)>.1){camera.fov+=(fov-camera.fov)*.1;camera.updateProjectionMatrix()}
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
// ---------- missions
let chaser=null;
function removeChaser(){if(chaser){scene.remove(chaser.mesh);traffic.list.splice(traffic.list.indexOf(chaser),1);chaser=null;traffic.chaseSpeed=null}}
function placePlayer(s){pl.x=s.x;pl.z=s.z;pl.th=s.th;pl.vx=pl.vz=0;pl.steer=0;cam.yaw=s.th;cam.init=false;pl.speed=0;
  for(const v of traffic.list)if(Math.hypot(v.x-s.x,v.z-s.z)<50)traffic.placeFar(v,s,140)}
function startMission(def,ch){
  paused=false;removeChaser();M={def,step:0,t:0,left:def.time,done:false,meter:0,peak:0,hint:0,hintT:0,gasT:0,fail:null};mode='mission';
  setChar(ch);placePlayer(def.start);
  if(def.chase){chaser=traffic.spawn('rival',{axis:'x',dir:1,idx:XS.indexOf(def.start.z)>=0?XS.indexOf(def.start.z):4,along:def.start.x-52,chaser:true});chaser.cruise=20;
    traffic.chaseSpeed=d=>d>110?27.5:d>60?24:d<18?20.5:21.5}
  inp.used={gas:0,steer:0,brake:0,horn:0,hand:0};
  show('hud');$('chase').classList.toggle('on',!!def.chase);$('bnTitle').textContent=(def.icon+' '+def.title).toUpperCase();
  applyStep();sfx.click();
  toast(def.tutorial?'Tutorial: neeche ke buttons se gaadi chalao 👇':'Mission shuru! Minimap aur ➤ arrow follow karo',3500)}
function applyStep(){const d=M.def,s=d.steps[M.step];marker.visible=true;marker.position.set(s.x,0,s.z);setMarkerColor(s.color||0xffd166);$('bnObj').textContent=s.label;
  const c=CHARS;if(d.id==='m1')setPerson(s.pick?s.x:0,s.pick?s.z:0,0x1d4e89,0xb57750,!!s.pick);
  if(d.id==='m2'&&M.step===0)setPerson(s.x,s.z,0xffcc00,0xd8a24a,true);else if(d.id==='m2')setPerson(0,0,0,0,false)}
function stepDone(){const d=M.def,s=d.steps[M.step];
  if(s.pick){sfx.pickup();toast(d.id==='m1'?'Bunty gaadi mein baith gaya! ✔':'Parcel mil gaya! ✔',2600,'good');setPerson(0,0,0,0,false)}
  else if(s.cp){sfx.checkpoint();toast(s.label+' ✔',1400,'good')}
  else if(s.drop){sfx.pickup();toast((d.id==='m1'?'Bunty ko drop kar diya':'Delivery '+s.drop)+' ✔',2200,'good')}
  M.step++;if(M.step>=d.steps.length){endMission(true)}else{if(d.id==='m2'||d.id==='m1'){M.left+=d.id==='m2'?8:0}applyStep();
    if(d.id==='m1'&&M.step===1)toast('Ab Sea Gate Arch (samundar kinare) ➜ minimap dekho',3200)}}
const HINTS=[
 ['t>0.6','🟢 Hara GAS button dabao — gaadi chalegi'],
 ['inp.used.gas&&t>5','⬅ ➡ se steer karo. Upar peela ➤ arrow marker ki taraf dikhata hai'],
 ['t>16','🔴 BRAKE dabao toh ruko — aur ruk ke dabate raho toh gaadi REVERSE jayegi'],
 ['t>26','📣 HORN dabao — aage ka traffic side ho jayega'],
 ['t>38','🟡 DRIFT (handbrake) dabake mod tez kato']];
function runHints(dt){if(!M.def.tutorial||M.hint>=HINTS.length)return;M.hintT-=dt;if(M.hintT>0)return;const t=M.t,used=inp.used;
  const ok=new Function('t','inp',`return ${HINTS[M.hint][0].replace('inp.used','inp.used')}`)(t,{used});
  if(ok){toast(HINTS[M.hint][1],4200);M.hint++;M.hintT=4.6}}
function endMission(win){if(M.done)return;M.done=true;marker.visible=false;setPerson(0,0,0,0,false);inp.l=inp.r=inp.gas=inp.brake=inp.hand=inp.horn=0;
  const d=M.def;let stars=0,reward=0;
  if(win){const ratio=M.left/d.time;stars=d.chase?(M.peak<.34?3:M.peak<.7?2:1):(ratio>=.5?3:ratio>=.2?2:1);reward=Math.round(d.reward*(0.6+stars*.2));cash+=reward;prog.cash=cash;
    const idx=MISSIONS.indexOf(d);prog.unlocked=Math.max(prog.unlocked,idx+2);const b=prog.best[d.id]||{stars:0,time:0};if(stars>=b.stars){prog.best[d.id]={stars,time:Math.round(M.t)}}save();sfx.win()}
  else sfx.fail();
  setTimeout(()=>{
    $('rTitle').textContent=win?'MISSION PASSED! 🎉':'MISSION FAILED 😕';$('rTitle').style.color=win?'#7CFC8A':'#ff6b6b';
    $('rStars').textContent=win?'★'.repeat(stars)+'☆'.repeat(3-stars):'☆☆☆';
    $('rLine').textContent=win?d.win.map(w=>CHARS.find(c=>c.id===w[0]).name+': '+w[1]).join('  '):M.fail||'Phir try karo!';
    $('rStats').textContent=win?`Time: ${Math.round(M.t)}s   •   Reward: +₹${reward}   •   Total: ₹${cash}`:'Koi baat nahi — dobara try karo, ab aur aasaan lagega!';
    $('rNext').style.display=win&&MISSIONS.indexOf(d)<MISSIONS.length-1?'':'none';
    mode='result';show('result')},900)}
function failMission(why){if(M&&!M.done){M.fail=why;toast(why,2400,'bad');endMission(false)}}
function startFree(){removeChaser();M=null;mode='free';marker.visible=false;setPerson(0,0,0,0,false);setChar(pl.ch);placePlayer({x:-192,z:-96,th:Math.PI/2});show('hud');$('chase').classList.remove('on');
  $('bnTitle').textContent='🌆 FREE ROAM';$('bnObj').textContent='Mumbai ghumo: Station • Sea Gate Arch • Bazaar • Maidan';$('arrow').style.visibility='hidden';$('dist').textContent='';$('timer').textContent='';toast('Free Roam: poori city ghumo! Pause mein character badal sakte ho',3600)}
function updateMission(dt){
  M.t+=dt;if(M.def.tutorial)runHints(dt);
  if(M.def.time){M.left-=dt;if(M.left<=0){M.left=0;return failMission('Time khatam! Thoda tez chalao.')}}
  const s=M.def.steps[M.step];if(!s||M.done)return;
  const dx=s.x-pl.x,dz=s.z-pl.z,d=Math.hypot(dx,dz);
  if(d<(s.r||10)+1.5)stepDone();
  if(chaser){const cd=Math.hypot(chaser.x-pl.x,chaser.z-pl.z);
    if(cd<10)M.meter+=dt/6;else M.meter=Math.max(0,M.meter-dt/5);M.peak=Math.max(M.peak,M.meter);
    if(M.meter>.5&&Math.floor(M.t*3)%2===0&&Math.floor((M.t-dt)*3)%2!==0)sfx.warn();
    if(M.meter>=1)failMission('Pakde gaye! Rival jeep ne ghera dal diya.')}
}
// ---------- HUD
const mini=$('mini'),mx=mini.getContext('2d');let MW=150;
function fitMini(){const w=$('mapwrap').clientWidth||150,d=Math.min(devicePixelRatio||1,2);mini.width=mini.height=Math.round(w*d);MW=mini.width}
function drawMini(){
  const W=MW,s=W/250,a=pl.th-Math.PI,ca=Math.cos(a),sa=Math.sin(a),off=city.map.off,MS=city.map.scale;
  mx.setTransform(1,0,0,1,0,0);mx.fillStyle='#17142a';mx.fillRect(0,0,W,W);
  mx.save();mx.translate(W/2,W/2);mx.scale(s,s);mx.rotate(a);mx.translate(-pl.x,-pl.z);mx.imageSmoothingEnabled=true;mx.drawImage(city.map.canvas,-off,-off,700,700);mx.restore();
  const P=(x,z)=>{const dx=x-pl.x,dz=z-pl.z;return[W/2+(dx*ca-dz*sa)*s,W/2+(dx*sa+dz*ca)*s]};
  const dot=(x,z,col,r,clampEdge)=>{let [px,py]=P(x,z);const cx=px-W/2,cy=py-W/2,dd=Math.hypot(cx,cy),lim=W/2-r-3;if(dd>lim){if(!clampEdge)return;px=W/2+cx/dd*lim;py=W/2+cy/dd*lim}
    mx.beginPath();mx.arc(px,py,r,0,7);mx.fillStyle=col;mx.fill();mx.lineWidth=2;mx.strokeStyle='#fff';mx.stroke()};
  const k=W/150;
  if(chaser)dot(chaser.x,chaser.z,'#ff3b3b',4*k,true);
  if(M&&!M.done&&marker.visible){const st=M.def.steps[M.step];dot(st.x,st.z,'#ffd166',6*k,true)}
  mx.save();mx.translate(W/2,W/2);mx.fillStyle='#fff';mx.strokeStyle='#e63946';mx.lineWidth=2;mx.beginPath();mx.moveTo(0,-8*k);mx.lineTo(6*k,7*k);mx.lineTo(0,4*k);mx.lineTo(-6*k,7*k);mx.closePath();mx.fill();mx.stroke();mx.restore();
}
function updateHud(dt){
  $('spd').textContent=Math.round(Math.abs(pl.speed)*3.6);
  $('hudCash').textContent='₹'+cash;
  if(M&&!M.done){const s=M.def.steps[M.step],dx=s.x-pl.x,dz=s.z-pl.z,d=Math.hypot(dx,dz);
    $('arrow').style.visibility='visible';$('arrow').style.transform=`rotate(${-90-angd(pl.th,Math.atan2(dx,dz))*180/Math.PI*1}deg)`;
    $('dist').textContent=Math.round(d)+' m';const t=$('timer');t.textContent='⏱ '+Math.ceil(M.left)+'s';t.classList.toggle('low',M.left<15);
    if(M.def.chase)$('chaseBar').style.width=Math.min(100,M.meter*100)+'%';
    const e=$('bnObj');if(M.def.steps.length>1&&!M.def.steps[0].cp)e.textContent=s.label}
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
function openBrief(i){bi=i;const m=MISSIONS[i];bch=m.rec;$('bTitle').textContent=m.icon+' '+m.title.toUpperCase();$('bSub').textContent=m.sub+'  •  Reward ₹'+m.reward;$('bDialog').innerHTML=dialog(m.brief);$('bObj').textContent='🎯 '+m.obj+(m.time?'  •  ⏱ '+m.time+'s':'');renderChars(m);show('brief')}
function renderChars(m){$('bChars').innerHTML=CHARS.map((c,i)=>{const s=c.stats,bar=(l,v)=>`<span>${l}</span><i style="width:${v*100}%"></i>`;return `<div class="cc ${i===bch?'sel':''}" data-i="${i}">${i===m.rec?'<div class="bd">BEST FOR THIS</div>':''}<img src="${PORT[c.id]}"><div class="nm" style="color:${c.color}">${c.name}</div><div class="stt">${bar('Speed',s.speed)}${bar('Turn',s.handle)}${bar('Tough',s.tough)}</div></div>`}).join('');
  $('bChars').querySelectorAll('.cc').forEach(e=>e.onclick=()=>{bch=+e.dataset.i;sfx.click();renderChars(m)})}
$('bGo').onclick=()=>{sfx.click();startMission(MISSIONS[bi],bch)};$('bBack').onclick=()=>{sfx.click();openMenu()};
$('menuBack').onclick=()=>{sfx.click();toTitle()};
$('btnPlay').onclick=()=>{sfx.click();if(!prog.storySeen)showStory();else openMenu()};
$('btnStory').onclick=()=>{sfx.click();showStory()};
$('btnFree').onclick=()=>{sfx.click();startFree()};
function toTitle(){mode='title';removeChaser();M=null;show('title')}
function pause(on){if(state!=='hud'&&state!=='pause')return;paused=on;if(on){$('pSwitch').style.display=mode==='free'?'':'none';$('pRestart').style.display=mode==='mission'?'':'none';show('pause');$('hud').classList.add('on')}else{show('hud')}}
$('btnPause').onclick=()=>{sfx.click();pause(true)};$('pResume').onclick=()=>{sfx.click();pause(false)};
$('pRestart').onclick=()=>{sfx.click();const d=M.def,c=pl.ch;startMission(d,c)};
$('pSwitch').onclick=()=>{sfx.click();const c=(pl.ch+1)%3;setChar(c);toast('Ab '+CHARS[c].name+' ki gaadi 🚗',2000);pause(false)};
$('pQuit').onclick=()=>{sfx.click();paused=false;if(M&&!M.done){marker.visible=false;setPerson(0,0,0,0,false)}marker.visible=false;toTitle()};
{const b=document.createElement('button');b.className='btn sm';b.textContent='🛣 Gaadi sadak pe laao';b.onclick=()=>{sfx.click();snapRoad();pause(false)};$('pause').firstElementChild.insertBefore(b,$('pQuit'))}
function snapRoad(){let best=1e9,bx=pl.x,bz=pl.z,bt=pl.th;for(const a of XS){const dx=Math.abs(pl.x-a);if(dx<best){best=dx;bx=a;bz=pl.z;bt=Math.cos(pl.th)>=0?0:Math.PI}const dz=Math.abs(pl.z-a);if(dz<best){best=dz;bz=a;bx=pl.x;bt=Math.sin(pl.th)>=0?Math.PI/2:-Math.PI/2}}
  pl.x=clamp(bx,-290,290);pl.z=clamp(bz,-290,290);pl.th=bt;pl.vx=pl.vz=0;cam.init=false;cam.yaw=bt}
$('rMenu').onclick=()=>{sfx.click();M=null;openMenu()};$('rRetry').onclick=()=>{sfx.click();startMission(M.def,pl.ch)};
$('rNext').onclick=()=>{sfx.click();const i=MISSIONS.indexOf(M.def)+1;if(i<MISSIONS.length)openBrief(i);else openMenu()};
$('btnMute').onclick=()=>{sfx.setMuted(!sfx.muted);$('btnMute').textContent=sfx.muted?'🔇':'🔊';$('pSound').textContent='🔊 Sound: '+(sfx.muted?'OFF':'ON')};
$('pSound').onclick=()=>$('btnMute').onclick();
$('pMusic').onclick=()=>{sfx.setMusic(!sfx.musicOn);$('pMusic').textContent='🎵 Music: '+(sfx.musicOn?'ON':'OFF')};
$('splash').addEventListener('pointerdown',()=>{if(state==='splash')endSplash()});
function endSplash(){if(state==='splash'){show('title');mode='title'}}
// ---------- main loop
let last=performance.now(),acc=0;
function frame(now){
  requestAnimationFrame(frame);
  let dt=Math.min(.05,(now-last)/1000);last=now;gtime+=dt;crashCool-=dt;hornCool-=dt;
  const playing=state==='hud'&&!paused&&(mode==='mission'||mode==='free');
  if(playing){const n=dt>.026?2:1;for(let i=0;i<n;i++){physics(dt/n)}
    traffic.update(dt,pl);
    if(mode==='mission'&&M)updateMission(dt);
    updateHud(dt);followCam(dt)}
  else if(state==='pause'){followCam(0)}
  else{traffic.update(dt,{x:-9999,z:-9999,half:2});titleCam(gtime)}
  // visuals
  pl.mesh.position.set(pl.x,.12,pl.z);pl.mesh.rotation.y=pl.th;pl.mesh.rotation.z=playing?-pl.steer*Math.min(1,Math.abs(pl.speed)/30)*.05:0;pl.mesh.visible=playing||state==='pause';
  city.update(gtime);
  if(marker.visible){const p=1+Math.sin(gtime*4)*.06;marker.userData.ring.scale.set(p,p,1);marker.userData.beam.material.opacity=.22+Math.sin(gtime*3)*.07}
  if(personM)personM.rotation.y=gtime;
  sky.position.copy(camera.position);sunS.position.copy(camera.position).addScaledVector(SUNDIR,2100);
  renderer.render(scene,camera);
  if(playing&&((frameN++)&1))drawMini();
  const ratio=Math.abs(pl.speed)/pl.P.maxS;
  sfx.update({ratio,throttle:playing&&inp.gas?1:0,skid:pl.skid*(playing?1:0),sea:clamp(1-(pl.x+322)/260,0,1),active:playing});
}
let frameN=0;
resize();
window.__mb={get state(){return state},get mode(){return mode},get M(){return M},pl,inp,traffic,MISSIONS,CHARS,prog,camera,setLeft:t=>{if(M)M.left=t},startMission,startFree,openMenu,show,get paused(){return paused},get cash(){return cash},colliders,failMission,get chaser(){return chaser}};
requestAnimationFrame(t=>{last=t;$('loading').classList.add('off');$('splash').classList.add('on');state='splash';setTimeout(endSplash,2500);frame(t)});
