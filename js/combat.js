/* Math Quest V2 — ต่อสู้บนแผนที่แบบเรียลไทม์ (ใช้กฎจาก js/combat-core.js)
   - มอนสเตอร์เดินอิสระในทุ่งของตัวเอง: เดินเล่น → เห็นผู้เล่นแล้ววิ่งไล่ → ไกลเกิน/ออกนอกทุ่ง → เดินกลับบ้าน
   - ชนผู้เล่น = ผู้เล่นเสีย HP + กระเด็น + อมตะ 1 วิ · HP หมด = กลับหมู่บ้าน HP เต็ม
   - ชนบอส = เข้าฉากต่อสู้บอสแบบเดิม
   ทุกอย่างหยุดนิ่งเมื่อ X.busy (มีหน้าต่างโจทย์/บทสนทนาเปิดอยู่) */

const MON_SPEED={wander:1.6,chase:3.6,return:2.4};   // ช่อง/วินาที
const PLAYER_INVULN_MS=1000,MON_PAUSE_MS=600;

function initMon_(m,index){
  if(m.fx==null)m.fx=m.x;if(m.fy==null)m.fy=m.y;
  m.t=1;m.index=index;m.hx=m.x;m.hy=m.y;
  m.tier=tierFor_(m.zone?m.zone.id:"A",index,!!m.night);
  m.armor=m.armorMax=armorFor_(m.tier,index);
  m.hp=m.maxHp=monHp_(m.tier,effAtk());
  m.state="wander";m.tx=null;m.ty=null;m.pauseUntil=0;m.flashUntil=0;m.anim="idle";m.animAt=0;m.dead=false;m.kx=0;m.ky=0;
  m.next=performance.now()+rng(300,1500);
  return m;
}
const monBlocker_=m=>(x,y)=>blocked_(x,y)||!!npcAt_(x,y)||!inZone_(m.zone,x,y);

function updateCombat_(now,dt){
  if(!X)return;
  updateNightMons_(now);
  X.mons.forEach((m,i)=>{if(m.tier==null)initMon_(m,i)});
  updateSkillButton_(now);updatePowerChip_(now);
  if(X.defShield===undefined)X.defShield=!!(X.m.zones&&skillLv("def")>=3);   // ทักษะป้องกันขั้น 3: กันการชนครั้งแรกหลังเข้าทุ่ง
  if(X.busy)return;
  const sec=Math.min(dt||16,50)/1000,[ppx,ppy]=footPx_(X.p.fx,X.p.fy);
  X.mons.forEach(m=>{if(!m.dead)updateMon_(m,now,sec,ppx,ppy)});
  if(X.attackHeld)swing_(now);
  updateCoins_(now,sec);updateRespawns_(now);updateAmbush_(now);
  combatContact_(now);
}
function updateMon_(m,now,sec,ppx,ppy){
  const blk=monBlocker_(m);
  if(m.kx||m.ky){   // กระเด็นจากการโดนตี/ชน
    [m.fx,m.fy]=moveBox_(m.fx,m.fy,m.kx*sec,m.ky*sec,MON_W,MON_H,blk);
    const decay=Math.pow(0.004,sec);m.kx*=decay;m.ky*=decay;if(Math.abs(m.kx)+Math.abs(m.ky)<0.05)m.kx=m.ky=0;
  }
  const [mx,my]=footPx_(m.fx,m.fy),dist=Math.hypot(ppx-mx,ppy-my)/TS;
  m.state=monStateNext_(m.state,dist,inZone_(m.zone,X.p.x,X.p.y));
  let gx=null,gy=null;
  if(m.state==="chase"){gx=ppx;gy=ppy}
  else if(m.state==="return"){[gx,gy]=footPx_(m.hx,m.hy);if(Math.hypot(gx-mx,gy-my)<6)m.state="wander"}
  else{
    if(m.tx==null||now>m.next){m.next=now+rng(1500,4000);pickWanderTarget_(m)}
    if(m.tx!=null){[gx,gy]=footPx_(m.tx,m.ty);if(Math.hypot(gx-mx,gy-my)<3){m.tx=null;gx=null}}
  }
  let moving=false;
  if(gx!=null&&now>=m.pauseUntil){
    const vx=gx-mx,vy=gy-my,len=Math.hypot(vx,vy);
    if(len>1){
      const d=MON_SPEED[m.state]*sec,ox=m.fx,oy=m.fy;
      [m.fx,m.fy]=moveBox_(m.fx,m.fy,vx/len*d,vy/len*d,MON_W,MON_H,blk);
      moving=Math.abs(m.fx-ox)+Math.abs(m.fy-oy)>1e-4;
      if(!moving&&m.state==="wander")m.tx=null;      // ติดขอบ → หาจุดใหม่
      if(Math.abs(vx)>2)m.flip=vx<0;
    }
  }
  if(!m.animUntil||now>m.animUntil)m.anim=moving?"walk":"idle";
  [m.x,m.y]=footTile_(m.fx,m.fy);
}
function pickWanderTarget_(m){
  const z=m.zone;
  for(let k=0;k<8;k++){
    const tx=clamp(m.hx+rng(-4,4),z.x0,z.x1),ty=clamp(m.hy+rng(-3,3),z.y0,z.y1);
    if(!blocked_(tx,ty)&&!npcAt_(tx,ty)){m.tx=tx;m.ty=ty;return}
  }
  m.tx=null;
}

