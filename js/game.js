/* Math Quest V2 — หน้าจอ แผนที่ ฉากต่อสู้ ร้านค้า และตัวละคร */

// URL เดียวกับ V1 (Google Apps Script) — ใช้แค่ยืนยันตัวตนนักเรียน ความก้าวหน้า V2 เก็บในเครื่อง
const API_URL="https://script.google.com/macros/s/AKfycby3D9Ko8fiVBqLznZMwmVvSmalf0kOw1whA_qWa3VWYgv-sB2UYUEUnqARGWv5GCMBang/exec";
function gsRun(fn,...args){
  return fetch(API_URL,{method:"POST",body:JSON.stringify({action:fn,args})})
    .then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.json()});
}

let save=null;          // เซฟของผู้เล่นปัจจุบัน
let B=null;             // สถานะฉากต่อสู้
let lastBattle=null;    // {kind,id} ไว้ใช้กด "สู้อีกครั้ง"/"ด่านถัดไป"
let guestAvatar=AVATARS[0];
let navBack="map";      // หน้าร้านค้า/ตัวละคร/ทักษะ กด "กลับ" แล้วไปไหน (map หรือ explore)
function goBack(){if(navBack==="explore")resumeExplore();else goMap()}

/* ====================================================================== */
/* Screens                                                                 */
/* ====================================================================== */
function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("active",s.id==="screen-"+id));
  window.scrollTo(0,0);
  const t=$("toast");if(t)t.classList.remove("show");
}
function persist(){if(save){save.lastPlayed=Date.now();writeSave_(save)}}

/* ---- บทสนทนา (เต็มจอ) — ภาพครึ่งตัวยืนเหนือกล่อง ข้อความขึ้นทีละตัว ตัวละครขยับตามจังหวะพูด · คืน Promise เมื่ออ่านจบ
   บรรทัด: {mood, text} = ครูแฟล็ก · {sprite, name, text, pose?} = ตัวละครอื่น (pose: happy | sad | surprised | angry | shy) ---- */
let dialogQueue=[],dialogDone=null;
const DLG={who:null,timer:null,full:"",art:null,open:false};
// อารมณ์ของครูแฟล็ก (ชื่อไฟล์ภาพ) → ท่าทาง
const MOOD_POSE={happy:"happy",excited:"happy",celebrate:"happy",wave:"happy",hello:"happy",welcome:"happy",
  shocked:"surprised",confused:"surprised",sad:"sad",angry:"angry",furious:"angry",determined:"angry",shy:"shy"};
const POSE_ANIM={happy:"hop",surprised:"shock",sad:"droop",angry:"rage",shy:"sway"};
const graphemes_=t=>{try{if(window.Intl&&Intl.Segmenter)return Array.from(new Intl.Segmenter("th",{granularity:"grapheme"}).segment(t),x=>x.segment)}catch(e){}return Array.from(t)};
function playDialog(lines){
  return new Promise(res=>{
    dialogQueue=lines.slice();dialogDone=res;DLG.who=null;
    $("dialog").classList.remove("hidden");showDialogLine_();
  });
}
// เลือกภาพ: ครึ่งตัว (ตัวละครที่มีภาพใหญ่) · ภาพใหญ่ของมอนสเตอร์ · หรือไอคอนเล็กในกล่อง (ป้าย หีบ ฯลฯ)
function dialogArt_(l,pose){
  if(!l.sprite)return {actor:true,base:mascotSrc(l.mood||"neutral")};
  const bust=bustInfo(l.sprite);
  if(bust){
    const ex=pose&&expressionBust(l.sprite,pose),t=!ex&&talkBust(l.sprite);
    return {actor:true,base:(ex||bust).url,talk:t?t.url:null};
  }
  const big=customSpriteInfo(l.sprite);
  if(big)return {actor:true,base:big.url,monster:true};
  return {actor:false,base:spriteURL(l.sprite)};
}
function showDialogLine_(){
  const l=dialogQueue.shift(),pose=l.pose||MOOD_POSE[l.mood],art=dialogArt_(l,pose);
  const img=$("dialog-img"),icon=$("dialog-icon"),actor=$("dialog-actor"),poseEl=$("dialog-pose");
  stopTyping_();
  $("dialog").classList.toggle("no-actor",!art.actor);
  const who=(l.sprite||"flag")+"|"+(l.name||"");
  if(art.actor){
    img.src=art.base;icon.classList.add("hidden");
    actor.classList.toggle("monster",!!art.monster);
    if(who!==DLG.who){actor.classList.remove("enter");void actor.offsetWidth;actor.classList.add("enter")}
  }else{icon.src=art.base;icon.classList.remove("hidden")}
  DLG.who=who;
  poseEl.className="dialog-pose";
  const anim=POSE_ANIM[pose];if(anim){void poseEl.offsetWidth;poseEl.classList.add("pose-"+anim)}
  $("dialog-name").textContent=l.name||"ครูแฟล็ก";
  typeLine_(l.text||"",art);
}
function typeLine_(text,art){
  const el=$("dialog-line"),g=graphemes_(text),img=$("dialog-img");
  let i=0,open=false;
  el.textContent="";DLG.full=text;DLG.art=art;
  $("dialog-next").classList.add("wait");$("dialog-actor").classList.add("talking");
  if(!g.length){finishTyping_();return}
  DLG.timer=setInterval(()=>{
    el.textContent+=g[i++];
    if(i%3===0&&g[i-1].trim())SFX.blip();
    if(art.talk&&i%4===0){open=!open;img.src=open?art.talk:art.base}   // ปากขยับ: สลับภาพปากอ้า/ปากปิด
    if(i>=g.length)finishTyping_();
  },28);
}
function stopTyping_(){if(DLG.timer){clearInterval(DLG.timer);DLG.timer=null}}
function finishTyping_(){
  stopTyping_();
  $("dialog-line").textContent=DLG.full;
  if(DLG.art&&DLG.art.actor)$("dialog-img").src=DLG.art.base;
  $("dialog-actor").classList.remove("talking");$("dialog-next").classList.remove("wait");
}
function advanceDialog(){
  if(DLG.timer){finishTyping_();return}      // แตะระหว่างข้อความกำลังขึ้น = แสดงข้อความทั้งหมดก่อน
  SFX.click();
  if(dialogQueue.length){showDialogLine_();return}
  $("dialog").classList.add("hidden");DLG.who=null;
  const d=dialogDone;dialogDone=null;if(d)d();
}
// ครูแฟล็กพูดแบบกล่องเล็กในหน้า (ไม่บังจอ)
function mascotSay(elId,line){
  const el=$(elId);if(!el)return;
  if(!line){el.innerHTML="";return}
  el.innerHTML=`<img class="pixelated" src="${mascotSrc(line.mood)}" alt="ครูแฟล็ก"><p>${esc(line.text)}</p>`;
}

