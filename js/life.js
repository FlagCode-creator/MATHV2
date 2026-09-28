/* Math Quest V2 — ระบบชีวิตในหมู่บ้าน
   1) ฟาร์มคณิต: ซื้อเมล็ด ปลูกในแปลงหมู่บ้าน รดน้ำด้วยการตอบโจทย์ (รดได้ทุก 40 วินาที) โตครบแล้วเก็บเกี่ยวได้เหรียญ
   2) ภารกิจรายวัน: 3 ภารกิจต่อวันที่กระดานประกาศหมู่บ้าน ทำครบรับรางวัล
   3) สมุดมอนสเตอร์: บันทึกมอนสเตอร์ที่เจอ + ความแม่นยำแต่ละหัวข้อ บอกหัวข้อที่ควรทบทวน
   4) ร้านชุด: ราวเสื้อในร้านค้า เปลี่ยนสีชุดของตัวละครบนแผนที่
   ภาพพืชผัก: Farm RPG Tiny Asset Pack (assets/packs/farm_crops.png) */

/* ---------------- 1) ฟาร์มคณิต ---------------- */
const CROPS={
  straw:{name:"สตรอว์เบอร์รี",row:1,grow:3,price:5,sell:18,icon:"🍓"},
  potato:{name:"มันฝรั่ง",row:5,grow:4,price:8,sell:28,icon:"🥔"},
  onion:{name:"หัวหอม",row:7,grow:4,price:8,sell:28,icon:"🧅"},
  leek:{name:"ต้นหอมยักษ์",row:3,grow:5,price:12,sell:45,icon:"🌱"}
};
const WATER_COOLDOWN=40000;
const FARM_PLOTS={x0:28,x1:32,y0:8,y1:9};
// ขุดแปลงผักในหมู่บ้าน (สนามหญ้าระหว่างโรงแรมกับบ้านน้องต้นกล้า)
(function(){
  const v=EXPLORE_MAPS.village;
  v.rows=v.rows.map((r,y)=>y<FARM_PLOTS.y0||y>FARM_PLOTS.y1?r:r.slice(0,FARM_PLOTS.x0)+"F".repeat(FARM_PLOTS.x1-FARM_PLOTS.x0+1)+r.slice(FARM_PLOTS.x1+1));
  TILE_BLOCK.add("F");
  (v.signs||[]).forEach(s=>{if(s.x===15&&s.y===9)s.daily=true});
  const shop=EXPLORE_MAPS.shop_in;if(shop)shop.props.forEach(p=>{if(p.k==="drawer3")p.act="outfit"});
})();
function farm_(){const e=save.explore;e.farm=e.farm||{};return e.farm}
function cropFrame_(c){const C=CROPS[c.crop];if(c.g>=C.grow)return 5;if(c.g<=0)return 1;return 2+Math.min(2,Math.floor(c.g/C.grow*3))}
// วาดผักในแปลงเป็นวัตถุ (เรียงหน้า-หลังกับตัวละคร) + ดินเปียก + หยดน้ำ/ประกายเตือน
function farmEnts_(ents,c,camX,camY,now){
  if(X.mapId!=="village")return;
  const F=farm_(),img=packImg_("farm_crops");
  for(let y=FARM_PLOTS.y0;y<=FARM_PLOTS.y1;y++)for(let x=FARM_PLOTS.x0;x<=FARM_PLOTS.x1;x++){
    const k=x+","+y,cr=F[k];
    const wet=cr&&cr.w&&Date.now()-cr.w<WATER_COOLDOWN;
    if(wet){c.fillStyle="rgba(40,20,10,.35)";c.fillRect(x*TS+1-camX,y*TS+1-camY,14,14)}
    if(!cr)continue;
    ents.push({y:y+0.25,draw:()=>{
      if(img.complete&&img.naturalWidth)c.drawImage(img,cropFrame_(cr)*16,CROPS[cr.crop].row*16,16,16,x*TS-camX,y*TS-2-camY,16,16);
      const ripe=cr.g>=CROPS[cr.crop].grow,bx=x*TS+8-camX,by=y*TS-8-camY-Math.round(Math.sin(now/250+x)*1);
      if(ripe){if(Math.floor(now/300+x)%3===0){c.fillStyle="#fff8c0";c.fillRect(bx-1,by,3,1);c.fillRect(bx,by-1,1,3)}}
      else if(!wet){c.fillStyle="#2d6fc0";c.fillRect(bx-1,by,3,3);c.fillRect(bx,by-1,1,1);c.fillStyle="#9fd8f6";c.fillRect(bx,by+1,1,1)}}});
  }
}
// โจทย์รดน้ำ: สุ่มจากหัวข้อที่ปลดล็อกแล้วในทุ่ง
function farmQuestion_(){
  const e=save.explore,open=["A"].concat(["B","C","D","E"].filter((z,i)=>e.open&&Object.values(e.open).filter(Boolean).length>i));
  const st=pickOne(open),q=makeQuestion({id:st},rng(1,4));
  return {text:q.text,answer:Number(q.answer),hint:q.explain};
}
async function farmInteract_(x,y){
  const F=farm_(),k=x+","+y,cr=F[k];
  if(!cr)return openSeedMenu_(k);
  const C=CROPS[cr.crop];
  if(cr.g>=C.grow){
    delete F[k];save.gold+=C.sell;dailyAdd_("harvest");persist();updateExHud_();SFX.coin();
    dust_(x*TS+8,y*TS+TS,4);toast(`เก็บเกี่ยว${C.name}แล้ว! ขายได้ 🪙 ${C.sell}`);return;
  }
  const left=WATER_COOLDOWN-(Date.now()-(cr.w||0));
  if(left>0)return toast(`ดินยังชุ่มอยู่ รออีก ${Math.ceil(left/1000)} วินาทีค่อยรดน้ำใหม่นะ`);
  const q=farmQuestion_();
  const ok=await askNumber({title:`💧 รดน้ำ${C.name}`,text:`ตอบให้ถูกเพื่อรดน้ำ: ${q.text}`,answer:q.answer,hint:q.hint});
  if(!ok)return;
  cr.g++;cr.w=Date.now();dailyAdd_("water");persist();SFX.heal();
  toast(cr.g>=C.grow?`${C.name}โตเต็มที่แล้ว! กด A เพื่อเก็บเกี่ยว`:`รดน้ำแล้ว ${C.name}โตขึ้น (${cr.g}/${C.grow})`);
}
function openSeedMenu_(k){
  SFX.click();X.busy=true;X.held=null;
  $("ex-menu-body").innerHTML=`<p class="pixel-label">FARM</p><h3 style="margin:4px 0 8px">🌱 เลือกเมล็ดพันธุ์</h3>
    <p style="margin:0 0 8px;font-size:.85rem;opacity:.85">รดน้ำโดยตอบโจทย์ให้ถูก ครบจำนวนครั้งแล้วเก็บเกี่ยวขายได้</p>
    ${Object.entries(CROPS).map(([id,C])=>`<button type="button" class="btn btn-ghost btn-block" ${save.gold<C.price?"disabled":""} onclick="plantSeed_('${k}','${id}')">${C.icon} ${C.name} · รดน้ำ ${C.grow} ครั้ง · ขาย 🪙 ${C.sell} <b style="float:right">🪙 ${C.price}</b></button>`).join("")}
    <button type="button" class="btn btn-gold btn-block" onclick="closeExMenu()">ปิด</button>`;
  $("ex-menu").classList.remove("hidden");
}
function plantSeed_(k,id){
  const C=CROPS[id];if(save.gold<C.price)return;
  save.gold-=C.price;farm_()[k]={crop:id,g:0,w:0};persist();updateExHud_();closeExMenu();SFX.item();
  const [x,y]=k.split(",").map(Number);dust_(x*TS+8,y*TS+TS,3);toast(`ปลูก${C.name}แล้ว! กด A เพื่อรดน้ำ`);
}

