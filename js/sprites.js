/* Math Quest V2 — ภาพพิกเซลอาร์ต (วาดด้วยโค้ด ไม่ต้องโหลดไฟล์ภาพ)
   แต่ละตัวเขียนเป็นตาราง: 1 ตัวอักษร = 1 พิกเซล, "." = โปร่งใส, ตัวอักษรอื่น = สีใน PALETTE
   ตอนวาดจริงระบบจะเติม "เส้นขอบดำ" และ "แสงเงา" (ขอบบนสว่าง ขอบล่างเข้ม) ให้อัตโนมัติ */

const PALETTE={
  k:"#181425",w:"#ffffff",l:"#c0cbdc",e:"#8b9bb4",E:"#5a6988",a:"#3a4466",
  r:"#e43b44",R:"#a22633",o:"#f77622",y:"#feae34",Y:"#fee761",
  g:"#63c74d",G:"#3e8948",h:"#265c42",c:"#2ce8f5",b:"#0099db",B:"#124e89",
  p:"#b55088",P:"#68386c",m:"#f6757a",n:"#b86f50",N:"#733e39",s:"#e8b796",t:"#ead4aa",
  q:"#c2a35a",Q:"#8f7639"
};
const OUTLINE="#181425";

/* ---------------- มอนสเตอร์ A–Z (16×16) ---------------- */
const SPRITES={
A:[ // สไลม์บวก
"................","................","................","................",
"......gggg......","....gggggggg....","...gggggggggg...","..gggggggggggg..",
"..ggwwggggwwgg..",".gggwkggggwkggg.",".ggggggyygggggg.",".ggggyyyyyygggg.",
"gggggggyyggggggg","gggggggggggggggg",".gggggggggggggg.","................"],
B:[ // ค้างคาวลบ
"................","................","................","P..............P",
"PP....p..p....PP","PPP...pppp...PPP","PPPP.pppppp.PPPP","PPPPPpwkkwpPPPPP",
".PPPPppppppPPPP.","..PPPpwppwpPPP..","...PP.pyyp.PP...","....P.pppp.P....",
"......p..p......","................","................","................"],
C:[ // กระต่ายทวีคูณ
"....ll....ll....","....lm....ml....","....lm....ml....","....lm....ml....",
"....ll....ll....","...llllllllll...","..llllllllllll..","..llkwllllkwll..",
"..llkkllllkkll..","..lmmllkkllmmll.","...llllwwllll...","....llllllll....",
"...llllllllll...","..llllllllllll..","..llll....llll..","................"],
D:[ // ปูแบ่งก้าม
"................","................",".rr..........rr.","rrrr........rrrr",
"r.rr........rr.r","rrrr..w..w..rrrr",".rr...k..k...rr.","..r...r..r...r..",
"...rrrrrrrrrr...","..rrrrrrrrrrrr..",".rrrrrrrrrrrrrr.",".rrrrrrkkrrrrrr.",
"..rrrrrrrrrrrr..",".r.r.r....r.r.r.","r.r.r......r.r.r","................"],
E:[ // หมูป่าสี่เครื่องหมาย
"................","................","................","..NN........NN..",
"..NnN......NnN..","..NnnnnnnnnnnN..",".Nnnnnnnnnnnnnn.",".nnnwknnnnkwnnn.",
".nnnnnnnnnnnnnn.",".nnnttttttttnnn.",".wnnttkttkttnnw.",".wwnnttttttnnww.",
"..nnnnnnnnnnnn..","..nNnnnnnnnnNn..","..NN.NN..NN.NN..","................"],
F:[ // เห็ดแบ่งเสี้ยว
"................",".....rrrrrr.....","...rrwwrrrrrr...","..rrwwrrrrwwrr..",
".rrrrrrrrrwwrrr.",".rwwrrrrrrrrrrr.","rrwwrrrwwrrrrrrr","rrrrrrrwwrrrwwrr",
".rrrrrrrrrrrrrr.","...tttttttttt...","...ttkwttkwtt...","...tttttttttt...",
"...ttttkktttt...","....tttttttt....","...tt.tttt.tt...","................"],
G:[ // ผึ้งจุดทศนิยม
"................","...lll....lll...","..lllll..lllll..","..llllll.llllll.",
"...lllll.lllll..","....yyyyyyyy....","...yyyyyyyyyy...","..yywkyyyywkyy..",
"..kkkkkkkkkkkk..",".yyyyyyyyyyyyyy.",".kkkkkkkkkkkkkk.",".yyyyyyyyyyyyyy.",
"..kkkkkkkkkkkk..","...yyyyyyyyyy...",".......kk.......","........k......."],
H:[ // จิ้งจอกลดราคา
"................","..o..........o..","..oo........oo..","..omo......omo..",
"..oooooooooooo..",".oooooooooooooo.",".oookwoooowkooo.",".oooooooooooooo.",
".wwwwookkoowwww.","..wwwwwwwwwwww..","....oooooooo....","...oooooooooo...",
"...oowwwwwwoo...","...oooooooooo.oo","...oo....oo..oow","..............ww"],
I:[ // นกฮูกสัดส่วน
"................","..N..........N..","..NN........NN..","..NnnnnnnnnnnN..",
".nnnnnnnnnnnnnn.",".nwwwwnnnnwwwwn.",".wwkkwwnnwwkkww.",".wwkkwwyywwkkww.",
".nwwwwnyynwwwwn.",".nnnnnnyynnnnnn.","..nnttttttttnn..",".nnttttttttttnn.",
".nnttttttttttnn.","..nnttttttttnn..","...nnnnnnnnnn...","....yy....yy...."],
J:[ // แมงป่องยกกำลัง
"..........yy....","...........pp...","............pp..","............pp..",
"...........pp...","..........pp....","pp......ppp.....","p.p....pppp.....",
"pp.p..ppppppp...","...pwkpwkppppp..","....pppppppppppp","pp...pppppppppp.",
"p.p..pppppppppp.","pp...p.p.p.p.p..","....p.p.p.p.p...","................"],
K:[ // แมงมุมถอดราก
"................","..E..........E..","...E........E...","E...E......E...E",
".E...EEEEEE...E.","..E.EEEEEEEE.E..","...EErEEEErEE...","EE.EEEEEEEEEE.EE",
"..EEEEEEEEEEEE..",".E.EEEEEEEEEE.E.","E..EEEEccEEEE..E","..E.EEEccEEE.E..",
".E...EEEEEE...E.","E.....EEEE.....E","................","................"],
L:[ // หินปริศนา x
"................","....eeeeeeee....","...eeeeeeeeee...","..eeeeeeeeeeee..",
"..eecceeeeccee..","..eeeeeeeeeeee..","..eeeeeEEeeeee..","..eeeeeEEeeeee..",
"..eeeeeeeeeeee..","..eeEEEEEEEEee..","...eeeeeeeeee...","....eeeeeeee....",
"...eeeeeeeeee...","..EEEEEEEEEEEE..","..EEEEEEEEEEEE..","................"],
M:[ // หมาป่ามากกว่า-น้อยกว่า
"................","..e..........e..","..ee........ee..","..eEe......eEe..",
"..eeeeeeeeeeee..",".eeeeeeeeeeeeee.",".eeeyyeeeeyyeee.",".eeekyeeeeykeee.",
".eeeeelllleeeee.","..eeelllllleee..","..eeelwkkwleee..","...eellllllee...",
"...eeeeeeeeee...","..eeeeeeeeeeee..","..ee.ee..ee.ee..","................"],
N:[ // อินทรีสองตัวแปร
"................",".....wwwwww.....","....wwwwwwww....","....wwkwwwkww...",
"....wwwwyyyww...","N...wwwwwyyw...N","NN...wwwwww...NN","NNN.nnnnnnnn.NNN",
"NNNNnnnnnnnnNNNN",".NNNnnnnnnnnNNN.","..NNnnnnnnnnNN..","....nnnnnnnn....",
".....nnnnnn.....","......nnnn......",".....y.yy.y.....","................"],
O:[ // ซอมบี้พจน์คล้าย
"................",".....GGGGGG.....","....gggggggg....","....gkgggkgg....",
"....gggggggg....","....ggkkkkgg....",".....gggggg.....","..BBBBBBBBBBBB..",
".gBBBBBBBBBBBBg.","gg.BBBbBBBBBB.gg","g..BBBBBBbBBB..g","...BBBBBBBBBB...",
"...NNNNNNNNNN...","...NNNN..NNNN...","...NNN....NNN...","..ggg......ggg.."],
P:[ // หุ่นกลแยกชิ้น
".......r........",".......e........","....eeeeeeee....","...eeeeeeeeee...",
"...eccceeccce...","...eeeeeeeeee...","...eekekekeee...","....eeeeeeee....",
"..bbbbbbbbbbbb..",".ebbbbyybbbbbbe.",".ebbbyyyybbbbbe.",".ebbbbyybbbbbbe.",
"..bbbbbbbbbbbb..","...ee......ee...","..eee......eee..","................"],
Q:[ // ผีสองราก
"................",".....llllll.....","...llllllllll...","..llllllllllll..",
"..llkkllllkkll..",".lllkkllllkklll.",".llllllllllllll.",".lllllkkkklllll.",
".llllkmmmmkllll.",".lllllkkkklllll.","llllllllllllllll","l.llllllllllll.l",
"..llllllllllll..","..llllllllllll..","..ll.lll.lll.ll.","..l...l...l...l."],
R:[ // ปลาปักเป้าฟังก์ชัน
"................",".......y........","...y..yyyy..y...","....yyyyyyyy....",
"..yyyyyyyyyyyy..","y.yyyyyyywkyyy.y",".yyyyyyyykkyyyy.","yyyyyyyyyyyyyyyy",
"ooyyyyyyyyyyykky","ooyyyttttttyyyyy","yyytttttttttyyy.","..yyttttttttyy..",
"y..yyyyyyyyyy..y","....yyyyyyyy....","...y..y..y..y...","................"],
S:[ // ฉลามความชัน
"................","......b.........",".....bb.........","....bbb.........",
"...bbbbbbbbb....","b.bbbbbbbbbbbb..","bbbbbbbbbbwkbbb.","bbbbbbbbbbbbbbbb",
"bbbbllllllwlwlwb","b.bblllllllllll.","....bbbbbbbbbb..",".....bb...bb....",
"................","................","................","................"],
T:[ // งูทะเลอนุกรม
"................",".........cccc...","........cccccc..","........cwkcccc.",
"........cccccccr",".........cccc..r","..........cc....","...cccc....cc...",
"..cc..cc...cc...",".cc....cc.cc....",".cc.....ccc.....","..cc............",
"...ccc..........",".....cccc.......","........ccc.....","................"],
U:[ // โจ๊กเกอร์สุ่มดวง
"..y..........y..","..rr........pp..","...rr......pp...","....rrr..ppp....",
"....rrrrpppp....","...wwwwwwwwww...","...wwkwwwwkww...","...wmwwwwwwmw...",
"...wwrrrrrrww...","....wwwwwwww....","..pprrpprrpprr..","..rrpprrpprrpp..",
"..pprrpprrpprr..","...rrrr..pppp...","..yrrr....pppy..","................"],
V:[ // หนูนับสถิติ
"................","..ee........ee..",".emme......emme.",".emme......emme.",
"..eeeeeeeeeeee..",".eeeeeeeeeeeeee.",".ekkkeeeeeekkke.",".ekwkkkkkkkkwke.",
".ekkkeeeeeekkke.","..eeeeemmeeeee..","..eeeeewweeeee..","...eeeeeeeeee...",
"..eettttttttee..","..eettttttttee.m","...ee......ee.m.","..............m."],
W:[ // โกเลมพื้นที่
"................","....NNNNNNNN....","....nnNnnNnn....","....nyynnyyn....",
"....NNNNNNNN....",".NNNnnNnnNnnNNN.","NnnNNNNNNNNNNnnN","nnNnnNnnNnnNnnNn",
"NnnNNNNNNNNNNnnN","Nnn.nnNnnNnn.nnN",".NN.NNNNNNNN.NN.","....nnNnnNnn....",
"....NNNNNNNN....","....nnn..nnn....","...NNNN..NNNN...","................"],
X:[ // นักธนูมุมฉาก
"................",".....GGGGGG.....","....GGGGGGGG..n.","....GssssssG...n",
"....GskssksG...n",".....ssmmss....n","...GGGGGGGGGG..n","..GGGGnGGGGGGssn",
"..sGGGGnGGGGG..n","..s.GGGGnGGG...n","....GGGGGGGG...n","....NNNNNNNN..n.",
"....NNN..NNN....","....NN....NN....","...NNN....NNN...","................"],
Y:[ // พายุอนุพันธ์
"..cccccccccccc..",".cclllllllllllc.","..cccccccccccc..","...lllllllllll..",
"...ccwkcccwkc...","....llllllll....",".y...cccccccc...","yy....lllllll...",
".yy...cccccc....","..y....lllll....","......cccc......",".......lll......",
"........cc......",".......c........","................","................"],
Z:[ // เงาแห่งทุกหัวข้อ
"................",".....PPPPPP.....","....PPPPPPPP....","...PPPkkkkPPP...",
"...PPkrkkrkPP...","...PPkkkkkkPP...","...PPPkkkkPPP...","..PPPPPPPPPPPP..",
".PPPPpPPPPpPPPP.","PPPPPpPPPPpPPPPP","PP.PPpPyyPpPP.PP","P..PPpPPPPpPP..P",
"...PPPPPPPPPP...","..PPPPPPPPPPPP..",".PPP.PPPPPP.PPP.","................"],

/* ---------------- บอสประจำดินแดน (20×20) ---------------- */
boss_w1:[ // ราชาสไลม์ตัวเลข
"....................","......y..yy..y......","......yyyyyyyy......","......yryyyyry......",
"......yyyyyyyy......","....gggggggggggg....","...gggggggggggggg...","..gggggggggggggggg..",
"..gggwwggggggwwggg..",".ggggwkggggggkwgggg.",".gggggggggggggggggg.","ggggggggkkkkgggggggg",
"gggggggkwwwwkggggggg","ggggggggkkkkgggggggg","gggggggggggggggggggg","gggggggggggggggggggg",
".gggggggggggggggggg.","..gggggggggggggggg..","....................","...................."],
boss_w2:[ // ต้นไม้ยักษ์พันส่วน
"......GGGGGGGG......","....GGggGGGGggGG....","...GggggGGGGggggG...","..GGggggggggggggGG..",
".GgggGgggggggGgggGG.",".GggggggggggggggggG.","..GGGggggggggggGGG..","....GGGnnnnnnGGG....",
".....nnnnnnnnnn.....",".....nNyynnyyNn.....",".....nnnnnnnnnn.....","..NN.nnkkkkkknn.NN..",
".N..NnnkwkkwknnN..N.","N....nnnnnnnnnn....N",".....nnnnnnnnnn.....",".....nnNnnnnNnn.....",
"....nnnnnnnnnnnn....","...NNnn.NNNN.nnNN...","..NNN....NN....NNN..","...................."],
boss_w3:[ // มังกรเลขชี้กำลัง
"....................","..R..............R..","..RR....y..y....RR..","..RRR...rrrr...RRR..",
"..RRRR.rrrrrr.RRRR..","..RRRRRryrryrRRRRR..","..RRRRRrrrrrrRRRRR..","..RRRR.rwrrwr.RRRR..",
"..RRR..rrrrrr..RRR..","..RR..rrrrrrrr..RR..","..R..rrrttttrrr..R..",".....rrttttttrr.....",
"....rrrttttttrrr....","....rrrrttttrrrr....",".....rrrrrrrrrr.rr..",".....rr......rr..r..",
"....yyy......yyy.r..","................rr..","....................","...................."],
boss_w4:[ // ยักษ์ตาชั่ง
"....................","......EEEEEEEE......",".....EeeeeeeeeE.....","....EeeeeeeeeeeE....",
"....EeEEEeeEEEeE....","....EewkeeeekweE....","....EeeeeEEeeeeE....","....EeeeeEEeeeeE....",
"....EewEEEEEEweE....",".....EewwwwwweE.....","......EEEEEEEE......","..bbbbbbbbbbbbbbbb..",
".ebbbbbbyybbbbbbbbe.","eebbbbbyyyybbbbbbbee","ee.bbbbbyybbbbbbb.ee","ee.bbbbbbbbbbbbbb.ee",
"...NNNNNNNNNNNNNN...","...NNNNNN..NNNNNN...","..EEEEEE....EEEEEE..","...................."],
boss_w5:[ // พ่อมดพหุนาม
"..........P.........",".........PPy........","........PPPP........",".......PPyPPP.......",
"......PPPPPPPP......",".....PPPPPPPPPP....c","..yyyyyyyyyyyyyy.ccc",".....ssssssssss..cc.",
".....ssksssskss..n..",".....ssssmmssss..n..","....wwwwwwwwwwww.n..","...PwwwwwwwwwwwwPsn.",
"..PPPwwwwwwwwwwPPPn.","..PPPPwwwwwwwwPPPPn.","..PPPPPwwwwwwPPPPPn.","..PPPPPPwwwwPPPPPPn.",
"..PPPPPPPyyPPPPPPPn.","..PPPPPPPPPPPPPPPPn.","...PPPPPPPPPPPPPP.n.","...................."],
boss_w6:[ // คราเคนกราฟ
"....................",".......pppppp.......",".....pppppppppp.....","....pppppppppppp....",
"...pppmppppppmppp...","...pppppppppppppp...","...ppwwwppppwwwpp...","...ppwkkppppkkwpp...",
"...pppppppppppppp...","....ppppPPPPpppp....","..pppppppppppppppp..",".pp.pp.pp..pp.pp.pp.",
"pp..pp.pp..pp.pp..pp","p..pp..pp..pp..pp..p","..pp...pp..pp...pp..",".pp...pp....pp...pp.",
".p...pp......pp...p.","....p..........p....","....................","...................."],
boss_w7:[ // เจ้ามือลูกเต๋า
"......kkkkkkkk......","......kkkkkkkk......","......kkkkkkkk......","......rrrrrrrr......",
"....kkkkkkkkkkkk....","...wwwwwwwwwwwwww...","...wkkwwwwwwwwkkw...","...wkkwwwwwwwwkkw...",
"...wwwwwwkkwwwwww...","...wwwwwwkkwwwwww...","...wwrwwwwwwwwrww...","...wwwrrrrrrrrwww...",
"...wwwwwwwwwwwwww...","...llllllllllllll...","......ww....ww......",".....www....www.....",
"....................","....................","....................","...................."],
boss_w8:[ // อัศวินตรีโกณ
".........rr.........","........rrrr........","......llllllll......","......llllllll....l.",
"......lkkkkkkl....l.","......lkckkckl....l.","......llllllll....l.","......llelelll....l.",
"...eellllllllllee.l.","...eellllyyllllee.l.","...eelllyyyylllee.l.","...eellyyyyyyllee.l.",
"...ssllllllllllssnnn","....llllllllll....n.","....EEEEEEEEEE....n.","....EEEE..EEEE......",
"....EEEE..EEEE......","...eeeee..eeeee.....","....................","...................."]
};

