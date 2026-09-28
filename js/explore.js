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
    {mood:"remind",text:"ครูรออยู่ที่ลานน้ำพุกลางหมู่บ้าน มาคุยกับครูก่อนนะ แล้วครูจะบอกภารกิจแรกให้"}
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
    const sp=EXPLORE_MAPS.village.spawn;loadMap_("village",sp.x,sp.y,"up");resizeExplore_();updateExHud_();
    await exSay_([{mood:"sad",text:"ไม่เป็นไรนะ ครูพาเธอกลับมาพักที่หมู่บ้านแล้ว HP เต็มแล้ว ลองอ่านวิธีคิดข้อที่พลาดแล้วค่อยไปสู้ใหม่"}]);
  }
  if(pend&&pend.kill){
    const z=pend.kill,k=e.kills[z];
    if(k===QUEST_KILLS)await exSay_([{mood:"happy",text:`ปราบ${zoneMonName_(z)}ครบ ${QUEST_KILLS} ตัวแล้ว! ตอนนี้ไปไขปริศนาเพื่อเปิดทางไป${nextZoneName_(z)}ได้เลย`}]);
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
    npcs:(m.npcs||[]).map(n=>({...n,fx:n.x,fy:n.y,ox:n.x,oy:n.y,t:1,step:0,next:performance.now()+rng(1500,3500)})),
    mons:[],held:old.held||null,running:old.running||false,last:old.last||0,
    canvas:$("ex-canvas"),frame:0,busy:false,invulnUntil:0,zone:null,pending:old.pending||null,
    px:old.px,cssScale:old.cssScale,hudPad:old.hudPad,scale:old.scale
  };
  X.ctx=X.canvas.getContext("2d");
  if(blocked_(x,y)&&!(m.warps||[]).some(w=>w.x===x&&w.y===y)){X.p.x=X.p.fx=m.spawn.x;X.p.y=X.p.fy=m.spawn.y;e.x=m.spawn.x;e.y=m.spawn.y}
  if(m.zones)m.zones.forEach(z=>z.monsters.forEach(([mx,my],i)=>{
    X.mons.push({id:z.id+i,stage:z.stage,x:mx,y:my,fx:mx,fy:my,t:1,zone:z,next:performance.now()+rng(600,2000),
      tiny:i%2?"blood":"demon",hue:(ZONE_MON[z.stage]||{}).hue||0});
  }));
  buildBase_();
  persist();
}
// ช่องจริงหลังรวมสถานะ (ประตูที่เปิดแล้ว = ทางเดิน, สะพานซ่อมแล้ว, หีบที่เปิดแล้ว)
function tileAt_(x,y){
  const m=X.m;if(y<0||y>=X.H||x<0||x>=X.W)return "T";
  const ch=m.rows[y][x],e=save.explore;
  if(ch==="G"||ch==="b"){
    const gid=gateAt_(x,y);
    if(gid)return e.open[gid]?(ch==="b"?"=":":"):ch;
  }
  if(ch==="c"){const c=(m.chests||[]).find(c=>c.x===x&&c.y===y);if(c&&e.chests[c.id])return "C"}
  return ch;
}
function gateAt_(x,y){for(const [gid,g] of Object.entries(X.m.gates||{}))if(g.cells.some(([gx,gy])=>gx===x&&gy===y))return gid;return null}
const inZone_=(z,x,y)=>x>=z.x0&&x<=z.x1&&y>=z.y0&&y<=z.y1;
function blocked_(x,y){const t=tileAt_(x,y);return TILE_BLOCK.has(t)||t==="C"}
function npcAt_(x,y){return X.npcs.find(n=>n.x===x&&n.y===y)}
function monAt_(x,y){return X.mons.find(m=>m.x===x&&m.y===y)}
function bossAt_(x,y){const b=X.m.boss;return b&&!save.explore.bossDone&&b.x===x&&b.y===y?b:null}

/* ====================================================================== */
/* วาดพื้นแผนที่ (ทำครั้งเดียวต่อสถานะ เก็บไว้ 2 เฟรมสำหรับน้ำกระเพื่อม)            */
/* ====================================================================== */
function hash2_(x,y,s){let h=(x*374761393+y*668265263+(s||0)*97531)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296}
function buildBase_(){
  const T=(x,y)=>tileAt_(x,y);
  const houses=findHouses_(X.m.rows);
  X.base=[0,1].map(frame=>{
    const buf=new PixBuf(X.W*TS,X.H*TS);
    for(let y=0;y<X.H;y++)for(let x=0;x<X.W;x++)paintGround_(buf,x,y,frame,T);
    if(!farmReady_())houses.forEach((h,i)=>paintHouse_(buf,h,X.m.rows,i+(X.mapId==="village"?0:2)));   // บ้านแบบวาดเอง (ระหว่างรอภาพโหลด)
    paintFountains_(buf,X.m.rows,frame);
    const cv=document.createElement("canvas");cv.width=buf.w;cv.height=buf.h;
    const c=cv.getContext("2d");c.imageSmoothingEnabled=false;c.putImageData(buf.img,0,0);
    for(let y=0;y<X.H;y++)for(let x=0;x<X.W;x++){
      const ch=tileAt_(x,y);
      if(ch==="q"){c.drawImage(tallCanvas("bush",Math.floor(hash2_(x,y,5)*2)),x*TS,y*TS);continue}
      if(ch==="G")continue;   // ประตูปริศนาวาดเป็นวัตถุแยก (มีแสงและแอนิเมชันเปิด)
      if(farmReady_()){   // รั้วและหีบจากชุด Farm RPG
        if(ch==="f"){drawFarmFence_(c,x,y,tileAt_);continue}
        if(ch==="c"||ch==="C"){c.drawImage(farmImg_("chest"),8,ch==="c"?3:19,16,16,x*TS,y*TS,16,16);continue}
      }
      const obj=OBJ_OF[ch];if(obj){const o=spriteCanvas(obj);if(o)c.drawImage(o,x*TS-1,y*TS-1)}
    }
    if(farmReady_())paintForest_(c);
    // บ้านภาพ Farm RPG กว้าง 4.5 ช่อง: ช่องบ้านที่เหลือ (ยังเดินไม่ได้) ปลูกพุ่มไม้ไว้
    if(farmReady_())houses.forEach((h,i)=>{const r=farmHouseRect_(h,i);
      for(let y=h.y0+1;y<=h.y1;y++)for(let x=h.x0;x<=h.x1;x++){const cx=x*TS+8;if(cx>r.x+2&&cx<r.x+r.w-2)continue;c.drawImage(tallCanvas("bush",(x+y)%2),x*TS,y*TS)}});
    return cv;
  });
  X.houses=houses;X.fountains=null;
  if(!farmReady_())whenFarmReady_(()=>{if(X)buildBase_()});
}
// ต้นไม้ที่ล้อมด้วยต้นไม้ทุกด้าน (กลางป่า/ขอบแผนที่) → ไม่ต้องวาดทั้งต้น
function forestInner_(x,y){const t=(dx,dy)=>{const X2=x+dx,Y2=y+dy;return X2<0||Y2<0||X2>=X.W||Y2>=X.H||X.m.rows[Y2][X2]==="T"};
  return t(0,1)&&t(0,-1)&&t(1,0)&&t(-1,0)&&t(1,1)&&t(-1,1)}
