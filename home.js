// Enterable homes: a small furnished "dollhouse" interior built far from the city (own coordinates), walls culled from the camera side.
import * as THREE from './three.module.min.js';
export const HR={OX:1500,OZ:1500,x0:-5,x1:5,z0:-4,z1:4};
const rr=(a,b)=>a+Math.random()*(b-a);
const cvs=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return[c,c.getContext('2d')]};
const tex=(c,rep)=>{const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1])}return t};
const matC={};const L=(hex,em=.3)=>{const k=hex+'|'+em;return matC[k]||(matC[k]=new THREE.MeshLambertMaterial({color:hex,emissive:hex,emissiveIntensity:em}))};
const B=new THREE.BoxGeometry(1,1,1),CY=new THREE.CylinderGeometry(1,1,1,14),SP=new THREE.SphereGeometry(1,12,8);
function box(p,m,sx,sy,sz,x,y,z){const o=new THREE.Mesh(B,m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);p.add(o);return o}
function cyl(p,m,r,h,x,y,z){const o=new THREE.Mesh(CY,m);o.scale.set(r,h,r);o.position.set(x,y,z);p.add(o);return o}
function glow(p,hex,s,x,y,z,op=.8){const [c,g]=cvs(64,64),r=g.createRadialGradient(32,32,2,32,32,32);r.addColorStop(0,'#fff');r.addColorStop(.3,hex);r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,64,64);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:op,fog:false}));sp.scale.set(s,s,1);sp.position.set(x,y,z);p.add(sp);return sp}
function woodTex(){const [c,g]=cvs(256,256);for(let i=0;i<8;i++){const v=150+Math.random()*26;g.fillStyle=`rgb(${v},${v*.68|0},${v*.42|0})`;g.fillRect(0,i*32,256,31);g.fillStyle='rgba(60,30,10,.35)';g.fillRect(0,i*32+31,256,1.5);
  for(let k=0;k<5;k++){g.fillStyle='rgba(80,40,15,.18)';g.fillRect(Math.random()*256,i*32+Math.random()*28,30+Math.random()*60,1)}g.fillStyle='rgba(60,30,10,.3)';g.fillRect((i*83)%256,i*32,1.5,32)}return tex(c,[3,2])}
function wallTex(hex){const [c,g]=cvs(256,256);g.fillStyle=hex;g.fillRect(0,0,256,256);for(let x=0;x<256;x+=32){g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x,0,16,256)}
  g.fillStyle='rgba(0,0,0,.05)';for(let i=0;i<200;i++)g.fillRect(Math.random()*256,Math.random()*256,2,2);return tex(c,[4,1.4])}
function rugTex(h1,h2){const [c,g]=cvs(256,192);g.fillStyle=h1;g.fillRect(0,0,256,192);g.strokeStyle=h2;g.lineWidth=8;g.strokeRect(14,14,228,164);g.lineWidth=3;g.strokeRect(30,30,196,132);
  g.fillStyle=h2;for(let i=0;i<5;i++){g.beginPath();g.moveTo(128-60+i*30,96);g.lineTo(128-45+i*30,70);g.lineTo(128-30+i*30,96);g.lineTo(128-45+i*30,122);g.fill()}return tex(c)}
function winTex(day){const [c,g]=cvs(256,160),gr=g.createLinearGradient(0,0,0,160);
  if(day){gr.addColorStop(0,'#5fa8e8');gr.addColorStop(.6,'#ffd9a0');gr.addColorStop(1,'#ffb36b')}else{gr.addColorStop(0,'#030818');gr.addColorStop(.6,'#122a4a');gr.addColorStop(1,'#27607a')}
  g.fillStyle=gr;g.fillRect(0,0,256,160);
  if(!day){for(let i=0;i<60;i++){g.fillStyle=`rgba(255,255,255,${.3+Math.random()*.7})`;g.fillRect(Math.random()*256,Math.random()*80,1.4,1.4)}g.fillStyle='#eef4ff';g.beginPath();g.arc(206,30,9,0,7);g.fill()}
  else{g.fillStyle='#fff6c0';g.beginPath();g.arc(60,50,14,0,7);g.fill()}
  let x=0;while(x<256){const w=18+Math.random()*26,h=40+Math.random()*80;g.fillStyle=day?'#6b5a78':'#0b1626';g.fillRect(x,160-h,w,h);
    for(let yy=160-h+6;yy<154;yy+=9)for(let xx=x+4;xx<x+w-4;xx+=8)if(Math.random()<(day?.12:.5)){g.fillStyle=day?'#ffe9b0':['#ffd27a','#8fe4ff','#ffb84f'][Math.floor(Math.random()*3)];g.fillRect(xx,yy,4,5)}x+=w+2}
  return tex(c)}