/* ---------------- ตัวละครผู้เล่น (16×16) ----------------
   H=ผม/หมวก s=ผิว C=เสื้อ A=ลาย D=กางเกง F=รองเท้า — แต่ละอาชีพเปลี่ยนสีและบางแถว */
const HERO_BASE=[
"................",".....HHHHHH.....","....HHHHHHHH....","....HHssssHH....",
"....HskssksH....","....ssssssss....",".....ssmmss.....","...CCCCCCCCCC...",
"..sCCCCAACCCCs..","..sCCCCAACCCCs..","..sCCCCCCCCCCs..","....DDDDDDDD....",
"....DDD..DDD....","....DDD..DDD....","...FFFF..FFFF...","................"];
const HERO_CLASSES={
  student_m:{name:"นักเรียนชาย",pal:{H:"k",C:"w",A:"b",D:"B",F:"k",m:"R"}},
  student_f:{name:"นักเรียนหญิง",pal:{H:"k",C:"w",A:"b",D:"B",F:"k",m:"R"},
    rows:{3:"...HHssssssHH...",5:"...HssssssssH...",6:"...H.ssmmss.H...",11:"...DDDDDDDDDD...",12:"...DDDDDDDDDD...",13:"....ss....ss...."}},
  warrior:{name:"นักรบ",pal:{H:"l",C:"b",A:"y",D:"B",F:"N",m:"R"},rows:{1:".....HHrrHH.....",3:"....HHkkkkHH....",4:"....HskssksH...."}},
  warrior_r:{name:"นักรบเพลิง",pal:{H:"l",C:"r",A:"y",D:"R",F:"N",m:"R"},rows:{1:".....HHyyHH.....",3:"....HHkkkkHH....",4:"....HskssksH...."}},
  mage:{name:"จอมเวท",pal:{H:"P",C:"P",A:"y",D:"P",F:"N",m:"R"},rows:{0:".......PP.......",1:"......PPyP......",2:"...PPPPPPPPPP...",3:"....wssssssw....",4:"....wskssksw....",6:".....wwwwww.....",7:"...CCwwwwwwCC..."}},
  mage_b:{name:"จอมเวทวารี",pal:{H:"B",C:"B",A:"c",D:"B",F:"N",m:"R"},rows:{0:".......BB.......",1:"......BBcB......",2:"...BBBBBBBBBB...",3:"....wssssssw....",4:"....wskssksw....",6:".....wwwwww.....",7:"...CCwwwwwwCC..."}},
  ninja:{name:"นินจา",pal:{H:"a",C:"a",A:"r",D:"a",F:"k",m:"a"},rows:{5:"....HHHHHHHH....",6:".....HHHHHH....."}},
  ninja_r:{name:"นินจาแดง",pal:{H:"R",C:"R",A:"k",D:"a",F:"k",m:"R"},rows:{5:"....HHHHHHHH....",6:".....HHHHHH....."}},
  archer:{name:"นักธนู",pal:{H:"G",C:"G",A:"n",D:"N",F:"N",m:"R"},rows:{2:"...HHHHHHHHHH...",3:"...HHssssssHH..."}},
  archer_b:{name:"พรานป่า",pal:{H:"n",C:"n",A:"y",D:"h",F:"N",m:"R"},rows:{2:"...HHHHHHHHHH...",3:"...HHssssssHH..."}},
  princess:{name:"เจ้าหญิง",pal:{H:"Y",C:"m",A:"w",D:"m",F:"p",m:"R"},rows:{0:"....y.y..y.y....",1:"....yyyyyyyy....",3:"...HHssssssHH...",5:"...HssssssssH...",6:"...HHssmmssHH...",11:"...DDDDDDDDDD...",12:"..DDDDDDDDDDDD..",13:"..DDDDDDDDDDDD.."}},
  prince:{name:"เจ้าชาย",pal:{H:"y",C:"b",A:"y",D:"w",F:"N",m:"R"},rows:{0:"....y.y..y.y....",1:"....yyyyyyyy....",2:"....HHHHHHHH....",7:"...rCCCCCCCCr..."}}
};
// ภาพอวตารที่เลือกได้ (ตามลำดับที่แสดง)
const HERO_KEYS=Object.keys(HERO_CLASSES);