// พุ่มใบ (ยอดเมเปิลไม่มีลำต้น) ใช้แทรกตามขอบป่า
function forestClump_(v){return v?mapleCrop_(71,13,20,23,true):mapleCrop_(90,0,50,34,false)}
// พุ่มใบป่าทึบ: พื้นเขียวเข้ม + ยอดไม้ซ้อนกันแบบสุ่ม (ไม่เป็นแถว)
function paintForest_(c){
  const maple=farmImg_("maple"),cells=[];
  for(let y=0;y<X.H;y++)for(let x=0;x<X.W;x++)if(X.m.rows[y][x]==="T"&&forestInner_(x,y))cells.push([x,y]);
  cells.forEach(([x,y])=>{c.fillStyle="#2f6b3a";c.fillRect(x*TS,y*TS,TS,TS)});
  cells.forEach(([x,y])=>{c.fillStyle="rgba(20,50,30,.45)";c.fillRect(x*TS+Math.floor(hash2_(x,y,51)*10),y*TS+Math.floor(hash2_(x,y,52)*10),5,4)});
  cells.sort((a,b)=>a[1]-b[1]||hash2_(a[0],a[1],53)-hash2_(b[0],b[1],53)).forEach(([x,y])=>{
    const big=hash2_(x,y,54)<0.7,src=big?[90,0,50,34]:[71,13,20,23],jx=Math.round((hash2_(x,y,55)-0.5)*10),jy=Math.round((hash2_(x,y,56)-0.5)*8);
    const dx=x*TS+8+jx-src[2]/2,dy=y*TS+10+jy-src[3]*0.7;
    c.drawImage(mapleCrop_(src[0],src[1],src[2],src[3],hash2_(x,y,57)<0.5),dx,dy)});
}
function drawStoneGate_(c,gx,y0,y1,gid,camX,camY,now,anim){
  const e=save.explore,zone=(EXPLORE_MAPS.field.zones||[]).find(z=>z.gate===gid),ready=zone&&(e.kills[zone.stage]||0)>=QUEST_KILLS&&gid!=="gC"||gid==="gC"&&e.key;
  const k=anim?Math.min(1,(now-anim.t0)/1100):0,sink=Math.round(k*k*30);
  const x=gx*TS-camX,top=y0*TS-12-camY,H=(y1-y0+1)*TS+12,bottom=(y1+1)*TS-camY;
  const R=(X2,Y2,W,H2,col)=>{c.fillStyle=col;c.fillRect(Math.round(X2),Math.round(Y2),W,H2)};
  // เงา
  c.fillStyle="rgba(0,0,0,.25)";c.fillRect(x+2,bottom-2,14,3);
  c.save();c.beginPath();c.rect(x-4,top-8,26,bottom-top+8);c.clip();
  const oy=sink;
  // บานประตูหิน
  R(x+1,top+oy,14,H,"#5e5549");R(x+2,top+1+oy,12,H-2,"#9a8f7c");R(x+2,top+1+oy,12,2,"#c9bea9");R(x+2,top+oy+H-4,12,2,"#6a6052");
  for(let j=top+6;j<top+H-4;j+=7)R(x+2,j+oy,12,1,"#7d7263");
  // อักษรเวทวงกลมกลางประตู
  const glow=ready?`rgba(255,210,90,${0.55+0.35*Math.sin(now/220)})`:`rgba(255,70,70,${0.45+0.3*Math.sin(now/400)})`,cy=top+H/2+oy;
  R(x+5,cy-6,6,1,glow);R(x+5,cy+5,6,1,glow);R(x+4,cy-5,1,10,glow);R(x+11,cy-5,1,10,glow);R(x+7,cy-3,2,6,glow);R(x+6,cy-1,4,2,glow);
  if(ready||anim){c.globalCompositeOperation="lighter";const g=c.createRadialGradient(x+8,cy,0,x+8,cy,14);g.addColorStop(0,"rgba(255,200,80,.35)");g.addColorStop(1,"rgba(255,200,80,0)");c.fillStyle=g;c.fillRect(x-6,cy-14,28,28);c.globalCompositeOperation="source-over"}
  c.restore();
  // เสาหินสองข้าง (ไม่จม)
  R(x-1,top-8,18,5,"#5e5549");R(x,top-7,16,3,"#c9bea9");R(x,top-5,16,1,"#9a8f7c");
  if(anim&&Math.random()<0.5)dust_(gx*TS+2+Math.random()*12,(y1+1)*TS,1);
}
function drawBridgeBuild_(c,camX,camY,now){
  const A=X.bridgeAnim,k=(now-A.t0)/1300;
  A.cells.forEach(([bx,by],ci)=>{for(let p=0;p<4;p++){const idx=ci*4+p,appear=idx/(A.cells.length*4);if(k<appear)continue;
    const drop=Math.max(0,1-(k-appear)*8),x=bx*TS+p*4-camX,y=by*TS-camY-Math.round(drop*10);
    c.fillStyle="#c98a52";c.fillRect(x,y,1,16);c.fillStyle="#b86a3a";c.fillRect(x+1,y,1,16);c.fillStyle="#8a4428";c.fillRect(x+2,y,1,16);c.fillStyle="#3a1c10";c.fillRect(x+3,y,1,16);
    if(drop>0&&drop<0.3)dust_(x+camX+2,by*TS+TS,1)}});
}
// ตำแหน่งภาพบ้าน: ประตูในภาพตรงกับช่องประตู (D) ของแผนที่ · บ้านลำดับคี่กลับด้าน
function farmHouseRect_(h,i){
  const d=(X.m.doors||[]).find(d=>d.x>=h.x0&&d.x<=h.x1&&d.y>=h.y0&&d.y<=h.y1),dx=d?d.x:Math.round((h.x0+h.x1)/2),dy=d?d.y:h.y1;
  return {x:dx*TS+8-(i%2?FARM_HOUSE.w-FARM_HOUSE.doorCx:FARM_HOUSE.doorCx),y:(dy+1)*TS-FARM_HOUSE.doorBottom,w:FARM_HOUSE.w,dy};
}
const OBJ_OF={o:"obj_rock",f:"obj_fence",s:"obj_sign",k:"obj_tablet",c:"obj_chest",C:"obj_chest_open",G:"obj_gate",n:"obj_carrot",w:"obj_well",x:"obj_barrel",X:"obj_crate"};

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
  updateNpcs_(now);
  updateEmotes_(now);
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
  dust_(p.sx*TS+8,p.sy*TS+TS,p.step%2?2:1);
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
  const p=X.p,z=(X.m.zones||[]).find(z=>inZone_(z,p.x,p.y)),ba=X.m.bossArea;
  const zid=z?z.id:(ba&&p.x>=ba.x0&&p.x<=ba.x1?"boss":X.mapId);
  if(zid!==X.zone){X.zone=zid;showArea_(z?`${ZONE_NAMES[z.id]} · หน่วย${TOPICS[z.stage]}`:zid==="boss"?"👑 ลานบอส":X.m.name)}
}
function warpTo_(w){
  const wrap=$("ex-wrap");wrap.classList.add("fade");
  X.busy=true;
  setTimeout(()=>{loadMap_(w.to,w.tx,w.ty,save.explore.dir);playBgm(screenTrack_("explore"));X.running=true;resizeExplore_();updateExHud_();wrap.classList.remove("fade");X.invulnUntil=performance.now()+1000;checkZone_()},220);
}
function showArea_(text){const el=$("ex-area");el.textContent=text;el.classList.remove("show");void el.offsetWidth;el.classList.add("show")}
$("ex-area").addEventListener("animationend",ev=>ev.currentTarget.classList.remove("show"));