/* ---- ชนผู้เล่น / ชนบอส ---- */
function combatContact_(now){
  if(X.busy)return;
  const [px,py]=footPx_(X.p.fx,X.p.fy);
  const b=X.m.boss;
  if(b&&!save.explore.bossDone){const [bx,by]=footPx_(b.x,b.y);if(boxesOverlap_(px,py,FOOT_W,FOOT_H,bx,by,16,12)){startBossBattle_();return}}
  if(!canBeHit_(now,X.invulnUntil))return;
  const m=X.mons.find(m=>{if(m.dead)return false;const [mx,my]=footPx_(m.fx,m.fy);return boxesOverlap_(px,py,FOOT_W,FOOT_H,mx,my,MON_W,MON_H)});
  if(!m)return;
  const atk=monsterStats(m.stage).atk*(m.night?1.2:1);
  m.pauseUntil=now+MON_PAUSE_MS;
  if(X.defShield){X.defShield=false;X.invulnUntil=now+PLAYER_INVULN_MS;const [fx,fy]=footPx_(X.p.fx,X.p.fy);canvasFx_("shield",fx,fy-10,0.6);floatText2_("BLOCK!",fx,fy-32,"#7dd3fc",now);SFX.block&&SFX.block();return}m.animUntil=now+400;m.anim="attack01";m.animAt=now;
  hurtPlayer_(contactDmg_(atk,damageTakenMul()),m.fx,m.fy,now);
}
function hurtPlayer_(amount,fromFx,fromFy,now){
  const e=save.explore,p=X.p;
  e.hp=Math.max(0,e.hp-amount);X.invulnUntil=now+PLAYER_INVULN_MS;X.hurtAt=now;
  const dx=p.fx-fromFx,dy=p.fy-fromFy,len=Math.hypot(dx,dy)||1;
  [p.fx,p.fy]=moveBox_(p.fx,p.fy,dx/len*0.6,dy/len*0.6,FOOT_W,FOOT_H,playerBlocked_);
  [p.x,p.y]=footTile_(p.fx,p.fy);
  SFX.hurt();
  const [fx,fy]=footPx_(p.fx,p.fy);floatText2_("-"+amount,fx,fy-30,"#ff6b6b",now);
  updateExHud_();persist();
  if(e.hp<=0)playerDownOnMap_();
}
// HP หมดบนแผนที่ → กลับหมู่บ้าน HP เต็ม (เหมือนแพ้ในฉากต่อสู้แบบเดิม)
function playerDownOnMap_(){
  if(!X)return;
  X.busy=true;
  const e=save.explore,sp=EXPLORE_MAPS.village.spawn,wrap=$("ex-wrap");
  e.hp=effMaxHp();persist();wrap.classList.add("fade");
  setTimeout(async()=>{
    try{loadMap_("village",sp.x,sp.y,"up");resizeExplore_();updateExHud_();X.invulnUntil=performance.now()+1500;checkZone_();playBgm(screenTrack_("explore"))}
    catch(err){reportError_(err,"down")}
    finally{wrap.classList.remove("fade")}
    await exSay_([{mood:"sad",text:"ไม่เป็นไรนะ ครูพาเธอกลับมาพักที่หมู่บ้านแล้ว HP เต็มแล้ว ตัวที่มีเกราะต้องใช้สกิลคิดเลขทำลายก่อนนะ แล้วค่อยไปสู้ใหม่"}]);
  },350);
}

