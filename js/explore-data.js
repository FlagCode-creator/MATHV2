/* Math Quest V2 — ข้อมูลโหมดผจญภัย (ดินแดนที่ 1: ทุ่งหญ้าจำนวน · แผนที่แนวนอน)
   แผนที่เขียนเป็นตัวอักษร 1 ตัว = 1 ช่อง (16×16 พิกเซล) — สร้างจากสคริปต์ออกแบบด่าน แก้ตำแหน่งได้โดยตรง
   .=หญ้า ,=หญ้ามีดอก v=หญ้าสูง :=ทางเดิน p=ลานหิน ~=น้ำ ==สะพาน b=สะพานพัง _=พื้นหิน #=กำแพงหิน
   T=ต้นไม้ o=ก้อนหิน f=รั้ว s=ป้าย k=แผ่นหินสลัก c=หีบ G=ประตูปริศนา n=แครอท u=ทานตะวัน w=บ่อน้ำ
   R=หลังคา H=ผนังบ้าน W=หน้าต่าง D=ประตูบ้าน q=พุ่มไม้ l=เสาไฟ x=ถังไม้ X=ลังไม้ O=น้ำพุ (2×2) */

const TILE_BLOCK=new Set(["~","b","#","T","o","f","s","k","c","G","n","u","w","R","H","W","D","q","l","x","X","O"]);

