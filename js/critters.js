/* Math Quest V2 — สัตว์เลี้ยงและชาวบ้านเดินได้ 4 ทิศ (ภาพจากชุดฟรี ดู assets/packs/CREDITS.md)
   - ชาวบ้าน: Mana Seed Farmer (Seliel the Shaper) — ประกอบชั้นเสื้อผ้า + เปลี่ยนสีแล้ว เดินได้ 4 ทิศจริง
   - ไก่ ลูกเจี๊ยบ วัว: Farm RPG Tiny Asset Pack — เดินเล่นรอบ ๆ ไม่ขวางทาง */

const PACK_IMG={};
function packImg_(name){if(!PACK_IMG[name]){const i=new Image();i.src="assets/packs/"+name+".png?v=1";PACK_IMG[name]=i}return PACK_IMG[name]}

/* ---- ชาวบ้าน Mana Seed: 15 ช่อง 64×64 — ยืน(ลง ขึ้น ขวา) · เดินลง×3 · เดินขึ้น×3 · เดินขวา×6 ---- */
const MS_SHEETS={ms_villager_f:1,ms_villager_m:1};
const MS_FOOT=43;       // แถวล่างสุดของเท้าในช่อง 64×64
function drawMsChar_(c,key,dir,fx,fy,camX,camY,ent,now){
  const img=packImg_(key);if(!img.complete||!img.naturalWidth)return false;
  const moving=ent&&ent.t<1,k=Math.floor(now/135)%6;
  let cell,flip=false;
  if(!moving)cell=dir==="up"?1:dir==="down"?0:2;
  else if(dir==="down"){cell=3+(k%3);flip=k>=3}
  else if(dir==="up"){cell=6+(k%3);flip=k>=3}
  else cell=9+k;
  if(dir==="left")flip=!flip;
  const x=Math.round(fx*TS+8-camX),y=Math.round(fy*TS+TS-camY);
  c.fillStyle="rgba(0,0,0,.26)";c.beginPath();c.ellipse(x,y-1,6,2.2,0,0,Math.PI*2);c.fill();
  const sc=MS_SCALE[key]||1;
  c.save();c.translate(x,y);c.scale(flip?-sc:sc,sc);c.imageSmoothingEnabled=false;
  c.drawImage(img,cell*64,0,64,64,-32,-MS_FOOT-1,64,64);c.restore();
  return true;
}