/* ---- ตัวเลขลอยบนแผนที่ (พิกัดโลก) ---- */
function floatText2_(text,wx,wy,color,now){(X.floats=X.floats||[]).push({text,wx,wy,color,t0:now})}
function drawCombatOverlay_(c,camX,camY,now){
  drawCombatMarks_(c,camX,camY,now);drawCanvasFx_(c,camX,camY,now);
  if(!X.floats||!X.floats.length)return;
  c.save();c.font="bold 8px sans-serif";c.textAlign="center";c.textBaseline="middle";
  X.floats=X.floats.filter(f=>{
    const t=(now-f.t0)/800;if(t>=1)return false;
    const x=Math.round(f.wx-camX),y=Math.round(f.wy-camY-t*12);
    c.globalAlpha=1-t*t;c.fillStyle="#181425";c.fillText(f.text,x+1,y+1);c.fillStyle=f.color;c.fillText(f.text,x,y);
    return true;
  });
  c.restore();
}

// ทดสอบใน console: สร้างมอนชั้นที่กำหนดข้างหน้าผู้เล่น (ในทุ่งที่ยืนอยู่)
function spawnTestMon_(tier){
  const z=(X.m.zones||[]).find(z=>inZone_(z,X.p.x,X.p.y));if(!z)return "ต้องยืนอยู่ในทุ่ง";
  const [vx,vy]=DIRS[X.p.dir]||[1,0],x=clamp(X.p.x+vx*3,z.x0,z.x1),y=clamp(X.p.y+vy*3,z.y0,z.y1);
  const m=initMon_({id:"test"+Date.now(),stage:z.stage,x,y,zone:z,tiny:tier%2?"demon":"blood",hue:(ZONE_MON[z.stage]||{}).hue||0},0);
  m.tier=tier;m.armor=m.armorMax=armorFor_(tier,0);m.hp=m.maxHp=monHp_(tier,effAtk());
  X.mons.push(m);return m;
}

