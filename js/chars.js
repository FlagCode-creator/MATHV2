/* Math Quest V2 — ตัวละครเดินได้ 4 ทิศ (16×24 พิกเซล, ทิศละ 3 เฟรม)
   ประกอบจากชั้น: ร่างพื้นฐาน + ทรงผม/หมวก + เสื้อผ้า แล้วใส่สีตามอาชีพ
   ตัวอักษรในแม่แบบ: H/h=ผม(เงา) s/S=ผิว(เงา) k=ตา w=ขาว m=แก้ม R=ปาก C/c=เสื้อ(เงา) A/a=ลาย D/d=กางเกง(เงา) F=รองเท้า
                     T/t=หมวก(เงา) Y=ทอง B=เครา/ผ้าคลุมหน้า */

const CHAR_W=16,CHAR_H=24;
const CHAR_BASE={
  down:[
"................","......HHHH......","....HHHHHHHH....","...HHHHHHHHHH...",
"..HHHHHHHHHHHH..","..HHhHHHHHHhHH..","..HhssHHHHsshH..","..HssssssssssH..",
"..HsskwsskwssH..","..HsskksskkssH..","..HsmssssssmsH..","...SsssRRsssS...",
"....SSssssSS....","....cCwsswCc....","...cCCCAACCCc...","..scCCCAACCCcs..",
"..scCCCAACCCcs..","..sscCCCCCCcss..","....cCCCCCCc....","....DDDDDDDD....",
"....DDDddDDD....","....DDD..DDD....","....dDD..DDd....","...FFFF..FFFF..."],
  up:[
"................","......HHHH......","....HHHHHHHH....","...HHHHHHHHHH...",
"..HHHHHHHHHHHH..","..HHHHhHHhHHHH..","..HHHhHHHHhHHH..","..HHHHHHHHHHHH..",
"..HhHHHHHHHHhH..","..HHhHHHHHHhHH..","..HHHHHHHHHHHH..","...hHHHHHHHHh...",
"....SSssssSS....","....cCCCCCCc....","...cCCCCCCCCc...","..scCCCCCCCCcs..",
"..scCCCCCCCCcs..","..sscCCCCCCcss..","....cCCCCCCc....","....DDDDDDDD....",
"....DDDddDDD....","....DDD..DDD....","....dDD..DDd....","...FFFF..FFFF..."],
  side:[
"................",".....HHHHH......","....HHHHHHHH....","...HHHHHHHHHH...",
"...HHHHHHHHHHH..","...HHHHHHHhHHH..","...HHHHHhssshH..","...HHHHsssssss..",
"...HHHssssskwss.","...HHHssssskkss.","...hHHsssssmss..","....hHSssssRs...",
".....SSsssSS....",".....cCCwCCc....","....cCCCCCCc....","....cCCCCCCsc...",
"....cCCCCCCsc...","....cCCCCCCcc...",".....cCCCCCc....",".....DDDDDD.....",
".....DDddDD.....",".....DDDDDD.....","......dDDd......","......FFFFF....."]
};
// ขาตอนก้าวเดิน (แทนแถว 21–23)
const CHAR_LEGS={
  down:{a:["....DDD..DDD....","....FFF..DDd....",".........FFFF..."],b:["....DDD..DDD....","....dDD..FFF....","...FFFF........."]},
  up:{a:["....DDD..DDD....","....FFF..DDd....",".........FFFF..."],b:["....DDD..DDD....","....dDD..FFF....","...FFFF........."]},
  side:{a:[".....DD..DD.....","....dD....Dd....","...FFF....FFF..."],b:[".....DD..DD.....","....dD....Dd....","...FFF....FFF..."]}
};
// ทรงผม/หมวก/เครื่องแต่งกาย: ทับแม่แบบ ("." = ไม่เปลี่ยน)
const CHAR_STYLES={
  long:{down:{11:".HH..........HH.",12:".HH..........HH.",13:".HH..........HH.",14:"..H..........H.."},
        up:{11:"..HHHHHHHHHHHH..",12:"..HHHHHHHHHHHH..",13:"...HHHHHHHHHH...",14:"....HHHHHHHH...."},
        side:{11:"..HHH...........",12:"..HHH...........",13:"..HH............",14:"...H............"}},
  helmet:{down:{0:".......AA.......",1:"......TTTT......",6:"..TtssTTTTsstT..",7:"..TssssssssssT.."},
          up:{0:".......AA.......",1:"......TTTT......"},
          side:{0:"......AA........",1:".....TTTTT......"}},
  wizard:{down:{0:"........TT......",1:".......TTT......",2:"......TTTTT.....",3:".....TTTYTTT....",4:"..TTTTTTTTTTTT..",5:".TTTTTTTTTTTTTT.",11:"...SwwwwwwwwS...",12:"....wwwwwwww....",13:"....cwwwwwwc....",14:"...cCwwwwwwCc...",15:"..scCCwwwwCCcs.."},
          up:{0:"........TT......",1:".......TTT......",2:"......TTTTT.....",3:".....TTTTTTT....",4:"..TTTTTTTTTTTT..",5:".TTTTTTTTTTTTTT."},
          side:{0:".......TT.......",1:"......TTT.......",2:".....TTTTT......",3:"....TTTYTTT.....",4:"..TTTTTTTTTTTT..",5:".TTTTTTTTTTTTTT.",11:"....hHSwwwwwww..",12:".....SSwwwww....",13:".....cCwwwCc...."}},
  hood:{down:{10:"..HHHHHHHHHHHH..",11:"...HHHHHHHHHH...",12:"....hHHHHHHh...."},
        up:{},
        side:{10:"...hHHHHHHHHHH..",11:"....hHHHHHHHH...",12:".....hHHHHH....."}},
  crown:{down:{0:"....Y.Y..Y.Y....",1:"....YYYYYYYY...."},up:{0:"....Y.Y..Y.Y....",1:"....YYYYYYYY...."},side:{0:"....Y.Y.Y.......",1:"....YYYYYY......"}},
  hardhat:{down:{1:"......TTTT......",2:"....TTTTTTTT....",3:"...TTTTTTTTTT...",4:"..TTTTTTTTTTTT..",5:".tTTTTTTTTTTTTt."},
           up:{1:"......TTTT......",2:"....TTTTTTTT....",3:"...TTTTTTTTTT...",4:"..TTTTTTTTTTTT..",5:".tTTTTTTTTTTTTt."},
           side:{1:".....TTTTT......",2:"....TTTTTTTT....",3:"...TTTTTTTTTT...",4:"...TTTTTTTTTTT..",5:"..tTTTTTTTTTTTTT"}},
  strawhat:{down:{2:"....TTTTTTTT....",3:"...TTTTTTTTTT...",4:"...TtttttttttT..",5:"TTTTTTTTTTTTTTTT"},
            up:{2:"....TTTTTTTT....",3:"...TTTTTTTTTT...",4:"...TtttttttttT..",5:"TTTTTTTTTTTTTTTT"},
            side:{2:"....TTTTTTTT....",3:"...TTTTTTTTTT...",4:"...TtttttttttT..",5:".TTTTTTTTTTTTTTT"}},
  // เครื่องแต่งกายช่วงล่าง
  skirt:{all:{19:"...DDDDDDDDDD...",20:"...DDdDDDDdDD...",21:"..DDDDDDDDDDDD.."},legs:"skin"},
  robe:{all:{19:"....CCCCCCCC....",20:"...cCCCCCCCCc...",21:"...cCCCCCCCCc...",22:"...cCCCCCCCCc..."},legs:"robe"},
  apron:{down:{14:"...cCwwwwwwCc...",15:"..scCwwwwwwCcs..",16:"..scCwwwwwwCcs..",17:"..sscwwwwwwcss..",18:"....wwwwwwww...."}},
  epaulet:{down:{13:"...YcCwsswCcY...",14:"..YcCCAAAACCcY.."},side:{13:"....YcCCwCCc...."}}
};

