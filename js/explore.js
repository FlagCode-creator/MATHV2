/* Math Quest V2 — โหมดผจญภัย: เดินสำรวจแผนที่แบบ RPG มุมบน (ต้นแบบดินแดนที่ 1)
   วาดด้วย canvas ขนาดเล็กแล้วขยายแบบ pixelated · ควบคุมด้วยปุ่มบนจอ (มือถือ) หรือคีย์บอร์ด */

const TS=16;                 // ขนาดช่อง (พิกเซล)
const STEP_MS=150;           // เวลาเดิน 1 ช่อง
const MON_STEP_MS=320;
let X=null;                  // สถานะขณะเล่นโหมดผจญภัย

/* ====================================================================== */
/* เข้า/ออกโหมด                                                              */
/* ====================================================================== */
function ensureExplore_(){
  if(!save.explore)save.explore=newExploreState_();
  const e=save.explore;
  if(e.hp==null||e.hp>effMaxHp())e.hp=effMaxHp();
  return e;
}
async function enterExplore(){
  SFX.click();
  const e=ensureExplore_(),first=!e.talkedFlag&&!e.visited;
  e.visited=true;persist();
  loadMap_(e.map,e.x,e.y,e.dir);
  showExplore_();
  checkZone_();
  if(first)await exSay_([
    {mood:"hello",text:"ยินดีต้อนรับสู่โหมดผจญภัย! ตอนนี้เธอเดินสำรวจหมู่บ้านและทุ่งหญ้าได้เองแล้ว"},
    {mood:"explain",text:"ใช้ปุ่มลูกศรด้านล่างซ้ายเพื่อเดิน กดปุ่ม A เพื่อคุย อ่านป้าย หรือเปิดหีบ (บนคอมใช้ลูกศร/WASD และ Space)"},
    {mood:"remind",text:"ครูรออยู่ที่ลานกลางหมู่บ้าน มาคุยกับครูก่อนนะ แล้วครูจะบอกภารกิจแรกให้"}
  ]);
}
function showExplore_(){
  showScreen("explore");
  resizeExplore_();
  updateExHud_();
  X.invulnUntil=performance.now()+1200;X.busy=false;
  if(!X.running){X.running=true;X.last=performance.now();requestAnimationFrame(exLoop_)}
}
function stopExplore_(){if(X)X.running=false;X&&(X.held=null)}
// กลับมาจากฉากต่อสู้/ร้านค้า/ทักษะ
async function resumeExplore(){
  if(!save||!save.explore){goMap();return}
  const e=save.explore;
  if(!X||X.mapId!==e.map)loadMap_(e.map,e.x,e.y,e.dir);
  const pend=X.pending;X.pending=null;
  if(pend&&pend.defeated)X.mons=X.mons.filter(m=>m.id!==pend.defeated);
  showExplore_();
  if(pend&&pend.lost){
    loadMap_("village",9,12,"up");resizeExplore_();updateExHud_();
    await exSay_([{mood:"sad",text:"ไม่เป็นไรนะ ครูพาเธอกลับมาพักที่หมู่บ้านแล้ว HP เต็มแล้ว ลองอ่านวิธีคิดข้อที่พลาดแล้วค่อยไปสู้ใหม่"}]);
  }
  if(pend&&pend.kill){
    const z=pend.kill,k=e.kills[z];
    if(k===QUEST_KILLS)await exSay_([{mood:"happy",text:`ปราบ${MONSTERS[z].name}ครบ ${QUEST_KILLS} ตัวแล้ว! ตอนนี้ไปไขปริศนาเพื่อเปิดทางไป${nextZoneName_(z)}ได้เลย`}]);
    else if(k<QUEST_KILLS)toast(`${ZONE_NAMES[z]}: ปราบแล้ว ${k}/${QUEST_KILLS}`);
  }
  if(pend&&pend.boss)await exSay_([{mood:"celebrate",text:"ปราบราชาสไลม์ตัวเลขได้แล้ว! ทุ่งหญ้าจำนวนกลับมาสงบสุข กลับไปรายงานครูที่หมู่บ้านนะ"}]);
  updateExHud_();
}
function nextZoneName_(z){const i="ABCDE".indexOf(z);return i<4?ZONE_NAMES["ABCDE"[i+1]]:"ลานบอส"}
function exitExploreToMap(){closeExMenu();stopExplore_();goMap()}