/* ====================================================================== */
/* ฟันดาบ · เกราะ · ตาย · เหรียญ · เกิดใหม่                                    */
/* ====================================================================== */
const COIN_PULL_TILES=2.5;   // เหรียญดูดเข้าหาผู้เล่นในระยะนี้ (ช่อง)
const SWING_MS=330,SWING_REPEAT_MS=380,SWING_RADIUS=22,RESPAWN_MS=25000;
// ปุ่ม A / Space / J: มีคน/ของให้คุยตรงหน้า → คุย · ไม่มี → ฟัน
function actionButton_(){if(!X||X.busy)return;if(interact_())return;swing_(performance.now())}
function swing_(now){
  if(!X||X.busy)return;
  const p=X.p;if(now<(p.nextSwing||0))return;
  p.swingUntil=now+SWING_MS;p.swingAt=now;p.nextSwing=now+SWING_REPEAT_MS;
  // ฟันซ้าย/ขวาตามที่หัน · ถ้ากดขึ้น/ลงอยู่ ฟันขึ้น/ลง
  const mv=exInput_(),dir=Math.abs(mv.y)>Math.abs(mv.x)&&mv.y?(mv.y<0?"up":"down"):(p._face||(p.dir==="left"?"left":"right"));
  p.swingDir=dir;
  const [ox,oy]=footPx_(p.fx,p.fy),cy=oy-6;
  const dmg=swordDmg_(effAtk())*(X.powerUntil>now?2:1);
  X.mons.forEach(m=>{if(m.dead)return;const [mx,my]=footPx_(m.fx,m.fy);if(inArc_(ox,cy,dir,mx,my-6,SWING_RADIUS))hitMon_(m,dmg,p.fx,p.fy,now,false)});
}
// คืน true ถ้ามอนตาย
function hitMon_(m,dmg,fromFx,fromFy,now,breaksArmor){
  if(m.dead)return false;
  const [mx,my]=footPx_(m.fx,m.fy),sc=m.tier===3?1.3:1;
  if(m.armor>0&&!breaksArmor){   // มีเกราะ → ฟันไม่เข้า
    floatText2_("ฟันไม่เข้า!",mx,my-28*sc,"#cbd5e1",now);canvasFx_("hurt",mx,my-10,0.5);SFX.block&&SFX.block();
    return false;
  }
  if(breaksArmor&&m.armor>0){m.armor--;floatText2_(m.armor?"เกราะแตก! (เหลือ 1)":"เกราะแตก!",mx,my-36*sc,"#7dd3fc",now)}
  m.hp=Math.max(0,m.hp-dmg);m.flashUntil=now+140;m.anim="hurt";m.animAt=now;m.animUntil=now+400;
  const dx=m.fx-fromFx,dy=m.fy-fromFy,len=Math.hypot(dx,dy)||1;m.kx=dx/len*7;m.ky=dy/len*7;
  m.pauseUntil=Math.max(m.pauseUntil,now+300);if(m.state==="wander")m.state="chase";
  floatText2_("-"+dmg,mx,my-28*sc,"#fde047",now);canvasFx_("hit",mx,my-10,0.35);SFX.hit&&SFX.hit();
  if(m.hp<=0){killMon_(m,now);return true}
  return false;
}
function killMon_(m,now){
  m.dead=true;m.anim="death";m.animAt=now;m.animUntil=now+500;m.kx=m.ky=0;
  const [mx,my]=footPx_(m.fx,m.fy),e=save.explore,z=m.stage,wasReady=gateReady_(z,e.kills[z],(e.armorKills||{})[z],QUEST_KILLS);
  canvasFx_("smoke",mx,my-8,0.45);
  setTimeout(()=>{if(X)X.mons=X.mons.filter(q=>q!==m)},500);
  const s=monsterStats(z),r=fieldReward_(s.gold,s.xp,!!m.night,rewardMul());
  coinSplit_(r.gold).forEach(v=>{const a=Math.random()*Math.PI*2,sp=18+Math.random()*16;
    (X.coins=X.coins||[]).push({wx:mx,wy:my-6,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-50,gold:v,t0:now})});
  // นับการปราบ (ภารกิจประตูทุ่ง · ภารกิจรายวัน · สมุดมอนสเตอร์ · สถิติ)
  e.kills[z]=(e.kills[z]||0)+1;
  if(m.armorMax>0){e.armorKills=e.armorKills||{};e.armorKills[z]=(e.armorKills[z]||0)+1}
  dailyAdd_("kill");
  const name=m.night?NIGHT_MON[m.night].name:zoneMonName_(z,m.tiny);
  if(typeof recordFieldKill_==="function")recordFieldKill_(name,m.night||m.tiny,m.hue||0,z);
  save.stats.battles++;save.stats.wins++;
  if(m.night)NIGHT_STATE.gone[m.night]=true;
  else (X.respawns=X.respawns||[]).push({at:now+RESPAWN_MS,proto:{id:m.id,stage:z,zone:m.zone,tiny:m.tiny,hue:m.hue},index:m.index});
  const ups=gainXp_(r.xp);
  if(ups.length){SFX.levelUp();spriteFx_("levelup",{scale:2.2,fps:20});toast(`⬆️ เลเวลอัป! Lv.${save.level} · ไปอัปทักษะได้ที่เมนู ☰`)}
  persist();updateExHud_();
  killProgress_(z,wasReady);
}
// ข้อความความคืบหน้าภารกิจทุ่ง (ไม่หยุดเกม ยกเว้นตอนครบ)
function killProgress_(z,wasReady){
  const e=save.explore,k=e.kills[z],a=(e.armorKills||{})[z]||0,ready=gateReady_(z,k,a,QUEST_KILLS);
  if(ready&&!wasReady){exSay_([{mood:"happy",text:`ภารกิจ${ZONE_NAMES[z]}ครบแล้ว! ตอนนี้ไปไขปริศนาเพื่อเปิดทางไป${nextZoneName_(z)}ได้เลย`}]);return}
  if(ready)return;
  toast(`${ZONE_NAMES[z]}: ปราบแล้ว ${Math.min(k,QUEST_KILLS)}/${QUEST_KILLS}`+(gateNeedsArmor_(z)?` · มอนเกราะ ${Math.min(a,1)}/1`:""));
}
function updateRespawns_(now){
  if(!X.respawns||!X.respawns.length)return;
  X.respawns=X.respawns.filter(r=>{
    if(now<r.at)return true;
    const z=r.proto.zone;
    for(let k=0;k<20;k++){
      const x=rng(z.x0,z.x1),y=rng(z.y0,z.y1);
      if(blocked_(x,y)||npcAt_(x,y)||Math.abs(x-X.p.x)+Math.abs(y-X.p.y)<5)continue;
      const m=initMon_({...r.proto,x,y,fx:x,fy:y},r.index);X.mons.push(m);dust_(x*TS+8,y*TS+TS,4);return false;
    }
    r.at=now+2000;return true;   // ยังหาที่ไม่ได้ → ลองใหม่
  });
}
function updateCoins_(now,sec){
  if(!X.coins||!X.coins.length)return;
  const [px,py]=footPx_(X.p.fx,X.p.fy);
  X.coins=X.coins.filter(c=>{
    const age=now-c.t0;if(age>20000)return false;
    const dx=px-c.wx,dy=(py-6)-c.wy,d=Math.hypot(dx,dy);
    if(age>400&&d<TS*COIN_PULL_TILES){if(d<5){save.gold+=c.gold;SFX.coin&&SFX.coin();updateExHud_();persist();return false}c.vx=dx/d*160;c.vy=dy/d*160}
    else{c.vx*=Math.pow(0.05,sec);c.vy=c.vy*Math.pow(0.05,sec)+(age<400?180*sec:0)}
    c.wx+=c.vx*sec;c.wy+=c.vy*sec;return true;
  });
}

