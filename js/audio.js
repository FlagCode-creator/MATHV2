/* Math Quest V2 — เสียงเอฟเฟกต์สังเคราะห์ด้วย WebAudio (ไม่ต้องโหลดไฟล์เสียง) */
let audioCtx=null;
let sfxOn=(function(){try{return localStorage.getItem("mq2_sfx")!=="off"}catch(e){return true}})();
function ctx_(){
  if(!audioCtx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;audioCtx=new C()}
  if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});
  return audioCtx;
}
// notes: [[freq, start, dur, type, vol]]
function playNotes_(notes){
  if(!sfxOn)return;
  const c=ctx_();if(!c)return;
  const t0=c.currentTime+0.01;
  notes.forEach(([f,st,du,type,vol])=>{
    const o=c.createOscillator(),g=c.createGain();
    o.type=type||"square";o.frequency.setValueAtTime(f,t0+st);
    g.gain.setValueAtTime(0.0001,t0+st);
    g.gain.exponentialRampToValueAtTime(vol||0.08,t0+st+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+st+du);
    o.connect(g);g.connect(c.destination);o.start(t0+st);o.stop(t0+st+du+0.02);
  });
}
function playNoise_(dur,vol){
  if(!sfxOn)return;
  const c=ctx_();if(!c)return;
  const n=Math.floor(c.sampleRate*dur),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=c.createBufferSource(),g=c.createGain();g.gain.value=vol||0.12;
  s.buffer=buf;s.connect(g);g.connect(c.destination);s.start();
}
const SFX={
  click:()=>playNotes_([[660,0,.05,"square",.04]]),
  transition:()=>playNotes_([[220,0,.06,"square",.05],[330,.06,.06,"square",.05],[440,.12,.06,"square",.05],[660,.18,.1,"square",.05],[880,.28,.14,"triangle",.05]]),
  boss:()=>{playNoise_(.3,.08);playNotes_([[110,0,.25,"sawtooth",.06],[104,.28,.25,"sawtooth",.06],[98,.56,.45,"sawtooth",.07],[55,.56,.5,"square",.05]])},
  blip:()=>playNotes_([[500+Math.random()*160,0,.03,"square",.015]]),
  hit:()=>{playNoise_(.12,.1);playNotes_([[220,0,.08,"square",.06],[330,.04,.08,"square",.05]])},
  crit:()=>{playNoise_(.18,.14);playNotes_([[523,0,.07,"square",.07],[784,.06,.07,"square",.07],[1046,.12,.12,"square",.07]])},
  hurt:()=>{playNoise_(.2,.12);playNotes_([[180,0,.15,"sawtooth",.07],[120,.1,.18,"sawtooth",.06]])},
  block:()=>playNotes_([[880,0,.06,"triangle",.08],[1320,.05,.12,"triangle",.07]]),
  heal:()=>playNotes_([[523,0,.1,"sine",.08],[659,.08,.1,"sine",.08],[784,.16,.16,"sine",.08]]),
  item:()=>playNotes_([[740,0,.06,"triangle",.07],[988,.06,.1,"triangle",.07]]),
  charge:()=>playNotes_([[200,0,.3,"sawtooth",.05],[300,.1,.3,"sawtooth",.05],[400,.2,.3,"sawtooth",.05]]),
  win:()=>playNotes_([[523,0,.12,"square",.07],[659,.12,.12,"square",.07],[784,.24,.12,"square",.07],[1046,.36,.35,"square",.07]]),
  lose:()=>playNotes_([[392,0,.2,"triangle",.08],[330,.2,.2,"triangle",.08],[262,.4,.45,"triangle",.08]]),
  levelUp:()=>playNotes_([[392,0,.08,"square",.06],[523,.08,.08,"square",.06],[659,.16,.08,"square",.06],[784,.24,.08,"square",.06],[1046,.32,.3,"square",.06]]),
  coin:()=>playNotes_([[988,0,.06,"square",.05],[1319,.06,.16,"square",.05]]),
  tick:()=>playNotes_([[1200,0,.03,"square",.03]])
};
function toggleSfx(){
  sfxOn=!sfxOn;
  try{localStorage.setItem("mq2_sfx",sfxOn?"on":"off")}catch(e){}
  updateSfxBtn_();if(sfxOn){SFX.click();playBgm(BGM.want)}else stopBgm_();
}
function updateSfxBtn_(){const b=$("sfx-btn");if(b)b.textContent=sfxOn?"🔊":"🔇"}