/* ---- สัตว์ ---- */
const CRITTER_KIND={
  chicken:{img:"chicken_red",fw:16,fh:16,speed:13,rows:{left:0,right:1}},
  hen:{img:"chicken_blonde",fw:16,fh:16,speed:12,rows:{left:0,right:1}},
  chick:{img:"chick",fw:16,fh:16,speed:10,rows:{left:0,right:1}},
  cow:{img:"cow",fw:32,fh:32,speed:6,rows:{left:0,right:0,down:1,up:2},flipRight:true}
};
// ฝูงสัตว์ของแต่ละแผนที่: [ชนิด, x0, y0, x1, y1 (ช่อง), จำนวน]
const CRITTER_SPAWN={
  village:[["chicken",28,16,37,21,2],["hen",28,16,37,21,1],["chick",28,16,37,21,3],["hen",3,7,10,10,1]],
  field:[["cow",55,13,62,20,2],["chicken",43,2,46,10,1],["hen",43,2,46,10,1],["chick",43,2,46,10,2]]
};
function crittersInit_(){
  X.critters=[];X.critterMap=X.mapId;
  (CRITTER_SPAWN[X.mapId]||[]).forEach(([kind,x0,y0,x1,y1,n])=>{for(let i=0;i<n;i++){
    for(let tries=0;tries<20;tries++){const tx=x0+Math.floor(Math.random()*(x1-x0+1)),ty=y0+Math.floor(Math.random()*(y1-y0+1));
      if(!blocked_(tx,ty)){X.critters.push({kind,x:tx*TS+8,y:ty*TS+14,rx:[x0,x1],ry:[y0,y1],tx:null,ty:null,dir:"left",next:performance.now()+Math.random()*2000,hop:0});break}}}});
}
function critterEnts_(ents,c,camX,camY,now,dt){
  if(X.critterMap!==X.mapId)crittersInit_();
  const sec=Math.min(0.06,dt/1000);
  X.critters.forEach(a=>{
    const K=CRITTER_KIND[a.kind];
    // เดิน: เลือกจุดหมายใหม่เป็นระยะ ๆ · ถ้าช่องข้างหน้าเดินไม่ได้ให้หยุด
    if(a.tx===null&&now>a.next&&!X.busy){
      const tx=a.rx[0]+Math.random()*(a.rx[1]-a.rx[0]+1),ty=a.ry[0]+Math.random()*(a.ry[1]-a.ry[0]+1);
      if(!blocked_(Math.floor(tx),Math.floor(ty))){a.tx=tx*TS;a.ty=ty*TS+6}
      a.next=now+rng(1500,4500);
      if(a.kind!=="cow"&&Math.random()<0.4)a.hop=now;   // ไก่ดีดตัว/จิกพื้น
    }
    if(a.tx!==null){
      const dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy);
      if(d<1.5){a.tx=null}
      else{const nx=a.x+dx/d*K.speed*sec,ny=a.y+dy/d*K.speed*sec;
        if(blocked_(Math.floor(nx/TS),Math.floor((ny-2)/TS))){a.tx=null}else{a.x=nx;a.y=ny}
        a.dir=Math.abs(dx)>=Math.abs(dy)*0.8?(dx<0?"left":"right"):(dy<0?"up":"down");
        if(!K.rows[a.dir])a.dir=dx<0?"left":"right";}
    }
    a.fx=(a.x-8)/TS;a.fy=(a.y-TS)/TS;
    // ผู้เล่นเดินมาใกล้ → ขึ้นฟอง ♥
    if(Math.abs(a.x-(X.p.fx*TS+8))+Math.abs(a.y-(X.p.fy*TS+14))<22&&!(a.seen&&now-a.seen<5000)){a.seen=now;emote_(a,a.kind==="cow"?"♪":"♥",K.fh+2)}
    ents.push({y:a.y/TS-1,draw:()=>{
      const img=packImg_(K.img);if(!img.complete||!img.naturalWidth)return;
      const moving=a.tx!==null,row=K.rows[a.dir]||0,frame=moving?Math.floor(now/(a.kind==="cow"?220:120))%4:(a.kind==="cow"?Math.floor(now/900)%2:0);
      const hopY=a.hop&&now-a.hop<300?Math.sin((now-a.hop)/300*Math.PI)*2:0;
      const x=Math.round(a.x-camX),y=Math.round(a.y-camY);
      c.fillStyle="rgba(0,0,0,.22)";c.beginPath();c.ellipse(x,y,K.fw*0.32,1.6,0,0,Math.PI*2);c.fill();
      c.save();c.translate(x,Math.round(y-hopY));if(K.flipRight&&a.dir==="right")c.scale(-1,1);c.imageSmoothingEnabled=false;
      c.drawImage(img,frame*K.fw,row*K.fh,K.fw,K.fh,-K.fw/2,-K.fh+1,K.fw,K.fh);c.restore();
      grassOver_(c,a.fx,a.fy,camX,camY,now)}});
  });
}
// รูปหน้าชาวบ้านสำหรับกล่องบทสนทนา (ตัดจากช่องยืนหันหน้า)
const MS_FACE={};
function msFaceURL_(key){
  if(MS_FACE[key])return MS_FACE[key];const img=packImg_(key);if(!img.complete||!img.naturalWidth)return "";
  const cv=document.createElement("canvas");cv.width=cv.height=28;const c=cv.getContext("2d");c.imageSmoothingEnabled=false;
  c.drawImage(img,18,6,28,28,0,0,28,28);return MS_FACE[key]=cv.toDataURL();
}

/* ---- ปีศาจกลางคืน (Tiny RPG Character Asset Pack 02 — Demon_A, Blood Monster_A) ----
   ออกมาเดินในทุ่งเฉพาะตอนกลางคืน · แข็งแรงกว่ามอนสเตอร์ปกติ แต่ให้เหรียญ/EXP มากกว่า · รุ่งเช้าจะหายไป */
