/* Math Quest V2 — ข้อมูลเกม: ดินแดน มอนสเตอร์ บอส ไอเทม และบทพูดครูแฟล็ก */

const MASCOT_DIR="assets/mascot/";
const mascotSrc=mood=>MASCOT_DIR+mood+".png";

// หัวข้อ A–Z และเวลาพื้นฐานต่อด่าน (อ้างอิงจาก V1) — ใช้คำนวณเวลาต่อข้อในฉากต่อสู้
const TOPICS={A:"การบวกจำนวน",B:"การลบจำนวน",C:"การคูณ",D:"การหาร",E:"บวก ลบ คูณ หาร",F:"เศษส่วน",G:"ทศนิยม",H:"ร้อยละ",I:"อัตราส่วน",J:"เลขยกกำลัง",K:"รากที่สอง",L:"สมการเชิงเส้นตัวแปรเดียว",M:"อสมการเชิงเส้นตัวแปรเดียว",N:"ระบบสมการเชิงเส้นสองตัวแปร",O:"พหุนาม",P:"การแยกตัวประกอบพหุนาม",Q:"สมการกำลังสองตัวแปรเดียว",R:"ฟังก์ชัน",S:"กราฟและความชัน",T:"ลำดับและอนุกรม",U:"ความน่าจะเป็น",V:"สถิติ",W:"เรขาคณิต (พื้นที่และปริมาตร)",X:"อัตราส่วนตรีโกณมิติ",Y:"แคลคูลัสเบื้องต้น",Z:"Mathematics Challenge"};
const STAGE_BASE_TIME={A:150,B:150,C:160,D:160,E:170,F:200,G:170,H:180,I:180,J:170,K:180,L:210,M:220,N:260,O:190,P:230,Q:240,R:180,S:180,T:190,U:170,V:200,W:210,X:230,Y:220,Z:250};

// มอนสเตอร์ประจำหัวข้อ
const MONSTERS={
  A:{name:"สไลม์บวก",sprite:"A"},        B:{name:"ค้างคาวลบ",sprite:"B"},
  C:{name:"กระต่ายทวีคูณ",sprite:"C"},    D:{name:"ปูแบ่งก้าม",sprite:"D"},
  E:{name:"หมูป่าสี่เครื่องหมาย",sprite:"E"},
  F:{name:"เห็ดแบ่งเสี้ยว",sprite:"F"},   G:{name:"ผึ้งจุดทศนิยม",sprite:"G"},
  H:{name:"จิ้งจอกลดราคา",sprite:"H"},    I:{name:"นกฮูกสัดส่วน",sprite:"I"},
  J:{name:"แมงป่องยกกำลัง",sprite:"J"},   K:{name:"แมงมุมถอดราก",sprite:"K"},
  L:{name:"หินปริศนา x",sprite:"L"},      M:{name:"หมาป่ามากกว่า-น้อยกว่า",sprite:"M"},
  N:{name:"อินทรีสองตัวแปร",sprite:"N"},
  O:{name:"ซอมบี้พจน์คล้าย",sprite:"O"},  P:{name:"หุ่นกลแยกชิ้น",sprite:"P"},
  Q:{name:"ผีสองราก",sprite:"Q"},
  R:{name:"ปลาปักเป้าฟังก์ชัน",sprite:"R"},S:{name:"ฉลามความชัน",sprite:"S"},
  T:{name:"งูทะเลอนุกรม",sprite:"T"},
  U:{name:"โจ๊กเกอร์สุ่มดวง",sprite:"U"}, V:{name:"หนูนับสถิติ",sprite:"V"},
  W:{name:"โกเลมพื้นที่",sprite:"W"},     X:{name:"นักธนูมุมฉาก",sprite:"X"},
  Y:{name:"พายุอนุพันธ์",sprite:"Y"},     Z:{name:"เงาแห่งทุกหัวข้อ",sprite:"Z"}
};