// สีของแต่ละอาชีพ/NPC (hex) — เงาคำนวณอัตโนมัติ
const SKIN="#f2c29b";
const CHAR_SPECS={
  student_m:{hair:"#2b2433",cloth:"#f4f6fb",accent:"#2f6fd6",pants:"#27335e",shoes:"#1c1a24",styles:[]},
  student_f:{hair:"#2b2433",cloth:"#f4f6fb",accent:"#2f6fd6",pants:"#27335e",shoes:"#1c1a24",styles:["long","skirt"]},
  warrior:{hair:"#c7d0e0",hat:"#c7d0e0",accent:"#e43b44",cloth:"#3a78c9",pants:"#2a3d66",shoes:"#5a3a28",styles:["helmet"]},
  warrior_r:{hair:"#c7d0e0",hat:"#c7d0e0",accent:"#fee761",cloth:"#c93a3a",pants:"#6e2430",shoes:"#5a3a28",styles:["helmet"]},
  mage:{hair:"#d8d8e8",hat:"#6a3fa0",accent:"#fee761",cloth:"#7c4bb8",pants:"#5a3488",shoes:"#3a2a50",beard:"#f4f4fa",styles:["wizard","robe"]},
  mage_b:{hair:"#d8d8e8",hat:"#2a5aa8",accent:"#7ee8ff",cloth:"#3568c0",pants:"#244a90",shoes:"#2a2a50",beard:"#f4f4fa",styles:["wizard","robe"]},
  ninja:{hair:"#3a4466",cloth:"#3a4466",accent:"#e43b44",pants:"#2c3350",shoes:"#181425",styles:["hood"]},
  ninja_r:{hair:"#8a2230",cloth:"#a22633",accent:"#181425",pants:"#3a1a24",shoes:"#181425",styles:["hood"]},
  archer:{hair:"#3e8948",cloth:"#4a9a4f",accent:"#8a5a3a",pants:"#6b4a2b",shoes:"#4a3020",styles:["hood"]},
  archer_b:{hair:"#8a5a3a",cloth:"#a8703f",accent:"#fee761",pants:"#2f5a3a",shoes:"#4a3020",styles:[]},
  princess:{hair:"#f6d860",cloth:"#f07aa8",accent:"#ffffff",pants:"#f07aa8",shoes:"#c04a80",gold:"#fee761",styles:["long","crown","skirt"]},
  prince:{hair:"#f6d860",cloth:"#2f6fd6",accent:"#fee761",pants:"#eef2ff",shoes:"#5a3a28",gold:"#fee761",styles:["crown"]},
  npc_flag:{hair:"#211c2b",cloth:"#c2a35a",accent:"#fee761",pants:"#9c8246",shoes:"#1c1a24",gold:"#fee761",styles:["epaulet"]},
  npc_shop:{hair:"#8a5a3a",cloth:"#5da83f",accent:"#ffffff",pants:"#6b4a2b",shoes:"#4a3020",styles:["apron"]},
  npc_inn:{hair:"#f6c860",cloth:"#e87aa0",accent:"#ffffff",pants:"#b84a78",shoes:"#6b3a50",styles:["long","skirt"]},
  npc_carpenter:{hair:"#6b4a2b",hat:"#fec640",cloth:"#f08a3a",accent:"#8a5a3a",pants:"#2f4f8a",shoes:"#4a3020",styles:["hardhat"]},
  npc_farmer:{hair:"#6b4a2b",hat:"#e8c878",cloth:"#3f7fc9",accent:"#8a5a3a",pants:"#8a6a45",shoes:"#4a3020",styles:["strawhat"]},
  npc_kid:{hair:"#e07a2a",cloth:"#e24a4a",accent:"#fee761",pants:"#2f4f8a",shoes:"#1c1a24",styles:[]}
};