function heroRows_(key){return buildHeroRows_(HERO_CLASSES[key]||HERO_CLASSES.student_m)}
function buildHeroRows_(cls){
  const rows=HERO_BASE.slice();
  Object.entries(cls.rows||{}).forEach(([i,r])=>{rows[+i]=r});
  return rows.map(r=>r.replace(/[HCADF]/g,ch=>cls.pal[ch]||ch).replace(/m/g,cls.pal.m||"m"));
}

/* ---------------- ตัววาด ---------------- */
const SPRITE_CACHE={};
function hexToRgb_(h){const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255]}
function mix_(rgb,target,t){return rgb.map((v,i)=>Math.round(v+(target[i]-v)*t))}
function spriteRows_(key){
  if(SPRITES[key])return SPRITES[key];
  if(key&&key.indexOf("hero:")===0)return heroRows_(key.slice(5));
  return null;
}
// วาดภาพลงแคนวาส (ขนาดจริง 1 พิกเซลต่อช่อง + ขอบ 1 พิกเซลรอบตัว) — ใช้ทั้งใน HTML (data URL) และแผนที่ผจญภัย
const SPRITE_CANVAS={};
function spriteCanvas(key){
  if(SPRITE_CANVAS[key])return SPRITE_CANVAS[key];
  if(typeof customSprite==="function"){const img=customSprite(key);if(img)return img}   // ภาพ PNG ที่ครูใส่เอง (ถ้ามี)
  const rows=spriteRows_(key);if(!rows)return null;
  const grid=rows.map(r=>[...r].map(ch=>ch!=="."&&PALETTE[ch]?PALETTE[ch]:null));
  return SPRITE_CANVAS[key]=gridCanvas_(grid);
}
function spriteURL(key){
  if(typeof customSpriteURL==="function"){const u=customSpriteURL(key);if(u)return u}
  if(SPRITE_CACHE[key])return SPRITE_CACHE[key];
  const cv=spriteCanvas(key);if(!cv)return "";
  return SPRITE_CACHE[key]=cv.toDataURL();
}
function spriteImg(key,size,cls){
  if(typeof portraitInfo==="function"){const info=portraitInfo(key)||customSpriteInfo(key);if(info)return fitImg_(info,size,cls)}   // ภาพ PNG ของครู
  const url=spriteURL(key);
  return url?`<img class="sprite pixelated ${cls||""}" src="${url}" width="${size}" height="${size}" alt="">`:"";
}
// อวตารของผู้เล่น (รองรับเซฟเก่าที่เก็บเป็นอีโมจิ)
function heroKey(avatar){return HERO_CLASSES[avatar]?avatar:"student_m"}
const HERO_URL={};
// อวตารใช้ตัวละครแบบใหม่ (หันหน้า) — สูงเท่า size กว้างตามสัดส่วน
function heroImg(avatar,size,cls){
  const k=heroKey(avatar);
  if(typeof portraitInfo==="function"){const info=portraitInfo(k)||customSpriteInfo("hero:"+k);if(info)return fitImg_(info,size,cls)}
  const cv=charFrame(k,"down",0),url=HERO_URL[k]||(HERO_URL[k]=cv.toDataURL());
  return `<img class="sprite pixelated ${cls||""}" src="${url}" height="${size}" width="${Math.round(size*cv.width/cv.height)}" alt="">`;
}