// 9 ดินแดน — ด่านในดินแดนต้องผ่านตามลำดับ แล้วจึงสู้บอสประจำดินแดน
const WORLDS=[
  {id:"w1",name:"ทุ่งหญ้าจำนวน",icon:"🌾",color:"#22c55e",dark:"#14532d",stages:["A","B","C","D","E"],
   boss:{name:"ราชาสไลม์ตัวเลข",sprite:"boss_w1",title:"ผู้ปกครองทุ่งหญ้า"}},
  {id:"w2",name:"ป่าเศษส่วน",icon:"🌲",color:"#10b981",dark:"#064e3b",stages:["F","G","H","I"],
   boss:{name:"ต้นไม้ยักษ์พันส่วน",sprite:"boss_w2",title:"ผู้พิทักษ์ป่าลึก"}},
  {id:"w3",name:"ถ้ำเลขยกกำลัง",icon:"🕳️",color:"#a855f7",dark:"#3b0764",stages:["J","K"],
   boss:{name:"มังกรเลขชี้กำลัง",sprite:"boss_w3",title:"เจ้าแห่งถ้ำมืด"}},
  {id:"w4",name:"ขุนเขาสมการ",icon:"⛰️",color:"#3b82f6",dark:"#172554",stages:["L","M","N"],
   boss:{name:"ยักษ์ตาชั่ง",sprite:"boss_w4",title:"ผู้รักษาสมดุล"}},
  {id:"w5",name:"หอคอยพหุนาม",icon:"🗼",color:"#8b5cf6",dark:"#2e1065",stages:["O","P","Q"],
   boss:{name:"พ่อมดพหุนาม",sprite:"boss_w5",title:"จอมเวทแยกตัวประกอบ"}},
  {id:"w6",name:"ทะเลฟังก์ชัน",icon:"🌊",color:"#06b6d4",dark:"#083344",stages:["R","S","T"],
   boss:{name:"คราเคนกราฟ",sprite:"boss_w6",title:"อสูรใต้สมุทร"}},
  {id:"w7",name:"ตลาดโชคชะตา",icon:"🎪",color:"#f59e0b",dark:"#451a03",stages:["U","V"],
   boss:{name:"เจ้ามือลูกเต๋า",sprite:"boss_w7",title:"นักพนันแห่งความน่าจะเป็น"}},
  {id:"w8",name:"ปราสาทเรขาคณิต",icon:"🏰",color:"#f43f5e",dark:"#4c0519",stages:["W","X"],
   boss:{name:"อัศวินตรีโกณ",sprite:"boss_w8",title:"ผู้เฝ้าประตูปราสาท"}},
  {id:"w9",name:"บัลลังก์ Z",icon:"⚡",color:"#fbbf24",dark:"#1c1917",stages:["Y","Z"],
   boss:{name:"ครูแฟล็ก ร่างเดือด",sprite:null,title:"บอสใหญ่แห่งดินแดนคณิตศาสตร์",final:true}}
];
const worldOfStage=id=>WORLDS.findIndex(w=>w.stages.includes(id));

// ---- ค่าพลังของผู้เล่นตามเลเวล ----
const PLAYER_MAX_LEVEL=50;
const playerMaxHp=lvl=>100+(lvl-1)*12;
const playerAtk=lvl=>22+(lvl-1)*3;
const xpToNext=lvl=>60+lvl*40;

// ---- ค่าพลังศัตรู ----
function monsterStats(stageId){
  const w=worldOfStage(stageId);
  return {hp:80+w*18,atk:10+w*3,gold:20+w*6,xp:30+w*12};
}
function bossStats(worldIndex){
  if(WORLDS[worldIndex].boss.final)return {hp:720,atk:40,gold:500,xp:600,phases:3};
  return {hp:220+worldIndex*45,atk:16+worldIndex*4,gold:80+worldIndex*25,xp:120+worldIndex*40,phases:2};
}

// ---- ไอเทม ----
const ITEMS={
  potion:{name:"ยาฟื้นพลัง",icon:"🧪",price:30,desc:"ฟื้น HP 40% ของ HP สูงสุด"},
  shield:{name:"โล่ป้องกัน",icon:"🛡️",price:40,desc:"กันการโจมตีครั้งถัดไปได้ 1 ครั้ง"},
  fifty:{name:"ลูกแก้ว 50/50",icon:"🔮",price:25,desc:"ตัดตัวเลือกผิดออก 2 ข้อ"},
  time:{name:"นาฬิกาทราย",icon:"⏳",price:20,desc:"เพิ่มเวลาข้อนี้ +10 วินาที"}
};
const ITEM_ORDER=["potion","shield","fifty","time"];