function updateNpcs_(now){
  X.npcs.forEach(n=>{
    if(n.t<1){n.t=Math.min(1,(now-n.t0)/260);n.fx=n.sx+(n.x-n.sx)*n.t;n.fy=n.sy+(n.y-n.sy)*n.t;return}
    if(!n.wander&&!X.busy&&now>=n.next){n.next=now+rng(2500,5500);n.dir=pickOne(["down","down","left","right"]);return}   // ยืนเฉย ๆ ก็หันมองรอบตัว
    if(!n.wander||X.busy||now<n.next)return;
    n.next=now+(n.range?rng(500,1600):rng(1800,4000));
    const dir=pickOne(Object.keys(DIRS)),[dx,dy]=DIRS[dir],nx=n.x+dx,ny=n.y+dy;n.dir=dir;
    if(Math.abs(nx-n.ox)>(n.range||2)||Math.abs(ny-n.oy)>(n.rangeY||1)||blocked_(nx,ny)||npcAt_(nx,ny)||monAt_(nx,ny)||(nx===X.p.x&&ny===X.p.y))return;
    n.sx=n.x;n.sy=n.y;n.x=nx;n.y=ny;n.t0=now;n.t=0;n.step++;dust_(n.sx*TS+8,n.sy*TS+TS,1);
  });
}
function updateMonsters_(now){
  updateNightMons_(now);
  X.mons.forEach(m=>{
    if(m.t<1){m.t=Math.min(1,(now-m.t0)/MON_STEP_MS);m.fx=m.sx+(m.x-m.sx)*m.t;m.fy=m.sy+(m.y-m.sy)*m.t;
      if(m.t>=1&&!m.night&&!m.tiny&&monStyle_(MONSTERS[m.stage].sprite)==="hop")dust_(m.x*TS+8,m.y*TS+TS,3);return}
    if(X.busy||now<m.next)return;
    m.next=now+rng(500,1300);
    if(Math.random()<0.25){if(Math.random()<0.6)m.flip=!m.flip;return}   // หยุดมองซ้าย-ขวา
    const dir=pickOne(Object.keys(DIRS)),[dx,dy]=DIRS[dir],nx=m.x+dx,ny=m.y+dy;
    if(!inZone_(m.zone,nx,ny)||blocked_(nx,ny)||npcAt_(nx,ny)||monAt_(nx,ny))return;
    if(nx===X.p.x&&ny===X.p.y){if(now>X.invulnUntil&&X.p.t>=1)startFieldBattle_(m);return}
    m.sx=m.x;m.sy=m.y;m.x=nx;m.y=ny;m.t0=now;m.t=0;m.flip=dx<0?true:dx>0?false:m.flip;
  });
}