/* ====================================================================== */
/* Title / login                                                           */
/* ====================================================================== */
function renderTitle(){
  const last=(function(){try{return localStorage.getItem(LAST_PLAYER_KEY)}catch(e){return null}})();
  const lastSave=last&&loadSave_(last);
  $("continue-box").classList.toggle("hidden",!lastSave);
  if(lastSave)$("continue-btn").textContent=`▶ เล่นต่อ: ${lastSave.name} (Lv.${lastSave.level})`;
  const saves=listSaves_();
  $("saves-box").classList.toggle("hidden",saves.length<2);
  $("saves-list").innerHTML=saves.map(s=>`<div class="save-row">
    <button type="button" class="pick" onclick="startWithSave('${esc(s.playerId)}')"><span class="av">${heroImg(s.avatar,40)}</span><span><b>${esc(s.name)}</b><small>Lv.${s.level} · ⭐ ${totalStars_(s)} · ${s.studentId?"บัญชีนักเรียน":"ผู้เยี่ยมชม"}</small></span></button>
    <button type="button" class="del" title="ลบเซฟ" onclick="deleteSaveFromTitle('${esc(s.playerId)}')">×</button></div>`).join("");
  const reached=saves.reduce((m,s)=>{const i=WORLDS.findIndex((w,wi)=>!worldUnlocked_(s,wi+1));return Math.max(m,i<0?WORLDS.length-1:i)},0);
  $("title-scene").style.backgroundImage=`url(${bgURL(Math.max(0,reached))})`;
  $("title-parade").innerHTML=["A","F","J","Q","S","Z"].map((k,i)=>`<span style="animation-delay:${i*0.2}s">${spriteImg(k,44)}</span>`).join("");
  showTitleForm("menu");
  showScreen("title");
}
function renderAvatarGrid_(elId,selected,onPick){
  const grid=$(elId);grid.innerHTML="";
  AVATARS.forEach(a=>{
    const b=document.createElement("button");b.type="button";b.innerHTML=heroImg(a,36);b.title=HERO_CLASSES[a].name;
    if(a===selected)b.className="sel";
    b.onclick=()=>{SFX.click();onPick(a)};
    grid.appendChild(b);
  });
}
function showTitleForm(which){
  $("title-menu").classList.toggle("hidden",which!=="menu");
  $("login-form").classList.toggle("hidden",which!=="login");
  $("guest-form").classList.toggle("hidden",which!=="guest");
  if(which==="guest")renderAvatarGrid_("guest-avatars",guestAvatar,function pick(e){guestAvatar=e;renderAvatarGrid_("guest-avatars",e,pick)});
}
async function handleLogin(e){
  e.preventDefault();
  const err=$("login-error"),btn=$("login-submit");
  err.classList.add("hidden");
  const studentId=$("login-id").value.trim(),password=$("login-password").value;
  btn.disabled=true;btn.textContent="กำลังตรวจสอบ...";
  try{
    const res=await gsRun("loginStudent",{studentId,password});
    if(!res.ok){err.textContent=res.message||"เข้าสู่ระบบไม่สำเร็จ";err.classList.remove("hidden");return}
    const p=res.profile||{},sid=String(p.student_id||studentId),pid="sid_"+sid;
    save=loadSave_(pid)||newSave_(pid,p.nickname||p.student_name||sid,AVATARS[0],sid);
    $("login-password").value="";
    persist();enterGame();
  }catch(ex){err.textContent="เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่ (หรือเล่นแบบผู้เยี่ยมชมไปก่อน)";err.classList.remove("hidden")}
  finally{btn.disabled=false;btn.textContent="เข้าสู่ระบบ"}
}
function handleGuest(e){
  e.preventDefault();
  const name=$("guest-name").value.trim().slice(0,16)||"นักผจญภัย";
  save=newSave_("guest_"+Date.now().toString(36),name,guestAvatar,null);
  persist();enterGame();
}
function continueLast(){try{startWithSave(localStorage.getItem(LAST_PLAYER_KEY))}catch(e){}}
function startWithSave(pid){const s=loadSave_(pid);if(!s){toast("ไม่พบเซฟนี้");renderTitle();return}save=s;persist();enterGame()}
function deleteSaveFromTitle(pid){
  const s=loadSave_(pid);if(!s)return;
  if(!confirm(`ลบเซฟของ "${s.name}" (Lv.${s.level}) ถาวร?`))return;
  deleteSave_(pid);renderTitle();
}
async function enterGame(){
  SFX.click();
  if(!save.introSeen){
    await playDialog(INTRO_STORY);
    save.introSeen=true;persist();
  }
  goMap();
}
function replayIntro(){playDialog(INTRO_STORY)}
function switchPlayer(){save=null;renderTitle()}