/* ---- เอฟเฟกต์ภาพเคลื่อนไหวในพิกัดโลก (ตามกล้อง) จากแถบใน assets/fx ---- */
const FX_IMG={};
function fxImg_(name){if(!FX_IMG[name]){const i=new Image();i.src=`assets/fx/${name}.png?v=${FX_VER}`;FX_IMG[name]=i}return FX_IMG[name]}
function canvasFx_(name,wx,wy,scale,fps){if(!X||!FX_SHEETS[name])return;fxImg_(name);(X.fxs=X.fxs||[]).push({name,wx,wy,scale:scale||1,fps:fps||20,t0:performance.now()})}
function drawCanvasFx_(c,camX,camY,now){
  if(!X.fxs||!X.fxs.length)return;
  X.fxs=X.fxs.filter(f=>{
    const [w,h,n]=FX_SHEETS[f.name],fr=Math.floor(Math.max(0,now-f.t0)*f.fps/1000);if(fr>=n)return false;
    const img=fxImg_(f.name);if(!img.complete||!img.naturalWidth)return true;
    const W=w*f.scale,H=h*f.scale;c.drawImage(img,fr*w,0,w,h,Math.round(f.wx-W/2-camX),Math.round(f.wy-H/2-camY),W,H);
    return true;
  });
}
// แถบเกราะ/HP เหนือหัวมอน + วงฟัน + เหรียญ
function drawCombatMarks_(c,camX,camY,now){
  X.mons.forEach(m=>{
    if(m.dead||(m.armor<=0&&m.hp>=m.maxHp))return;
    const [mx,my]=footPx_(m.fx,m.fy),sc=m.tier===3?1.3:1,x=Math.round(mx-8-camX),y=Math.round(my-26*sc-camY);
    c.fillStyle="#181425";c.fillRect(x-1,y-1,18,4);c.fillStyle="#3a0f17";c.fillRect(x,y,16,2);c.fillStyle="#e43b44";c.fillRect(x,y,Math.round(16*m.hp/m.maxHp),2);
    for(let i=0;i<m.armor;i++){const ax=x+17+i*6,ay=y-3;   // โล่เล็ก ๆ = เกราะ 1 ชั้น
      c.fillStyle="#181425";c.fillRect(ax-1,ay-1,7,8);c.fillStyle="#8b9bb4";c.fillRect(ax,ay,5,5);c.fillRect(ax+1,ay+5,3,1);c.fillStyle="#c0cbdc";c.fillRect(ax+1,ay+1,1,3)}
  });
  const p=X.p;
  if(p.swingAt&&now-p.swingAt<120&&now>=p.swingAt){   // วงฟันสีขาวให้เห็นว่าฟันไปทางไหน
    const [ox,oy]=footPx_(p.fx,p.fy),a={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2}[p.swingDir]||0,k=(now-p.swingAt)/120;
    c.save();c.globalAlpha=0.85*(1-k);c.strokeStyle="#ffffff";c.lineWidth=3;c.beginPath();c.arc(ox-camX,oy-6-camY,SWING_RADIUS-4,a-1.1,a+1.1);c.stroke();c.restore();
  }
  (X.coins||[]).forEach(cn=>{const x=Math.round(cn.wx-camX),y=Math.round(cn.wy-camY);
    c.fillStyle="#7a4a10";c.fillRect(x-2,y-2,5,5);c.fillStyle="#feae34";c.fillRect(x-2,y-1,5,3);c.fillRect(x-1,y-2,3,5);c.fillStyle="#fee761";c.fillRect(x-1,y-1,1,2)});
}