/* ====================================================================== */
/* โหลดแผนที่                                                                */
/* ====================================================================== */
function loadMap_(mapId,x,y,dir){
  const m=EXPLORE_MAPS[mapId],e=save.explore;
  e.map=mapId;e.x=x;e.y=y;e.dir=dir||e.dir||"down";
  const old=X||{};
  X={
    mapId,m,W:m.rows[0].length,H:m.rows.length,
    p:{x,y,fx:x,fy:y,t:1,dir:e.dir,step:0},
    npcs:(m.npcs||[]).map(n=>({...n,fx:n.x,fy:n.y})),
    mons:[],held:old.held||null,running:old.running||false,last:old.last||0,
    canvas:$("ex-canvas"),frame:0,busy:false,invulnUntil:0,zone:null,pending:old.pending||null
  };
  X.ctx=X.canvas.getContext("2d");
  if(m.zones)m.zones.forEach(z=>z.monsters.forEach(([mx,my],i)=>{
    X.mons.push({id:z.id+i,stage:z.stage,x:mx,y:my,fx:mx,fy:my,t:1,y0:z.y0,y1:z.y1,next:performance.now()+rng(600,2000)});
  }));
  buildBase_();
  persist();
}
// ช่องจริงหลังรวมสถานะ (ประตูที่เปิดแล้ว = ทางเดิน, สะพานซ่อมแล้ว, หีบที่เปิดแล้ว)
function tileAt_(x,y){
  const m=X.m;if(y<0||y>=X.H||x<0||x>=X.W)return "T";
  const ch=m.rows[y][x],e=save.explore;
  if(ch==="G"||ch==="b"){
    for(const [gid,g] of Object.entries(m.gates||{})){
      const ys=g.rows||[g.y];
      if(ys.includes(y)&&g.xs.includes(x))return e.open[gid]?(ch==="b"?"=":":"):ch;
    }
  }
  if(ch==="c"){const c=(m.chests||[]).find(c=>c.x===x&&c.y===y);if(c&&e.chests[c.id])return "C"}
  return ch;
}
function blocked_(x,y){const t=tileAt_(x,y);return TILE_BLOCK.has(t)||t==="C"}
function npcAt_(x,y){return X.npcs.find(n=>n.x===x&&n.y===y)}
function monAt_(x,y){return X.mons.find(m=>m.x===x&&m.y===y)}
function bossAt_(x,y){const b=X.m.boss;return b&&!save.explore.bossDone&&b.x===x&&b.y===y?b:null}

/* ====================================================================== */
/* วาดพื้นแผนที่ (ทำครั้งเดียวต่อสถานะ เก็บไว้ 2 เฟรมสำหรับน้ำกระเพื่อม)            */
/* ====================================================================== */
function hash2_(x,y,s){let h=(x*374761393+y*668265263+(s||0)*97531)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296}
function buildBase_(){
  X.base=[0,1].map(frame=>{
    const cv=document.createElement("canvas");cv.width=X.W*TS;cv.height=X.H*TS;
    const c=cv.getContext("2d");c.imageSmoothingEnabled=false;
    for(let y=0;y<X.H;y++)for(let x=0;x<X.W;x++)paintTile_(c,x,y,frame);
    return cv;
  });
}
const OBJ_OF={T:"obj_tree",o:"obj_rock",f:"obj_fence",s:"obj_sign",k:"obj_tablet",c:"obj_chest",C:"obj_chest_open",G:"obj_gate",n:"obj_carrot",w:"obj_well"};
function paintTile_(c,x,y,frame){
  const ch=tileAt_(x,y),ox=x*TS,oy=y*TS,R=i=>hash2_(x,y,i);
  const rect=(px,py,w,h,col)=>{c.fillStyle=col;c.fillRect(ox+px,oy+py,w,h)};
  const grass=flowers=>{
    rect(0,0,TS,TS,"#5cb84a");
    for(let i=0;i<5;i++){const px=1+Math.floor(R(i)*12),py=2+Math.floor(R(i+9)*12);rect(px,py,1,1,"#43983a");rect(px+2,py,1,1,"#43983a");rect(px+1,py+1,1,1,"#43983a")}
    for(let i=0;i<3;i++)rect(Math.floor(R(i+20)*15),Math.floor(R(i+30)*15),1,1,"#7ad55e");
    if(flowers)for(let i=0;i<3;i++){const px=1+Math.floor(R(i+40)*13),py=1+Math.floor(R(i+50)*13);rect(px,py,2,2,["#fee761","#f6757a","#ffffff"][i]);rect(px,py+2,1,1,"#2f6e38")}
  };
  const path=()=>{rect(0,0,TS,TS,"#d9a066");for(let i=0;i<6;i++)rect(Math.floor(R(i)*15),Math.floor(R(i+7)*15),1+(i%2),1,i<4?"#c08552":"#e8bf88")};
  const water=()=>{
    rect(0,0,TS,TS,"#1f7fc0");
    for(let i=0;i<3;i++){const py=(2+i*5+frame*2)%TS,px=Math.floor(R(i+60)*9);rect(px,py,5,1,"#5fc7ef");rect(px+2,py+1,3,1,"#1a6aa3")}
    const up=y>0?X.m.rows[y-1][x]:"~";if(up!=="~"&&up!=="b")for(let i=0;i<TS;i+=2)rect(i+frame%2,0,1,1,"#bff0ff");
  };
  if(ch==="~"){water();return}
  if(ch==="="){water();for(let py=0;py<TS;py+=4){rect(1,py,14,3,"#b86f50");rect(1,py+3,14,1,"#733e39")}rect(0,0,1,TS,"#5a3420");rect(15,0,1,TS,"#5a3420");return}
  if(ch==="b"){water();rect(2,3,6,3,"#b86f50");rect(2,6,6,1,"#733e39");rect(9,10,5,3,"#b86f50");rect(9,13,5,1,"#733e39");return}
  if(ch==="_"){rect(0,0,TS,TS,"#9aa6bd");rect(0,0,TS,1,"#c0cbdc");rect(0,0,1,TS,"#c0cbdc");rect(0,15,TS,1,"#6b7690");rect(15,0,1,TS,"#6b7690");if(R(1)>0.6)rect(4+Math.floor(R(2)*7),4+Math.floor(R(3)*7),2,1,"#8591a8");return}
  if(ch==="#"){rect(0,0,TS,TS,"#5a6988");for(let py=0;py<TS;py+=4){rect(0,py,TS,1,"#3a4466");const off=(py/4)%2?4:0;for(let px=off;px<TS;px+=8)rect(px,py,1,4,"#3a4466")}rect(0,1,TS,1,"#7d8fb8");return}
  if(ch==="R"){rect(0,0,TS,TS,"#c43a44");for(let py=0;py<TS;py+=4){rect(0,py+3,TS,1,"#8a2230");const off=(py/4)%2?0:4;for(let px=off;px<TS;px+=8)rect(px,py,4,1,"#e05560")}const up=y>0?X.m.rows[y-1][x]:".";if(up!=="R")rect(0,0,TS,2,"#6a1a26");return}
  if(ch==="H"||ch==="W"||ch==="D"){
    rect(0,0,TS,TS,"#ead4aa");rect(0,0,TS,2,"#8a2230");rect(0,14,TS,2,"#8a5a3a");
    const l=x>0?X.m.rows[y][x-1]:".",r=x<X.W-1?X.m.rows[y][x+1]:".";
    if(!"HWD".includes(l))rect(0,0,2,TS,"#b86f50");if(!"HWD".includes(r))rect(14,0,2,TS,"#b86f50");
    if(ch==="W"){rect(4,4,8,8,"#733e39");rect(5,5,6,6,"#6cc3ec");rect(8,5,1,6,"#733e39");rect(5,8,6,1,"#733e39");rect(5,5,2,1,"#d6f3ff")}
    if(ch==="D"){rect(3,3,10,13,"#5a3420");rect(4,4,8,12,"#8a5a3a");rect(10,10,1,1,"#fee761")}
    return;
  }
  // พื้นใต้วัตถุ
  if(ch==="n"){rect(0,0,TS,TS,"#7a4a30");for(let py=3;py<TS;py+=5)rect(0,py,TS,1,"#5a3420")}
  else if(ch===":"||ch==="G"||ch==="w")path();
  else grass(ch===",");
  const obj=OBJ_OF[ch];
  if(obj){const cv=spriteCanvas(obj);if(cv)c.drawImage(cv,ox-1,oy-1)}
}