function posterTex(){const [c,g]=cvs(160,112),gr=g.createLinearGradient(0,0,0,112);gr.addColorStop(0,'#2d1b69');gr.addColorStop(.6,'#ff6a88');gr.addColorStop(1,'#ffd27a');g.fillStyle=gr;g.fillRect(0,0,160,112);
  g.fillStyle='#14091f';[[10,60,16,52],[30,45,14,67],[50,70,18,42],[74,40,12,72],[92,58,20,54],[118,48,16,64],[138,66,14,46]].forEach(([x,y,w,h])=>g.fillRect(x,y,w,h));
  g.fillStyle='#fff6d8';g.font='bold 13px Arial';g.textAlign='center';g.fillText('MAFIA BROTHERS',80,22);g.font='9px Arial';g.fillText('Mumbai • Raat ka sheher',80,36);return tex(c)}
function canTex(hex,txt){const [c,g]=cvs(64,96);g.fillStyle=hex;g.fillRect(0,0,64,96);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(0,0,10,96);g.fillStyle='#fff';g.font='bold 14px Arial';g.textAlign='center';g.fillText(txt,32,40);g.font='10px Arial';g.fillText('thanda!',32,58);
  g.fillStyle='#fff';g.beginPath();g.arc(32,76,9,0,7);g.fill();g.fillStyle=hex;g.beginPath();g.arc(32,76,5,0,7);g.fill();return tex(c)}