/* ---------------- NPC ในโหมดผจญภัย (ใช้โครงเดียวกับตัวละครผู้เล่น) ---------------- */
const NPC_CLASSES={
  npc_flag:{pal:{H:"k",C:"q",A:"y",D:"Q",F:"k",m:"R"},rows:{7:"...QCCCCCCCCQ..."}},                 // ครูแฟล็ก (ชุดกากี)
  npc_shop:{pal:{H:"n",C:"g",A:"w",D:"N",F:"N",m:"R"},rows:{9:"..sCCCwwwwCCCs..",10:"..sCCCwwwwCCCs.."}}, // แม่ค้า
  npc_inn:{pal:{H:"Y",C:"m",A:"w",D:"p",F:"N",m:"R"},rows:{3:"...HHssssssHH...",5:"...HssssssssH...",6:"...H.ssmmss.H..."}}, // เจ้าของโรงแรม
  npc_carpenter:{pal:{H:"y",C:"o",A:"n",D:"B",F:"N",m:"R"},rows:{2:"...HHHHHHHHHH..."}},               // ช่างไม้ (หมวกนิรภัย)
  npc_farmer:{pal:{H:"t",C:"b",A:"n",D:"n",F:"N",m:"R"},rows:{1:"....HHHHHHHH....",2:"..HHHHHHHHHHHH.."}}, // ชาวสวน (หมวกสาน)
  npc_kid:{pal:{H:"o",C:"r",A:"y",D:"B",F:"k",m:"R"}}
};
Object.entries(NPC_CLASSES).forEach(([k,cls])=>{SPRITES[k]=buildHeroRows_(cls)});