const NIGHT_MON={
  demon:{name:"ปีศาจรัตติกาล",frames:{idle:6,walk:8,attack01:7,hurt:4,death:4}},
  blood:{name:"อสูรโลหิต",frames:{idle:6,walk:8,attack01:8,hurt:4,death:4}}
};
const TINY_FOOT=58,TINY_CX=52;
const NIGHT_STATE={day:-1,gone:{}};   // ปีศาจที่ถูกปราบแล้วในคืนนี้
function tinyImg_(kind,anim){return packImg_(kind+"_"+anim)}
// วาดบนแผนที่ (ขนาดจริง 1:1)
function drawTinyMon_(c,m,camX,camY,now){
  const kind=m.night||m.tiny,anim=m.t<1?"walk":"idle",img=tinyTinted_(kind,anim,m.hue||0);if(!img.width&&!img.naturalWidth)return;
  const n=NIGHT_MON[kind].frames[anim],f=Math.floor(now/(anim==="walk"?90:140)+(m.x||0))%n;
  const x=Math.round(m.fx*TS+8-camX),y=Math.round(m.fy*TS+TS-camY);
  c.fillStyle="rgba(0,0,0,.3)";c.beginPath();c.ellipse(x,y-1,7,2.2,0,0,Math.PI*2);c.fill();
  // ปีศาจกลางคืน: แสงแดงเรือง ๆ ให้เห็นในความมืด
  if(m.night){c.globalCompositeOperation="lighter";const g=c.createRadialGradient(x,y-10,0,x,y-10,16);g.addColorStop(0,"rgba(255,60,60,.28)");g.addColorStop(1,"rgba(255,60,60,0)");c.fillStyle=g;c.fillRect(x-16,y-26,32,32);c.globalCompositeOperation="source-over"}
  c.save();c.translate(x,y);if(m.flip)c.scale(-1,1);c.imageSmoothingEnabled=false;
  c.drawImage(img,f*100,0,100,100,-TINY_CX,-TINY_FOOT-1,100,100);c.restore();
}
// เกิด/หายตามช่วงเวลา (เรียกทุกเฟรมจาก updateMonsters_)
function updateNightMons_(now){
  if(!X||X.mapId!=="field"||!X.m.zones)return;
  const {dark}=dayLight_(dayPhase_(now)),night=dark>=0.3,has=X.mons.some(m=>m.night),day=dayIndex_(now);
  if(NIGHT_STATE.day!==day){NIGHT_STATE.day=day;NIGHT_STATE.gone={}}   // คืนใหม่ → ปีศาจกลับมาได้อีก
  if(night&&!has&&!X.nightSpawned){
    X.nightSpawned=true;
    const e=save.explore,zs=X.m.zones.filter((z,i)=>i===0||Object.values(e.open||{}).filter(Boolean).length>=i);   // ทุ่งที่ไปถึงแล้ว
    ["demon","blood"].filter(k=>!NIGHT_STATE.gone[k]).forEach(kind=>{const z=zs[Math.min(zs.length-1,Math.floor(Math.random()*zs.length))];
      for(let tries=0;tries<30;tries++){const x=z.x0+Math.floor(Math.random()*(z.x1-z.x0+1)),y=z.y0+Math.floor(Math.random()*(z.y1-z.y0+1));
        if(!blocked_(x,y)&&!monAt_(x,y)&&Math.abs(x-X.p.x)+Math.abs(y-X.p.y)>5){X.mons.push({id:"night_"+kind,night:kind,stage:z.stage,x,y,fx:x,fy:y,t:1,zone:z,next:now+rng(400,1200)});dust_(x*TS+8,y*TS+TS,4);break}}});
  }
  if(!night){if(has){X.mons.filter(m=>m.night).forEach(m=>dust_(m.x*TS+8,m.y*TS+TS,5));X.mons=X.mons.filter(m=>!m.night)}X.nightSpawned=false}
}