/* ====================================================================== */
/* Map                                                                     */
/* ====================================================================== */
function renderHud_(){
  $("hud-avatar").innerHTML=heroImg(save.avatar,44);
  $("hud-name").textContent=save.name;
  $("hud-title").textContent=heroTitle(save.level);
  $("hud-level").textContent="LV."+save.level;
  $("hud-xp").style.width=(save.level>=PLAYER_MAX_LEVEL?100:clamp(save.xp/xpToNext(save.level)*100,0,100))+"%";
  $("hud-gold").textContent=save.gold;
  $("hud-stars").textContent=`${totalStars_(save)}/${MAX_STARS}`;
  const pts=skillPointsFree();$("skills-btn").textContent=pts?`🌳 ทักษะ (${pts})`:"🌳 ทักษะ";$("skills-btn").classList.toggle("notify",pts>0);
}
function starsStr_(n){return "⭐".repeat(n)+"☆".repeat(3-n)}
function goMap(){
  if(!save){renderTitle();return}
  B=null;
  renderHud_();updateSfxBtn_();
  $("ae-art").innerHTML=heroImg(save.avatar,48);document.querySelector(".adventure-entry").style.setProperty("--bg",`url(${bgURL(0)})`);
  mascotSay("map-mascot",pickOne(LINES.mapHello));
  const list=$("world-list");list.innerHTML="";
  let focusEl=null;
  WORLDS.forEach((w,wi)=>{
    const unlocked=worldUnlocked_(save,wi);
    const cleared=w.stages.filter(id=>stageCleared_(save,id)).length+(bossCleared_(save,wi)?1:0);
    const el=document.createElement("div");
    el.className="world"+(unlocked?"":" locked");
    el.style.setProperty("--wc",w.color);el.style.setProperty("--wd",w.dark);el.style.setProperty("--bg",`url(${bgURL(wi)})`);
    let nodes="";
    w.stages.forEach((id,i)=>{
      const st=save.stages[id],ok=stageUnlocked_(save,id),done=stageCleared_(save,id);
      const cls=done?"cleared":ok?"available":"locked";
      nodes+=(i?`<span class="node-link"></span>`:"")+`<button type="button" class="node ${cls}" ${ok?`onclick="openPreview('stage','${id}')"`:"disabled"} title="${esc(TOPICS[id])}">
        <span class="n-sprite">${ok?spriteImg(MONSTERS[id].sprite,40):"🔒"}</span><span class="n-id">${id}</span>${done?`<span class="n-stars">${starsStr_(st.stars)}</span>`:""}</button>`;
    });
    const bOk=bossUnlocked_(save,wi),bDone=bossCleared_(save,wi),bs=save.bosses[w.id];
    const bossSprite=w.boss.final?`<img class="pixelated" src="${mascotSrc(bDone?"celebrate":"furious")}" alt="">`:`<span class="n-sprite">${spriteImg(w.boss.sprite,52)}</span>`;
    nodes+=`<span class="node-link"></span><button type="button" class="node boss ${bDone?"cleared":bOk?"available":"locked"}" ${bOk?`onclick="openPreview('boss',${wi})"`:"disabled"} title="บอส: ${esc(w.boss.name)}">
      ${bOk?bossSprite:`<span class="n-sprite">🔒</span>`}${bDone?`<span class="n-stars">${starsStr_(bs.stars)}</span>`:""}</button>`;
    el.innerHTML=`<div class="world-head"><div><span class="world-num">WORLD ${wi+1}</span><h3>${w.icon} ${esc(w.name)}</h3><small>${unlocked?w.stages.map(id=>id+" "+TOPICS[id]).join(" · "):"🔒 ชนะบอสดินแดนก่อนหน้าเพื่อปลดล็อก"}</small></div>
      <span class="world-prog">${cleared}/${w.stages.length+1}</span></div><div class="nodes">${nodes}</div>`;
    list.appendChild(el);
    if(unlocked&&!bDone&&!focusEl)focusEl=el;
  });
  showScreen("map");
  if(focusEl&&focusEl!==list.firstChild)setTimeout(()=>focusEl.scrollIntoView({behavior:"smooth",block:"center"}),350);
}

/* ---- หน้าต่างดูข้อมูลศัตรูก่อนสู้ ---- */
function openPreview(kind,ref){
  SFX.click();
  let html="";
  if(kind==="stage"){
    const m=MONSTERS[ref],s=monsterStats(ref),st=save.stages[ref],wi=worldOfStage(ref);
    html=`<p class="pixel-label">WORLD ${wi+1} · STAGE ${ref}</p><div class="preview-sprite" style="background-image:url(${bgURL(wi)})">${spriteImg(m.sprite,128)}</div>
      <h2 class="preview-name">${esc(m.name)}</h2><p class="preview-sub">หัวข้อ: ${esc(TOPICS[ref])}</p>
      <div class="preview-stats"><span class="chip">❤️ ${s.hp}</span><span class="chip">⚔️ ${s.atk}</span><span class="chip">🪙 ~${Math.round(s.gold*(st?0.6:1.5))}</span><span class="chip">✨ ${Math.round(s.xp*(st?0.6:1))} EXP</span></div>
      ${st?`<p class="preview-sub" style="margin-top:8px">ดาวที่ได้: ${starsStr_(st.stars)} · ชนะแล้ว ${st.clears} ครั้ง (รอบนี้โจทย์ยากขึ้น)</p>`:""}`;
  }else{
    const w=WORLDS[ref],s=bossStats(ref),bs=save.bosses[w.id];
    const sprite=w.boss.final?`<img class="pixelated" src="${mascotSrc("furious")}" alt="">`:spriteImg(w.boss.sprite,150);
    html=`<p class="pixel-label">BOSS · ${esc(w.name)}</p><div class="preview-sprite" style="background-image:url(${bgURL(ref)})">${sprite}</div>
      <h2 class="preview-name">${esc(w.boss.name)}</h2><p class="preview-sub">${esc(w.boss.title)}</p>
      <p class="preview-sub">โจทย์ผสม: ${w.boss.final?"ทุกหัวข้อ A–Y":w.stages.map(id=>TOPICS[id]).join(", ")}</p>
      <div class="preview-stats"><span class="chip">❤️ ${s.hp}</span><span class="chip">⚔️ ${s.atk}</span><span class="chip">🪙 ${bs?Math.round(s.gold*0.5):s.gold}</span><span class="chip">${s.phases} ร่าง</span></div>
      ${bs?`<p class="preview-sub" style="margin-top:8px">ดาวที่ได้: ${starsStr_(bs.stars)}</p>`:""}`;
  }
  $("preview-body").innerHTML=html;
  $("preview-start").onclick=()=>{closePreview();startBattle(kind,ref)};
  $("preview-modal").classList.remove("hidden");
}
function closePreview(){$("preview-modal").classList.add("hidden")}

