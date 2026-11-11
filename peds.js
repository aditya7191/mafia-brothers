// Pedestrians: instanced low-poly civilians that walk the sidewalks, wait for the signal at zebra crossings,
// loiter near landmarks, run when shots are fired or a car drives at them. No gore: hit civilians just fall over and fade.
import * as THREE from './three.module.min.js';
import {XS} from './city.js';
import {sigState} from './fx.js';
const LINE=10.4,EDGE=9.3;
const SHIRT=[0xe53935,0x1e88e5,0xfdd835,0x43a047,0x8e24aa,0xfb8c00,0x00acc1,0xf5f5f5,0xec407a,0x6d4c41,0x26c6da,0xff7043];
const PANTS=[0x23283d,0x3b3b44,0x1b3a5c,0x4e342e,0x2f3e2f,0x6b6b72];
const SKIN=[0xc88a5c,0xb57750,0xd9a37a,0x9c6b4a,0xe0b18a];
const HAIR=[0x14100f,0x2a1a10,0x3a2314,0x111111,0x6b4a2a];
const LAND=[[-144,106],[0,-134],[-300,0],[-48,28],[236,-200],[144,-20],[-144,144],[-150,-150]]; // loiter groups: bazaar stall, station, arch, clock plaza, garage, maidan edge, market, seafront
const rr=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
const near=(t,m)=>XS.some(k=>Math.abs(t-k)<m);
export class Peds{
  constructor(scene,max=60){this.scene=scene;this.max=max;this.list=[];this.onHit=null;this.t=0;this.landAct=LAND.map(()=>false);this.rp=[];
    const box=new THREE.BoxGeometry(1,1,1),mat=()=>new THREE.MeshLambertMaterial({color:0xffffff,emissive:0x141a28});
    const mk=()=>{const m=new THREE.InstancedMesh(box,mat(),max);m.frustumCulled=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(m);return m};
    this.M={torso:mk(),head:mk(),hair:mk(),legL:mk(),legR:mk(),armL:mk(),armR:mk()};
    for(let i=0;i<max;i++)this.list.push({i,on:false,x:0,z:0,th:0,ax:'x',idx:3,side:1,dir:1,state:'walk',stT:0,walk:Math.random()*6,sp:1.9,fall:0,home:null,fixed:-1,c:null,fleeDir:1,zone:-1,prevZ:false});
    this.tmp={tr:new THREE.Matrix4(),m:new THREE.Matrix4(),b:new THREE.Matrix4(),p:new THREE.Matrix4(),q:new THREE.Quaternion(),e:new THREE.Euler(),v:new THREE.Vector3(),s:new THREE.Vector3(),c:new THREE.Color()};
    this.dirty=true;this.hideAll()}
  hideAll(){const z=new THREE.Matrix4().makeScale(0,0,0);for(const k in this.M)for(let i=0;i<this.max;i++)this.M[k].setMatrixAt(i,z);for(const k in this.M)this.M[k].instanceMatrix.needsUpdate=true}
  paint(p){const c=this.tmp.c,M=this.M;p.c={shirt:pick(SHIRT),pants:pick(PANTS),skin:pick(SKIN),hair:pick(HAIR)};
    for(const [k,h] of [['torso',p.c.shirt],['armL',p.c.shirt],['armR',p.c.shirt],['legL',p.c.pants],['legR',p.c.pants],['head',p.c.skin],['hair',p.c.hair]]){M[k].setColorAt(p.i,c.setHex(h));if(M[k].instanceColor)M[k].instanceColor.needsUpdate=true}}
  free(){return this.list.find(p=>!p.on)}
  // ---- spawning
  spawnWalker(P,tries=10){const p=this.free();if(!p)return null;
    for(let n=0;n<tries;n++){const ax=Math.random()<.5?'x':'z',lc=ax==='x'?P.z:P.x,ac=ax==='x'?P.x:P.z;
      const cand=[];XS.forEach((c,i)=>{if(Math.abs(c-lc)<115)cand.push(i)});if(!cand.length)continue;
      const idx=pick(cand),side=Math.random()<.5?1:-1,along=Math.max(-284,Math.min(284,ac+rr(-130,130)));
      if(near(along,12))continue;const lat=XS[idx]+side*LINE,x=ax==='x'?along:lat,z=ax==='x'?lat:along;
      if(Math.hypot(x-P.x,z-P.z)<32)continue;
      Object.assign(p,{on:true,dodge:Math.random()<.5,x,z,ax,idx,side,dir:Math.random()<.5?1:-1,state:'walk',stT:0,fall:0,fixed:-1,sp:rr(1.5,2.3),th:0});this.paint(p);return p}
    return null}
  spawnAt(x,z,state='flee',away){const p=this.free();if(!p)return null;
    // nearest sidewalk line
    let best=1e9,bi=0,bax='x',bs=1;for(let i=0;i<7;i++)for(const s of[-1,1]){const dz=Math.abs(z-(XS[i]+s*LINE)),dx=Math.abs(x-(XS[i]+s*LINE));if(dz<best){best=dz;bi=i;bax='x';bs=s}if(dx<best){best=dx;bi=i;bax='z';bs=s}}
    Object.assign(p,{on:true,dodge:Math.random()<.5,x,z,ax:bax,idx:bi,side:bs,dir:1,state,stT:5,fall:0,fixed:-1,sp:2,th:0});this.paint(p);if(state==='flee')this.fleeFrom(p,away?away[0]:x+rr(-3,3),away?away[1]:z+rr(-3,3));return p}
  fleeFrom(p,tx,tz){if(p.state==='down')return;const a=p.ax==='x'?p.x:p.z,ta=p.ax==='x'?tx:tz;p.dir=a>=ta?1:-1;p.state='flee';p.stT=rr(4,7);if(p.fixed>=0)p.fixed=-1}
  alarm(x,z,r=42){for(const p of this.list){if(!p.on||p.state==='down')continue;const d=Math.hypot(p.x-x,p.z-z);if(d<r)this.fleeFrom(p,x,z)}}
  knock(p){if(p.state==='down')return;p.state='down';p.fall=0}
  ray(x,z,dx,dz,maxT){let best=null,bt=maxT;for(const p of this.list){if(!p.on||p.state==='down')continue;const rx=p.x-x,rz=p.z-z,a=rx*dx+rz*dz;if(a<0||a>bt)continue;if(Math.abs(rx*dz-rz*dx)<.55){bt=a;best=p}}return best?{t:bt,p:best}:null}
  blast(x,z,r){let n=0;for(const p of this.list){if(!p.on||p.state==='down')continue;if(Math.hypot(p.x-x,p.z-z)<r){this.knock(p);n++}}return n}
  roadPeds(){return this.rp}
  // ---- update
  update(dt,P,veh,tm){this.t=tm!==undefined?tm:this.t+dt;
    // landmark loiterers (activate near the player)
    for(let g=0;g<LAND.length;g++){const L=LAND[g],d=Math.hypot(L[0]-P.x,L[1]-P.z);
      if(!this.landAct[g]&&d<105){let n=0;for(let k=0;k<3;k++){const p=this.free();if(!p)break;const a=k*2.1+Math.random(),r=rr(2.2,5);Object.assign(p,{on:true,dodge:Math.random()<.5,x:L[0]+Math.cos(a)*r,z:L[1]+Math.sin(a)*r,state:'idle',stT:999,fall:0,fixed:g,home:[L[0],L[1]],th:Math.random()*6,ax:'x',idx:3,side:1,dir:1});this.paint(p);n++}this.landAct[g]=true}
      else if(this.landAct[g]&&d>175){for(const p of this.list)if(p.fixed===g)p.on=false;this.landAct[g]=false}}
    // recycle / respawn walkers around the player (budget: 2 per frame)
    let budget=2;const walkers=this.list.filter(p=>p.on&&p.fixed<0).length;
    for(const p of this.list){if(budget<=0)break;if(p.on&&p.fixed<0&&(Math.hypot(p.x-P.x,p.z-P.z)>175||(p.state==='down'&&p.fall>2.2))){p.on=false;budget--}}
    if(walkers<38){let n=Math.min(2,38-walkers);while(n-->0&&budget>0){if(!this.spawnWalker(P))break;budget--}}
    const M=this.M,T=this.tmp;this.rp.length=0;
    for(const p of this.list){
      if(!p.on){this.put(p,true);continue}
      this.step(p,dt,P,veh);
      if(p.state==='cross'||(p.state==='flee'&&p.zone>=0))this.rp.push(p);
      this.put(p,false)}
    for(const k in M)M[k].instanceMatrix.needsUpdate=true}
  step(p,dt,P,veh){
    if(p.state==='down'){p.fall+=dt;return}
    // threats: player vehicle and moving traffic
    for(const v of veh){const sp=Math.abs(v.speed!==undefined?v.speed:v.v);if(sp<4)continue;const rx=p.x-v.x,rz=p.z-v.z;if(Math.abs(rx)>9||Math.abs(rz)>9)continue;
      const fx=Math.sin(v.th),fz=Math.cos(v.th),l=Math.abs(rx*fz-rz*fx),ahead=rx*fx+rz*fz,hf=v.half||2.2;
      // run-over: any pedestrian caught in front of the player's moving vehicle goes down (even ones that were fleeing)
      if(v.isPlayer&&sp>5&&ahead>-hf*.5&&ahead<hf+.5&&l<(v.isBike?.9:1.5)){this.knock(p);if(this.onHit)this.onHit(p,'car');return}
      // only some pedestrians notice and dodge in time
      if(p.state!=='flee'&&p.dodge&&ahead>-1&&ahead<7.5&&l<2.4)this.fleeFrom(p,v.x,v.z)}
    if(p.state==='idle'&&p.fixed>=0){p.walk+=dt*.4;p.th+=Math.sin(this.t*.6+p.i)*dt*.3;return}
    const ax=p.ax,dir=p.dir;let along=ax==='x'?p.x:p.z,lat=ax==='x'?p.z:p.x;const line=XS[p.idx]+p.side*LINE;
    let sp=p.state==='flee'?5.3:p.sp;
    if(p.state==='idle'){p.stT-=dt;if(p.stT<=0)p.state='walk';return}
    // zone detection
    let zone=-1;for(let k=0;k<7;k++){if(Math.abs(along-XS[k])<EDGE){zone=k;break}}
    if(p.state==='walk'||p.state==='flee'){
      if(zone>=0&&p.zone<0&&p.state==='walk'){ // entering a road: wait for the red phase of the road being crossed
        const crossAxis=ax==='x'?'z':'x';if(sigState(crossAxis,this.t)!=='r'){p.state='wait';p.stT=0}else p.state='cross'}
      else if(p.state==='walk'&&Math.random()<dt*.04&&zone<0){p.state='idle';p.stT=rr(2.5,6);return}
      p.stT-=dt;if(p.state==='flee'&&p.stT<=0)p.state=zone>=0?'cross':'walk'}
    if(p.state==='wait'){const crossAxis=ax==='x'?'z':'x';p.stT+=dt;if(sigState(crossAxis,this.t)==='r'||p.stT>14)p.state='cross';else{p.zone=-1;return}}
    if(p.state==='cross'&&zone<0&&p.zone>=0){ // stepped off the road: maybe turn onto the cross sidewalk
      p.state='walk';const k=p.zone;if(Math.random()<.4){const sgn=Math.sign(along-XS[k])||dir;p.ax=ax==='x'?'z':'x';p.idx=k;p.side=sgn;p.dir=Math.random()<.5?1:-1}}
    p.zone=zone;
    if(p.ax!==ax)return;
    along+=dir*sp*dt;if(along>286){along=286;p.dir=-1}else if(along<-286){along=-286;p.dir=1}
    lat+=(line-lat)*Math.min(1,dt*(zone>=0?0:4));
    if(ax==='x'){p.x=along;p.z=lat}else{p.z=along;p.x=lat}
    p.th+=angd(p.th,Math.atan2(ax==='x'?dir:0,ax==='x'?0:dir)*0+(ax==='x'?(dir>0?Math.PI/2:-Math.PI/2):(dir>0?0:Math.PI)))*Math.min(1,dt*9);
    p.walk+=dt*sp*(p.state==='flee'?2.4:2.9)}
  put(p,hide){const T=this.tmp,M=this.M;
    if(hide){T.m.makeScale(0,0,0);for(const k in M)M[k].setMatrixAt(p.i,T.m);return}
    const fall=p.state==='down'?Math.min(1,p.fall/.35):0,fade=p.state==='down'&&p.fall>1.4?Math.max(.001,1-(p.fall-1.4)/.7):1;
    T.e.set(-fall*1.5,p.th,0,'YXZ');T.q.setFromEuler(T.e);T.v.set(p.x,fall*.22,p.z);T.s.setScalar(fade);T.p.compose(T.v,T.q,T.s);
    const mv=(p.state==='idle'||p.state==='down')?0:1,sw=Math.sin(p.walk*3.1)*.75*mv,run=p.state==='flee'?1.25:1;
    const set=(k,px,py,pz,sx,sy,sz,rx,top)=>{T.e.set(rx,0,0);T.q.setFromEuler(T.e);T.v.set(px,py,pz);T.s.set(sx,sy,sz);T.b.compose(T.v,T.q,T.s);if(top)T.b.multiply(T.tr.makeTranslation(0,-.5,0));T.m.multiplyMatrices(T.p,T.b);M[k].setMatrixAt(p.i,T.m)};
    set('legL',.11,.88,0,.2,.88,.24,sw*run,1);set('legR',-.11,.88,0,.2,.88,.24,-sw*run,1);
    set('armL',.3,1.42,0,.13,.6,.16,-sw*run*.9,1);set('armR',-.3,1.42,0,.13,.6,.16,sw*run*.9,1);
    set('torso',0,1.13,0,.46,.62,.28,0);set('head',0,1.62,0,.25,.26,.25,0);set('hair',0,1.76,-.01,.27,.1,.27,0)}
}
function angd(a,b){let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d}