/* ---- ปีศาจในฉากต่อสู้: แอนิเมชันจริง (ยืน · โจมตี · โดนตี · ตาย) ---- */
const TINY_CROP={x:22,y:22,w:62,h:40},TINY_SCALE=4.4;
function tinyBattleStart_(el,kind,hue){
  el.innerHTML="";const cv=document.createElement("canvas");cv.width=TINY_CROP.w;cv.height=TINY_CROP.h;cv.className="tiny-mon";
  cv.style.width=Math.round(TINY_CROP.w*TINY_SCALE)+"px";cv.style.height=Math.round(TINY_CROP.h*TINY_SCALE)+"px";el.appendChild(cv);
  const st={kind,hue:hue||0,anim:"idle",t0:performance.now(),cv};el._tiny=st;
  const tick=()=>{if(el._tiny!==st)return;const now=performance.now(),F=NIGHT_MON[kind].frames;let f=Math.floor((now-st.t0)/110);
    if(st.anim!=="idle"&&f>=F[st.anim]){if(st.anim==="death")f=F.death-1;else{st.anim="idle";st.t0=now;f=0}}
    const img=tinyTinted_(kind,st.anim,st.hue),c=cv.getContext("2d");c.clearRect(0,0,cv.width,cv.height);
    if(img.width||img.naturalWidth){c.save();c.translate(cv.width,0);c.scale(-1,1);c.imageSmoothingEnabled=false;   // หันหน้าเข้าหาผู้เล่น
      c.drawImage(img,(f%F[st.anim])*100+(100-TINY_CROP.x-TINY_CROP.w),TINY_CROP.y,TINY_CROP.w,TINY_CROP.h,0,0,TINY_CROP.w,TINY_CROP.h);c.restore()}
    requestAnimationFrame(tick)};
  tick();
}
function tinyBattleAct_(el,anim){const st=el&&el._tiny;if(!st)return false;st.anim=anim;st.t0=performance.now();return true}

/* ---- ตัวเดินของฮีโร่และ NPC (Mana Seed เปลี่ยนสีให้ตรงกับแต่ละตัวละคร) ---- */
const MS_CHARS=new Set(["student_m","student_f","warrior","warrior_r","mage","mage_b","ninja","ninja_r","archer","archer_b","princess","prince",
  "npc_flag","npc_shop","npc_inn","npc_kid","npc_carpenter","npc_farmer"]);
MS_CHARS.forEach(k=>{MS_SHEETS["ms_"+k]=1});
const MS_SCALE={ms_npc_kid:0.85};
function msKeyFor_(k){if(!k)return null;if(MS_SHEETS[k])return k;const s=k.indexOf("hero:")===0?k.slice(5):k;return MS_CHARS.has(s)?"ms_"+s:null}

/* ---- มอนสเตอร์ในทุ่ง: ปีศาจ/อสูรจากชุด Tiny RPG ย้อมสีตามทุ่ง ---- */
const ZONE_MON={A:{hue:130,short:"บวก"},B:{hue:-75,short:"ลบ"},C:{hue:185,short:"คูณ"},D:{hue:35,short:"หาร"},E:{hue:0,short:"ผสม"}};
const zoneMonName_=(stage,kind)=>((kind||"demon")==="demon"?"ปีศาจ":"อสูร")+(ZONE_MON[stage]?ZONE_MON[stage].short:"");
const TINT={};
// เลื่อนสี (hue) เฉพาะส่วนที่มีสี · ส่วนสีเทา/ดำ/ขาวคงเดิม
function tinyTinted_(kind,anim,hue){
  const base=tinyImg_(kind,anim);if(!hue)return base;if(!base.complete||!base.naturalWidth)return base;
  const key=kind+anim+hue;if(TINT[key])return TINT[key];
  const cv=document.createElement("canvas");cv.width=base.naturalWidth;cv.height=base.naturalHeight;const c=cv.getContext("2d");c.drawImage(base,0,0);
  const id=c.getImageData(0,0,cv.width,cv.height),d=id.data;
  for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;const r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,dl=mx-mn;
    if(dl<0.12)continue;const s=l>0.5?dl/(2-mx-mn):dl/(mx+mn);let h=mx===r?((g-b)/dl)%6:mx===g?(b-r)/dl+2:(r-g)/dl+4;h=((h*60+hue)%360+360)%360;
    const C=(1-Math.abs(2*l-1))*s,X2=C*(1-Math.abs((h/60)%2-1)),m=l-C/2;let rr,gg,bb;
    if(h<60)[rr,gg,bb]=[C,X2,0];else if(h<120)[rr,gg,bb]=[X2,C,0];else if(h<180)[rr,gg,bb]=[0,C,X2];else if(h<240)[rr,gg,bb]=[0,X2,C];else if(h<300)[rr,gg,bb]=[X2,0,C];else [rr,gg,bb]=[C,0,X2];
    d[i]=(rr+m)*255;d[i+1]=(gg+m)*255;d[i+2]=(bb+m)*255}
  c.putImageData(id,0,0);return TINT[key]=cv;
}