/* ====================================================================== */
/* Battle                                                                  */
/* ====================================================================== */
async function startBattle(kind,ref,opts){
  opts=opts||{};
  lastBattle={kind,ref};
  const lvl=save.level,maxHp=effMaxHp();
  let enemy,wi,phases=1;
  if(kind==="stage"){
    wi=worldOfStage(ref);const s=monsterStats(ref),m=MONSTERS[ref];
    enemy={name:m.name,sprite:m.sprite,img:null,hp:s.hp,maxHp:s.hp,atk:s.atk,gold:s.gold,xp:s.xp};
  }else{
    wi=ref;const w=WORLDS[wi],s=bossStats(wi);phases=s.phases;
    enemy={name:w.boss.name,sprite:w.boss.sprite,img:w.boss.final?mascotSrc(FINAL_BOSS_PHASES[0].mood):null,hp:s.hp,maxHp:s.hp,atk:s.atk,gold:s.gold,xp:s.xp,final:!!w.boss.final};
  }
  const prevClears=kind==="stage"?((save.stages[ref]||{}).clears||0):((save.bosses[WORLDS[wi].id]||{}).clears||0);
  B={kind,ref,wi,enemy,phases,phase:1,prevClears,origin:opts.origin||"map",startSub:opts.startSub,
     player:{hp:clamp(opts.hp==null?maxHp:opts.hp,1,maxHp),maxHp,atk:effAtk()},eyeUsed:false,
     turn:0,combo:0,maxCombo:0,correct:0,wrong:0,crits:0,wrongList:[],
     shield:skillLv("def")>=3,charging:false,q:null,answered:false,timer:null,timeLeft:0,timeMax:0,hintStep:0,fiftyUsed:false,over:false,lowHpWarned:false};
  document.documentElement.style.setProperty("--wc",WORLDS[wi].color);
  $("enemy-box").style.setProperty("--wc",WORLDS[wi].color);
  $("enemy-box").classList.remove("enraged");
  $("enemy-stage").style.backgroundImage=`url(${bgURL(wi)})`;
  $("battle-flee").textContent=B.origin==="explore"?"🏃 ถอย":"🏃 หนี";
  $("battle-label").textContent=B.origin==="explore"&&kind==="stage"?`🧭 ${TOPICS[ref]}`:kind==="stage"?`${WORLDS[wi].icon} STAGE ${ref} · ${TOPICS[ref]}`:`${WORLDS[wi].icon} BOSS · ${WORLDS[wi].name}`;
  $("player-avatar").innerHTML=heroImg(save.avatar,portraitInfo(save.avatar)?72:52);$("player-avatar").className="player-avatar";
  $("player-name").textContent=`${save.name} Lv.${lvl}`;
  $("enemy-sprite").className="enemy-sprite";
  renderEnemySprite_();
  updateBattleHud_();
  $("q-answers").innerHTML="";$("q-text").textContent="";$("q-feedback").classList.add("hidden");
  $("q-diagram").classList.add("hidden");$("q-hint").classList.add("hidden");$("charge-warning").classList.add("hidden");
  showScreen("battle");
  if(kind==="boss"){
    if(enemy.final)await playDialog([FINAL_BOSS_PHASES[0]]);
    else if(!prevClears)await playDialog(LINES.bossIntro);
  }
  nextTurn_();
}
function renderEnemySprite_(){
  const e=B.enemy,el=$("enemy-sprite");
  el.innerHTML=e.img?`<img class="pixelated" src="${e.img}" alt="${esc(e.name)}">`:spriteImg(e.sprite,B.kind==="boss"?168:136);
}
function updateBattleHud_(){
  const e=B.enemy,p=B.player;
  $("enemy-name").textContent=e.name;
  $("enemy-phase").textContent=B.phases>1?`ร่างที่ ${B.phase}/${B.phases}`:"";
  $("enemy-hp").style.width=clamp(e.hp/e.maxHp*100,0,100)+"%";
  $("enemy-hp-text").textContent=`${Math.max(0,e.hp)}/${e.maxHp}`;
  $("player-hp").style.width=clamp(p.hp/p.maxHp*100,0,100)+"%";
  $("player-hp-text").textContent=`${Math.max(0,p.hp)}/${p.maxHp}`;
  document.querySelector(".hp-bar.player").classList.toggle("low",p.hp/p.maxHp<=0.3);
  $("battle-combo").textContent=B.combo;
  $("shield-icon").classList.toggle("hidden",!B.shield);
  renderItemBar_();
}
function renderItemBar_(){
  const bar=$("item-bar");
  const canAct=B&&!B.answered&&!B.over;
  let html=ITEM_ORDER.map(k=>{
    const it=ITEMS[k],n=save.items[k]||0;
    let usable=canAct&&n>0;
    if(k==="potion"&&B&&B.player.hp>=B.player.maxHp)usable=false;
    if(k==="shield"&&B&&B.shield)usable=false;
    if(k==="fifty"&&B&&B.fiftyUsed)usable=false;
    return `<button type="button" class="item-btn" ${usable?"":"disabled"} onclick="useItem('${k}')" title="${esc(it.desc)}">${it.icon}<small>${esc(it.name.split(" ")[0])}</small><span class="cnt">${n}</span></button>`;
  }).join("");
  if(skillLv("wis")>=2)html+=`<button type="button" class="item-btn" ${canAct&&!B.eyeUsed&&!B.fiftyUsed?"":"disabled"} onclick="useEye()" title="ทักษะสายตาคม: ตัดตัวเลือกผิด 2 ข้อ (ฟรี 1 ครั้ง)">👁️<small>สายตาคม</small></button>`;
  const hints=hintsFor_();
  html+=`<button type="button" class="item-btn" ${canAct&&B.hintStep<hints.length?"":"disabled"} onclick="useHint()" title="คำใบ้จากครูแฟล็ก (ดาเมจข้อนี้ลดครึ่งหนึ่ง)">💡<small>คำใบ้</small></button>`;
  bar.innerHTML=html;
}
function hintsFor_(){const q=B&&B.q;return q?(HINTS[q.topicKey]||HINTS_FALLBACK_Z):[]}

