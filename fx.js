// Shared night/day state and cheap "fake bloom" helpers (halo sprites, additive light pools).
import * as THREE from './three.module.min.js';
export const ENV={night:true};
const cache={};
function radial(stops,size=128){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);stops.forEach(([o,col])=>g.addColorStop(o,col));x.fillStyle=g;x.fillRect(0,0,size,size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
export function glowTex(){return cache.glow||(cache.glow=radial([[0,'rgba(255,255,255,1)'],[.12,'rgba(255,255,255,.85)'],[.35,'rgba(255,255,255,.28)'],[1,'rgba(255,255,255,0)']]))}
export function poolTex(){return cache.pool||(cache.pool=radial([[0,'rgba(255,255,255,.95)'],[.4,'rgba(255,255,255,.45)'],[.75,'rgba(255,255,255,.12)'],[1,'rgba(255,255,255,0)']],128))}
export function beamTex(){if(cache.beam)return cache.beam;const c=document.createElement('canvas');c.width=64;c.height=128;const x=c.getContext('2d');
  // canvas top = end nearest the car (bright), bottom = far end (fades out). Cone widens with distance.
  const g=x.createLinearGradient(0,0,0,128);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.5,'rgba(255,255,255,.32)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.beginPath();x.moveTo(22,0);x.lineTo(42,0);x.lineTo(63,128);x.lineTo(1,128);x.closePath();x.fill();
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return cache.beam=t}
const hm={};
export function halo(hex,size,op=.9){const k=hex+'_'+op;const m=hm[k]||(hm[k]=new THREE.SpriteMaterial({map:glowTex(),color:hex,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false}));const s=new THREE.Sprite(m);s.scale.set(size,size,1);return s}
const am={};
export function addMat(tex,hex,op=1,off=true){const k=(tex.id)+'_'+hex+'_'+op;return am[k]||(am[k]=new THREE.MeshBasicMaterial({map:tex,color:hex,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:off,polygonOffsetFactor:-2,polygonOffsetUnits:-2}))}
export function nightify(o){o.userData.night=true;o.visible=ENV.night;return o}
export function dayify(o){o.userData.day=true;o.visible=!ENV.night;return o}
export function applyVis(root){root.traverse(o=>{if(o.userData.night)o.visible=ENV.night;else if(o.userData.day)o.visible=!ENV.night})}
export function groundQuad(w,l,tex,hex,op,y=.16){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,l),addMat(tex,hex,op));m.rotation.x=-Math.PI/2;m.position.y=y;m.renderOrder=2;return m}

// ---- shared traffic-signal cycle (26 s): x-axis green 0-10, yellow 10-12, red 12-26; z-axis green 13-23, yellow 23-25, red otherwise
export const SIGP=26;
export function sigState(axis,t){const p=t%SIGP;if(axis==='x')return p<10?'g':p<12?'y':'r';return(p>=13&&p<23)?'g':(p>=23&&p<25)?'y':'r'}
