/* Math Quest V2 — เข้าไปในบ้านได้ (เฟอร์นิเจอร์จาก Farm RPG Tiny Asset Pack: assets/packs/farm_interior.png)
   ร้านค้า · โรงแรม (นอนพักฟื้น HP) · โรงเรียน (กระดานดำมีเคล็ดลับ) · บ้านน้องต้นกล้า (จดหมายปริศนา)
   เดินชนประตูหรือกด A ที่ประตูเพื่อเข้า · เดินออกทางพรมหน้าประตูเพื่อกลับหมู่บ้าน */

// ชิ้นเฟอร์นิเจอร์: s = [x,y,w,h] ในแผ่นภาพ · w,h = จำนวนช่องที่ตั้งอยู่ · floor = พรม (เดินทับได้) · wall = ของติดผนัง
const INT_PROPS={
  bed_v:{s:[87,8,18,34],w:1,h:2}, bed_h:{s:[80,52,32,24],w:2,h:1}, fireplace:{s:[115,8,26,40],w:2,h:1},
  table:{s:[68,120,24,23],w:2,h:1}, chair_f:{s:[2,125,11,18]}, chair_b:{s:[18,127,11,16]}, chair_l:{s:[35,125,10,18]}, chair_r:{s:[51,125,10,18]},
  drawer0:{s:[96,120,16,18]}, drawer1:{s:[112,120,16,18]}, drawer2:{s:[128,120,16,18]}, drawer3:{s:[144,120,16,18]},
  plant:{s:[4,1,8,15]}, tree:{s:[34,0,11,16]}, rug:{s:[0,82,48,30],w:3,h:2,floor:true},
  window:{s:[1,48,14,16],wall:true}, curtain:{s:[16,47,16,17],wall:true}, clock:{s:[1,18,13,13],wall:true},
  frame:{s:[18,18,13,13],wall:true}, painting:{s:[18,1,12,15],wall:true}
};
const INT_ROWS=["##########","##########","#________#","#________#","#________#","#________#","#________#","#####e####"];
const INTERIORS={
  shop_in:{name:"ร้านค้าป้าแม่ค้า",door:{x:5,y:5},
    npcs:[{id:"shop",x:5,y:3,sprite:"npc_shop",name:"ป้าแม่ค้า",dir:"down"}],
    props:[{k:"window",px:24,py:6},{k:"clock",px:118,py:9},{k:"frame",px:74,py:8},
      {k:"drawer1",x:1,y:2},{k:"drawer3",x:2,y:2},{k:"tree",x:8,y:2},
      {k:"drawer0",x:3,y:4,act:"shop"},{k:"drawer2",x:4,y:4,act:"shop"},{k:"drawer0",x:5,y:4,act:"shop"},{k:"drawer2",x:6,y:4,act:"shop"},
      {k:"plant",x:1,y:6},{k:"plant",x:8,y:6}]},
  inn_in:{name:"โรงแรมหมู่บ้าน",door:{x:24,y:5},
    npcs:[{id:"inn",x:8,y:4,sprite:"npc_inn",name:"เจ้าของโรงแรม",dir:"left"}],
    props:[{k:"window",px:24,py:6},{k:"painting",px:58,py:7},{k:"clock",px:130,py:9},
      {k:"bed_v",x:1,y:2,act:"rest"},{k:"bed_v",x:3,y:2,act:"rest"},{k:"fireplace",x:6,y:2},{k:"tree",x:8,y:2},
      {k:"rug",x:3,y:5},{k:"plant",x:1,y:6}]},
  school_in:{name:"โรงเรียนของครูแฟล็ก",door:{x:14,y:5},board:[3,6],
    props:[{k:"clock",px:130,py:9},{k:"window",px:18,py:6},
      {k:"drawer1",x:8,y:2},{k:"plant",x:1,y:2},
      {k:"table",x:2,y:4},{k:"table",x:6,y:4},{k:"chair_b",x:2,y:5},{k:"chair_b",x:3,y:5},{k:"chair_b",x:6,y:5},{k:"chair_b",x:7,y:5},
      {k:"tree",x:8,y:6},{k:"plant",x:1,y:6}]},
  house_in:{name:"บ้านน้องต้นกล้า",door:{x:33,y:5},
    props:[{k:"window",px:56,py:6},{k:"curtain",px:55,py:5},{k:"painting",px:26,py:7},{k:"frame",px:92,py:8},
      {k:"bed_h",x:1,y:2,act:"rest"},{k:"fireplace",x:7,y:2},{k:"table",x:4,y:4,act:"note"},{k:"chair_r",x:3,y:4},{k:"chair_l",x:6,y:4},
      {k:"rug",x:3,y:5},{k:"plant",x:1,y:6},{k:"tree",x:8,y:6}]}
};
// สร้างแผนที่ในบ้าน + ย้ายป้าแม่ค้า/เจ้าของโรงแรมเข้าไปอยู่ในบ้าน
(function(){
  Object.entries(INTERIORS).forEach(([id,d])=>{
    EXPLORE_MAPS[id]={name:d.name,rows:INT_ROWS,interior:true,spawn:{x:5,y:6},npcs:d.npcs||[],props:d.props,board:d.board,
      warps:[{x:5,y:7,to:"village",tx:d.door.x,ty:d.door.y+1,dir:"down"}]};
  });
  const v=EXPLORE_MAPS.village;v.npcs=v.npcs.filter(n=>n.id!=="shop"&&n.id!=="inn");
  v.doors.forEach(dr=>{const hit=Object.entries(INTERIORS).find(([,d])=>d.door.x===dr.x&&d.door.y===dr.y);if(hit)dr.inside=hit[0]});
})();