/* ---------------- 2) ภารกิจรายวัน ---------------- */
const DAILY_POOL=[
  {id:"kill",text:"ปราบมอนสเตอร์ในทุ่ง",goal:3,reward:30},
  {id:"correct",text:"ตอบคำถามในการต่อสู้ให้ถูก",goal:12,reward:40},
  {id:"water",text:"รดน้ำผักในฟาร์ม",goal:3,reward:25},
  {id:"harvest",text:"เก็บเกี่ยวผักในฟาร์ม",goal:1,reward:30},
  {id:"crit",text:"ตีคริติคอล (ตอบเร็ว)",goal:3,reward:35}
];
const todayKey_=()=>{const d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()};
function daily_(){
  const t=todayKey_();
  if(!save.daily||save.daily.date!==t){
    let h=0;for(const ch of t)h=(h*31+ch.charCodeAt(0))>>>0;
    const pool=DAILY_POOL.slice(),ids=[];while(ids.length<3){const i=h%pool.length;ids.push(pool.splice(i,1)[0].id);h=Math.floor(h/7)+13}
    save.daily={date:t,ids,c:{},claimed:{}};
  }
  return save.daily;
}
function dailyAdd_(id,n){
  if(!save)return;const D=daily_();if(!D.ids.includes(id))return;
  const q=DAILY_POOL.find(q=>q.id===id),before=D.c[id]||0;D.c[id]=before+(n||1);
  if(before<q.goal&&D.c[id]>=q.goal)setTimeout(()=>toast(`✨ ภารกิจรายวันสำเร็จ: ${q.text} — ไปรับรางวัลที่กระดานประกาศหมู่บ้าน`),600);
  persist();
}
function openDaily_(){
  SFX.click();if(X){X.busy=true;X.held=null}
  const D=daily_(),rows=D.ids.map(id=>{const q=DAILY_POOL.find(q=>q.id===id),n=Math.min(q.goal,D.c[id]||0),done=n>=q.goal;
    return `<div class="daily-row"><div><b>${q.text}</b><div class="daily-bar"><span style="width:${n/q.goal*100}%"></span></div><small>${n}/${q.goal} · รางวัล 🪙 ${q.reward}</small></div>
      ${D.claimed[id]?`<span class="chip">✅ รับแล้ว</span>`:`<button type="button" class="btn btn-small ${done?"btn-gold":"btn-ghost"}" ${done?"":"disabled"} onclick="claimDaily_('${id}')">รับ</button>`}</div>`}).join("");
  const all=D.ids.every(id=>D.claimed[id]);
  $("ex-menu-body").innerHTML=`<p class="pixel-label">DAILY</p><h3 style="margin:4px 0 8px">📜 ภารกิจประจำวัน</h3>${rows}
    <p style="font-size:.8rem;opacity:.8;margin:8px 0">${all?"ทำครบทุกภารกิจแล้ว เก่งมาก! พรุ่งนี้มีภารกิจใหม่นะ":"ภารกิจเปลี่ยนใหม่ทุกวัน · ทำครบทั้ง 3 ข้อรับโบนัสยาฟื้นพลังเพิ่ม 1 ขวด"}</p>
    <button type="button" class="btn btn-gold btn-block" onclick="closeExMenu()">ปิด</button>`;
  $("ex-menu").classList.remove("hidden");
}
function claimDaily_(id){
  const D=daily_(),q=DAILY_POOL.find(q=>q.id===id);if(D.claimed[id]||(D.c[id]||0)<q.goal)return;
  D.claimed[id]=true;save.gold+=q.reward;SFX.coin();
  if(D.ids.every(i=>D.claimed[i])){save.items.potion=(save.items.potion||0)+1;SFX.levelUp();toast("ทำภารกิจรายวันครบ! ได้ 🧪 ยาฟื้นพลังเป็นโบนัส")}
  persist();updateExHud_();openDaily_();
}

