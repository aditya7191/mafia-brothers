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
    // city hum + warning beep gain
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
  horn(vol=0.16,pitch=1){this.tone(392*pitch,0.38,'sawtooth',vol);this.tone(494*pitch,0.38,'sawtooth',vol);this.tone(196*pitch,0.38,'square',vol*.5)}
  farHorn(){this.horn(0.05,0.8+Math.random()*0.5)}
  crash(p){p=Math.min(1,p); this.burst(0.25+p*0.3,500+p*600,0.3+p*0.5); this.tone(90,0.25,'sine',0.5*p+0.1,0,-50)}
  click(){this.tone(660,0.07,'square',0.12)}
  pickup(){[523,659,784].forEach((f,i)=>this.tone(f,0.18,'triangle',0.28,i*0.08))}
  checkpoint(){this.tone(880,0.12,'triangle',0.3);this.tone(1174,0.2,'triangle',0.3,0.09)}
  win(){[523,659,784,1047,784,1047,1319].forEach((f,i)=>this.tone(f,0.22,'triangle',0.3,i*0.1)); this.tone(262,0.9,'sine',0.25,0)}
  fail(){[440,392,330,262].forEach((f,i)=>this.tone(f,0.3,'sawtooth',0.2,i*0.17))}
  warn(){this.tone(1000,0.08,'square',0.12)}
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