function drawExplore_(now){
  const c=X.ctx,cv=X.canvas,p=X.p,P=X.px||2;
  c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;
  c.fillStyle="#0b1026";c.fillRect(0,0,cv.width,cv.height);
  c.setTransform(P,0,0,P,0,0);c.imageSmoothingEnabled=false;
  const vw=cv.width/P,vh=cv.height/P,mw=X.W*TS,mh=X.H*TS;
  const topPad=Math.round((X.hudPad||64)/(X.cssScale||2));
  let camX=Math.round(p.fx*TS+TS/2-vw/2),camY=Math.round(p.fy*TS+TS/2-vh/2);
  camX=mw<=vw?Math.round((mw-vw)/2):clamp(camX,0,mw-vw);
  camY=mh+topPad<=vh?Math.round((mh-vh)/2)-topPad:clamp(camY,-topPad,mh-vh);
  c.drawImage(X.base[X.frame],-camX,-camY);
  const ents=[];
  // ต้นไม้ / เสาไฟ (วัตถุสูง) เฉพาะที่อยู่ในจอ
  const tx0=Math.max(0,Math.floor(camX/TS)-2),tx1=Math.min(X.W-1,Math.ceil((camX+vw)/TS)+2);
  const ty0=Math.max(0,Math.floor(camY/TS)-1),ty1=Math.min(X.H-1,Math.ceil((camY+vh)/TS)+4);
  for(let y=ty0;y<=ty1;y++)for(let x=tx0;x<=tx1;x++){
    const ch=X.m.rows[y][x];
    if(ch==="T"){
      if(forestInner_(x,y))continue;                     // กลางป่า: วาดเป็นพุ่มใบต่อเนื่องในพื้นแล้ว
      // ขอบป่า: สุ่มต้นใหญ่/ต้นเล็ก/พุ่มใบ เหลื่อมตำแหน่ง → ไม่เป็นแถวลำต้นเรียงกัน
      const h=hash2_(x,y,7),kind=h<0.55?0:h<0.82?2:3,tc=kind===3?forestClump_(Math.floor(hash2_(x,y,9)*2)):tallCanvas("tree",kind===0?(hash2_(x,y,8)<0.5?0:1):2);
      const jx=Math.round((hash2_(x,y,41)-0.5)*10),jy=Math.round((hash2_(x,y,43)-0.5)*8)+(kind===3?4:0);
      const shrub=hash2_(x,y,45)<0.45;
      ents.push({y:y+0.2+jy/64,draw:()=>{
      if(kind!==3){c.fillStyle="rgba(10,40,20,.22)";c.beginPath();c.ellipse(x*TS+8+jx-camX,y*TS+15+jy-camY,Math.min(15,tc.width*0.3),3.2,0,0,Math.PI*2);c.fill()}
      const tx=x*TS+8+jx-tc.width/2,ty=y*TS+17+jy-tc.height;
      // ผู้เล่นเดินอยู่หลังพุ่มใบ → ทำต้นไม้โปร่งแสง (ไม่บังตัวละคร)
      const pcx=p.fx*TS+8,pcy=p.fy*TS+4,behind=pcy<y*TS&&pcx>tx+4&&pcx<tx+tc.width-4&&pcy>ty+4;
      if(behind)c.globalAlpha=0.45;
      c.drawImage(tc,tx-camX,ty-camY);
      if(shrub&&kind!==3)c.drawImage(tallCanvas("bush",(x+y)%2),x*TS+jx+(hash2_(x,y,47)<0.5?-7:7)-camX,y*TS+4+jy-camY);   // พุ่มไม้ที่โคนต้น
      c.globalAlpha=1}})}
    else if(ch==="u")ents.push({y:y+0.2,draw:()=>{   // ทานตะวัน: ดอกโยกตามลม (ลำต้นอยู่กับที่)
      const v=(x*7+y*3)%3,sc=tallCanvas("sunflower",v),sway=Math.sin(now/650+x*0.9+y*0.4),dx=Math.round(sway*1.2),W=sc.width,HD=17;
      const bx=x*TS+8-W/2-camX,by=y*TS+16-sc.height+[0,-3,2][v]-camY;
      c.fillStyle="rgba(10,40,20,.22)";c.beginPath();c.ellipse(x*TS+8-camX,y*TS+15-camY,7,2.4,0,0,Math.PI*2);c.fill();
      c.drawImage(sc,0,HD,W,sc.height-HD,bx,by+HD,W,sc.height-HD);c.drawImage(sc,0,0,W,HD,bx+dx,by,W,HD)}});
    else if(ch==="l")ents.push({y:y+0.2,draw:()=>c.drawImage(tallCanvas("lamp",0),x*TS-camX,y*TS+16-32-camY)});
  }
  if(farmReady_())(X.houses||[]).forEach((h,i)=>{
    const r=farmHouseRect_(h,i),hc=farmHouseCanvas_(i%2===1),hx=r.x,hy=r.y,dy=r.dy;
    ents.push({y:dy+0.9,draw:()=>{
      const pcx=p.fx*TS+8,pcy=p.fy*TS+4,behind=pcy<hy+60&&pcx>hx&&pcx<hx+hc.width&&p.fy<dy;   // เดินอยู่หลังบ้าน → บ้านโปร่งแสง
      if(behind)c.globalAlpha=0.5;c.drawImage(hc,hx-camX,hy-camY);c.globalAlpha=1}});
  });
  // ประตูปริศนา: ประตูหินมีอักษรเวท (แดง = ยังปิดผนึก · ทอง = ไขได้แล้ว) · ตอนเปิดประตูจมลงดิน
  Object.entries(X.m.gates||{}).forEach(([gid,g])=>{
    const cells=g.cells.filter(([gx,gy])=>X.m.rows[gy][gx]==="G");if(!cells.length)return;
    const anim=X.gateAnim&&X.gateAnim.gid===gid?X.gateAnim:null;if(save.explore.open[gid]&&!anim)return;
    const gx=cells[0][0],y0=Math.min(...cells.map(c=>c[1])),y1=Math.max(...cells.map(c=>c[1]));
    ents.push({y:y1+0.1,draw:()=>drawStoneGate_(c,gx,y0,y1,gid,camX,camY,now,anim)});
  });
  if(X.bridgeAnim)ents.push({y:-1,draw:()=>drawBridgeBuild_(c,camX,camY,now)});
  (X.m.labels||[]).forEach(l=>ents.push({y:l.y-0.6,draw:()=>{
    const bx=l.x*TS+1-camX,by=l.y*TS-9-camY;
    c.fillStyle="#4a2c18";c.fillRect(bx,by,14,10);c.fillStyle="#b87a48";c.fillRect(bx+1,by+1,12,8);c.fillStyle="#d49a60";c.fillRect(bx+1,by+1,12,1);
    c.font="7px sans-serif";c.textAlign="center";c.textBaseline="middle";c.fillText(l.icon,bx+7,by+5.5)}}));
  X.npcs.forEach(n=>ents.push({y:n.fy,draw:()=>{drawChar_(c,n.sprite,n.dir||"down",n.t<1?(n.step%2?1:2):0,n.fx,n.fy,camX,camY,n,now);grassOver_(c,n.fx,n.fy,camX,camY,now)}}));
  X.mons.forEach(m=>ents.push({y:m.fy,draw:()=>{
    if(m.night||m.tiny){drawTinyMon_(c,m,camX,camY,now);return}
    const art=customSpriteInfo(MONSTERS[m.stage].sprite);
    if(art)drawArt_(c,art,Math.min(MON_ART_H,MON_ART_W*art.h/art.w),m.fx*TS+8-camX,m.fy*TS+TS-camY,m,!!m.flip,now,monStyle_(MONSTERS[m.stage].sprite));
    else drawSprite_(c,MONSTERS[m.stage].sprite,m.fx,m.fy,camX,camY,Math.floor(now/350+m.x)%2,m.flip);grassOver_(c,m.fx,m.fy,camX,camY,now)}}));
  const b=X.m.boss;
  if(b&&!save.explore.bossDone)ents.push({y:b.y,draw:()=>{
    const art=customSpriteInfo(b.sprite);
    if(art){drawArt_(c,art,Math.min(BOSS_ART_H,BOSS_ART_W*art.h/art.w),b.x*TS+8-camX,b.y*TS+TS-camY,X.bossEnt||(X.bossEnt={x:b.x,y:b.y,t:1}),false,now,monStyle_(b.sprite));return}
    const cv2=spriteCanvas(b.sprite);c.drawImage(cv2,Math.round(b.x*TS+8-cv2.width/2-camX),Math.round(b.y*TS+TS-cv2.height-camY+(Math.floor(now/400)%2)))}});
  const moving=p.t<1;
  ents.push({y:p.fy,draw:()=>{drawChar_(c,"hero:"+heroKey(save.avatar),p.dir,moving?(p.step%2?1:2):0,p.fx,p.fy,camX,camY,p,now);grassOver_(c,p.fx,p.fy,camX,camY,now)}});
  ambientUnder_(c,camX,camY,vw,vh,now);
  critterEnts_(ents,c,camX,camY,now,now-(X.lastDraw||now));
  drawDust_(c,camX,camY,now);
  ents.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());
  ambientOver_(c,camX,camY,vw,vh,now,Math.min(60,now-(X.lastDraw||now)));X.lastDraw=now;
  // ป้าย "!" เหนือครูแฟล็กเมื่อมีเรื่องสำคัญ
  const f=X.npcs.find(n=>n.id==="flag");
  if(f&&(!save.explore.talkedFlag||(save.explore.bossDone&&!save.explore.reported))){
    const bx=f.x*TS+5-camX,by=f.y*TS-18-camY-(Math.floor(now/300)%2);
    c.fillStyle="#181425";c.fillRect(bx-1,by-1,8,11);c.fillStyle="#fee761";c.fillRect(bx,by,6,9);c.fillStyle="#181425";c.fillRect(bx+2,by+1,2,4);c.fillRect(bx+2,by+6,2,2);
  }
}
// ตัวละครที่มีภาพใหญ่ (portraits) → ใช้ภาพนั้นแบบย่อ เดินเด้งโยกซ้ายขวา · ไม่มีภาพ → ตัวเดินที่วาดด้วยโค้ด (16×32)
const CHAR_ART_H=32,MON_ART_H=24,BOSS_ART_H=42,MON_ART_W=26,BOSS_ART_W=46;
function drawChar_(c,spriteKey,dir,frame,fx,fy,camX,camY,ent,now){
  const walk=walkFrame(spriteKey,dir,frame);   // มี sprite sheet เดิน 4 ทิศ (ภาพของครู) → ใช้ก่อน
  if(walk){drawArt_(c,walk,CHAR_ART_H,fx*TS+8-camX,fy*TS+TS-camY,ent,false,now||performance.now(),"sheet");return}
  const ms=msKeyFor_(spriteKey);   // ตัวเดิน Mana Seed เดิน 4 ทิศจริง
  if(ms&&drawMsChar_(c,ms,dir,fx,fy,camX,camY,ent,now||performance.now()))return;
  const art=portraitInfo(spriteKey);
  if(art){
    // หันซ้าย = กลับภาพ · หันขึ้น/ลง = คงด้านเดิมไว้ (ไม่ดีดกลับ)
    const flip=dir==="left"?true:dir==="right"?false:!!(ent&&ent._flip);
    drawArt_(c,art,CHAR_ART_H,fx*TS+8-camX,fy*TS+TS-camY,ent,flip,now||performance.now(),"walk",dir);return}
  const key=charKeyFor(spriteKey);
  if(!key){drawSprite_(c,spriteKey,fx,fy,camX,camY,0,false);return}
  const cv=charFrame(key,dir,frame);
  const w=TS+2,h=Math.round(w*cv.height/cv.width);
  const dx=Math.round(fx*TS-1-camX),dy=Math.round(fy*TS+TS+1-h-camY);
  c.fillStyle="rgba(0,0,0,.28)";c.fillRect(dx+4,Math.round(fy*TS-camY)+14,10,3);c.fillRect(dx+3,Math.round(fy*TS-camY)+15,12,1);
  c.drawImage(cv,dx,dy,w,h);
}
// ย่อภาพใหญ่ให้พอดีความละเอียดจอจริง (ย่อทีละครึ่งเพื่อให้คม) — เก็บแคชไว้ตามขนาด
function miniArt_(info,h,P){
  const H=Math.max(1,Math.round(h*P)),k=H;info.mini=info.mini||{};if(info.mini[k])return info.mini[k];
  let src=info.canvas,sw=info.w,sh=info.h;
  while(sh/2>=H){const t=document.createElement("canvas");t.width=Math.max(1,Math.round(sw/2));t.height=Math.max(1,Math.round(sh/2));
    const tc=t.getContext("2d");tc.imageSmoothingEnabled=true;tc.imageSmoothingQuality="high";tc.drawImage(src,0,0,t.width,t.height);src=t;sw=t.width;sh=t.height}
  const out=document.createElement("canvas");out.height=H;out.width=Math.max(1,Math.round(H*info.w/info.h));
  const oc=out.getContext("2d");oc.imageSmoothingEnabled=H<sh;oc.imageSmoothingQuality="high";oc.drawImage(src,0,0,out.width,out.height);
  return info.mini[k]=out;
}
// ท่าขยับของมอนสเตอร์แต่ละแบบ: hop = กระโดดดึ๋ง · fly = ลอย+กระพือ · scuttle = วิ่งซอยเท้า · waddle = เดินโยก
const MON_STYLE={A:"hop",C:"hop",F:"hop",L:"hop",boss_w1:"hop",
  B:"fly",G:"fly",I:"fly",N:"fly",Q:"fly",R:"fly",S:"fly",T:"fly",Y:"fly",Z:"fly",boss_w6:"fly",boss_w3:"fly",
  D:"scuttle",J:"scuttle",K:"scuttle"};