/* ---------------- 3) สมุดมอนสเตอร์ ---------------- */
function recordBattle_(B,won){
  if(!save||!B||!B.enemy)return;
  save.book=save.book||{};
  const e=B.enemy,key=e.name,r=save.book[key]||(save.book[key]={name:e.name,tiny:e.tiny||null,hue:e.hue||0,sprite:e.sprite||null,stage:B.kind==="stage"?B.ref:null,seen:0,won:0,correct:0,wrong:0});
  r.seen++;if(won)r.won++;r.correct+=B.correct;r.wrong+=B.wrong;
  dailyAdd_("correct",B.correct);if(B.crits)dailyAdd_("crit",B.crits);
  persist();
}
function bookThumb_(r){
  if(r.tiny&&typeof tinyTinted_==="function"){const src=tinyTinted_(r.tiny,"idle",r.hue);if(src.width||src.naturalWidth){const cv=document.createElement("canvas");cv.width=40;cv.height=28;
    const c=cv.getContext("2d");c.imageSmoothingEnabled=false;c.translate(40,0);c.scale(-1,1);c.drawImage(src,32,30,40,28,0,0,40,28);return `<img src="${cv.toDataURL()}" class="pixelated" style="width:60px;height:42px" alt="">`}}
  if(r.sprite)return spriteImg(r.sprite,42);
  return `<span style="font-size:1.6rem">👾</span>`;
}
function openBook_(retry){
  if(!retry)SFX.click();if(X){X.busy=true;X.held=null}
  const B=save.book||{},list=Object.values(B).sort((a,b)=>b.seen-a.seen);
  // ภาพมอนสเตอร์ยังโหลดไม่เสร็จ → รอแล้ววาดใหม่ (ครั้งเดียว)
  if(!retry&&typeof tinyImg_==="function"&&list.some(r=>r.tiny&&!tinyImg_(r.tiny,"idle").naturalWidth)){list.forEach(r=>{if(r.tiny)tinyImg_(r.tiny,"idle")});setTimeout(()=>{if(!$("ex-menu").classList.contains("hidden"))openBook_(true)},400)}
  const topics={};list.forEach(r=>{if(!r.stage)return;const t=topics[r.stage]||(topics[r.stage]={c:0,w:0});t.c+=r.correct;t.w+=r.wrong});
  const weak=Object.entries(topics).filter(([,t])=>t.c+t.w>=5).sort((a,b)=>a[1].c/(a[1].c+a[1].w)-b[1].c/(b[1].c+b[1].w))[0];
  $("ex-menu-body").innerHTML=`<p class="pixel-label">MONSTER BOOK</p><h3 style="margin:4px 0 8px">📖 สมุดมอนสเตอร์ (${list.length})</h3>
    ${weak?`<div class="book-weak">💡 หัวข้อที่ควรทบทวน: <b>${esc(TOPICS[weak[0]]||weak[0])}</b> (ตอบถูก ${Math.round(weak[1].c/(weak[1].c+weak[1].w)*100)}%)</div>`:""}
    <div class="book-list">${list.length?list.map(r=>{const tot=r.correct+r.wrong,acc=tot?Math.round(r.correct/tot*100):0;
      return `<div class="book-row">${bookThumb_(r)}<div><b>${esc(r.name)}</b><small>${r.stage&&TOPICS[r.stage]?esc(TOPICS[r.stage])+" · ":""}เจอ ${r.seen} · ชนะ ${r.won}</small>
        <div class="daily-bar"><span style="width:${acc}%;background:${acc>=80?"#84cc16":acc>=50?"#fbbf24":"#ef4444"}"></span></div><small>ตอบถูก ${acc}% (${r.correct}/${tot})</small></div></div>`}).join(""):`<p style="opacity:.8">ยังไม่เคยสู้กับมอนสเตอร์เลย ออกไปผจญภัยในทุ่งกันเถอะ!</p>`}</div>
    <button type="button" class="btn btn-gold btn-block" onclick="closeExMenu()">ปิด</button>`;
  $("ex-menu").classList.remove("hidden");
}

/* ---------------- 4) ร้านชุด (เปลี่ยนสีเสื้อตัวเดินบนแผนที่) ---------------- */
const OUTFIT_PAL={red:["#6a1420","#b02a2a","#e85a4a"],blue:["#1e3a78","#2f5fb8","#5f9ae8"],green:["#1a4a24","#2e7a3a","#5aae54"],
  purple:["#3a1a5a","#6a3aa0","#9a6ad8"],gold:["#7a5a10","#c8a020","#f8e060"],black:["#141418","#26262e","#3a3a46"],pink:["#8a2a5a","#d85a9a","#f8a0c8"],white:["#8a8f9e","#c8ccd8","#f4f6fa"]};
const OUTFITS=[{id:"red",name:"เสื้อแดงนักสู้"},{id:"blue",name:"เสื้อฟ้าทะเล"},{id:"green",name:"เสื้อเขียวป่า"},{id:"purple",name:"เสื้อม่วงเวทมนตร์"},
  {id:"gold",name:"เสื้อทองราชา"},{id:"black",name:"เสื้อดำนินจา"},{id:"pink",name:"เสื้อชมพูซากุระ"},{id:"white",name:"เสื้อขาวนักเรียน"}];
const OUTFIT_PRICE=60;
// สีเสื้อเดิมของแต่ละตัว (ตรงกับตอนสร้างภาพ ms_*.png)
const HERO_SHIRT={student_m:"white",student_f:"white",warrior:"blue",warrior_r:"red",mage:"purple",mage_b:"blue",ninja:"navy",ninja_r:"red",
  archer:"green",archer_b:"brown",princess:"pink",prince:"blue"};
const SHIRT_BASE=Object.assign({navy:["#1a2240","#2c3a6a","#4a5f9a"],brown:["#3a2418","#6b4226","#9a6a3e"]},OUTFIT_PAL);
const OUTFIT_CACHE={};
function outfitImg_(key){
  if(!save||!save.outfit)return null;const hk=heroKey(save.avatar);if(key!=="ms_"+hk)return null;
  const base=packImg_(key),from=SHIRT_BASE[HERO_SHIRT[hk]],to=OUTFIT_PAL[save.outfit];if(!from||!to||!base.complete||!base.naturalWidth)return null;
  const ck=key+save.outfit;if(OUTFIT_CACHE[ck])return OUTFIT_CACHE[ck];
  const cv=document.createElement("canvas");cv.width=base.naturalWidth;cv.height=base.naturalHeight;const c=cv.getContext("2d");c.drawImage(base,0,0);
  const id=c.getImageData(0,0,cv.width,cv.height),d=id.data,map={};from.forEach((h,i)=>{map[h]=to[i]});
  for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;const h="#"+[d[i],d[i+1],d[i+2]].map(v=>v.toString(16).padStart(2,"0")).join(""),t=map[h];
    if(t){d[i]=parseInt(t.slice(1,3),16);d[i+1]=parseInt(t.slice(3,5),16);d[i+2]=parseInt(t.slice(5,7),16)}}
  c.putImageData(id,0,0);return OUTFIT_CACHE[ck]=cv;
}
function openOutfits_(){
  SFX.click();X.busy=true;X.held=null;save.outfits=save.outfits||[];
  $("ex-menu-body").innerHTML=`<p class="pixel-label">CLOTHES</p><h3 style="margin:4px 0 8px">👕 ราวเสื้อของป้าแม่ค้า</h3>
    <p style="margin:0 0 8px;font-size:.85rem;opacity:.85">เปลี่ยนสีเสื้อของตัวละครตอนเดินบนแผนที่ · ชุดละ 🪙 ${OUTFIT_PRICE} ซื้อครั้งเดียวใส่ได้ตลอด</p>
    <div class="outfit-grid">${OUTFITS.map(o=>{const own=save.outfits.includes(o.id),on=save.outfit===o.id,[a,b,c]=OUTFIT_PAL[o.id];
      return `<button type="button" class="btn btn-ghost outfit-btn${on?" on":""}" ${!own&&save.gold<OUTFIT_PRICE?"disabled":""} onclick="pickOutfit_('${o.id}')">
        <span class="swatch" style="background:linear-gradient(135deg,${c},${b} 55%,${a})"></span>${o.name}<small>${on?"ใส่อยู่":own?"ใส่ชุดนี้":"🪙 "+OUTFIT_PRICE}</small></button>`}).join("")}</div>
    <button type="button" class="btn btn-ghost btn-block" onclick="pickOutfit_(null)">ใส่ชุดเดิมของตัวละคร</button>
    <button type="button" class="btn btn-gold btn-block" onclick="closeExMenu()">ปิด</button>`;
  $("ex-menu").classList.remove("hidden");
}
function pickOutfit_(id){
  save.outfits=save.outfits||[];
  if(id&&!save.outfits.includes(id)){if(save.gold<OUTFIT_PRICE)return;save.gold-=OUTFIT_PRICE;save.outfits.push(id);SFX.coin()}else SFX.item();
  save.outfit=id;persist();updateExHud_();openOutfits_();
}
