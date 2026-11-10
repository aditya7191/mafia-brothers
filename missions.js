import {LM} from './city.js';
export const STORY=[
 {who:['veer','bunty','chintu'],text:'Mumbai. Samundar kinare sunset ka time. Veer, Bunty aur Chintu — teen pakke dost, ek hi gali ke. 🌇'},
 {who:['veer','bunty','chintu'],text:'Teeno ne apni dosti ka naam rakha — "MAFIA BROTHERS"! 😄 Mafia sirf naam ka hai. Koi gundagardi nahi — bas delivery, dost-yaar ki help aur Mumbai ki masti.'},
 {who:['chintu','veer'],text:'Aaj teeno ko gaadi mili hai. Missions karo, paise kamao, aur poori city ghumo. Har mission mein apna dost chuno — sabki gaadi alag hai!'}
];
const PI=Math.PI;
export const MISSIONS=[
 {id:'m1',icon:'🚕',title:'Pehli Sawari',sub:'Taxi pick-up & drop • Tutorial',rec:0,time:180,reward:500,
  start:{x:-192,z:-96,th:PI/2},tutorial:true,
  brief:[['veer','Bunty Rail Station pe phasa hai, uski bike kharab ho gayi. Usse uthana hai!'],['chintu','Phir Sea Gate Arch pe chhodna hai. Aaram se chalana, traffic se takkar mat karna. 3 minute hain.']],
  obj:'Station pe Bunty ko pick karo ➜ Sea Gate Arch pe drop karo',
  steps:[{x:LM.station.x,z:LM.station.z,r:10,label:'Rail Station pe Bunty ko pick karo',pick:'Bunty',color:0xffd166},
         {x:-304,z:0,r:10,label:'Bunty ko Sea Gate Arch pe drop karo',drop:'Bunty',color:0x59ff8a}],
  win:[['bunty','Shabaash Veer! Bilkul time pe. Mafia Brothers zindabad! 🙌']]},
 {id:'m2',icon:'🥪',title:'Vada Pav Express',sub:'Delivery 3 jagah • Time ke andar',rec:2,time:165,reward:900,
  start:{x:-288,z:96,th:PI/2},
  brief:[['chintu','Bazaar wale chacha ke vada pav ka order late ho raha hai! Parcel uthao aur 3 jagah pahucha do.'],['bunty','Time kam hai bhai. Chintu ki gaadi sabse tez hai — usse jao!']],
  obj:'Bazaar se parcel lo ➜ Seafront flats ➜ Towers ➜ Maidan',
  steps:[{x:LM.vada.x,z:LM.vada.z,r:10,label:'Chacha ke Vada Pav stall se parcel lo',pick:'Parcel',color:0xffd166},
         {x:-288,z:144,r:10,label:'Delivery 1: Seafront flats (coast road)',drop:'1/3',color:0x59ff8a},
         {x:192,z:144,r:10,label:'Delivery 2: Towers wali road',drop:'2/3',color:0x59ff8a},
         {x:96,z:-48,r:10,label:'Delivery 3: Maidan ke paas',drop:'3/3',color:0x59ff8a}],
  win:[['chintu','Chacha khush! "Shabaash bachchon!" bole aur extra paise diye 😋']]},
 {id:'m3',icon:'🏁',title:'Bhaago!',sub:'Rival gang se bachke Safe Garage',rec:1,time:120,reward:1300,chase:true,
  start:{x:-192,z:96,th:PI/2},
  brief:[['veer','Pandu aur uski gang ki kaali jeep humare peeche padi hai — bas race hai, koi ladai nahi!'],['bunty','Meri strong gaadi se nikalte hain! Peeche wali jeep ko door rakho aur Safe Garage tak pahucho.'],['chintu','Dhyan rakho: upar PAKDE JAANE KA meter bhar gaya toh mission fail!']],
  obj:'Rival jeep se door raho ➜ Safe Garage tak pahucho',
  steps:[{x:288,z:-192,r:11,label:'Safe Garage tak bhaago! (Peeche kaali jeep hai)',color:0x59ff8a}],
  win:[['veer','Hum nikal gaye! Pandu ki gang peeche reh gayi 😎']]},
 {id:'m4',icon:'🌊',title:'Sea Face Sprint',sub:'7 checkpoints • Race against time',rec:0,time:105,reward:1600,
  start:{x:-288,z:240,th:PI},
  brief:[['chintu','Samundar kinare se shuru karke poori city ka chakkar! 7 checkpoints, sirf 105 second.'],['veer','Challenge accepted! Jo bhi gaadi lo, bas time pe pahucho.']],
  obj:'Saare 7 checkpoints time ke andar lo',
  steps:[{x:-288,z:96,r:11,label:'Checkpoint 1/7',cp:1,r:14,color:0x59d6ff},{x:-288,z:-96,r:11,label:'Checkpoint 2/7',cp:1,r:14,color:0x59d6ff},{x:-288,z:-288,r:11,label:'Checkpoint 3/7',cp:1,r:14,color:0x59d6ff},
         {x:-96,z:-288,r:11,label:'Checkpoint 4/7',cp:1,r:14,color:0x59d6ff},{x:96,z:-288,r:11,label:'Checkpoint 5/7',cp:1,r:14,color:0x59d6ff},{x:288,z:-96,r:11,label:'Checkpoint 6/7',cp:1,r:14,color:0x59d6ff},{x:96,z:-96,r:11,label:'Checkpoint 7/7 — Finish!',cp:1,r:14,color:0x59ff8a}],
  win:[['bunty','Kya race thi! Mafia Brothers sabse tez 🏆']]},
];
