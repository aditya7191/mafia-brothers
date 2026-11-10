// Original cartoon portraits of the three friends, drawn procedurally.
export const CHARS=[
  {id:'veer',name:'Veer',role:'Leader',color:'#e63946',car:0xe63946,skin:'#c88a5c',desc:'Balanced hatchback',
   stats:{speed:.8,handle:.7,tough:.55},phys:{maxS:28,acc:11,steer:1.75,mass:1.0,grip:8}},
  {id:'bunty',name:'Bunty',role:'Strong one',color:'#2a7de1',car:0x2a6fdb,skin:'#b57750',desc:'Heavy SUV – kam hilta hai',
   stats:{speed:.62,handle:.5,tough:1},phys:{maxS:25,acc:10,steer:1.5,mass:1.7,grip:9}},
  {id:'chintu',name:'Chintu',role:'Speedy brain',color:'#2ecc71',car:0x29b765,skin:'#d9a37a',desc:'Chhoti tez gaadi',
   stats:{speed:1,handle:1,tough:.3},phys:{maxS:30,acc:13,steer:2.05,mass:0.8,grip:7}}
];
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
export function portrait(ch,W=160,H=200){
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#ffb36b');g.addColorStop(.6,'#e8808a');g.addColorStop(1,'#5a3a8a');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.fillStyle='#ffffff22';c.beginPath();c.arc(W*.78,H*.2,W*.14,0,7);c.fill();
  const cx=W/2,skin=ch.skin,id=ch.id;
  // body
  const bw=id==='bunty'?W*.9:id==='veer'?W*.78:W*.7;
  c.fillStyle=id==='veer'?'#d62828':id==='bunty'?'#1d4e89':'#2a9d4a';rr(c,cx-bw/2,H*.66,bw,H*.5,W*.14);c.fill();
  if(id==='veer'){c.fillStyle='#fff';c.fillRect(cx-bw/2+6,H*.72,5,H*.3);c.fillRect(cx+bw/2-11,H*.72,5,H*.3);c.fillStyle='#8b1a1a';c.beginPath();c.moveTo(cx-18,H*.66);c.lineTo(cx,H*.76);c.lineTo(cx+18,H*.66);c.fill()}
  if(id==='bunty'){c.fillStyle='#ffcc00';c.font='900 '+W*.13+'px Arial Black,Arial';c.textAlign='center';c.fillText('MB',cx,H*.84)}
  if(id==='chintu'){c.fillStyle='#1d7a37';c.beginPath();c.ellipse(cx,H*.67,W*.3,H*.07,0,0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.moveTo(cx-8,H*.7);c.lineTo(cx-10,H*.82);c.moveTo(cx+8,H*.7);c.lineTo(cx+10,H*.82);c.stroke()}
  // neck
  c.fillStyle=skin;c.fillRect(cx-W*.07,H*.58,W*.14,H*.1);
  // head
  const hw=id==='bunty'?W*.3:id==='veer'?W*.25:W*.24, hh=id==='bunty'?H*.25:H*.26;
  c.fillStyle=skin;c.beginPath();c.ellipse(cx,H*.44,hw,hh,0,0,7);c.fill();
  c.beginPath();c.ellipse(cx-hw,H*.46,W*.04,H*.05,0,0,7);c.ellipse(cx+hw,H*.46,W*.04,H*.05,0,0,7);c.fill();
  // hair / hat
  if(id==='veer'){c.fillStyle='#14100f';c.beginPath();c.moveTo(cx-hw-3,H*.42);for(let i=0;i<=6;i++){const x=cx-hw-3+i*(hw*2+6)/6;c.lineTo(x+( (hw*2+6)/12),H*.12+(i%2?0:-H*.06));c.lineTo(x+(hw*2+6)/6,H*.34)}c.lineTo(cx+hw+3,H*.42);c.lineTo(cx+hw,H*.3);c.lineTo(cx-hw,H*.3);c.fill();
    c.fillStyle='#e63946';c.fillRect(cx-hw,H*.325,hw*2,H*.04)}
  if(id==='bunty'){c.fillStyle='#ffcc00';c.beginPath();c.ellipse(cx,H*.3,hw+2,H*.12,0,Math.PI,0);c.fill();c.fillRect(cx-hw-2,H*.295,hw*2+4,H*.03);c.fillStyle='#e0a800';rr(c,cx-hw-W*.12,H*.3,W*.2,H*.035,4);c.fill();c.fillStyle='#14100f';c.beginPath();c.ellipse(cx,H*.31,hw-2,H*.03,0,0,Math.PI);c.fill()}
  if(id==='chintu'){c.fillStyle='#3a2314';for(let i=0;i<9;i++){const a=Math.PI+i*Math.PI/8;c.beginPath();c.arc(cx+Math.cos(a)*hw*1.05,H*.4+Math.sin(a)*hh*.95,W*.07,0,7);c.fill()}c.beginPath();c.ellipse(cx,H*.3,hw*.9,H*.07,0,0,7);c.fill();
    c.fillStyle='#2a9d4a';c.beginPath();c.ellipse(cx,H*.62,W*.2,H*.045,0,0,7);c.fill()}
  // face
  const ey=H*.45,ex=hw*.45;
  c.fillStyle='#fff';c.beginPath();c.ellipse(cx-ex,ey,W*.045,H*.035,0,0,7);c.ellipse(cx+ex,ey,W*.045,H*.035,0,0,7);c.fill();
  c.fillStyle='#1a0f0a';c.beginPath();c.arc(cx-ex+1,ey,W*.022,0,7);c.arc(cx+ex+1,ey,W*.022,0,7);c.fill();
  c.strokeStyle='#14100f';c.lineWidth=3;c.beginPath();c.moveTo(cx-ex-9,ey-H*.05);c.lineTo(cx-ex+8,ey-H*(id==='veer'?.065:.05));c.moveTo(cx+ex+9,ey-H*.05);c.lineTo(cx+ex-8,ey-H*(id==='veer'?.065:.05));c.stroke();
  if(id==='chintu'){c.strokeStyle='#222';c.lineWidth=2.5;c.beginPath();c.arc(cx-ex,ey,W*.07,0,7);c.arc(cx+ex,ey,W*.07,0,7);c.moveTo(cx-ex+W*.07,ey);c.lineTo(cx+ex-W*.07,ey);c.stroke()}
  c.strokeStyle='#7a2b1a';c.lineWidth=3;c.beginPath();
  if(id==='veer'){c.moveTo(cx-W*.08,H*.55);c.quadraticCurveTo(cx+W*.02,H*.6,cx+W*.1,H*.53)}
  else if(id==='bunty'){c.moveTo(cx-W*.11,H*.54);c.quadraticCurveTo(cx,H*.63,cx+W*.11,H*.54)}
  else{c.moveTo(cx-W*.07,H*.55);c.quadraticCurveTo(cx,H*.59,cx+W*.07,H*.55)}
  c.stroke();
  if(id==='bunty'){c.fillStyle='#fff';c.beginPath();c.moveTo(cx-W*.1,H*.545);c.quadraticCurveTo(cx,H*.62,cx+W*.1,H*.545);c.fill()}
  c.fillStyle='#0003';c.beginPath();c.ellipse(cx,H*.5,W*.015,H*.012,0,0,7);c.fill();
  return cv.toDataURL();
}
