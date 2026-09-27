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
  updateSfxBtn_();if(sfxOn)SFX.click();
}
function updateSfxBtn_(){const b=$("sfx-btn");if(b)b.textContent=sfxOn?"🔊":"🔇"}