const monStyle_=key=>MON_STYLE[key]||"waddle";
// ฝุ่นใต้เท้า
function dust_(x,y,n){if(!X)return;X.dust=X.dust||[];const now=performance.now();for(let i=0;i<(n||2);i++)X.dust.push({x:x+(Math.random()*8-4),y:y-1,vx:Math.random()*10-5,t0:now,life:380+Math.random()*200})}
function drawDust_(c,camX,camY,now){
  if(!X.dust||!X.dust.length)return;
  X.dust=X.dust.filter(d=>now-d.t0<d.life);
  X.dust.forEach(d=>{const k=(now-d.t0)/d.life;c.fillStyle=`rgba(236,222,190,${0.55*(1-k)})`;const r=1+k*2.4;
    c.beginPath();c.arc(d.x+d.vx*k-camX,d.y-k*3-camY,r,0,Math.PI*2);c.fill()});
}
// วาดภาพย่อ: เท้าอยู่ที่ (cx, footY) · มีท่าหันตัว (พลิกภาพแบบการ์ด) · เดินเด้ง ยืด-ยุบ เอนตัวตามทิศ · ยืนหายใจ
function drawArt_(c,info,h,cx,footY,ent,flip,now,style,dir){
  const P=X.px||2,mini=miniArt_(info,h,P),w=mini.width/P,hh=mini.height/P;
  style=style||"walk";
  const t=ent&&ent.t!=null?ent.t:1,moving=t<1,ph=moving?Math.sin(t*Math.PI):0;
  const seed=ent?(ent.x||0)*7.3+(ent.y||0)*3.1+(ent.id?String(ent.id).length:0):0;
  const side=((ent&&ent.step!=null?ent.step:ent?(ent.x||0)+(ent.y||0):0)%2)?1:-1;
  const hdir=ent&&ent.sx!=null&&moving?Math.sign(ent.x-ent.sx):0;
  // ท่าหันตัว: ด้านเดิมหดเข้า แล้วด้านใหม่ขยายออก (170ms) · หันขึ้น/ลง = ย่อข้างสั้น ๆ
  let face=flip?-1:1,turnK=1;
  if(ent&&style!=="sheet"){
    if(ent._flip===undefined){ent._flip=flip;ent._dir=dir}
    if(flip!==ent._flip){ent._flip=flip;ent._turn=now}
    if(dir&&dir!==ent._dir){ent._dir=dir;if(!ent._turn||now-ent._turn>170)ent._vturn=now}
    if(ent._turn&&now-ent._turn<170){const k=(now-ent._turn)/170;turnK=k<.5?1-2*k:2*k-1;face=(k<.5?!flip:flip)?-1:1;turnK=0.12+turnK*0.88}
    else if(ent._vturn&&now-ent._vturn<140){turnK=1-0.35*Math.sin((now-ent._vturn)/140*Math.PI)}
  }
  let bob=0,rot=0,sx=1,sy=1,lift=0,shadowK=1;
  if(style==="sheet"){bob=moving?ph:0;sy=moving?1:1+0.02*Math.sin(now/380+seed)}
  else if(style==="hop"){
    if(moving){bob=ph*7;sy=1+ph*0.14;sx=1-ph*0.09;if(t<0.15||t>0.85){sy=0.9;sx=1.1}}
    else{const cyc=((now/1000+seed*0.13)%1.8+1.8)%1.8;
      if(cyc<0.4){const q=Math.sin(cyc/0.4*Math.PI);bob=q*3.5;sy=1+q*0.1;sx=1-q*0.07}
      else if(cyc<0.52){const q=Math.sin((cyc-0.4)/0.12*Math.PI);sy=1-q*0.14;sx=1+q*0.1}
      else{sy=1+0.03*Math.sin(now/260+seed);sx=1-0.02*Math.sin(now/260+seed)}}
    shadowK=1-bob*0.05;
  }else if(style==="fly"){
    lift=5+Math.sin(now/280+seed)*2.5;sy=1+Math.sin(now/65+seed)*0.06;sx=1-Math.sin(now/65+seed)*0.03;
    rot=moving?0.1*hdir:Math.sin(now/520+seed)*0.06;shadowK=0.75-Math.sin(now/280+seed)*0.08;
  }else if(style==="scuttle"){
    if(moving){rot=Math.sin(t*Math.PI*4)*0.13;bob=Math.abs(Math.sin(t*Math.PI*4))*1.6;sx=1.04}
    else{const tw=Math.sin(now/900+seed)>0.7;rot=tw?Math.sin(now/45)*0.06:0;sy=1+0.025*Math.sin(now/300+seed)}
  }else{ // walk (ตัวละคร) / waddle (มอนสเตอร์เดิน)
    if(moving){bob=ph*(style==="walk"?3.5:3);rot=ph*0.12*side+0.08*hdir;
      sy=1+ph*0.05;sx=1-ph*0.03;if(t<0.12||t>0.88){sy=0.93;sx=1.05}}
    else{const br=Math.sin(now/380+seed);sy=1+0.024*br;sx=1-0.01*br}
    shadowK=1-bob*0.05;
  }
  if(dir==="left"||dir==="right")sx*=0.92;        // มองจากด้านข้าง: ตัวแคบลงเล็กน้อย
  if(dir==="up")sy*=0.97;
  const px=Math.round(cx*P)/P,py=Math.round(footY*P)/P;
  c.fillStyle="rgba(0,0,0,.26)";c.beginPath();c.ellipse(px,py-1,Math.max(4,w*0.36)*shadowK,2.2*shadowK,0,0,Math.PI*2);c.fill();
  c.save();c.translate(px,py-bob-lift);c.rotate(rot);c.scale(face*sx*turnK,sy);
  c.imageSmoothingEnabled=true;c.drawImage(mini,-w/2,-hh,w,hh);c.restore();
}
function drawSprite_(c,key,fx,fy,camX,camY,bob,flip){
  const cv=spriteCanvas(key);if(!cv)return;
  const w=TS+2,h=Math.round(w*cv.height/cv.width);
  const dx=Math.round(fx*TS-1-camX),dy=Math.round(fy*TS+TS+1-h-camY-bob);
  c.fillStyle="rgba(0,0,0,.25)";c.fillRect(dx+4,Math.round(fy*TS-camY)+13,10,3);
  if(flip){c.save();c.translate(dx+w,dy);c.scale(-1,1);c.drawImage(cv,0,0,w,h);c.restore()}
  else c.drawImage(cv,dx,dy,w,h);
}
// ขนาดแคนวาสตามความละเอียดจริงของจอ (คมชัด) · แนวนอนเห็นประมาณ 10–11 ช่องตามแนวตั้ง
function resizeExplore_(){
  if(!X)return;
  const wrap=$("ex-wrap"),landscape=window.innerWidth>window.innerHeight;
  wrap.classList.toggle("landscape",landscape);                     // ตั้งคลาสก่อนวัดขนาด (แนวนอนใช้เต็มความกว้างจอ)
  const w=wrap.clientWidth||360,h=wrap.clientHeight||640,dpr=window.devicePixelRatio||1;
  const cssScale=landscape?clamp(h/(TS*12),1.5,5):clamp(w/(TS*11),2,5);
  X.cssScale=cssScale;X.hudPad=landscape?8:72;
  X.px=Math.max(1,Math.round(cssScale*dpr));
  X.canvas.width=Math.round(w*dpr);X.canvas.height=Math.round(h*dpr);
  X.canvas.style.width=w+"px";X.canvas.style.height=h+"px";
  const hint=$("ex-rotate");if(hint)hint.classList.toggle("hidden",landscape||exRotateDismissed);
}
let exRotateDismissed=false;
function dismissRotateHint(){exRotateDismissed=true;$("ex-rotate").classList.add("hidden")}
window.addEventListener("resize",()=>{if(X&&X.running)resizeExplore_()});