// ---------- TV channels (original animations, 320x180)
const TVW=320,TVH=180;
export function drawTV(g,t,ch){
  if(ch===0){ // cricket-like
    const ph=(t%5.2)/5.2,cyc=Math.floor(t/5.2),six=cyc%3===0;
    let sky=g.createLinearGradient(0,0,0,70);sky.addColorStop(0,'#5fa8e8');sky.addColorStop(1,'#bfe3ff');g.fillStyle=sky;g.fillRect(0,0,TVW,70);
    for(let i=0;i<64;i++){g.fillStyle=['#e63946','#ffd166','#4cc9f0','#fff','#7bd88f','#f4a261'][i%6];g.fillRect(i*5,56+(i*7%9),4,6)}
    g.fillStyle='#3a9d3f';g.fillRect(0,68,TVW,TVH-68);for(let i=0;i<9;i++){g.fillStyle=i%2?'#3fa844':'#369a3b';g.fillRect(0,68+i*13,TVW,13)}
    g.fillStyle='#d6b77a';g.beginPath();g.moveTo(130,76);g.lineTo(190,76);g.lineTo(235,170);g.lineTo(85,170);g.fill();
    const fig=(x,y,s,c1,bat)=>{g.fillStyle=c1;g.fillRect(x-4*s,y,8*s,14*s);g.fillStyle='#c88a5c';g.beginPath();g.arc(x,y-4*s,4.5*s,0,7);g.fill();g.fillStyle='#fff';g.fillRect(x-3*s,y+14*s,3*s,9*s);g.fillRect(x+0.5*s,y+14*s,3*s,9*s);if(bat){g.save();g.translate(x+6*s,y+8*s);g.rotate(ph>.43&&ph<.6?-1.6+(ph-.43)*9:-.3);g.fillStyle='#e8c07a';g.fillRect(0,-3*s,3*s,16*s);g.restore()}};
    fig(160,82,.8,'#1e88e5',false);fig(160,132,1.7,'#e63946',true);
    let bx,by,bs=4;if(ph<.45){const k=ph/.45;bx=160;by=92+k*(138-92);bs=2+k*3}else if(ph<.95){const k=(ph-.45)/.5;bx=160+k*(six?120:90);by=138-Math.sin(k*Math.PI)*(six?120:40)+(six?0:k*30);bs=5-k*2.5}else{bx=-9;by=-9}
    g.fillStyle='#fff';g.beginPath();g.arc(bx,by,bs,0,7);g.fill();
    if(ph>.46&&ph<.9){g.fillStyle=six?'#ffd166':'#4cc9f0';g.font='900 28px Arial Black,Impact';g.textAlign='center';g.fillText(six?'SIX!':'FOUR!',160+Math.sin(t*20)*2,48)}
    g.fillStyle='rgba(10,20,40,.88)';g.fillRect(0,TVH-22,TVW,22);g.fillStyle='#ffd166';g.font='bold 12px Arial';g.textAlign='left';g.fillText('BLAZERS 142/3',8,TVH-7);g.fillStyle='#fff';g.fillText('vs PANTHERS • 16.'+(1+cyc%6)+' ov',116,TVH-7);g.fillStyle='#e63946';g.fillRect(TVW-52,TVH-18,44,14);g.fillStyle='#fff';g.fillText('LIVE',TVW-45,TVH-7);
    return ph}
  if(ch===1){ // cartoon
    g.fillStyle='#7fd0ff';g.fillRect(0,0,TVW,TVH);g.fillStyle='#ffe066';g.beginPath();g.arc(270,36,20,0,7);g.fill();g.fillStyle='#5cb85c';g.beginPath();g.ellipse(80,TVH,150,60,0,0,7);g.fill();g.fillStyle='#46a046';g.beginPath();g.ellipse(250,TVH,140,45,0,0,7);g.fill();
    const blob=(x,y,r,c,sq)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,r*(1+sq),r*(1-sq),0,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(x-r*.3,y-r*.2,r*.28,0,7);g.arc(x+r*.3,y-r*.2,r*.28,0,7);g.fill();g.fillStyle='#111';g.beginPath();g.arc(x-r*.22,y-r*.2,r*.12,0,7);g.arc(x+r*.38,y-r*.2,r*.12,0,7);g.fill();g.strokeStyle='#111';g.lineWidth=2;g.beginPath();g.arc(x+r*.05,y+r*.15,r*.28,.1,Math.PI-.1);g.stroke()};
    const hop=Math.abs(Math.sin(t*3)),hy=130-hop*60,sq=(1-hop)*.18,cx=110+Math.sin(t*.9)*70;
    blob(cx,hy,24,'#ff8a3c',sq);blob(cx-(Math.cos(t*.9)>0?-1:1)*52,134-Math.abs(Math.sin(t*3+1.2))*40,17,'#7bd88f',(1-Math.abs(Math.sin(t*3+1.2)))*.2);
    g.fillStyle='rgba(10,20,40,.85)';g.fillRect(0,0,TVW,20);g.fillStyle='#ffd166';g.font='900 13px Arial Black';g.textAlign='center';g.fillText('CHOTU TOONS  •  Hasi ka tadka',TVW/2,14);return hop}
  g.fillStyle='#0b0620';g.fillRect(0,0,TVW,TVH);const cols=['#ff3bd0','#32e6ff','#ffd166','#7dff5a'];
  for(let i=0;i<4;i++){g.save();g.globalAlpha=.28;g.fillStyle=cols[i];g.beginPath();const a=Math.sin(t*1.3+i*1.7)*.9;g.moveTo(40+i*80,0);g.lineTo(40+i*80+Math.tan(a)*TVH,TVH);g.lineTo(100+i*80+Math.tan(a)*TVH,TVH);g.lineTo(70+i*80,0);g.fill();g.restore()}
  for(let i=0;i<20;i++){const h=20+Math.abs(Math.sin(t*5+i*.7))*80;g.fillStyle=cols[i%4];g.fillRect(10+i*15,TVH-26-h,11,h)}
  const pu=1+Math.sin(t*8)*.08;g.fillStyle='#fff';g.font=`900 ${26*pu}px Arial Black`;g.textAlign='center';g.fillText('GAANE ON 🎵',TVW/2,50);g.fillStyle='rgba(10,20,40,.85)';g.fillRect(0,TVH-22,TVW,22);g.fillStyle='#ffd166';g.font='bold 12px Arial';g.fillText('Non-stop dhamaka • Mafia Music',TVW/2,TVH-7);return 0}