function interiorImg_(){return packImg_("farm_interior")}
// ช่องที่เฟอร์นิเจอร์ตั้งอยู่ (เดินผ่านไม่ได้)
function propCells_(m){const cells={};(m.props||[]).forEach(p=>{const d=INT_PROPS[p.k];if(!d||d.wall||d.floor)return;
  for(let j=0;j<(d.h||1);j++)for(let i=0;i<(d.w||1);i++)cells[(p.x+i)+","+(p.y+j)]=p});return cells}
function propAt_(x,y){return X&&X.propCells?X.propCells[x+","+y]:null}
function drawPropImg_(c,p,ox,oy){
  const d=INT_PROPS[p.k],[sx,sy,sw,sh]=d.s,img=interiorImg_();if(!img.complete||!img.naturalWidth)return;
  if(d.wall){c.drawImage(img,sx,sy,sw,sh,p.px+ox,p.py+oy,sw,sh);return}
  const w=(d.w||1)*TS,h=(d.h||1)*TS,dx=p.x*TS+Math.round((w-sw)/2),dy=(p.y*TS+h)-sh;
  c.drawImage(img,sx,sy,sw,sh,dx+ox,dy+oy,sw,sh);
}
// ของติดผนังและพรม วาดลงพื้นครั้งเดียว · กระดานดำวาดเอง
function paintInteriorBase_(c,m){
  if(m.board){const [a,b]=m.board,x0=a*TS+2,w=(b-a+1)*TS-4;
    c.fillStyle="#5a3420";c.fillRect(x0-2,5,w+4,22);c.fillStyle="#2f5a3e";c.fillRect(x0,7,w,17);c.fillStyle="#3a6a4a";c.fillRect(x0,7,w,2);
    c.fillStyle="#e8f0e8";c.font="7px monospace";c.textBaseline="top";c.fillText("7x8=56",x0+4,10);c.fillText("12+9=21",x0+w/2+2,16);
    c.fillStyle="#d8d0c0";c.fillRect(x0+w-12,24,8,2);c.fillStyle="#f8f8f8";c.fillRect(x0+6,24,5,1)}
  (m.props||[]).forEach(p=>{const d=INT_PROPS[p.k];if(d&&(d.wall||d.floor))drawPropImg_(c,p,0,0)});
}
// เฟอร์นิเจอร์ตั้งพื้น เป็นวัตถุเรียงหน้า-หลังกับตัวละคร
function interiorEnts_(ents,c,camX,camY){
  (X.m.props||[]).forEach(p=>{const d=INT_PROPS[p.k];if(!d||d.wall||d.floor)return;
    ents.push({y:p.y+(d.h||1)-1+0.3,draw:()=>drawPropImg_(c,p,-camX,-camY)})});
}
// แสงไฟในบ้าน: เตาผิงกระพริบ
function interiorLight_(c,camX,camY,now){
  (X.m.props||[]).forEach(p=>{if(p.k!=="fireplace")return;const x=p.x*TS+16-camX,y=p.y*TS+8-camY,f=0.25+0.08*Math.sin(now/90)+0.05*Math.sin(now/37);
    c.globalCompositeOperation="lighter";const g=c.createRadialGradient(x,y,0,x,y,44);g.addColorStop(0,`rgba(255,150,60,${f})`);g.addColorStop(1,"rgba(255,150,60,0)");c.fillStyle=g;c.fillRect(x-44,y-44,88,88);c.globalCompositeOperation="source-over"});
}
function enterDoor_(door){
  if(!door||!door.inside||X.busy)return false;
  SFX.click();save.explore.dir="up";
  warpTo_({to:door.inside,tx:5,ty:6,dir:"up"});return true;
}
// ใช้ของในบ้าน: เตียง = นอนพัก · โต๊ะ = จดหมายปริศนา · เคาน์เตอร์ = คุยกับป้าแม่ค้า
async function usePropAct_(p){
  const e=save.explore;
  if(p.act==="shop"){const n=X.npcs.find(n=>n.id==="shop");if(n)return talkNpc_(n)}
  if(p.act==="rest"){
    X.busy=true;const wrap=$("ex-wrap");wrap.classList.add("fade");SFX.heal();await sleep(700);
    e.hp=effMaxHp();persist();updateExHud_();wrap.classList.remove("fade");X.busy=false;
    return exSay_([{sprite:"hero:"+heroKey(save.avatar),name:save.name,pose:"happy",text:"ฮ้าว~ นอนพักจนสดชื่นแล้ว! HP เต็มแล้ว 💤"}]);
  }
  if(p.act==="note"){
    e.flags=e.flags||{};
    if(e.flags.houseNote)return exSay_([{sprite:"obj_sign",name:"จดหมายบนโต๊ะ",text:"จดหมายของแม่น้องต้นกล้า เธอช่วยตอบไปแล้ว ขอบคุณมากนะ!"}]);
    const ok=await askNumber({title:"✉️ จดหมายบนโต๊ะ",text:"\"ต้นกล้าจ๋า แม่ให้ค่าขนมวันละ 5 เหรียญ ครบ 1 สัปดาห์ (7 วัน) ลูกจะได้ทั้งหมดกี่เหรียญ? ถ้าตอบถูก แม่มีรางวัลให้ในลิ้นชักนะ\"",answer:35,hint:"5 × 7 = ? (หรือบวก 5 ไปเรื่อย ๆ 7 ครั้ง)"});
    if(!ok)return;e.flags.houseNote=true;save.gold+=25;save.items.potion=(save.items.potion||0)+1;persist();updateExHud_();SFX.coin();
    return exSay_([{mood:"happy",text:"เก่งมาก! ในลิ้นชักมีเหรียญ 🪙 25 กับ 🧪 ยาฟื้นพลัง 1 ขวด — แม่ของน้องต้นกล้าบอกว่าให้เธอเป็นรางวัล"}]);
  }
}
function boardTip_(){
  return exSay_([{mood:"explain",text:pickOne([
    "เคล็ดลับคูณ 9: ตัวเลขสองหลักของคำตอบจะบวกกันได้ 9 เสมอ เช่น 9×7=63 → 6+3=9",
    "บวกเลขให้เร็ว: ปัดให้เป็นสิบก่อน เช่น 38+27 = 40+27−2 = 65",
    "การหารคือการแบ่งเท่า ๆ กัน ถ้าจำสูตรคูณได้ การหารจะง่ายมาก เช่น 56÷8 → 8×? = 56 → 7",
    "ลบเลขที่ต้องยืม: 52−18 ให้คิดเป็น 52−20+2 = 34",
    "พื้นที่สี่เหลี่ยม = กว้าง × ยาว นับแผ่นหินทีละแถวก็ได้ แต่คูณเร็วกว่า!"])}]);
}