/* ====================================================================== */
/* ควบคุม                                                                   */
/* ====================================================================== */
function bindExploreControls_(){
  bindJoystick_();
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

// จอยสติ๊ก (ลูกกลิ้ง): แตะตรงไหนในโซนซ้ายล่างก็ได้ จอยจะย้ายไปอยู่ใต้นิ้ว แล้วลากไปทางที่ต้องการเดิน
// ยังเดินทีละช่อง (เลือกทิศตามแกนที่ลากมากกว่า) เพื่อให้ปริศนาและการชนมอนสเตอร์ทำงานเหมือนเดิม
function bindJoystick_(){
  const zone=$("ex-stick-zone"),base=$("ex-stick"),knob=$("ex-knob");
  let id=null,cx=0,cy=0;
  const radius=()=>base.offsetWidth/2;
  const reset=()=>{id=null;base.classList.remove("active","floating");base.style.left=base.style.top="";knob.style.transform="";if(X)X.held=null};
  zone.addEventListener("pointerdown",ev=>{
    ev.preventDefault();if(id!==null)return;
    id=ev.pointerId;zone.setPointerCapture(id);
    const zr=zone.getBoundingClientRect(),r=radius();
    // ย้ายฐานจอยมาอยู่ใต้นิ้ว (ไม่ให้ล้นขอบโซน)
    const lx=clamp(ev.clientX-zr.left,r,zr.width-r),ly=clamp(ev.clientY-zr.top,r,zr.height-r);
    base.classList.add("active","floating");base.style.left=(lx-r)+"px";base.style.top=(ly-r)+"px";
    cx=zr.left+lx;cy=zr.top+ly;move(ev);
  });
  const move=ev=>{
    if(ev.pointerId!==id)return;
    const r=radius(),dx=ev.clientX-cx,dy=ev.clientY-cy,dist=Math.hypot(dx,dy),k=dist>r?r/dist:1;
    knob.style.transform=`translate(${dx*k}px,${dy*k}px)`;
    if(!X)return;
    if(dist<r*0.28){X.held=null;return}
    X.held=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");
  };
  zone.addEventListener("pointermove",move);
  ["pointerup","pointercancel","lostpointercapture"].forEach(t=>zone.addEventListener(t,ev=>{if(ev.pointerId===id)reset()}));
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
  if(!e.talkedFlag)return "คุยกับครูแฟล็กที่ลานน้ำพุกลางหมู่บ้าน";
  for(const z of EXPLORE_MAPS.field.zones){
    if(e.open[z.gate])continue;
    const k=e.kills[z.stage];
    if(k<QUEST_KILLS)return `${ZONE_NAMES[z.id]}: ปราบ${zoneMonName_(z.stage)} ${k}/${QUEST_KILLS}`;
    return {gA:"ไขประตูหิน — หาเลขบนแผ่นหิน 3 แผ่นในทุ่งบวกแล้วบวกกัน",bridge:"ซ่อมสะพาน — คุยกับลุงช่างไม้ริมแม่น้ำ",
            gC:e.key?"ใช้กุญแจเปิดประตูทางตะวันออกของทุ่งคูณ":"เปิดหีบรหัสในทุ่งคูณ (ถามลุงชาวสวน)",gD:"ไขประตูแบ่งเหรียญทางตะวันออกของทุ่งหาร",
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
const say=(npc,text,pose)=>({sprite:npc.sprite,name:npc.name,text,pose});

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
  if(t==="G"||t==="b"){const gid=gateAt_(tx,ty);if(gid)return tryGate_(gid)}
}

async function talkNpc_(npc){
  const e=save.explore;SFX.click();
  const opp={up:"down",down:"up",left:"right",right:"left"};if(npc)npc.dir=opp[X.p.dir]||"down";
  if(npc.id==="flag"){
    if(!e.talkedFlag){
      await exSay_([
        {mood:"explain",text:"มาแล้วเหรอ! ทุ่งหญ้าจำนวนทางตะวันออกของหมู่บ้านถูกมอนสเตอร์ตัวเลขยึดไปหมดแล้ว"},
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
  if(npc.id==="shop"){await exSay_([say(npc,"ยินดีต้อนรับจ้า! มีของดีช่วยให้รอดเยอะเลย","happy")]);stopExplore_();return openShop("explore")}
  if(npc.id==="inn"){
    await exSay_([say(npc,"พักผ่อนสักหน่อยไหมจ๊ะ? ที่นี่ฟรีสำหรับนักผจญภัยตัวน้อย 🛏️")]);
    e.hp=effMaxHp();persist();SFX.heal();toast("💤 พักผ่อนแล้ว HP เต็ม!");updateExHud_();return;
  }
  if(npc.id==="vill_f")return exSay_([say(npc,pickOne([
    "ไก่ที่บ้านฉันออกไข่วันละ 3 ฟอง สัปดาห์หนึ่งก็ได้ 21 ฟองแน่ะ!",
    "ถ้าอยากคิดเลขเร็ว ลองท่องสูตรคูณก่อนนอนทุกคืนสิ",
    "ครูแฟล็กใจดีมากเลยนะ แต่ถ้าไม่ทำการบ้านล่ะก็... 😅"]),"happy")]);
  if(npc.id==="vill_m")return exSay_([say(npc,pickOne([
    "วัวของลุงชาวสวนกินหญ้าวันละ 12 กิโล ลองคิดดูสิว่าอาทิตย์หนึ่งกินกี่กิโล",
    "ระวังนะ ได้ยินว่ากลางคืนมีปีศาจออกมาเดินในทุ่ง!",
    "เดินไปตามถนนทางตะวันออก จะเจอทุ่งหญ้าจำนวน"]))]);
  if(npc.id==="kid")return exSay_([say(npc,pickOne([
    "รู้ไหม ถ้าตอบเร็ว ๆ ตอนแถบเวลายังเป็นสีทอง จะตีคริติคอลแรงขึ้นครึ่งหนึ่งเลยนะ!",
    "ตอบถูกติดกันหลาย ๆ ข้อ คอมโบจะทำให้ตีแรงขึ้นเรื่อย ๆ",
    "ถ้า HP เหลือน้อย กลับมาพักที่โรงแรมได้ฟรีนะ",
    "เลเวลอัปแล้วได้แต้มทักษะ ลองกดปุ่ม ☰ ดูสิ"]),"happy")]);
  if(npc.id==="carpenter")return tryGate_("bridge");
  if(npc.id==="farmer")return exSay_([say(npc,e.chests.cC
    ?"ขอบใจที่ช่วยเปิดหีบนะ กุญแจในนั้นใช้เปิดประตูทางตะวันออกได้"
    :"ลุงล็อกหีบสมบัติไว้แต่ดันลืมรหัส! จำได้แค่ว่ารหัสคือ 'จำนวนแครอททั้งหมดในแปลง' ช่วยลุงนับหน่อยนะ")]);
}

// ประตู/สะพาน: ต้องปราบมอนสเตอร์ครบก่อน แล้วค่อยไขปริศนา
async function tryGate_(gid){
  const e=save.explore;
  if(e.open[gid])return;
  const zone=EXPLORE_MAPS.field.zones.find(z=>z.gate===gid),k=e.kills[zone.stage],P=e.puz;
  const carpenter=X.npcs.find(n=>n.id==="carpenter");
  if(k<QUEST_KILLS){
    const who=gid==="bridge"&&carpenter?say(carpenter,`ปีศาจลบขโมยไม้ไปหมดเลย! ช่วยปราบ${zoneMonName_(zone.stage)}ให้ได้ ${QUEST_KILLS} ตัวก่อน (ตอนนี้ ${k}/${QUEST_KILLS})`)
      :{mood:"remind",text:`ประตูนี้ถูกผนึกไว้ ต้องปราบ${zoneMonName_(zone.stage)}ใน${ZONE_NAMES[zone.id]}ให้ครบ ${QUEST_KILLS} ตัวก่อน (ตอนนี้ ${k}/${QUEST_KILLS})`};
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
  else if(gid==="gE")ok=await askNumber({title:"👑 ประตูลานบอส",text:"ประตูสลักไว้ว่า: \"รหัสคือพื้นที่ของห้องหินโบราณในทุ่งนี้ (กี่ตารางหน่วย)\"",answer:40,hint:"เข้าไปในห้องหินโบราณ นับแผ่นหินตามแนวกว้างและแนวยาว แล้วนำมาคูณกัน (กว้าง × ยาว)"});
  if(!ok)return;
  e.open[gid]=true;persist();
  // แอนิเมชันเปิดประตู / วางไม้สะพานทีละแผ่น แล้วค่อยอัปเดตพื้น
  X.busy=true;SFX.levelUp();
  if(gid==="bridge"){X.bridgeAnim={t0:performance.now(),cells:X.m.gates.bridge.cells};await sleep(1500);X.bridgeAnim=null}
  else{X.gateAnim={gid,t0:performance.now()};await sleep(1300);X.gateAnim=null}
  X.busy=false;buildBase_();updateExHud_();
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
  const night=mon.night?{name:NIGHT_MON[mon.night].name,tiny:mon.night,strong:true}
    :mon.tiny?{name:zoneMonName_(mon.stage,mon.tiny),tiny:mon.tiny,hue:mon.hue}:null;
  startBattle("stage",mon.stage,{origin:"explore",hp:e.hp,startSub:1+Math.min(4,e.kills[mon.stage]),enemy:night});
}
async function startBossBattle_(){
  if(!X||X.busy)return;
  X.held=null;
  await exSay_([{sprite:"boss_w1",name:"ราชาสไลม์ตัวเลข",pose:"angry",text:"บึ๋ง บึ๋ง! ข้าคือราชาแห่งทุ่งหญ้าจำนวน! ใครกล้ามาท้าทายข้า?!"}]);
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
    else if(pend.monster){e.kills[pend.stage]=(e.kills[pend.stage]||0)+1;X.pending={defeated:pend.monster,kill:pend.stage};if(String(pend.monster).indexOf("night_")===0)NIGHT_STATE.gone[pend.monster.slice(6)]=true}
  }else{
    const sp=EXPLORE_MAPS.village.spawn;e.hp=effMaxHp();e.map="village";e.x=sp.x;e.y=sp.y;
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