// ---------- build
export function buildHome(scene){
  const grp=new THREE.Group();grp.position.set(HR.OX,0,HR.OZ);grp.visible=false;scene.add(grp);
  const dyn={wall:null,sofa:null,rug:null,win:null,winDay:winTex(true),winNight:winTex(false),sign:null};
  const solids=[],W=(x0,x1,z0,z1)=>solids.push({x0:HR.OX+x0,x1:HR.OX+x1,z0:HR.OZ+z0,z0b:0,z1:HR.OZ+z1});
  // floor + walls (FrontSide: the +z wall faces into the room and is culled from the outside camera)
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(10,8),new THREE.MeshLambertMaterial({map:woodTex(),emissive:0xffffff,emissiveMap:null,emissiveIntensity:0}));floor.material.emissive.setHex(0x2a1608);floor.rotation.x=-Math.PI/2;grp.add(floor);
  const wallMat=new THREE.MeshLambertMaterial({map:wallTex('#f0d9b5'),emissive:0x2a2218});dyn.wallMat=wallMat;
  const mkW=(w,x,z,ry)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,3.4),wallMat);m.position.set(x,1.7,z);m.rotation.y=ry;grp.add(m)};
  mkW(10,0,-4,0);mkW(8,-5,0,Math.PI/2);mkW(8,5,0,-Math.PI/2);mkW(10,0,4,Math.PI);
  const trim=L(0x3a2a22,.15);box(grp,trim,10.5,.18,.5,0,3.45,-4.05);box(grp,trim,.5,.18,8.5,-5.05,3.45,0);box(grp,trim,.5,.18,8.5,5.05,3.45,0);
  const skirt=L(0x5a4034,.2);box(grp,skirt,10,.22,.08,0,.11,-3.96);box(grp,skirt,.08,.22,8,-4.96,.11,0);box(grp,skirt,.08,.22,8,4.96,.11,0);
  // window (back wall) with curtains
  const glassM=new THREE.MeshBasicMaterial({map:dyn.winNight});dyn.win=glassM;const gl=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.4),glassM);gl.position.set(-1.9,2.0,-3.96);grp.add(gl);
  const fr=L(0xf4efe6,.4);box(grp,fr,2.4,.1,.1,-1.9,2.75,-3.93);box(grp,fr,2.4,.1,.14,-1.9,1.25,-3.9);box(grp,fr,.1,1.5,.1,-3.0,2.0,-3.93);box(grp,fr,.1,1.5,.1,-.8,2.0,-3.93);box(grp,fr,.06,1.4,.08,-1.9,2.0,-3.93);box(grp,fr,2.2,.06,.08,-1.9,2.0,-3.93);
  box(grp,L(0xc23a4a,.35),.55,1.9,.16,-3.35,1.95,-3.85);box(grp,L(0xc23a4a,.35),.55,1.9,.16,-.45,1.95,-3.85);box(grp,L(0x8a8a90,.3),3.6,.06,.06,-1.9,2.95,-3.85);
  // poster, clock, name plate
  const po=new THREE.Mesh(new THREE.PlaneGeometry(1.0,.7),new THREE.MeshBasicMaterial({map:posterTex()}));po.position.set(.3,2.1,-3.96);grp.add(po);box(grp,L(0x222,.2),1.1,.8,.04,.3,2.1,-3.97);
  const clk=new THREE.Group();clk.position.set(-4.95,2.5,-1.0);grp.add(clk);cyl(clk,L(0xf5f5f5,.5),.34,.05,0,0,0).rotation.z=Math.PI/2;clk.children[0].rotation.set(0,0,Math.PI/2);
  const hand=box(clk,L(0x111,.1),.03,.24,.03,0,0,.04);hand.position.set(.04,0,0);dyn.hand=hand;
  // ---- furniture
  const sofaMat=new THREE.MeshLambertMaterial({color:0xc23a4a,emissive:0x331018});dyn.sofaMat=sofaMat;
  const sofa=new THREE.Group();sofa.position.set(2.4,0,.5);grp.add(sofa);box(sofa,sofaMat,3.1,.5,1.1,0,.45,0);box(sofa,sofaMat,3.1,.85,.32,0,.9,.55);box(sofa,sofaMat,.34,.7,1.1,-1.5,.65,0);box(sofa,sofaMat,.34,.7,1.1,1.5,.65,0);
  for(let k=-1;k<=1;k+=2)box(sofa,L(0xffd166,.35),.7,.5,.18,k*.7,.88,.28).rotation.x=-.25;box(sofa,L(0x2a2020,.2),3.2,.12,1.2,0,.14,0);W(.8,4.0,-.15,1.15);
  box(grp,L(0x7a5232,.3),1.5,.4,.8,2.4,.2,-1.1);box(grp,L(0xcfe8f5,.5),1.5,.04,.8,2.4,.42,-1.1);W(1.6,3.2,-1.5,-.7);
  const rug=new THREE.Mesh(new THREE.PlaneGeometry(3.8,2.8),new THREE.MeshLambertMaterial({map:rugTex('#7a2a3a','#f2c46b'),emissive:0x1a0a0a}));rug.rotation.x=-Math.PI/2;rug.position.set(2.4,.02,-.6);grp.add(rug);
  box(grp,L(0x5a3d2a,.3),2.8,.62,.7,2.4,.31,-3.6);W(1.0,3.8,-3.95,-3.2);
  box(grp,L(0x16161a,.2),2.1,1.25,.12,2.4,1.5,-3.55);
  const scr=document.createElement('canvas');scr.width=TVW;scr.height=TVH;const sg=scr.getContext('2d'),stex=new THREE.CanvasTexture(scr);stex.colorSpace=THREE.SRGBColorSpace;
  const smat=new THREE.MeshBasicMaterial({map:stex,color:0x222a33});const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.92,1.08),smat);screen.position.set(2.4,1.5,-3.48);grp.add(screen);sg.fillStyle='#0a0f16';sg.fillRect(0,0,TVW,TVH);stex.needsUpdate=true;
  const tvGlow=glow(grp,'#6ad0ff',5.5,2.4,1.4,-2.9,.0);
  // fridge
  box(grp,L(0xe9edf2,.45),1.15,2.2,1.0,-4.25,1.1,-3.45);W(-4.9,-3.65,-4,-2.9);
  const fdoor=new THREE.Group();fdoor.position.set(-3.68,0,-2.93);grp.add(fdoor);box(fdoor,L(0xdfe5ec,.5),1.1,2.15,.08,-.55,1.1,0);box(fdoor,L(0x888,.3),.06,.7,.06,-.1,1.3,.1);box(fdoor,L(0x4a90e2,.6),.5,.12,.02,-.55,1.8,.05);dyn.fdoor=fdoor;
  box(grp,L(0x2a2a30,.2),1.0,.02,.9,-4.25,2.22,-3.45);
  // bed
  const bedF=L(0x6b4423,.3);box(grp,bedF,2.2,.35,3.3,-3.85,.18,1.9);box(grp,L(0xf2f2f2,.5),2.0,.28,3.1,-3.85,.5,1.9);box(grp,L(0x2f6db5,.55),2.0,.12,1.9,-3.85,.68,2.45);box(grp,L(0xffffff,.6),.8,.16,.5,-4.3,.74,.7);box(grp,L(0xffffff,.6),.8,.16,.5,-3.4,.74,.7);box(grp,bedF,2.3,1.0,.12,-3.85,.7,.2);W(-5,-2.7,.2,3.55);
  // side table + lamp
  box(grp,L(0x7a5232,.3),.6,.5,.6,-2.3,.25,.55);cyl(grp,L(0xffd9a0,.9),.2,.3,-2.3,.65,.55);glow(grp,'#ffc870',2.4,-2.3,.8,.55,.65);W(-2.6,-2.0,.25,.85);
  // dining
  box(grp,L(0x8a5a36,.3),1.7,.08,.95,-.9,.78,-.7);for(const dx of[-.75,.75])for(const dz of[-.4,.4])box(grp,L(0x6b4423,.3),.08,.76,.08,-.9+dx,.38,-.7+dz);W(-1.8,.0,-1.2,-.2);
  for(const[cx,cz]of[[-1.4,-.05],[-.4,-.05],[-1.4,-1.35],[-.4,-1.35]]){box(grp,L(0xb8895a,.3),.5,.08,.5,cx,.46,cz);box(grp,L(0xb8895a,.3),.5,.55,.07,cx,.75,cz+(cz>-.7?.22:-.22));for(const dx of[-.2,.2])for(const dz of[-.2,.2])box(grp,L(0x6b4423,.3),.05,.45,.05,cx+dx,.22,cz+dz)}
  cyl(grp,L(0x2f8f4a,.4),.22,.3,-.9,.97,-.7);cyl(grp,L(0xe8e0d0,.5),.16,.22,-.9,.9,-.7);
  // shelf with books, floor lamp, plant, door
  box(grp,L(0x6b4423,.3),.5,1.6,1.8,-4.7,.8,-1.0).visible=false;
  box(grp,L(0x6b4423,.3),.4,.06,1.8,-4.78,1.4,-1.0);box(grp,L(0x6b4423,.3),.4,.06,1.8,-4.78,1.95,-1.0);for(let k=0;k<9;k++){box(grp,L([0xe63946,0xffd166,0x4cc9f0,0x7bd88f,0xc77dff][k%5],.4),.22,.4,.14,-4.78,1.63,-1.7+k*.2)}
  cyl(grp,L(0x2a2a30,.2),.18,.04,4.3,.03,-3.3);cyl(grp,L(0x2a2a30,.2),.04,1.7,4.3,.88,-3.3);cyl(grp,L(0xffe3a8,.95),.28,.4,4.3,1.8,-3.3);glow(grp,'#ffc870',3.4,4.3,1.8,-3.3,.7);W(4.0,4.6,-3.6,-3.0);
  cyl(grp,L(0xb5651d,.3),.28,.4,4.35,.2,-1.6);const lf=new THREE.Mesh(SP,L(0x2f9f55,.45));lf.scale.set(.5,.45,.5);lf.position.set(4.35,.75,-1.6);grp.add(lf);W(4.05,4.65,-1.9,-1.3);
  const door=new THREE.Group();door.position.set(4.93,0,1.8);grp.add(door);box(door,L(0x5a3a22,.35),.1,2.45,1.35,0,1.22,0);box(door,L(0x3a2616,.3),.14,2.6,.1,0,1.3,-.72);box(door,L(0x3a2616,.3),.14,2.6,.1,0,1.3,.72);box(door,L(0x3a2616,.3),.14,.1,1.5,0,2.55,0);box(door,L(0xffd166,.9),.14,.1,.1,-.02,1.1,.5);
  const exs=new THREE.Mesh(new THREE.PlaneGeometry(1.0,.28),new THREE.MeshBasicMaterial({map:(()=>{const[c,g]=cvs(128,36);g.fillStyle='#0a3a1a';g.fillRect(0,0,128,36);g.fillStyle='#7dff9a';g.font='bold 24px Arial';g.textAlign='center';g.fillText('EXIT ➜',64,27);return tex(c)})()}));exs.position.set(4.9,2.95,1.8);exs.rotation.y=-Math.PI/2;grp.add(exs);
  // can (for the cold-drink action) + bubbles
  const can=new THREE.Group();can.visible=false;grp.add(can);const cm=new THREE.Mesh(CY,new THREE.MeshLambertMaterial({map:canTex('#ff7a1a','COLD'),emissive:0x333333}));cm.scale.set(.08,.22,.08);can.add(cm);cyl(can,L(0xcfd3d8,.5),.082,.02,0,.11,0);
  const bubs=[];for(let i=0;i<6;i++)bubs.push(glow(grp,'#ffffff',.18,0,-9,0,.7));
  // night / day look, per-home accent
  const set={
    home(h){wallMat.map=wallTex(h.wall);wallMat.needsUpdate=true;sofaMat.color.setHex(h.sofa);sofaMat.emissive.setHex(h.sofa).multiplyScalar(.18)},
    day(d){glassM.map=d?dyn.winDay:dyn.winNight;glassM.needsUpdate=true}};
  return {group:grp,solids,set,can,bubs,fdoor,tvGlow,screen,smat,stex,sg,hand,
    zones:{tv:{x:HR.OX+2.4,z:HR.OZ-1.9,r:3.3},fridge:{x:HR.OX-3.6,z:HR.OZ-2.1,r:2.0},bed:{x:HR.OX-2.5,z:HR.OZ+1.8,r:2.2},door:{x:HR.OX+4.0,z:HR.OZ+1.8,r:1.8}},
    spawn:{x:HR.OX+3.4,z:HR.OZ+1.7}};
}