/* ====================================================================== */
/* ลูปหลัก: อัปเดตการเดิน + วาด                                               */
/* ====================================================================== */
function exLoop_(now){
  if(!X||!X.running)return;
  if(!$("screen-explore").classList.contains("active")){X.running=false;return}
  const dt=now-X.last;X.last=now;
  X.frame=Math.floor(now/600)%2;
  updatePlayer_(now,dt);
  updateMonsters_(now);
  drawExplore_(now);
  requestAnimationFrame(exLoop_);
}
const DIRS={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
function updatePlayer_(now){
  const p=X.p;
  if(p.t<1){
    p.t=Math.min(1,(now-p.t0)/STEP_MS);
    p.fx=p.sx+(p.x-p.sx)*p.t;p.fy=p.sy+(p.y-p.sy)*p.t;
    if(p.t>=1)arrived_();
    return;
  }
  if(X.busy||!X.held)return;
  tryStep_(X.held,now);
}
function tryStep_(dir,now){
  const p=X.p,[dx,dy]=DIRS[dir],nx=p.x+dx,ny=p.y+dy;
  p.dir=dir;save.explore.dir=dir;
  const mon=monAt_(nx,ny);if(mon){startFieldBattle_(mon);return}
  if(bossAt_(nx,ny)){startBossBattle_();return}
  if(blocked_(nx,ny)||npcAt_(nx,ny)){p.bump=now;return}
  p.sx=p.x;p.sy=p.y;p.x=nx;p.y=ny;p.t0=now;p.t=0;p.step++;
}
function arrived_(){
  const p=X.p,e=save.explore;
  e.x=p.x;e.y=p.y;
  const w=(X.m.warps||[]).find(w=>w.x===p.x&&w.y===p.y);
  if(w){warpTo_(w);return}
  checkZone_();
}
// เข้าโซนใหม่ → แสดงชื่อพื้นที่
function checkZone_(){
  const p=X.p,z=(X.m.zones||[]).find(z=>p.y>=z.y0&&p.y<=z.y1);
  const zid=z?z.id:(p.y<8&&X.mapId==="field"?"boss":X.mapId);
  if(zid!==X.zone){X.zone=zid;showArea_(z?`${ZONE_NAMES[z.id]} · หน่วย${TOPICS[z.stage]}`:zid==="boss"?"👑 ลานบอส":X.m.name)}
}
function warpTo_(w){
  const wrap=$("ex-wrap");wrap.classList.add("fade");
  X.busy=true;
  setTimeout(()=>{loadMap_(w.to,w.tx,w.ty,save.explore.dir);X.running=true;resizeExplore_();updateExHud_();wrap.classList.remove("fade");X.invulnUntil=performance.now()+1000;checkZone_()},220);
}
function showArea_(text){const el=$("ex-area");el.textContent=text;el.classList.remove("show");void el.offsetWidth;el.classList.add("show")}
$("ex-area").addEventListener("animationend",ev=>ev.currentTarget.classList.remove("show"));

function updateMonsters_(now){
  X.mons.forEach(m=>{
    if(m.t<1){m.t=Math.min(1,(now-m.t0)/MON_STEP_MS);m.fx=m.sx+(m.x-m.sx)*m.t;m.fy=m.sy+(m.y-m.sy)*m.t;return}
    if(X.busy||now<m.next)return;
    m.next=now+rng(700,1700);
    if(Math.random()<0.3)return;
    const dir=pickOne(Object.keys(DIRS)),[dx,dy]=DIRS[dir],nx=m.x+dx,ny=m.y+dy;
    if(ny<m.y0||ny>m.y1||blocked_(nx,ny)||npcAt_(nx,ny)||monAt_(nx,ny))return;
    if(nx===X.p.x&&ny===X.p.y){if(now>X.invulnUntil&&X.p.t>=1)startFieldBattle_(m);return}
    m.sx=m.x;m.sy=m.y;m.x=nx;m.y=ny;m.t0=now;m.t=0;m.flip=dx<0?true:dx>0?false:m.flip;
  });
}

function drawExplore_(now){
  const c=X.ctx,cv=X.canvas,p=X.p;
  c.imageSmoothingEnabled=false;
  const vw=cv.width,vh=cv.height,mw=X.W*TS,mh=X.H*TS;
  let camX=Math.round(p.fx*TS+TS/2-vw/2),camY=Math.round(p.fy*TS+TS/2-vh/2);
  camX=mw<=vw?Math.round((mw-vw)/2):clamp(camX,0,mw-vw);
  const topPad=Math.round(96/(X.scale||2));                // เผื่อพื้นที่ใต้ HUD ด้านบน ให้เห็นแถวบนสุดของแผนที่
  camY=mh+topPad<=vh?Math.round((mh-vh)/2)-topPad:clamp(camY,-topPad,mh-vh);
  c.fillStyle="#0b1026";c.fillRect(0,0,vw,vh);
  c.drawImage(X.base[X.frame],-camX,-camY);
  const ents=[];
  (X.m.labels||[]).forEach(l=>ents.push({y:l.y-0.5,draw:()=>{c.font="9px sans-serif";c.textAlign="center";c.fillText(l.icon,l.x*TS+8-camX,l.y*TS-2-camY)}}));
  X.npcs.forEach(n=>ents.push({y:n.fy,draw:()=>drawSprite_(c,n.sprite,n.fx,n.fy,camX,camY,Math.floor(now/500+n.x)%2,false)}));
  X.mons.forEach(m=>ents.push({y:m.fy,draw:()=>drawSprite_(c,MONSTERS[m.stage].sprite,m.fx,m.fy,camX,camY,Math.floor(now/350+m.x)%2,m.flip)}));
  const b=X.m.boss;
  if(b&&!save.explore.bossDone)ents.push({y:b.y,draw:()=>{const cv2=spriteCanvas(b.sprite);c.drawImage(cv2,Math.round(b.x*TS+8-cv2.width/2-camX),Math.round(b.y*TS+TS-cv2.height-camY+(Math.floor(now/400)%2)))}});
  const moving=p.t<1,bob=moving?(p.step%2):0;
  ents.push({y:p.fy,draw:()=>drawSprite_(c,"hero:"+heroKey(save.avatar),p.fx,p.fy,camX,camY,bob,p.dir==="left")});
  ents.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());
  // ป้าย "!" เหนือ NPC ที่มีเรื่องสำคัญ
  const f=X.npcs.find(n=>n.id==="flag");
  if(f&&(!save.explore.talkedFlag||(save.explore.bossDone&&!save.explore.reported))){
    c.fillStyle="#fee761";c.font="bold 10px sans-serif";c.textAlign="center";
    c.fillText("!",f.x*TS+8-camX,f.y*TS-3-camY-(Math.floor(now/300)%2));
  }
}
function drawSprite_(c,key,fx,fy,camX,camY,bob,flip){
  const cv=spriteCanvas(key);if(!cv)return;
  const dx=Math.round(fx*TS-1-camX),dy=Math.round(fy*TS-1-camY-bob);
  c.fillStyle="rgba(0,0,0,.25)";c.fillRect(dx+4,Math.round(fy*TS-camY)+13,10,3);
  if(flip){c.save();c.translate(dx+cv.width,dy);c.scale(-1,1);c.drawImage(cv,0,0);c.restore()}
  else c.drawImage(cv,dx,dy);
}
function resizeExplore_(){
  if(!X)return;
  const wrap=$("ex-wrap"),w=wrap.clientWidth||360,h=wrap.clientHeight||640;
  const scale=clamp(Math.round(w/176*2)/2,2,4);           // ประมาณ 11 ช่องตามแนวกว้าง
  X.scale=scale;
  X.canvas.width=Math.ceil(w/scale);X.canvas.height=Math.ceil(h/scale);
  X.canvas.style.width=w+"px";X.canvas.style.height=h+"px";
}
window.addEventListener("resize",()=>{if(X&&X.running)resizeExplore_()});