/* ---- เพลงประกอบ (ชิปทูน สังเคราะห์สด ไม่ต้องโหลดไฟล์) ---- */
const TRACKS={
  village:{bpm:96,lead:"triangle",
    mel:"E5 - G5 - C6 - G5 - | A5 - G5 E5 D5 - C5 - | D5 - E5 - G5 - E5 - | D5 - C5 - D5 - - - | E5 - G5 - C6 - D6 - | E6 - D6 C6 A5 - G5 - | A5 - G5 E5 D5 - E5 - | C5 - - - - - - -",
    bass:"C3 - G3 - E3 - G3 - | F3 - C4 - A3 - C4 - | G2 - D3 - B2 - D3 - | G2 - D3 - G3 - D3 - | C3 - G3 - E3 - G3 - | F3 - C4 - A3 - C4 - | G2 - D3 - B2 - D3 - | C3 - G3 - C3 - - -"},
  field:{bpm:116,lead:"square",
    mel:"G4 - B4 D5 G5 - F#5 E5 | D5 - B4 - G4 - A4 B4 | C5 - E5 - D5 - B4 G4 | A4 - - - - - D5 - | G4 - B4 D5 G5 - A5 B5 | C6 - B5 A5 G5 - E5 - | D5 - G5 - F#5 - A5 - | G5 - - - - - - -",
    bass:"G2 - D3 - G2 - D3 - | G2 - D3 - G2 - D3 - | C3 - G3 - C3 - G3 - | D3 - A3 - D3 - F#3 - | E3 - B3 - E3 - B3 - | C3 - G3 - C3 - G3 - | D3 - A3 - D3 - A3 - | G2 - D3 - G2 - - -",
    drum:"k - h - s - h - "},
  battle:{bpm:144,lead:"square",
    mel:"A4 - C5 E5 A5 - G5 E5 | F5 - E5 D5 E5 - - - | A4 - C5 E5 A5 - B5 C6 | B5 - G5 - E5 - - - | F5 - A5 - G5 - E5 - | D5 - F5 - E5 - C5 - | B4 - D5 - C5 - A4 - | G#4 - B4 - E5 - - -",
    bass:"A2 A2 A3 A2 A2 A2 A3 A2 | F2 F2 F3 F2 F2 F2 F3 F2 | A2 A2 A3 A2 A2 A2 A3 A2 | G2 G2 G3 G2 G2 G2 G3 G2 | F2 F2 F3 F2 F2 F2 F3 F2 | D2 D2 D3 D2 D2 D2 D3 D2 | G2 G2 G3 G2 G2 G2 G3 G2 | E2 E2 E3 E2 E2 E2 E3 E2",
    drum:"k h s h k h s h "},
  boss:{bpm:156,lead:"sawtooth",
    mel:"D5 - D5 F5 A5 - G5 F5 | E5 - C#5 - A4 - - - | D5 - D5 F5 A5 - C6 A5 | Bb5 - A5 G5 A5 - - - | G5 - F5 E5 F5 - E5 D5 | C#5 - E5 - A5 - G5 - | F5 - E5 D5 E5 - C#5 - | D5 - - - A4 - - -",
    bass:"D2 D3 D2 D3 D2 D3 D2 D3 | A1 A2 A1 A2 A1 A2 A1 A2 | D2 D3 D2 D3 D2 D3 D2 D3 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | G1 G2 G1 G2 G1 G2 G1 G2 | A1 A2 A1 A2 A1 A2 A1 A2 | Bb1 Bb2 Bb1 Bb2 A1 A2 A1 A2 | D2 D3 D2 D3 D2 D3 D2 D3",
    drum:"k h s h k k s h "}
};
const NOTE_I_={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function noteHz_(tok){const m=/^([A-G])(#|b)?(\d)$/.exec(tok);if(!m)return 0;const midi=12*(+m[3]+1)+NOTE_I_[m[1]]+(m[2]==="#"?1:m[2]==="b"?-1:0);return 440*Math.pow(2,(midi-69)/12)}
const parseSeq_=s=>s.replace(/\|/g," ").trim().split(/\s+/).map(t=>t==="-"?null:t);
const BGM={want:null,cur:null,timer:null,step:0,next:0,gain:null,seq:null};
function playBgm(name){
  BGM.want=name||null;
  if(!sfxOn||!name||!TRACKS[name]){stopBgm_();return}
  if(BGM.cur===name&&BGM.timer)return;
  stopBgm_();
  const c=ctx_();if(!c)return;
  const t=TRACKS[name];BGM.seq={mel:parseSeq_(t.mel),bass:parseSeq_(t.bass),drum:t.drum?t.drum.trim().split(/\s+/):null,step:60/t.bpm/2,lead:t.lead};
  BGM.gain=c.createGain();BGM.gain.gain.setValueAtTime(0.0001,c.currentTime);BGM.gain.gain.exponentialRampToValueAtTime(0.05,c.currentTime+0.6);BGM.gain.connect(c.destination);
  BGM.cur=name;BGM.step=0;BGM.next=c.currentTime+0.08;
  BGM.timer=setInterval(bgmTick_,90);bgmTick_();
}
function stopBgm_(){
  if(BGM.timer){clearInterval(BGM.timer);BGM.timer=null}
  if(BGM.gain&&audioCtx){const g=BGM.gain,t=audioCtx.currentTime;try{g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value||0.05,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.35)}catch(e){}setTimeout(()=>{try{g.disconnect()}catch(e){}},500)}
  BGM.gain=null;BGM.cur=null;
}
function bgmTick_(){
  const c=audioCtx,S=BGM.seq;if(!c||!S||!BGM.gain)return;
  while(BGM.next<c.currentTime+0.3){
    const i=BGM.step%S.mel.length,t=BGM.next,d=S.step;
    const len=(arr,j)=>{let k=1;while(k<8&&arr[(j+k)%arr.length]===null&&arr===S.mel)k++;return k};
    const n=S.mel[i];if(n)bgmNote_(noteHz_(n),t,d*len(S.mel,i)*0.9,S.lead,S.lead==="triangle"?0.9:0.35);
    const b=S.bass[i%S.bass.length];if(b)bgmNote_(noteHz_(b),t,d*0.9,"triangle",0.8);
    if(S.drum){const k=S.drum[i%S.drum.length];if(k==="k")bgmNote_(90,t,0.09,"sine",1,40);else if(k==="s")bgmHit_(t,0.08,0.35);else if(k==="h")bgmHit_(t,0.03,0.12)}
    BGM.next+=d;BGM.step++;
  }
}
function bgmNote_(f,t,dur,type,vol,slideTo){
  if(!f)return;const c=audioCtx,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);if(slideTo)o.frequency.exponentialRampToValueAtTime(slideTo,t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+Math.max(0.05,dur));
  o.connect(g);g.connect(BGM.gain);o.start(t);o.stop(t+dur+0.03);
}
function bgmHit_(t,dur,vol){
  const c=audioCtx,n=Math.floor(c.sampleRate*dur),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=c.createBufferSource(),g=c.createGain();g.gain.value=vol;s.buffer=buf;s.connect(g);g.connect(BGM.gain);s.start(t);
}
