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
  if(X.busy)return;
  const sec=Math.min(dt||16,50)/1000,[ppx,ppy]=footPx_(X.p.fx,X.p.fy);
  X.mons.forEach(m=>{if(!m.dead)updateMon_(m,now,sec,ppx,ppy)});
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
  m.pauseUntil=now+MON_PAUSE_MS;m.animUntil=now+400;m.anim="attack01";m.animAt=now;
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