function shadeHex_(hex,t){const c=hexToRgb_(hex).map(v=>Math.round(v*(1-t)));return "#"+c.map(v=>v.toString(16).padStart(2,"0")).join("")}
function charColors_(spec){
  const hat=spec.hat||spec.hair;
  return {H:spec.hair,h:shadeHex_(spec.hair,0.25),s:SKIN,S:shadeHex_(SKIN,0.16),k:"#181425",w:"#ffffff",m:"#f6a0a0",R:"#b0303c",
    C:spec.cloth,c:shadeHex_(spec.cloth,0.22),A:spec.accent,a:shadeHex_(spec.accent,0.22),D:spec.pants,d:shadeHex_(spec.pants,0.22),
    F:spec.shoes,T:hat,t:shadeHex_(hat,0.22),Y:spec.gold||"#fee761"};
}
const overlay_=(row,ov)=>[...row].map((ch,i)=>ov[i]&&ov[i]!=="."?ov[i]:ch).join("");
// สร้างตารางสีของเฟรม: dir = down/up/side, frame = 0 (ยืน) 1 (ก้าวซ้าย) 2 (ก้าวขวา)
function charGrid_(key,dir,frame){
  const spec=CHAR_SPECS[key]||CHAR_SPECS.student_m,col=charColors_(spec);
  let rows=CHAR_BASE[dir].slice();
  if(frame){const legs=CHAR_LEGS[dir][frame===1?"a":"b"];rows[21]=legs[0];rows[22]=legs[1];rows[23]=legs[2]}
  let legsMode=null;
  (spec.styles||[]).forEach(st=>{
    const S=CHAR_STYLES[st];if(!S)return;
    const ov=Object.assign({},S.all||{},S[dir]||{});
    Object.entries(ov).forEach(([i,r])=>{rows[+i]=overlay_(rows[+i],r)});
    if(S.legs)legsMode=S.legs;
  });
  if(legsMode==="skin")for(let i=22;i<24;i++)rows[i]=rows[i].replace(/D/g,"s").replace(/d/g,"S");
  if(legsMode==="robe")rows[23]=rows[23].replace(/F/g,frame?"F":"F");
  if(spec.beard)col.w=spec.beard;
  return rows.map(r=>[...r].map(ch=>ch==="."?null:(col[ch]||null)));
}