/* ====================================================================== */
/* สกิลคิดเลข ✨: ตอบถูก = ท่าไม้ตาย 5 เท่า + ทำลายเกราะ 1 ชั้น (วงรอบตัว 3 ช่อง)   */
/* ====================================================================== */
const SKILL_RANGE=4,SKILL_BLAST=3,SKILL_CD_OK=2000,SKILL_CD_BAD=5000;
function nearestMon_(rangeTiles){
  const [px,py]=footPx_(X.p.fx,X.p.fy);let best=null,bd=rangeTiles*TS;
  X.mons.forEach(m=>{if(m.dead)return;const [mx,my]=footPx_(m.fx,m.fy),d=Math.hypot(mx-px,my-py);if(d<=bd){bd=d;best=m}});
  return best;
}
async function useSkill_(){
  if(!X||X.busy)return;
  const now=performance.now();if(now<(X.skillReadyAt||0))return;
  const target=nearestMon_(SKILL_RANGE);
  if(!target){toast("✨ ไม่มีมอนสเตอร์อยู่ใกล้ ๆ");return}
  const stage=target.stage,sub=questionSubFor_(target.tier,save.explore.kills[stage]||0),q=makeQuestion({id:stage},sub);
  const res=await askTimed_({title:"✨ สกิลคิดเลข",text:q.text,answer:q.answer,options:q.options,seconds:15+bonusTime(),portrait:heroImg(save.avatar,72)});
  if(!X)return;
  const t=performance.now();
  if(res.ok){save.stats.correct++;skillBlast_(t)}
  else{save.stats.wrong++;X.skillStreak=0;X.skillReadyAt=t+SKILL_CD_BAD;X.skillCdMs=SKILL_CD_BAD}
  persist();
}
function skillBlast_(now){
  const [px,py]=footPx_(X.p.fx,X.p.fy),dmg=skillDmg_(effAtk(),X.skillStreak||0);
  X.skillStreak=(X.skillStreak||0)+1;X.skillReadyAt=now+SKILL_CD_OK;X.skillCdMs=SKILL_CD_OK;
  canvasFx_(HERO_FX[heroKey(save.avatar)]||"slash",px,py-8,0.9);canvasFx_("crit",px,py-8,0.55);
  (SFX.crit||SFX.hit)();
  floatText2_(X.skillStreak>1?`✨ คอมโบสกิล ×${X.skillStreak}`:"✨ สกิลคิดเลข!",px,py-40,"#c4b5fd",now);
  X.mons.slice().forEach(m=>{if(m.dead)return;const [mx,my]=footPx_(m.fx,m.fy);if(Math.hypot(mx-px,my-py)<=SKILL_BLAST*TS)hitMon_(m,dmg,X.p.fx,X.p.fy,now,true)});
}
// ปุ่ม ✨: วงคูลดาวน์ · จางเมื่อไม่มีเป้าหมาย · ซ่อนเมื่อไม่ได้อยู่ในทุ่ง
function updateSkillButton_(now){
  const b=$("ex-skill");if(!b||!X)return;
  const field=!!(X.m.zones&&X.m.zones.length);b.classList.toggle("hidden",!field);if(!field)return;
  const left=Math.max(0,(X.skillReadyAt||0)-now);
  b.style.setProperty("--cd",left>0?Math.min(1,left/(X.skillCdMs||left)).toFixed(3):"0");
  b.classList.toggle("disabled",left>0||!nearestMon_(SKILL_RANGE));
}

