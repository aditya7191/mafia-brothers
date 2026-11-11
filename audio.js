// All sound is synthesized with WebAudio – no audio files, original tunes.
export class Sfx{
  constructor(){this.ctx=null;this.muted=false;this.musicOn=true;this.t=0}
  init(){
    if(this.ctx){ if(this.ctx.state==='suspended')this.ctx.resume(); return; }
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC)return;
    const c=this.ctx=new AC();
    this.master=c.createGain(); this.master.gain.value=this.muted?0:0.85; this.master.connect(c.destination);
    this.sfx=c.createGain(); this.sfx.gain.value=1; this.sfx.connect(this.master);
    this.mus=c.createGain(); this.mus.gain.value=this.musicOn?0.2:0; this.mus.connect(this.master);
    const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate), d=nb.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1; this.noise=nb;
    // engine
    this.e1=c.createOscillator(); this.e1.type='sawtooth'; this.e2=c.createOscillator(); this.e2.type='square';
    this.ef=c.createBiquadFilter(); this.ef.type='lowpass'; this.ef.frequency.value=500; this.ef.Q.value=2;
    this.eg=c.createGain(); this.eg.gain.value=0;
    this.e1.connect(this.ef); this.e2.connect(this.ef); this.ef.connect(this.eg); this.eg.connect(this.sfx);
    this.e1.start(); this.e2.start();
    // skid
    this.sk=c.createBufferSource(); this.sk.buffer=nb; this.sk.loop=true; const bf=c.createBiquadFilter(); bf.type='bandpass'; bf.frequency.value=1700; bf.Q.value=3;
    this.skg=c.createGain(); this.skg.gain.value=0; this.sk.connect(bf); bf.connect(this.skg); this.skg.connect(this.sfx); this.sk.start();
    // sea waves
    this.wv=c.createBufferSource(); this.wv.buffer=nb; this.wv.loop=true; const lf=c.createBiquadFilter(); lf.type='lowpass'; lf.frequency.value=520;
    this.wg=c.createGain(); this.wg.gain.value=0; const lfo=c.createOscillator(); lfo.frequency.value=0.13; const lg=c.createGain(); lg.gain.value=0.5;
    this.wv.connect(lf); lf.connect(this.wg); this.wg.connect(this.sfx); lfo.connect(lg); lg.connect(this.wg.gain); lfo.start(); this.wv.start();
    // police siren
    this.so=c.createOscillator();this.so.type='sawtooth';const sf=c.createBiquadFilter();sf.type='lowpass';sf.frequency.value=1400;this.sg=c.createGain();this.sg.gain.value=0;
    this.so.connect(sf);sf.connect(this.sg);this.sg.connect(this.sfx);this.so.start();
    this.startMusic();
  }
  setMuted(m){this.muted=m; if(this.master)this.master.gain.setTargetAtTime(m?0:0.85,this.ctx.currentTime,0.05)}
  setMusic(on){this.musicOn=on; if(this.mus)this.mus.gain.setTargetAtTime(on?0.2:0,this.ctx.currentTime,0.1)}
  update(st){ // st:{ratio,throttle,skid,sea,active}
    if(!this.ctx)return; const t=this.ctx.currentTime,r=Math.min(1,st.ratio);
    const gear=Math.min(3,Math.floor(r*4)), gf=(r*4)-gear;
    const f=38+ (gear*18)+ gf*52 + r*18 + st.throttle*10;
    this.e1.frequency.setTargetAtTime(f,t,0.05); this.e2.frequency.setTargetAtTime(f*0.5+1.5,t,0.05);
    this.ef.frequency.setTargetAtTime(280+r*700+st.throttle*500,t,0.08);
    this.eg.gain.setTargetAtTime(st.active?(0.07+st.throttle*0.07+r*0.04):0,t,0.1);
    this.skg.gain.setTargetAtTime(st.active?st.skid*0.16:0,t,0.05);
    this.wg.gain.setTargetAtTime(st.sea*0.16,t,0.4);
    this.so.frequency.setTargetAtTime(760+Math.sin(t*5.5)*260,t,0.02);this.sg.gain.setTargetAtTime((st.siren||0)*0.07,t,0.1);
  }
  tone(freq,dur,type='sine',vol=0.3,when=0,slide=0,dest){
    if(!this.ctx)return; const c=this.ctx,t=c.currentTime+when,o=c.createOscillator(),g=c.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,t); if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide),t+dur);
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+0.012); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(dest||this.sfx); o.start(t); o.stop(t+dur+0.05);
  }
  burst(dur,freq,vol=0.4,type='lowpass',when=0){
    if(!this.ctx)return; const c=this.ctx,t=c.currentTime+when,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
    s.buffer=this.noise; f.type=type; f.frequency.value=freq; g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    s.connect(f); f.connect(g); g.connect(this.sfx); s.start(t,Math.random()); s.stop(t+dur+0.05);
  }
  gun(kind,vol=1){const k={pistol:[.34,2200,.09,230],smg:[.22,2600,.06,260],shotgun:[.5,1100,.2,150],enemy:[.2,1800,.08,200]}[kind]||[.3,2000,.08,220];
    this.burst(k[2],k[1],k[0]*vol,'highpass');this.burst(k[2]*1.6,700,k[0]*.8*vol,'lowpass');this.tone(k[3],.13,'square',.22*vol,0,-120)}
  blaster(){this.tone(78,.5,'sawtooth',.34,0,-34);this.tone(1500,.28,'square',.13,0,-1250);this.tone(430,.6,'sine',.2,.04,900);this.tone(880,.45,'triangle',.12,.1,1100);this.burst(.32,520,.34,'lowpass')}
  boom(){this.tone(62,.45,'sine',.42,0,-36);this.tone(180,.3,'sawtooth',.14,0,-120);this.burst(.35,380,.3,'lowpass')}
  hurt(){this.tone(140,.18,'sawtooth',.25,0,-60);this.burst(.1,400,.2)}
  dry(){this.tone(900,.04,'square',.1)}
  horn(vol=0.16,pitch=1){this.tone(392*pitch,0.38,'sawtooth',vol);this.tone(494*pitch,0.38,'sawtooth',vol);this.tone(196*pitch,0.38,'square',vol*.5)}
  farHorn(){this.horn(0.05,0.8+Math.random()*0.5)}
  crash(p){p=Math.min(1,p); this.burst(0.25+p*0.3,500+p*600,0.3+p*0.5); this.tone(90,0.25,'sine',0.5*p+0.1,0,-50)}
  click(){this.tone(660,0.07,'square',0.12)}
  pickup(){[523,659,784].forEach((f,i)=>this.tone(f,0.18,'triangle',0.28,i*0.08))}
  checkpoint(){this.tone(880,0.12,'triangle',0.3);this.tone(1174,0.2,'triangle',0.3,0.09)}
  win(){[523,659,784,1047,784,1047,1319].forEach((f,i)=>this.tone(f,0.22,'triangle',0.3,i*0.1)); this.tone(262,0.9,'sine',0.25,0)}
  fail(){[440,392,330,262].forEach((f,i)=>this.tone(f,0.3,'sawtooth',0.2,i*0.17))}
  warn(){this.tone(1000,0.08,'square',0.12)}
  // ---- home interior sounds (all synthesized)
  home(on){if(this.mus&&this.ctx)this.mus.gain.setTargetAtTime(on?0.06:(this.musicOn?0.2:0),this.ctx.currentTime,0.2)}
  door(){this.tone(180,.18,'sawtooth',.14,0,-60);this.burst(.12,500,.2);this.tone(90,.2,'sine',.3,.12,-30)}
  fizz(){this.burst(.55,6000,.2,'highpass');this.tone(1800,.05,'square',.1)}
  gulp(){[0,.28,.56].forEach(w=>this.tone(210,.16,'sine',.3,w,-90))}
  sleepTune(){[523,659,784,659,523,392].forEach((f,i)=>this.tone(f,.5,'sine',.2,i*.32))}
  tvOn(ch){if(!this.ctx)return;this.tvOff();const c=this.ctx;this.tvN=c.createBufferSource();this.tvN.buffer=this.noise;this.tvN.loop=true;this.tvF=c.createBiquadFilter();this.tvF.type='bandpass';this.tvF.frequency.value=900;this.tvF.Q.value=.6;
    this.tvG=c.createGain();this.tvG.gain.value=0;this.tvN.connect(this.tvF);this.tvF.connect(this.tvG);this.tvG.connect(this.sfx);this.tvN.start();this.tvSet(ch)}
  tvSet(ch){if(!this.tvG)return;const t=this.ctx.currentTime;this.tvG.gain.setTargetAtTime(ch===0?.07:ch===1?.012:.02,t,.1);this.tvF.frequency.setTargetAtTime(ch===0?700:1500,t,.1)}
  tvOff(){if(this.tvN){try{this.tvN.stop()}catch(e){}this.tvN.disconnect();this.tvN=null;this.tvG=null}}
  tvEvt(k){if(!this.ctx)return;const t=this.ctx.currentTime;
    if(k==='hit'){this.tone(1500,.04,'square',.12);this.burst(.06,2500,.15)}
    else if(k==='six'){if(this.tvG){this.tvG.gain.cancelScheduledValues(t);this.tvG.gain.setTargetAtTime(.2,t,.05);this.tvG.gain.setTargetAtTime(.07,t+1.2,.4)}[784,988,1175,1568].forEach((f,i)=>this.tone(f,.18,'triangle',.14,i*.09))}
    else if(k==='boing'){this.tone(300,.22,'sine',.16,0,500);this.tone(620,.12,'triangle',.1,.16)}
    else if(k==='beat'){this.tone(70,.14,'sine',.22,0,-30);this.burst(.04,5000,.06,'highpass',.2)}
    else if(k==='note'){const sc=[523,587,659,784,880];this.tone(sc[Math.floor(Math.random()*5)],.14,'square',.06)}}
  startMusic(){
    const c=this.ctx; this.base=130.81; this.sc=[0,1,4,5,7,8,10];
    this.step=0; this.next=c.currentTime+0.2; this.bpm=104;
    this.dl=c.createDelay(); this.dl.delayTime.value=0.288; const fb=c.createGain(); fb.gain.value=0.3; const dg=c.createGain(); dg.gain.value=0.45;
    this.dl.connect(fb); fb.connect(this.dl); this.dl.connect(dg); dg.connect(this.mus);
    this.melody=[12,-1,13,12,16,-1,12,-1, 10,-1,12,10,8,-1,7,-1, 7,8,7,-1,4,5,-1,4, 5,-1,4,1,0,-1,-1,-1];
    this.bass=[0,0,7,0, 5,5,4,1];
    this.timer=setInterval(()=>this.sched(),40);
  }
  sched(){
    const c=this.ctx; if(!c||!this.musicOn)return; if(c.state!=='running'){this.next=c.currentTime+0.1;return}
    const sd=60/this.bpm/4;
    while(this.next<c.currentTime+0.15){ this.play16(this.step%64,this.next); this.step++; this.next+=sd; }
  }
  play16(s,t){
    const c=this.ctx,m=this.mus,st=s%16,bar=Math.floor(s/16);
    if(st===0||st===8||(st===6&&bar%2)){const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+0.15);g.gain.setValueAtTime(0.9,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.2);o.connect(g);g.connect(m);o.start(t);o.stop(t+0.25)}
    if(st===4||st===12||st===14||(st===10&&bar===3)){const sr=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();sr.buffer=this.noise;f.type='bandpass';f.frequency.value=st===14?3200:2000;f.Q.value=1.5;g.gain.setValueAtTime(0.35,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.07);sr.connect(f);f.connect(g);g.connect(m);sr.start(t,Math.random());sr.stop(t+0.1)}
    if(st%2===0){ // 8th notes
      const e=(s>>1)%32, mel=this.melody[e];
      if(mel>=0 && (bar%4!==3 || e%8<6)){const f=this.base*2*Math.pow(2,mel/12);const o=c.createOscillator(),fl=c.createBiquadFilter(),g=c.createGain();o.type='triangle';o.frequency.value=f;fl.type='lowpass';fl.frequency.setValueAtTime(3000,t);fl.frequency.exponentialRampToValueAtTime(500,t+0.25);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.28,t+0.01);g.gain.exponentialRampToValueAtTime(0.001,t+0.3);o.connect(fl);fl.connect(g);g.connect(m);g.connect(this.dl);o.start(t);o.stop(t+0.35)}
      const b=this.bass[e%8],bf=this.base*0.5*Math.pow(2,b/12);const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=bf;g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.5,t+0.02);g.gain.exponentialRampToValueAtTime(0.001,t+0.26);o.connect(g);g.connect(m);o.start(t);o.stop(t+0.3);
    }
  }
}