/* ---- ตัววาดกริดสี: เส้นขอบแบบ "selective outline" (สีเข้มของพิกเซลข้าง ๆ) + แสงเงาเบา ๆ ---- */
function gridCanvas_(grid,opts){
  opts=opts||{};
  const h=grid.length,w=Math.max(...grid.map(r=>r.length)),pad=1;
  const at=(x,y)=>(y>=0&&y<h&&x>=0&&x<w)?grid[y][x]:null;
  const cv=document.createElement("canvas");cv.width=w+pad*2;cv.height=h+pad*2;
  const ctx=cv.getContext("2d"),img=ctx.createImageData(cv.width,cv.height),d=img.data;
  const put=(x,y,rgb)=>{const i=((y+pad)*cv.width+(x+pad))*4;d[i]=rgb[0];d[i+1]=rgb[1];d[i+2]=rgb[2];d[i+3]=255};
  const ink=[24,20,37],white=[255,255,255],black=[10,6,24];
  for(let y=-1;y<=h;y++)for(let x=-1;x<=w;x++){
    const c=at(x,y);
    if(c){
      let rgb=hexToRgb_(c);
      if(opts.shade!==false&&c!=="#181425"){
        if(!at(x,y+1))rgb=mix_(rgb,black,0.28);
        else if(!at(x,y-1))rgb=mix_(rgb,white,0.22);
      }
      put(x,y,rgb);
    }else{
      const n=at(x,y+1)||at(x,y-1)||at(x-1,y)||at(x+1,y);
      if(n)put(x,y,mix_(hexToRgb_(n),ink,0.78));
    }
  }
  ctx.putImageData(img,0,0);
  return cv;
}
const CHAR_CACHE={};
// คืน canvas ของเฟรม (dir: down/up/left/right) — ซ้าย = กลับด้านของขวา
function charFrame(key,dir,frame){
  const id=key+"|"+dir+"|"+frame;
  if(CHAR_CACHE[id])return CHAR_CACHE[id];
  if(typeof customCharFrame==="function"){const cc=customCharFrame(key,dir,frame);if(cc)return CHAR_CACHE[id]=cc}
  const base=dir==="left"||dir==="right"?"side":dir;
  let cv=gridCanvas_(charGrid_(key,base,frame));
  if(dir==="left"){const f=document.createElement("canvas");f.width=cv.width;f.height=cv.height;const c=f.getContext("2d");c.translate(f.width,0);c.scale(-1,1);c.drawImage(cv,0,0);cv=f}
  return CHAR_CACHE[id]=cv;
}
// key ของตัวละครจากอวตาร / NPC
function charKeyFor(spriteKey){
  if(spriteKey&&spriteKey.indexOf("hero:")===0)return spriteKey.slice(5);
  return CHAR_SPECS[spriteKey]?spriteKey:null;
}