// เลือกหัวข้อและความยาก (ขั้นย่อย 1–10) ของโจทย์ข้อถัดไป
function pickQuestion_(){
  const t=B.turn;let stageId,sub;
  if(B.kind==="stage"){
    stageId=B.ref;
    const start=B.startSub||Math.min(5,1+B.prevClears*2);           // ชนะด่านนี้แล้ว → รอบต่อไปเริ่มยากขึ้น
    sub=start+Math.floor(t*1.2);
  }else if(B.enemy.final){
    stageId=pickOne("ABCDEFGHIJKLMNOPQRSTUVWXY".split(""));
    sub=[5,7,9][B.phase-1]+rng(0,1);
  }else{
    stageId=pickOne(WORLDS[B.wi].stages);
    sub=(B.phase===1?4:7)+Math.floor(t/2);
  }
  return battleQuestion_(stageId,clamp(sub,1,10));
}
function questionTime_(q){
  let s=Math.round((STAGE_BASE_TIME[q.topicKey]||200)/10);   // 15–26 วินาที
  if(q.mode==="word")s+=12;
  s+=bonusTime();
  if(B.kind==="boss"&&B.phase>=2)s*=0.85;
  if(B.enemy.final&&B.phase>=3)s*=0.85;
  return Math.max(10,Math.round(s));
}
function nextTurn_(){
  if(B.over)return;
  const q=pickQuestion_();
  B.q=q;B.answered=false;B.hintStep=0;B.fiftyUsed=false;
  // บอสชาร์จพลังทุก ๆ 3 ข้อ (ข้อที่ 3, 6, 9, ...)
  B.charging=B.kind==="boss"&&B.turn%3===2;
  $("charge-warning").classList.toggle("hidden",!B.charging);
  if(B.charging)SFX.charge();
  $("q-topic").textContent=`ข้อที่ ${B.turn+1} · ${TOPICS[q.topicKey]||""}`;
  $("q-text").textContent=q.text;
  const svg=q.diagram?buildDiagramSVG_(q.diagram):"";
  $("q-diagram").innerHTML=svg;$("q-diagram").classList.toggle("hidden",!svg);
  $("q-hint").innerHTML="";$("q-hint").classList.add("hidden");
  $("q-feedback").classList.add("hidden");
  const box=$("q-answers");box.innerHTML="";
  q.options.forEach(opt=>{
    const b=document.createElement("button");b.type="button";b.className="answer";b.textContent=opt;b.dataset.value=opt;
    b.onclick=()=>answer_(opt,b);
    box.appendChild(b);
  });
  B.timeMax=questionTime_(q);B.timeLeft=B.timeMax;B.startedAt=performance.now();
  updateTimer_();
  clearInterval(B.timer);
  B.timer=setInterval(()=>{
    if(!B||B.answered||B.over)return;
    B.timeLeft=Math.max(0,B.timeMax-(performance.now()-B.startedAt)/1000);
    updateTimer_();
    if(B.timeLeft<=0)answer_(null,null);
  },100);
  updateBattleHud_();
}
function updateTimer_(){
  const pct=B.timeLeft/B.timeMax*100,crit=isCritWindow_();
  const f=$("q-time-fill");f.style.width=pct+"%";f.classList.toggle("crit-zone",crit);
  const t=$("q-timer");t.textContent=(crit?"⚡":"")+Math.ceil(B.timeLeft)+"s";
  t.classList.toggle("danger",B.timeLeft<=5);
  const sec=Math.ceil(B.timeLeft);
  if(sec<=3&&sec>0&&sec!==B.lastTick){B.lastTick=sec;SFX.tick()}
}
// ตอบเร็ว (ใช้เวลาไม่ถึง 35% ของเวลาทั้งหมด) = คริติคอล
function isCritWindow_(){return B.timeLeft>=B.timeMax*critThreshold()}