/* ====================================================================== */
/* โจทย์จู่โจม ⚡ · พลังคณิต · โล่จากต้นไม้ทักษะ                                */
/* ====================================================================== */
const POWER_MS=15000;
function enemyNear_(tiles){const [px,py]=footPx_(X.p.fx,X.p.fy);return X.mons.some(m=>{if(m.dead)return false;if(m.state==="chase")return true;const [mx,my]=footPx_(m.fx,m.fy);return Math.hypot(mx-px,my-py)<=tiles*TS})}
function updateAmbush_(now){
  if(!(X.m.zones&&X.m.zones.length))return;
  if(X.nextAmbushAt==null){X.nextAmbushAt=now+nextAmbushDelay_(Math.random());return}
  if(now<X.nextAmbushAt||X.busy||!enemyNear_(5))return;
  X.nextAmbushAt=Infinity;ambush_();
}
async function ambush_(){
  const z=(X.m.zones||[]).find(z=>inZone_(z,X.p.x,X.p.y))||(nearestMon_(8)||{}).zone;
  if(!z){X.nextAmbushAt=performance.now()+10000;return}
  const q=makeQuestion({id:z.stage},1+Math.floor(Math.random()*3));
  const res=await askTimed_({title:"⚡ โจทย์จู่โจม!",text:q.text,answer:q.answer,options:q.options,seconds:10+bonusTime(),portrait:`<img class="pixelated" src="${mascotSrc("excited")}" alt="">`});
  if(!X)return;
  const now=performance.now(),e=save.explore,[px,py]=footPx_(X.p.fx,X.p.fy);
  X.nextAmbushAt=now+nextAmbushDelay_(Math.random());
  if(!res.ok){save.stats.wrong++;persist();return}
  save.stats.correct++;
  const r=pickAmbushReward_(Math.random());
  if(r==="heal"){const max=effMaxHp(),h=Math.round(max*0.2);e.hp=Math.min(max,e.hp+h);canvasFx_("heal",px,py-10,0.6);floatText2_("+"+h+" HP",px,py-34,"#86efac",now);toast(`⚡ ตอบถูก! ฟื้น HP +${h}`)}
  else if(r==="power"){X.powerUntil=now+POWER_MS;canvasFx_("crit",px,py-10,0.5);toast("⚡ ตอบถูก! พลังคณิต: ดาบแรง ×2 นาน 15 วินาที")}
  else{const g=10+Math.floor(Math.random()*11);save.gold+=g;SFX.coin&&SFX.coin();toast(`⚡ ตอบถูก! ได้ 🪙 ${g}`)}
  updateExHud_();persist();
}
// ชิปนับถอยหลัง "พลังคณิต" ใน HUD
function updatePowerChip_(now){
  let chip=$("ex-power");const left=(X.powerUntil||0)-now;
  if(left<=0){if(chip)chip.classList.add("hidden");return}
  if(!chip){chip=document.createElement("span");chip.id="ex-power";chip.className="chip ex-power";document.querySelector(".ex-right").prepend(chip)}
  chip.classList.remove("hidden");chip.textContent=`⚡ พลังคณิต ${Math.ceil(left/1000)}s`;
}