const EXPLORE_MAPS={
  village:{
    name:"หมู่บ้านเริ่มต้น",
    rows:[
"TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
"TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
"TT....................................TT",
"TT.RRRRR...RRRRRRR...RRRRRRR...RRRRR..TT",
"TT.RRRRR...RRRRRRR...RRRRRRR...RRRRR..TT",
"TT.HWDWHxx.HWWDWWH..XHWWDWWHX..HWDWH..TT",
"TTq..:.....v..:.....v...:v.......:.vq.TT",
"TT...:,...q...:.,.q.....:,.,,q...:v...TT",
"TT..,:,....v..:.....,v..:........:...,TT",
"TT...:,..v.,,.:s........:,.v.....:..v.TT",
"TTv..:......lv:.......,.:.vl.....:...,TT",
"TT::::::::::::::::::::::::::::::::::::::",
"TT::::::::::::::::::::::::::::::::::::::",
"TT....,...,.lppppppppppppppl......T...TT",
"TT.....v..T..ppppppppppppppv.........vTT",
"TT.....,.....ppppppOOpppppp..T.....vq.TT",
"TT.~~~~~~v..,ppppppOOpppppp....T......TT",
"TT.~~~~~~~...pppppppppppppp.v..,...vv.TT",
"TT~~~~~~~~...pppppppppppppp,..qvv.....TT",
"TT~~~~~~~~vq.ppplpppppplppp..,...,.T..TT",
"TT~~~~~~~~..,........,,,.........q....TT",
"TT~~~~~~~..,.......,.....v......v..,..TT",
"TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
"TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"],
    spawn:{x:19,y:12},
    labels:[{x:5,y:5,icon:"🪙"},{x:14,y:5,icon:"🏫"},{x:24,y:5,icon:"🛏️"},{x:33,y:5,icon:"🏠"}],
    warps:[{x:39,y:11,to:"field",tx:1,ty:11},{x:39,y:12,to:"field",tx:1,ty:12}],
    npcs:[
      {id:"flag",x:18,y:14,sprite:"npc_flag",name:"ครูแฟล็ก",dir:"down"},
      {id:"shop",x:6,y:6,sprite:"npc_shop",name:"ป้าแม่ค้า",dir:"down"},
      {id:"inn",x:25,y:6,sprite:"npc_inn",name:"เจ้าของโรงแรม",dir:"down"},
      {id:"kid",x:30,y:15,sprite:"npc_kid",name:"น้องต้นกล้า",dir:"left",wander:true},
      {id:"vill_f",x:8,y:12,sprite:"ms_villager_f",name:"ป้าสมศรี",dir:"right",wander:true,range:5},
      {id:"vill_m",x:32,y:11,sprite:"ms_villager_m",name:"ลุงบุญมา",dir:"left",wander:true,range:4}
    ],
    doors:[
      {x:5,y:5,act:"shop"},{x:24,y:5,act:"inn"},
      {x:14,y:5,text:"โรงเรียนของครูแฟล็ก — ประตูล็อกอยู่ ครูออกไปยืนที่ลานน้ำพุกลางหมู่บ้านแล้ว"},
      {x:33,y:5,text:"บ้านของน้องต้นกล้า — มีกลิ่นขนมอบหอม ๆ ลอยออกมา"}
    ],
    signs:[{x:15,y:9,text:"📌 กระดานประกาศหมู่บ้าน: \"ด่วน! มอนสเตอร์ตัวเลขยึดทุ่งหญ้าทางตะวันออก ใครช่วยได้ติดต่อครูแฟล็กที่ลานน้ำพุ\""}]
  },
  field:{
    name:"ทุ่งหญ้าจำนวน",
    rows:[
"TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
"TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT#######TTTTTTTTTTTTTTTTTT",
"TT...........,.......vT....,.,..........v~~...fffffffff..v.....T,..~~~~....,v.......T.,#_____#...v...T.______.TT",
"TT..RRRRR..uuuuuuuu...T....,.............~~...fnnnnnnnf.....TT.T..~~~~~~,.TT......v.T,.#_____#......vT________TT",
"TT..RRRRR.............T...TT...........o.~~...fnnnnnnnf.,......Tvv~~~~~~v...v.......T..#_____#..TT.,.T________TT",
"TT..HWDWH..uuuuuuuu...T,v.T..............~~..vfnnnnnnnf...c....T..~~~~~~......c.....T..#_____#.v.....T________TT",
"TTv...:v.....v........Tv....v.......o..,v~~...fnnnnnnnf........T..~~~~~~...........,T..#_____#......,T________TT",
"TT..v.:....uuuuuuuu...T..................~~.v.fnnnnnnnf...,....T.,~~~~~~...v.,......T..#_____#.......T________TT",
"TT..k.:..,..v.v..v...,T.......T,....,....~~..sfnnnnnnnf.v..,...T.........v,.....v.T.T..#_____#.o.v...T________TT",
"TT..,v:.....,....k....T.v................~~..,fffffffff..,.....T......,..s.....xx...T..#_____#..v....T________TT",
"TT,...:..........,....T......v...,.......~~..v..v.......v......Tv.,..,.........v....T.s###:###.....vvT________TT",
"::::::::::::::::::::::G::::::::::::::::::bb::::::::::::::::::::G::::::::::::::::::::G::::::::::::::::G________TT",
"::::::::::::::::::::::G::::::::::::::::::bb::::::::::::::::::::G::::::::::::::::::::G::::::::::::::::G________TT",
"TT.....,.....,...v....q..................~~..v.................q....................q....,...v.......q________TT",
"TT..v....,......v.....q..................~~...,....v...........q....,............,..q...,.......v....q________TT",
"TT.ffffff..uuuuuuuu...q.....o.........c,,~~....,...............q............~~~~~~..q....v...........q________TT",
"TT.f....f....,......v.Tv.v........,....v.~~......,.,........v..T.v..~~~~v...~~~~~~..T...o.....v....TvT________TT",
"TT.f.k..f..uuuuuuuu..vT..........TT.....v~~....................T....~~~~....~~~~~~..T..,....,......,vT________TT",
"TT.f...............,..T.........,.T....v.~~.....TT,.v...v.,.T..T.,..~~~~.,..~~~~~~v.T..,.T......T.,..T________TT",
"TT.ffffff,.uuuuuuuu...T..ov..........T..,~~....v...,.v.....,.T.T.T..........~~~~~~..T...v..........,.T________TT",
"TT....................T.......,..........~~................v...T.............~~~~...T,............o..T________TT",
"TT....v.,........v....T.....v....v....v..~~..v.............,...T....v....v..........T.v..v....,......T.______.TT",
"TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
"TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"],
    spawn:{x:1,y:11},
    warps:[{x:0,y:11,to:"village",tx:38,ty:11},{x:0,y:12,to:"village",tx:38,ty:12}],
    npcs:[
      {id:"carpenter",x:40,y:13,sprite:"npc_carpenter",name:"ลุงช่างไม้",dir:"up"},
      {id:"farmer",x:56,y:10,sprite:"npc_farmer",name:"ลุงชาวสวน",dir:"left"}
    ],
    doors:[{x:6,y:5,text:"บ้านไร่ทานตะวัน — เจ้าของบ้านอพยพไปหลบมอนสเตอร์ที่หมู่บ้านแล้ว"}],
    // โซนแต่ละหน่วยเนื้อหา (สี่เหลี่ยม x0..x1 × y0..y1), มอนสเตอร์ของหัวข้อ, ประตูที่ต้องไขเพื่อไปโซนถัดไป
    zones:[
      {id:"A",x0:2,x1:21,y0:2,y1:21,stage:"A",monsters:[[17, 20], [19, 9], [18, 8], [6, 17]],gate:"gA"},
      {id:"B",x0:23,x1:40,y0:2,y1:21,stage:"B",monsters:[[33, 7], [26, 20], [25, 15], [38, 8]],gate:"bridge"},
      {id:"C",x0:43,x1:62,y0:2,y1:21,stage:"C",monsters:[[44, 19], [45, 9], [58, 9], [53, 18]],gate:"gC"},
      {id:"D",x0:64,x1:83,y0:2,y1:21,stage:"D",monsters:[[65, 5], [68, 15], [77, 5], [65, 3]],gate:"gD"},
      {id:"E",x0:85,x1:100,y0:2,y1:21,stage:"E",monsters:[[86, 18], [92, 15], [95, 9], [86, 16]],gate:"gE"}
    ],
    bossArea:{x0:102,x1:109},
    gates:{gA:{cells:[[22,11],[22,12]]},bridge:{cells:[[41,11],[42,11],[41,12],[42,12]]},gC:{cells:[[63,11],[63,12]]},gD:{cells:[[84,11],[84,12]]},gE:{cells:[[101,11],[101,12]]}},
    boss:{x:106,y:11,sprite:"boss_w1"},
    tablets:[{x:4,y:8,i:0},{x:17,y:9,i:1},{x:5,y:17,i:2}],
    chests:[
      {id:"cC",x:58,y:5,kind:"carrot"},
      {id:"cB",x:38,y:15,kind:"code",q:"b"},
      {id:"cD",x:78,y:5,kind:"code",q:"d"}
    ],
    signs:[
      {x:45,y:8,text:"สวนแครอทของลุงชาวสวน 🥕 ปลูกเป็นแถวตรง ๆ ทุกแถวมีจำนวนเท่ากัน"},
      {x:73,y:9,text:"บ่อปลาแห่งทุ่งหาร — ปูแบ่งก้ามชอบแบ่งทุกอย่างให้เท่า ๆ กัน"},
      {x:86,y:10,text:"ห้องหินโบราณ: ปูพื้นด้วยแผ่นหินขนาด 1 × 1 หน่วยเต็มทั้งห้อง ลองเดินเข้าไปนับดูสิ"}
    ]
  }
};