function checkAnswer_(value,correct){
  if(value===correct)return true;
  const parse=s=>{s=String(s).trim();if(s.includes("/")){const [n,d]=s.split("/").map(Number);return d?n/d:NaN}return Number(s)};
  const a=parse(value),b=parse(correct);
  return isFinite(a)&&isFinite(b)&&Math.abs(a-b)<1e-9;
}
async function answer_(value,btn){
  if(!B||B.answered||B.over)return;
  B.answered=true;clearInterval(B.timer);
  const q=B.q,ok=value!==null&&checkAnswer_(value,q.answer),crit=ok&&isCritWindow_();
  document.querySelectorAll("#q-answers .answer").forEach(b=>{
    b.disabled=true;
    if(checkAnswer_(b.dataset.value,q.answer))b.classList.add("correct");
  });
  if(btn&&!ok)btn.classList.add("wrong");
  renderItemBar_();
  B.turn++;
  if(ok){
    B.correct++;B.combo++;B.maxCombo=Math.max(B.maxCombo,B.combo);if(crit)B.crits++;
    let dmg=B.player.atk*(1+Math.min(B.combo-1,5)*comboStep())*(crit?1.5:1)*(0.9+Math.random()*0.2);
    if(B.hintStep>0&&skillLv("wis")<3)dmg*=0.5;
    if(skillLv("atk")>=4&&B.combo%5===0){dmg*=2;setTimeout(()=>floatText_("สมการพิฆาต!","crit"),200)}
    let interrupt=false;
    if(B.charging){dmg*=1.3;interrupt=true;B.charging=false;$("charge-warning").classList.add("hidden")}
    dmg=Math.max(1,Math.round(dmg));
    await playerAttack_(dmg,crit,interrupt);
    await sleep(450);
  }else{
    B.wrong++;B.combo=0;
    B.wrongList.push({text:q.text,answer:q.answer,explain:q.explain,picked:value});
    showFeedback_(value===null?"⏰ หมดเวลา!":"❌ ยังไม่ถูก",q);
    await enemyAttack_();
    if(!B.over)await waitContinue_();
  }
  if(!B.over)nextTurn_();
}
function showFeedback_(title,q){
  const fb=$("q-feedback");
  fb.className="q-feedback bad";
  fb.innerHTML=`<b>${esc(title)}</b> คำตอบที่ถูกคือ <b>${esc(q.answer)}</b>${q.explain?`<br><small>💡 ${esc(q.explain)}</small>`:""}`;
}
function waitContinue_(){
  return new Promise(res=>{
    const fb=$("q-feedback");
    const b=document.createElement("button");b.type="button";b.className="btn btn-lime btn-block";b.textContent="ข้อถัดไป ▶";
    b.onclick=()=>{SFX.click();res()};
    fb.appendChild(b);fb.classList.remove("hidden");
  });
}
function floatText_(text,cls){
  const d=document.createElement("div");d.className="dmg "+(cls||"");d.textContent=text;
  d.style.left=(40+Math.random()*20)+"%";
  $("fx-layer").appendChild(d);setTimeout(()=>d.remove(),1000);
}
// ท่าทางของผู้เล่นในฉากต่อสู้: attack (พุ่งโจมตี) · hurt (โดนตี) · win (กระโดดดีใจ) — ถ้ามีภาพท่า (poses) จะสลับภาพด้วย
function playerAct_(act){
  const el=$("player-avatar"),img=el&&el.querySelector("img");if(!img)return;
  const alt=poseInfo(heroKey(save.avatar),act);
  if(!img.dataset.base)img.dataset.base=img.src;
  clearTimeout(el._t);img.src=alt?alt.url:img.dataset.base;
  if(alt&&act!=="win")el._t=setTimeout(()=>{img.src=img.dataset.base},650);
  el.classList.remove("lunge","hurt","win");void el.offsetWidth;el.classList.add({attack:"lunge",hurt:"hurt",win:"win"}[act]);
}
async function playerAttack_(dmg,crit,interrupt){
  const e=B.enemy,sp=$("enemy-sprite");
  playerAct_("attack");await sleep(160);
  e.hp=Math.max(0,e.hp-dmg);
  (crit?SFX.crit:SFX.hit)();
  sp.classList.remove("hit");void sp.offsetWidth;sp.classList.add("hit");
  floatText_((crit?"CRIT! ":"")+"-"+dmg,crit?"crit":"");
  if(interrupt){setTimeout(()=>floatText_("ขัดจังหวะ!","miss"),250);toast("💥 ขัดจังหวะการชาร์จของบอสสำเร็จ!")}
  if(B.combo>=3&&B.combo%3===0)toast(`🔥 คอมโบ ${B.combo}! พลังโจมตีเพิ่มขึ้น`);
  updateBattleHud_();
  if(e.hp<=0){await sleep(350);return endBattle_(true)}
  await checkPhase_();
}
async function checkPhase_(){
  if(B.phases<=1)return;
  const e=B.enemy,threshold=1-B.phase/B.phases;     // 2 ร่าง: 50% · 3 ร่าง: 66%, 33%
  if(B.phase<B.phases&&e.hp<=e.maxHp*threshold){
    B.phase++;
    e.atk=Math.round(e.atk*1.25);
    $("enemy-box").classList.add("enraged");
    if(e.final){
      e.img=mascotSrc(FINAL_BOSS_PHASES[B.phase-1].mood);renderEnemySprite_();
      updateBattleHud_();
      await playDialog([FINAL_BOSS_PHASES[B.phase-1]]);
    }else{
      updateBattleHud_();
      toast(`😡 ${e.name} คลั่งแล้ว! โจมตีแรงขึ้นและโจทย์ยากขึ้น`);
      await sleep(600);
    }
  }
}
async function enemyAttack_(){
  const e=B.enemy,p=B.player,sp=$("enemy-sprite");
  await sleep(350);
  sp.classList.remove("attack");void sp.offsetWidth;sp.classList.add("attack");
  await sleep(250);
  if(B.shield){
    B.shield=false;SFX.block();floatText_("BLOCK!","miss");toast("🛡️ โล่ป้องกันการโจมตีไว้ได้!");
    updateBattleHud_();return;
  }
  let dmg=e.atk*(0.9+Math.random()*0.2)*damageTakenMul();
  if(B.charging){dmg*=2.2;toast(`💥 ${e.name} ปล่อยท่าไม้ตาย!`)}
  B.charging=false;$("charge-warning").classList.add("hidden");
  dmg=Math.max(1,Math.round(dmg));
  p.hp=Math.max(0,p.hp-dmg);
  SFX.hurt();
  const pb=document.querySelector(".player-box");pb.classList.remove("hurt");void pb.offsetWidth;pb.classList.add("hurt");playerAct_("hurt");
  toast(`💢 โดนโจมตี −${dmg} HP`);
  updateBattleHud_();
  if(p.hp<=0){await sleep(500);return endBattle_(false)}
  if(!B.lowHpWarned&&p.hp/p.maxHp<=0.3&&(save.items.potion||0)>0){B.lowHpWarned=true;await playDialog([LINES.lowHp])}
}
function useItem(k){
  if(!B||B.answered||B.over||!(save.items[k]>0))return;
  const p=B.player;
  if(k==="potion"){
    if(p.hp>=p.maxHp)return;
    const heal=Math.round(p.maxHp*0.4);p.hp=Math.min(p.maxHp,p.hp+heal);
    SFX.heal();floatText_("+"+heal+" HP","heal");toast(`🧪 ฟื้นพลัง +${heal} HP`);
  }else if(k==="shield"){
    if(B.shield)return;B.shield=true;SFX.item();toast("🛡️ ตั้งโล่แล้ว! กันการโจมตีครั้งถัดไป");
  }else if(k==="fifty"){
    if(B.fiftyUsed)return;B.fiftyUsed=true;
    const wrong=[...document.querySelectorAll("#q-answers .answer")].filter(b=>!checkAnswer_(b.dataset.value,B.q.answer));
    wrong.sort(()=>Math.random()-.5).slice(0,2).forEach(b=>{b.classList.add("removed");b.disabled=true});
    SFX.item();
  }else if(k==="time"){
    B.timeMax+=10;SFX.item();toast("⏳ เพิ่มเวลา +10 วินาที");
  }
  save.items[k]--;persist();
  updateBattleHud_();
}
function useEye(){
  if(!B||B.answered||B.over||B.eyeUsed||B.fiftyUsed)return;
  B.eyeUsed=true;B.fiftyUsed=true;
  const wrong=[...document.querySelectorAll("#q-answers .answer")].filter(b=>!checkAnswer_(b.dataset.value,B.q.answer));
  wrong.sort(()=>Math.random()-.5).slice(0,2).forEach(b=>{b.classList.add("removed");b.disabled=true});
  SFX.item();toast("👁️ สายตาคม! ตัดตัวเลือกผิดออก 2 ข้อ");renderItemBar_();
}
function useHint(){
  if(!B||B.answered||B.over)return;
  const hints=hintsFor_();if(B.hintStep>=hints.length)return;
  B.hintStep++;SFX.item();
  const shown=hints.slice(0,B.hintStep).map((h,i)=>`${i+1}. ${h}`).join("\n");
  mascotSay("q-hint",{mood:B.hintStep===1?"explain":"thinking",text:shown});
  $("q-hint").querySelector("p").style.whiteSpace="pre-line";
  $("q-hint").classList.remove("hidden");
  if(B.hintStep===1)toast(skillLv("wis")>=3?"💡 ครูช่วยสอน: ใช้คำใบ้แล้วยังตีแรงเท่าเดิม":"💡 ใช้คำใบ้แล้ว — ข้อนี้ตีเบาลงครึ่งหนึ่ง");
  renderItemBar_();
}
function fleeBattle(){
  if(!B||B.over)return B&&B.origin==="explore"?resumeExplore():goMap();
  if(!confirm("หนีออกจากการต่อสู้? (ไม่ได้รางวัล แต่ไม่เสียอะไร)"))return;
  clearInterval(B.timer);B.over=true;
  if(B.origin==="explore"){exploreFled(B.player.hp);resumeExplore()}else goMap();
}