// ---- บทพูดครูแฟล็ก (mood = ชื่อไฟล์ภาพใน assets/mascot) ----
const INTRO_STORY=[
  {mood:"welcome",text:"สวัสดีนักผจญภัย! ครูแฟล็กเองนะ ยินดีต้อนรับสู่ Math Quest 🫡"},
  {mood:"explain",text:"ตอนนี้ดินแดนคณิตศาสตร์ทั้ง 9 แห่งถูกมอนสเตอร์ตัวเลขยึดไปหมดแล้ว! เธอต้องออกเดินทางไปกู้คืนทีละดินแดน"},
  {mood:"thinking",text:"วิธีสู้ง่ายมาก — ตอบถูก = โจมตี, ตอบเร็ว = คริติคอล 💥 ตอบถูกติดกันยิ่งแรงขึ้น แต่ถ้าตอบผิดหรือหมดเวลา มอนสเตอร์จะสวนกลับ!"},
  {mood:"remind",text:"ชนะแล้วได้เหรียญกับ EXP เอาเหรียญไปซื้อยาและไอเทมที่ร้านค้าได้ อย่าลืมพกติดตัวไว้ใช้ตอนคับขันนะ"},
  {mood:"determined",text:"ทุกดินแดนมีบอสเฝ้าอยู่... และเมื่อผ่านครบหมด ครูจะรอเธออยู่ที่บัลลังก์ Z เตรียมตัวให้ดีล่ะ!"}
];
const LINES={
  win:[{mood:"happy",text:"เยี่ยมมาก! คิดเลขคล่องขึ้นเยอะเลยนะ"},{mood:"excited",text:"สุดยอด! มอนสเตอร์ไม่มีทางสู้เลย!"},{mood:"celebrate",text:"ชนะแล้ว! ไปด่านต่อไปกันเลย 🎉"}],
  perfect:[{mood:"celebrate",text:"3 ดาวเต็ม! แทบไม่โดนโจมตีเลย ครูภูมิใจมาก ⭐⭐⭐"},{mood:"excited",text:"ไร้รอยขีดข่วน! แบบนี้ต้องเรียกว่าเซียน"}],
  lose:[{mood:"sad",text:"ไม่เป็นไรนะ แพ้แล้วลุกใหม่ได้เสมอ ลองอ่านวิธีคิดข้อที่พลาดก่อนแล้วค่อยสู้ใหม่"},{mood:"remind",text:"อย่าลืมซื้อยาฟื้นพลังติดตัวไว้นะ แล้วลองกลับไปสู้ใหม่!"},{mood:"homework",text:"การบ้านจากครู: ทบทวนข้อที่ผิดด้านล่าง แล้วกลับมาแก้มือ!"}],
  bossIntro:[{mood:"determined",text:"ระวังให้ดี! บอสจะชาร์จพลังเป็นระยะ ถ้าตอบถูกตอนมันชาร์จ จะขัดจังหวะมันได้"},{mood:"explain",text:"บอสมี 2 ร่าง พอ HP เหลือครึ่งมันจะคลั่งและโจมตีแรงขึ้น ตั้งสติไว้นะ"}],
  hint:[{mood:"explain",text:""},{mood:"thinking",text:""}],
  lowHp:{mood:"shocked",text:"HP ใกล้หมดแล้ว! ใช้ยาฟื้นพลังเร็ว!"},
  levelUp:{mood:"excited",text:"เลเวลอัป! HP และพลังโจมตีเพิ่มขึ้นแล้ว 💪"},
  shopHello:{mood:"wave",text:"ร้านค้าของครูแฟล็ก ยินดีต้อนรับ! เลือกของที่ช่วยให้รอดได้เลย"},
  mapHello:[{mood:"hello",text:"พร้อมผจญภัยต่อหรือยัง? แตะด่านที่ปลดล็อกแล้วเพื่อเริ่มสู้"},{mood:"neutral",text:"ด่านไหนได้ดาวไม่ครบ ลองกลับไปเก็บให้ครบ 3 ดาวนะ"},{mood:"remind",text:"ฝึกทุกวัน สมองจะคล่องขึ้นเรื่อย ๆ 🔥"}],
  worldClear:{mood:"celebrate",text:"กู้คืนดินแดนสำเร็จ! ดินแดนใหม่เปิดแล้ว ไปต่อกันเลย!"}
};
// บอสใหญ่ (ครูแฟล็ก) — แต่ละเฟสใช้ภาพและบทพูดต่างกัน
const FINAL_BOSS_PHASES=[
  {mood:"determined",text:"มาถึงจนได้นะ... ถ้าอยากผ่านบัลลังก์ Z ต้องชนะครูให้ได้ก่อน!"},
  {mood:"angry",text:"ไม่เลวนี่! งั้นครูจะเอาจริงแล้ว — โจทย์ทุกหัวข้อจะมาพร้อมกัน!"},
  {mood:"furious",text:"ร่างเดือดเต็มพลัง!! เวลาจะน้อยลง ลองดูซิว่าจะรับไหว!"}
];
const FINAL_VICTORY=[
  {mood:"shocked",text:"ไม่อยากเชื่อ... เธอชนะครูได้จริง ๆ!"},
  {mood:"shy",text:"จริง ๆ แล้วครูแค่อยากให้เธอเก่งขึ้นเท่านั้นเองแหละ... 😳"},
  {mood:"celebrate",text:"ขอแสดงความยินดี! เธอคือ ตำนานนักคณิตศาสตร์ แห่ง Math Quest! 🏆"}
];

// ฉายาตามเลเวล
const HERO_TITLES=[[1,"นักผจญภัยฝึกหัด"],[5,"นักสู้ตัวเลข"],[10,"อัศวินสมการ"],[18,"จอมเวทคณิต"],[26,"ผู้พิชิตดินแดน"],[35,"ตำนานนักคณิตศาสตร์"]];
const heroTitle=lvl=>{let t=HERO_TITLES[0][1];HERO_TITLES.forEach(([m,n])=>{if(lvl>=m)t=n});return t};

// ตัวละครผู้เล่นเป็นภาพพิกเซลใน js/sprites.js (HERO_CLASSES)
const AVATARS=HERO_KEYS;