/* ====================================================================== */
/* ควบคุม                                                                   */
/* ====================================================================== */
function bindExploreControls_(){
  document.querySelectorAll(".ex-pad button").forEach(b=>{
    const dir=b.dataset.dir;
    const on=ev=>{ev.preventDefault();if(X)X.held=dir;b.classList.add("held")};
    const off=ev=>{ev.preventDefault();if(X&&X.held===dir)X.held=null;b.classList.remove("held")};
    b.addEventListener("pointerdown",on);b.addEventListener("pointerup",off);b.addEventListener("pointerleave",off);b.addEventListener("pointercancel",off);
  });
  $("ex-a").addEventListener("pointerdown",ev=>{ev.preventDefault();interact_()});
  const keyDir={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",w:"up",s:"down",a:"left",d:"right",W:"up",S:"down",A:"left",D:"right"};
  document.addEventListener("keydown",ev=>{
    if(!X||!$("screen-explore").classList.contains("active"))return;
    if(!$("dialog").classList.contains("hidden")){if(ev.key===" "||ev.key==="Enter"){ev.preventDefault();advanceDialog()}return}
    if(!$("puzzle-modal").classList.contains("hidden"))return;
    if(keyDir[ev.key]){ev.preventDefault();X.held=keyDir[ev.key]}
    else if(ev.key===" "||ev.key==="Enter"||ev.key==="z"||ev.key==="Z"){ev.preventDefault();interact_()}
  });
  document.addEventListener("keyup",ev=>{if(X&&keyDir[ev.key]===X.held)X.held=null});
}

/* ====================================================================== */
/* HUD                                                                      */
/* ====================================================================== */
function updateExHud_(){
  if(!save||!save.explore)return;
  const e=save.explore,max=effMaxHp();e.hp=Math.min(e.hp,max);
  $("ex-avatar").innerHTML=heroImg(save.avatar,36);
  $("ex-name").textContent=`${save.name} Lv.${save.level}`;
  $("ex-hp").style.width=clamp(e.hp/max*100,0,100)+"%";
  $("ex-hp").parentElement.classList.toggle("low",e.hp/max<=0.3);
  $("ex-hp-text").textContent=`HP ${e.hp}/${max}`;
  $("ex-gold").textContent=save.gold;
  $("ex-quest").innerHTML=`📜 ${esc(objective_())}`;
  const pts=skillPointsFree();$("ex-menu-btn").classList.toggle("notify",pts>0);
}
function objective_(){
  const e=save.explore;
  if(!e.talkedFlag)return "คุยกับครูแฟล็กที่ลานกลางหมู่บ้าน";
  for(const z of EXPLORE_MAPS.field.zones){
    if(e.open[z.gate])continue;
    const k=e.kills[z.stage];
    if(k<QUEST_KILLS)return `${ZONE_NAMES[z.id]}: ปราบ${MONSTERS[z.stage].name} ${k}/${QUEST_KILLS}`;
    return {gA:"ไขประตูหิน — หาเลขบนแผ่นหิน 3 แผ่นในทุ่งบวกแล้วบวกกัน",bridge:"ซ่อมสะพาน — คุยกับลุงช่างไม้ริมแม่น้ำ",
            gC:e.key?"ใช้กุญแจเปิดประตูทางเหนือของทุ่งคูณ":"เปิดหีบรหัสในทุ่งคูณ (ถามลุงชาวสวน)",gD:"ไขประตูแบ่งเหรียญทางเหนือของทุ่งหาร",
            gE:"ไขรหัสประตูลานบอส — ดูห้องหินโบราณในทุ่งผสม"}[z.gate];
  }
  if(!e.bossDone)return "ปราบราชาสไลม์ตัวเลขที่ลานบอส";
  if(!e.reported)return "กลับไปรายงานครูแฟล็กที่หมู่บ้าน";
  return "ดินแดนที่ 1 สำเร็จ! 🎉 ดินแดนถัดไปกำลังสร้าง";
}
function openExMenu(){
  SFX.click();X.busy=true;X.held=null;
  const e=save.explore,pts=skillPointsFree();
  $("ex-menu-body").innerHTML=`
    <p class="pixel-label">MENU</p>
    <div class="ex-menu-quest"><b>ภารกิจตอนนี้</b><p>📜 ${esc(objective_())}</p>
      <small>${"ABCDE".split("").map(z=>`${ZONE_NAMES[z]} ${e.open[EXPLORE_MAPS.field.zones.find(q=>q.id===z).gate]?"✅":`${Math.min(e.kills[z],QUEST_KILLS)}/${QUEST_KILLS}`}`).join(" · ")}</small></div>
    <div class="ex-menu-items">${ITEM_ORDER.map(k=>`<span class="chip">${ITEMS[k].icon} ${save.items[k]||0}</span>`).join("")}${e.key?`<span class="chip">🗝️ กุญแจ</span>`:""}</div>
    <button type="button" class="btn btn-lime btn-block" onclick="closeExMenu();stopExplore_();openSkills('explore')">🌳 ต้นไม้ทักษะ${pts?` (มีแต้ม ${pts})`:""}</button>
    <button type="button" class="btn btn-ghost btn-block" onclick="closeExMenu();stopExplore_();openHero('explore')">🧙 ตัวละคร</button>
    <button type="button" class="btn btn-ghost btn-block" onclick="exitExploreToMap()">🗺️ ออกไปแผนที่โลก</button>
    <button type="button" class="btn btn-gold btn-block" onclick="closeExMenu()">▶ เล่นต่อ</button>`;
  $("ex-menu").classList.remove("hidden");
}
function closeExMenu(){$("ex-menu").classList.add("hidden");if(X)X.busy=false}

/* ====================================================================== */
/* บทสนทนา / ปริศนา                                                         */
/* ====================================================================== */
async function exSay_(lines){if(X){X.busy=true;X.held=null}await playDialog(lines);if(X)X.busy=false}
const say=(npc,text)=>({sprite:npc.sprite,name:npc.name,text});

// กล่องใส่คำตอบตัวเลข (ปุ่มกดบนจอ) — คืนค่า true เมื่อตอบถูก
function askNumber({title,text,answer,hint,portrait}){
  return new Promise(res=>{
    if(X){X.busy=true;X.held=null}
    let val="",wrong=0;
    $("pz-title").textContent=title;
    $("pz-text").textContent=text;
    $("pz-portrait").innerHTML=portrait||`<img class="pixelated" src="${mascotSrc("thinking")}" alt="">`;
    $("pz-hint").classList.add("hidden");$("pz-hint").textContent="";
    const show=()=>{$("pz-input").textContent=val||"?"};show();
    const keys=["7","8","9","4","5","6","1","2","3","−","0","⌫"];
    $("pz-keys").innerHTML="";
    keys.forEach(k=>{
      const b=document.createElement("button");b.type="button";b.textContent=k;
      b.addEventListener("pointerdown",ev=>{ev.preventDefault();SFX.click();
        if(k==="⌫")val=val.slice(0,-1);else if(k==="−"){val=val.startsWith("-")?val.slice(1):"-"+val}else if(val.length<6)val+=k;show()});
      $("pz-keys").appendChild(b);
    });
    const done=ok=>{$("puzzle-modal").classList.add("hidden");if(X)X.busy=false;res(ok)};
    $("pz-ok").onclick=()=>{
      if(!val||val==="-")return;
      if(Number(val)===Number(answer)){SFX.win();done(true);return}
      wrong++;SFX.hurt();
      const card=$("pz-card");card.classList.remove("shake");void card.offsetWidth;card.classList.add("shake");
      toast("ยังไม่ถูก ลองคิดใหม่อีกครั้งนะ");val="";show();
      if(wrong>=2&&hint){$("pz-hint").textContent="💡 "+hint;$("pz-hint").classList.remove("hidden")}
    };
    $("pz-cancel").onclick=()=>{SFX.click();done(false)};
    $("puzzle-modal").classList.remove("hidden");
  });
}

async function interact_(){
  if(!X||X.busy||X.p.t<1)return;
  const p=X.p,[dx,dy]=DIRS[p.dir],tx=p.x+dx,ty=p.y+dy,e=save.explore;
  const npc=npcAt_(tx,ty);if(npc)return talkNpc_(npc);
  const mon=monAt_(tx,ty);if(mon)return startFieldBattle_(mon);
  if(bossAt_(tx,ty))return startBossBattle_();
  const door=(X.m.doors||[]).find(d=>d.x===tx&&d.y===ty);
  if(door){
    if(door.act==="shop")return talkNpc_(X.npcs.find(n=>n.id==="shop"));
    if(door.act==="inn")return talkNpc_(X.npcs.find(n=>n.id==="inn"));
    return exSay_([{sprite:save.avatar?"hero:"+heroKey(save.avatar):"npc_kid",name:save.name,text:door.text}]);
  }
  const t=tileAt_(tx,ty);
  if(t==="s"){const s=(X.m.signs||[]).find(s=>s.x===tx&&s.y===ty);if(s)return exSay_([{sprite:"obj_sign",name:"ป้าย",text:s.text}])}
  if(t==="k"){const tb=(X.m.tablets||[]).find(s=>s.x===tx&&s.y===ty);if(tb){SFX.item();return exSay_([{sprite:"obj_tablet",name:`แผ่นหินสลัก (${tb.i+1}/3)`,text:`บนแผ่นหินสลักตัวเลขไว้ว่า "${e.puz.tablets[tb.i]}" — จดไว้ให้ดีนะ!`}])}}
  if(t==="w")return exSay_([{sprite:"obj_well",name:"บ่อน้ำ",text:"น้ำในบ่อใสแจ๋ว สะท้อนเงาของเธอที่ดูเก่งขึ้นทุกวัน ✨"}]);
  if(t==="n")return exSay_([{sprite:"obj_carrot",name:"แครอท",text:"แครอทของลุงชาวสวน อย่าเพิ่งถอนนะ! แต่ลองนับดูว่ามีทั้งหมดกี่ต้น"}]);
  if(t==="c"){const ch=X.m.chests.find(c=>c.x===tx&&c.y===ty);if(ch)return openChest_(ch)}
  if(t==="C")return toast("หีบนี้เปิดไปแล้ว");
  if(t==="G"||t==="b"){const gid=Object.keys(X.m.gates).find(g=>{const G=X.m.gates[g];return (G.rows||[G.y]).includes(ty)&&G.xs.includes(tx)});if(gid)return tryGate_(gid)}
}

async function talkNpc_(npc){
  const e=save.explore;SFX.click();
  if(npc.id==="flag"){
    if(!e.talkedFlag){
      await exSay_([
        {mood:"explain",text:"มาแล้วเหรอ! ทุ่งหญ้าจำนวนทางเหนือของหมู่บ้านถูกมอนสเตอร์ตัวเลขยึดไปหมดแล้ว"},
        {mood:"thinking",text:"ทุ่งแบ่งเป็น 5 ส่วนตามบทเรียน: ทุ่งบวก ทุ่งลบ ทุ่งคูณ ทุ่งหาร และทุ่งผสม แต่ละทุ่งมีประตูหรือสิ่งกีดขวางกั้นอยู่"},
        {mood:"remind",text:`ภารกิจของเธอ: ในแต่ละทุ่ง ปราบมอนสเตอร์ ${QUEST_KILLS} ตัว แล้วใช้คณิตศาสตร์ไขปริศนาเพื่อเปิดทางไปทุ่งถัดไป`},
        {mood:"determined",text:"ปลายทางคือราชาสไลม์ตัวเลข ปราบมันให้ได้นะ! นี่ยาฟื้นพลัง 1 ขวด ติดตัวไว้ 🧪"}
      ]);
      e.talkedFlag=true;save.items.potion=(save.items.potion||0)+1;persist();SFX.coin();updateExHud_();
      return;
    }
    if(e.bossDone&&!e.reported){
      await exSay_(FINAL_REPORT_LINES);
      e.reported=true;save.gold+=200;save.items.potion=(save.items.potion||0)+2;save.items.shield=(save.items.shield||0)+1;persist();SFX.levelUp();updateExHud_();
      toast("ได้รับ 🪙 200 · 🧪 ×2 · 🛡️ ×1");
      return;
    }
    const pts=skillPointsFree();
    return exSay_([{mood:"thinking",text:`ภารกิจตอนนี้: ${objective_()}`},...(pts?[{mood:"excited",text:`เธอมีแต้มทักษะเหลือ ${pts} แต้ม! กดปุ่ม ☰ แล้วเลือก "ต้นไม้ทักษะ" เพื่ออัปเกรดนะ`}]:[])]);
  }
  if(npc.id==="shop"){await exSay_([say(npc,"ยินดีต้อนรับจ้า! มีของดีช่วยให้รอดเยอะเลย")]);stopExplore_();return openShop("explore")}
  if(npc.id==="inn"){
    await exSay_([say(npc,"พักผ่อนสักหน่อยไหมจ๊ะ? ที่นี่ฟรีสำหรับนักผจญภัยตัวน้อย 🛏️")]);
    e.hp=effMaxHp();persist();SFX.heal();toast("💤 พักผ่อนแล้ว HP เต็ม!");updateExHud_();return;
  }
  if(npc.id==="kid")return exSay_([say(npc,pickOne([
    "รู้ไหม ถ้าตอบเร็ว ๆ ตอนแถบเวลายังเป็นสีทอง จะตีคริติคอลแรงขึ้นครึ่งหนึ่งเลยนะ!",
    "ตอบถูกติดกันหลาย ๆ ข้อ คอมโบจะทำให้ตีแรงขึ้นเรื่อย ๆ",
    "ถ้า HP เหลือน้อย กลับมาพักที่โรงแรมได้ฟรีนะ",
    "เลเวลอัปแล้วได้แต้มทักษะ ลองกดปุ่ม ☰ ดูสิ"]))]);
  if(npc.id==="carpenter")return tryGate_("bridge");
  if(npc.id==="farmer")return exSay_([say(npc,e.chests.cC
    ?"ขอบใจที่ช่วยเปิดหีบนะ กุญแจในนั้นใช้เปิดประตูทางเหนือได้"
    :"ลุงล็อกหีบสมบัติไว้แต่ดันลืมรหัส! จำได้แค่ว่ารหัสคือ 'จำนวนแครอททั้งหมดในแปลง' ช่วยลุงนับหน่อยนะ")]);
}

// ประตู/สะพาน: ต้องปราบมอนสเตอร์ครบก่อน แล้วค่อยไขปริศนา
async function tryGate_(gid){
  const e=save.explore;
  if(e.open[gid])return;
  const zone=EXPLORE_MAPS.field.zones.find(z=>z.gate===gid),k=e.kills[zone.stage],P=e.puz;
  const carpenter=X.npcs.find(n=>n.id==="carpenter");
  if(k<QUEST_KILLS){
    const who=gid==="bridge"&&carpenter?say(carpenter,`ค้างคาวลบขโมยไม้ไปหมดเลย! ช่วยปราบ${MONSTERS[zone.stage].name}ให้ได้ ${QUEST_KILLS} ตัวก่อน (ตอนนี้ ${k}/${QUEST_KILLS})`)
      :{mood:"remind",text:`ประตูนี้ถูกผนึกไว้ ต้องปราบ${MONSTERS[zone.stage].name}ใน${ZONE_NAMES[zone.id]}ให้ครบ ${QUEST_KILLS} ตัวก่อน (ตอนนี้ ${k}/${QUEST_KILLS})`};
    return exSay_([who]);
  }
  let ok=false;
  if(gid==="gA")ok=await askNumber({title:"🔒 ประตูหินแห่งการบวก",text:"ประตูสลักไว้ว่า: \"รหัสคือผลรวมของตัวเลขบนแผ่นหินสลักทั้ง 3 แผ่นในทุ่งนี้\"",answer:P.tablets.reduce((a,b)=>a+b,0),hint:"เดินหาแผ่นหินสีเทา 3 แผ่นในทุ่งบวก กด A อ่านตัวเลข แล้วนำมาบวกกันทั้งหมด"});
  else if(gid==="bridge")ok=await askNumber({title:"🌉 ซ่อมสะพาน",text:`ลุงช่างไม้: "สะพานนี้ต้องใช้ไม้ ${P.planksNeed} แผ่น ตอนนี้ลุงมีอยู่ ${P.planksHave} แผ่น ต้องหาเพิ่มอีกกี่แผ่นถึงจะพอ?"`,answer:P.planksNeed-P.planksHave,hint:`ต้องใช้ − มีอยู่แล้ว = ${P.planksNeed} − ${P.planksHave}`,portrait:spriteImg("npc_carpenter",72)});
  else if(gid==="gC"){
    if(!e.key)return exSay_([{mood:"thinking",text:"ประตูนี้ล็อกด้วยแม่กุญแจทองเหลือง ต้องหากุญแจก่อน — ลองถามลุงชาวสวนเรื่องหีบสมบัติดูสิ"}]);
    ok=true;await exSay_([{mood:"happy",text:"ใช้กุญแจทองเหลืองไขประตู... แกร๊ก! ประตูเปิดแล้ว"}]);
  }
  else if(gid==="gD")ok=await askNumber({title:"🔒 ประตูแห่งการหาร",text:`ประตูสลักไว้ว่า: "มีเหรียญทอง ${P.coins} เหรียญ แบ่งให้นักผจญภัย ${P.people} คนเท่า ๆ กัน จะได้คนละกี่เหรียญ?"`,answer:P.coins/P.people,hint:`${P.coins} ÷ ${P.people} = ? (ลองนึกว่า ${P.people} × อะไร = ${P.coins})`});
  else if(gid==="gE")ok=await askNumber({title:"👑 ประตูลานบอส",text:"ประตูสลักไว้ว่า: \"รหัสคือพื้นที่ของห้องหินโบราณในทุ่งนี้ (กี่ตารางหน่วย)\"",answer:40,hint:"เข้าไปในห้องหินทางซ้าย นับแผ่นหินตามแนวกว้างและแนวยาว แล้วนำมาคูณกัน (กว้าง × ยาว)"});
  if(!ok)return;
  e.open[gid]=true;persist();
  buildBase_();SFX.levelUp();updateExHud_();
  const gold=40;save.gold+=gold;persist();updateExHud_();
  await exSay_([{mood:"celebrate",text:gid==="bridge"?`ซ่อมสะพานสำเร็จ! ข้ามแม่น้ำไป${nextZoneName_(zone.id)}ได้แล้ว (+🪙 ${gold})`:`ถูกต้อง! ประตูเปิดแล้ว ไปต่อที่${nextZoneName_(zone.id)}ได้เลย (+🪙 ${gold})`}]);
}

async function openChest_(ch){
  const e=save.explore,P=e.puz;
  let ok=false,reward="";
  if(ch.kind==="carrot"){
    ok=await askNumber({title:"🧰 หีบของลุงชาวสวน",text:"หีบล็อกด้วยรหัสตัวเลข: \"จำนวนแครอททั้งหมดในแปลง\"",answer:42,hint:"นับว่ามีแครอทกี่แถว และแถวละกี่ต้น แล้วนำมาคูณกัน",portrait:spriteImg("obj_chest",72)});
    if(ok){e.key=true;save.gold+=30;reward="ได้ 🗝️ กุญแจทองเหลือง และ 🪙 30"}
  }else if(ch.q==="b"){
    const [a,b]=P.chestB;
    ok=await askNumber({title:"🧰 หีบรหัส",text:`รหัสของหีบคือคำตอบของ ${a} − ${b}`,answer:a-b,hint:"ลบทีละหลัก ถ้าหลักหน่วยลบไม่พอให้ยืมจากหลักสิบ",portrait:spriteImg("obj_chest",72)});
    if(ok){save.gold+=40;save.items.time=(save.items.time||0)+1;reward="ได้ 🪙 40 และ ⏳ นาฬิกาทราย"}
  }else if(ch.q==="d"){
    const [a,b]=P.chestD;
    ok=await askNumber({title:"🧰 หีบรหัส",text:`รหัสของหีบคือคำตอบของ ${a} × ${b}`,answer:a*b,hint:`ท่องสูตรคูณแม่ ${a}`,portrait:spriteImg("obj_chest",72)});
    if(ok){save.gold+=50;save.items.potion=(save.items.potion||0)+1;reward="ได้ 🪙 50 และ 🧪 ยาฟื้นพลัง"}
  }
  if(!ok)return;
  e.chests[ch.id]=true;persist();buildBase_();SFX.coin();updateExHud_();
  await exSay_([{mood:"excited",text:`เปิดหีบสำเร็จ! ${reward}`}]);
}

/* ====================================================================== */
/* เข้าฉากต่อสู้                                                             */
/* ====================================================================== */
function startFieldBattle_(mon){
  if(!X||X.busy)return;
  X.busy=true;X.held=null;stopExplore_();
  X.pending={monster:mon.id,stage:mon.stage};
  SFX.charge();
  const e=save.explore;
  startBattle("stage",mon.stage,{origin:"explore",hp:e.hp,startSub:1+Math.min(4,e.kills[mon.stage])});
}
async function startBossBattle_(){
  if(!X||X.busy)return;
  X.held=null;
  await exSay_([{sprite:"boss_w1",name:"ราชาสไลม์ตัวเลข",text:"บึ๋ง บึ๋ง! ข้าคือราชาแห่งทุ่งหญ้าจำนวน! ใครกล้ามาท้าทายข้า?!"}]);
  X.busy=true;stopExplore_();
  X.pending={boss:true};
  startBattle("boss",0,{origin:"explore",hp:save.explore.hp});
}
// เรียกจาก endBattle_ เมื่อจบการต่อสู้ที่มาจากโหมดผจญภัย
function exploreBattleEnded(won,hpLeft){
  const e=save.explore,pend=X&&X.pending||{};
  if(won){
    e.hp=Math.min(effMaxHp(),hpLeft+(skillLv("def")>=4?Math.round(effMaxHp()*0.25):0));
    if(pend.boss){e.bossDone=true;X.pending={boss:true}}
    else if(pend.monster){e.kills[pend.stage]=(e.kills[pend.stage]||0)+1;X.pending={defeated:pend.monster,kill:pend.stage}}
  }else{
    e.hp=effMaxHp();e.map="village";e.x=9;e.y=12;
    X.pending={lost:true};
  }
  persist();
}
function exploreFled(hpLeft){if(save.explore)save.explore.hp=hpLeft;if(X)X.pending=null;persist()}

const FINAL_REPORT_LINES=[
  {mood:"excited",text:"ครูได้ข่าวแล้ว! เธอปราบราชาสไลม์ตัวเลขได้จริง ๆ ด้วย!"},
  {mood:"celebrate",text:"ทุ่งหญ้าจำนวนกลับมาสงบสุขแล้ว นี่คือรางวัลจากครู: 🪙 200 ยาฟื้นพลัง 2 ขวด และโล่ 1 อัน"},
  {mood:"determined",text:"แต่ดินแดนอื่น ๆ ยังรอให้เธอไปช่วยอยู่... ตอนนี้ครูกำลังเตรียมเส้นทางไปป่าเศษส่วน รออีกไม่นานนะ!"}
];