/* ====================================================================== */
/* Result                                                                  */
/* ====================================================================== */
function gainXp_(amount){
  const ups=[];save.xp+=amount;
  while(save.level<PLAYER_MAX_LEVEL&&save.xp>=xpToNext(save.level)){save.xp-=xpToNext(save.level);save.level++;ups.push(save.level)}
  if(save.level>=PLAYER_MAX_LEVEL)save.xp=0;
  return ups;
}
async function endBattle_(won){
  if(B.over)return;
  B.over=true;clearInterval(B.timer);if(won)playerAct_("win");
  const e=B.enemy,p=B.player,first=!B.prevClears;
  const total=B.correct+B.wrong,acc=total?Math.round(B.correct/total*100):0;
  const hpPct=p.hp/p.maxHp,stars=won?(hpPct>=0.7?3:hpPct>=0.35?2:1):0;
  save.stats.battles++;save.stats.correct+=B.correct;save.stats.wrong+=B.wrong;save.stats.crits+=B.crits;
  save.stats.bestCombo=Math.max(save.stats.bestCombo,B.maxCombo);
  let gold=0,xp=0,worldCleared=false,finalCleared=false;
  const field=B.origin==="explore"&&B.kind==="stage";
  if(won&&field){
    save.stats.wins++;$("enemy-sprite").classList.add("dead");SFX.win();
    gold=Math.round(e.gold*0.5)+stars*2;xp=Math.round(e.xp*0.8);
  }else if(won){
    save.stats.wins++;
    $("enemy-sprite").classList.add("dead");
    SFX.win();
    if(B.kind==="stage"){
      gold=Math.round(e.gold*(first?1.5:0.6))+stars*5;xp=Math.round(e.xp*(first?1:0.6));
      const st=save.stages[B.ref]||{stars:0,clears:0};st.stars=Math.max(st.stars,stars);st.clears++;save.stages[B.ref]=st;
    }else{
      const w=WORLDS[B.wi];
      gold=first?e.gold:Math.round(e.gold*0.5);xp=first?e.xp:Math.round(e.xp*0.5);
      const bs=save.bosses[w.id]||{stars:0,clears:0};bs.stars=Math.max(bs.stars,stars);bs.clears++;save.bosses[w.id]=bs;
      save.stats.bossKills++;
      worldCleared=first;
      if(e.final&&!save.finalCleared){save.finalCleared=true;finalCleared=true}
    }
  }else if(!won){
    save.stats.losses++;SFX.lose();
    xp=Math.round(e.xp*0.25);   // แพ้ก็ยังได้ EXP เล็กน้อยจากการฝึก
  }
  gold=Math.round(gold*rewardMul());xp=Math.round(xp*rewardMul());
  save.gold+=gold;
  const ups=gainXp_(xp);
  if(B.origin==="explore")exploreBattleEnded(won,p.hp);
  persist();
  await sleep(won?700:300);

  $("result-kicker").textContent=B.kind==="boss"?"BOSS BATTLE":field?`🧭 ${ZONE_NAMES[B.ref]||"ผจญภัย"}`:`STAGE ${B.ref}`;
  $("result-title").textContent=won?(B.kind==="boss"?`ปราบ ${e.name} สำเร็จ!`:"ชนะแล้ว! 🎉"):"พ่ายแพ้... 😵";
  $("result-stars").innerHTML=won?[1,2,3].map(i=>`<span class="${i<=stars?"":"off"}" style="animation-delay:${i*0.15}s">⭐</span>`).join(""):"";
  $("result-correct").textContent=`${B.correct}/${total}`;
  $("result-acc").textContent=acc+"%";
  $("result-combo").textContent=B.maxCombo;
  let rw="";
  if(gold)rw+=`<span class="reward">🪙 +${gold}</span>`;
  if(xp)rw+=`<span class="reward">✨ +${xp} EXP</span>`;
  ups.forEach(l=>rw+=`<span class="reward lvl">⬆️ Lv.${l}</span>`);
  $("result-rewards").innerHTML=rw;
  const line=won?(stars===3?pickOne(LINES.perfect):pickOne(LINES.win)):pickOne(LINES.lose);
  mascotSay("result-mascot",line);
  $("result-review").classList.toggle("hidden",!B.wrongList.length);
  $("result-review-list").innerHTML=B.wrongList.map((w,i)=>`<div class="rv"><div>${i+1}. ${esc(w.text)}</div>
    <div class="a">✓ ${esc(w.answer)}${w.picked!==null?` <span style="color:#fca5a5;font-weight:500">(ตอบ ${esc(w.picked)})</span>`:" <span style=\"color:#fca5a5;font-weight:500\">(หมดเวลา)</span>"}</div>${w.explain?`<div class="e">💡 ${esc(w.explain)}</div>`:""}</div>`).join("");
  const nxt=nextTarget_();
  const ex=B.origin==="explore";
  $("result-next").classList.toggle("hidden",ex||!won||!nxt);
  $("result-retry").classList.toggle("hidden",ex);$("result-map").classList.toggle("hidden",ex);
  $("result-explore").classList.toggle("hidden",!ex);
  $("result-explore").textContent=ex&&!won?"🏠 กลับหมู่บ้าน":"🧭 ผจญภัยต่อ";
  showScreen("result");
  if(ups.length){SFX.levelUp();await sleep(400);await playDialog([{...LINES.levelUp,text:`${LINES.levelUp.text} (Lv.${save.level} · HP ${effMaxHp()} · ATK ${effAtk()}) และได้แต้มทักษะ +${ups.length} — ไปอัปได้ที่ "🌳 ทักษะ"`}])}
  if(finalCleared)await playDialog(FINAL_VICTORY);
  else if(worldCleared)await playDialog([LINES.worldClear]);
}
// ด่านถัดไปที่ยังไม่เคลียร์ (หรือบอสที่ปลดล็อกแล้ว)
function nextTarget_(){
  for(let wi=0;wi<WORLDS.length;wi++){
    if(!worldUnlocked_(save,wi))break;
    for(const id of WORLDS[wi].stages)if(!stageCleared_(save,id))return {kind:"stage",ref:id};
    if(!bossCleared_(save,wi))return {kind:"boss",ref:wi};
  }
  return null;
}
function resultNext(){const n=nextTarget_();if(n)openPreview(n.kind,n.ref);else goMap()}
function retryBattle(){if(lastBattle)startBattle(lastBattle.kind,lastBattle.ref)}