/* ---------------- วัตถุบนแผนที่ผจญภัย (16×16) ---------------- */
Object.assign(SPRITES,{
obj_tree:[
"................",".....GGGGGG.....","...GGggggggGG...","..GggggggggggG..",
".GggggggggggggG.",".GgggggggGgggggG","GggggGgggggggggG","GggggggggGgggggG",
".GggggggggggggG.",".GgGgggggggGggG.","..GggggggggggG..","...GGggggggGG...",
".....GGnnGG.....",".......nn.......","......nnnn......","................"],
obj_rock:[
"................","................","................","................",
"................","................","......eeee......","....eeeeeeee....",
"...eeleeeeeee...","..eelleeeeeeee..","..eeleeeeeeEee..","..eeeeeeeeEEee..",
"...eeeeeEEEee...","....EEEEEEEE....","................","................"],
obj_fence:[
"................","................","................","................",
"..nn......nn....","..nn......nn....","nnnnnnnnnnnnnnnn","NNNNNNNNNNNNNNNN",
"..nn......nn....","..nn......nn....","nnnnnnnnnnnnnnnn","NNNNNNNNNNNNNNNN",
"..nn......nn....","..NN......NN....","................","................"],
obj_sign:[
"................","................","................","..nnnnnnnnnnnn..",
"..nttttttttttn..","..ntNNNNNNNNtn..","..nttttttttttn..","..ntNNNNNNtttn..",
"..nttttttttttn..","..nnnnnnnnnnnn..",".......nn.......",".......nn.......",
".......nn.......","......NNNN......","................","................"],
obj_tablet:[
"................","................",".....eeeeee.....","....eeeeeeee....",
"...eeeeeeeeee...","...eeEEEEEEee...","...eeeeeeeeee...","...eeEEEEEeee...",
"...eeeeeeeeee...","...eeEEEEEEee...","...eeeeeeeeee...","...eeeeeeeeee...",
"..EEEEEEEEEEEE..","..EEEEEEEEEEEE..","................","................"],
obj_chest:[
"................","................","................","................",
"...nnnnnnnnnn...","..nNNNNNNNNNNn..","..nnnnnnnnnnnn..","..yyyyyyyyyyyy..",
"..nnnnnyynnnnn..","..nnnnnkknnnnn..","..nnnnnnnnnnnn..","..nNNNNNNNNNNn..",
"..yyyyyyyyyyyy..","..NNNNNNNNNNNN..","................","................"],
obj_chest_open:[
"................","................","................","..NNNNNNNNNNNN..",
"..nnnnnnnnnnnn..","..nNNNNNNNNNNn..","..nkkkkkkkkkkn..","..yyyyyyyyyyyy..",
"..nnnnnnnnnnnn..","..nnnnnnnnnnnn..","..nnnnnnnnnnnn..","..nNNNNNNNNNNn..",
"..yyyyyyyyyyyy..","..NNNNNNNNNNNN..","................","................"],
obj_gate:[
"................","EEEEEEEEEEEEEEEE","eeeeeeeeeeeeeeee","EEEEEEEEEEEEEEEE",
".a..a..a..a..a..",".a..a..a..a..a..",".a..a..a..a..a..",".a..a..a..a..a..",
"eeeeeeyyyyeeeeee",".a..a.yeey.a..a.",".a..a..a..a..a..",".a..a..a..a..a..",
".a..a..a..a..a..",".a..a..a..a..a..","EEEEEEEEEEEEEEEE","................"],
obj_carrot:[
"................","................","................","................",
".......g........","......ggg.g.....",".....g.ggg......","......ggg.......",
".......gg.......","......oooo......","......oooo......",".......oo.......",
".......oo.......","........o.......","................","................"],
obj_well:[
"................","..RRRRRRRRRRRR..",".RRRRRRRRRRRRRR.","...n........n...",
"...n........n...","...n...nn...n...","...n........n...",".eeeeeeeeeeeeee.",
".eEEEEEEEEEEEEe.",".ebbbbbbbbbbbbe.",".eeeeeeeeeeeeee.",".eEeeEeeEeeEeee.",
".eeeeeeeeeeeeee.","..EEEEEEEEEEEE..","................","................"]
});