// ความคืบหน้าในโหมดผจญภัย (สร้างครั้งแรกที่เข้าโหมด) — ตัวเลขปริศนาสุ่มต่อผู้เล่น กันลอกคำตอบกัน
function newExploreState_(){
  const r=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const people=r(3,8),share=r(4,12);
  const planksNeed=r(25,60),planksHave=r(8,planksNeed-6);
  return {
    map:"village",x:19,y:12,dir:"down",hp:null,
    talkedFlag:false,reported:false,bossDone:false,key:false,
    kills:{A:0,B:0,C:0,D:0,E:0},
    open:{gA:false,bridge:false,gC:false,gD:false,gE:false},
    chests:{},
    puz:{
      tablets:[r(11,39),r(11,39),r(11,39)],          // A: รหัสประตู = ผลรวมเลขบนแผ่นหิน 3 แผ่น
      planksNeed,planksHave,                          // B: ไม้ที่ต้องหาเพิ่ม = ต้องใช้ − มีแล้ว
      coins:people*share,people,                      // D: แบ่งเหรียญเท่า ๆ กัน
      chestB:[r(40,90),r(11,35)],chestD:[r(6,9),r(6,9)]
    }
  };
}
const QUEST_KILLS=3;           // ต้องปราบมอนสเตอร์ของโซนกี่ตัวก่อนไขประตูได้
const ZONE_NAMES={A:"ทุ่งบวก",B:"ทุ่งลบ",C:"ทุ่งคูณ",D:"ทุ่งหาร",E:"ทุ่งผสม"};