/* ====================================================================== */
/* Shop & hero                                                             */
/* ====================================================================== */
const ITEM_MAX=9;
function openShop(from){
  SFX.click();navBack=from||"map";
  mascotSay("shop-mascot",LINES.shopHello);
  renderShop_();showScreen("shop");
}
function renderShop_(){
  $("shop-gold").textContent=save.gold;
  $("shop-list").innerHTML=ITEM_ORDER.map(k=>{
    const it=ITEMS[k],n=save.items[k]||0,can=save.gold>=it.price&&n<ITEM_MAX;
    return `<div class="panel shop-item"><span class="ic">${it.icon}</span><div class="info"><b>${esc(it.name)}</b><small>${esc(it.desc)}</small><div class="own">มีอยู่ ${n}/${ITEM_MAX}</div></div>
      <button type="button" class="btn btn-gold btn-small" ${can?"":"disabled"} onclick="buyItem('${k}')">🪙 ${it.price}</button></div>`;
  }).join("");
}
function buyItem(k){
  const it=ITEMS[k];
  if(save.gold<it.price||(save.items[k]||0)>=ITEM_MAX)return;
  save.gold-=it.price;save.items[k]=(save.items[k]||0)+1;persist();
  SFX.coin();toast(`ซื้อ ${it.icon} ${it.name} แล้ว!`);
  renderShop_();
}
function openHero(from){
  SFX.click();navBack=from||"map";
  const s=save.stats,total=s.correct+s.wrong;
  $("hero-avatar").innerHTML=heroImg(save.avatar,72);
  $("hero-name").textContent=save.name;
  $("hero-title").textContent=`Lv.${save.level} · ${heroTitle(save.level)}`;
  $("hero-account").textContent=save.studentId?`บัญชีนักเรียน: ${save.studentId}`:"ผู้เยี่ยมชม (เซฟอยู่ในเครื่องนี้เท่านั้น)";
  const cell=(l,v)=>`<div><small>${l}</small><b>${v}</b></div>`;
  $("hero-stats").innerHTML=[
    cell("❤️ HP สูงสุด",effMaxHp()),cell("⚔️ พลังโจมตี",effAtk()),
    cell("✨ EXP",save.level>=PLAYER_MAX_LEVEL?"MAX":`${save.xp}/${xpToNext(save.level)}`),cell("⭐ ดาวรวม",`${totalStars_(save)}/${MAX_STARS}`),
    cell("⚔️ ชนะ / สู้ทั้งหมด",`${s.wins}/${s.battles}`),cell("🎯 ความแม่นยำ",total?Math.round(s.correct/total*100)+"%":"—"),
    cell("🔥 คอมโบสูงสุด",s.bestCombo),cell("💥 คริติคอล",s.crits),
    cell("👑 ปราบบอส",s.bossKills),cell("🗺️ ดินแดนที่กู้คืน",`${WORLDS.filter((w,i)=>bossCleared_(save,i)).length}/${WORLDS.length}`)
  ].join("");
  renderAvatarGrid_("hero-avatars",save.avatar,function pick(a){save.avatar=a;persist();$("hero-avatar").innerHTML=heroImg(a,72);renderAvatarGrid_("hero-avatars",a,pick)});
  showScreen("hero");
}
function resetProgress(){
  if(!confirm(`ลบเซฟของ "${save.name}" ทั้งหมด? (เลเวล ดาว เหรียญ ไอเทม จะหายถาวร)`))return;
  deleteSave_(save.playerId);save=null;toast("ลบเซฟแล้ว");renderTitle();
}

/* ====================================================================== */
/* Boot                                                                    */
/* ====================================================================== */
updateSfxBtn_();
bindExploreControls_();
renderTitle();
loadCustomAssets().then(()=>{if(CUSTOM.loaded&&!save)renderTitle()});
