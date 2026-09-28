/* Math Quest V2 — ใช้ภาพ PNG ของครูเองแทนภาพที่วาดด้วยโค้ด
   วางไฟล์ภาพใน assets/custom/ แล้วเขียนรายชื่อใน assets/custom/manifest.json (ดูวิธีใน assets/custom/README.md)
   ถ้าไม่มี manifest เกมจะใช้ภาพที่วาดด้วยโค้ดตามปกติ

   ประเภทภาพใน manifest:
   - portraits  : ภาพใหญ่ของตัวละคร/NPC (ท่าเดียว) → ฉากต่อสู้ บทสนทนา หน้าตัวละคร
   - sprites    : ภาพใหญ่ของมอนสเตอร์/บอส/วัตถุ → ฉากต่อสู้และหน้าจอต่าง ๆ (บนแผนที่ยังใช้ตัวเล็กที่วาดด้วยโค้ด)
   - mapSprites : ภาพเล็กสำหรับบนแผนที่ (ไม่บังคับ)
   - characters : sprite sheet เดิน 4 ทิศ แบบ RPG Maker (ไม่บังคับ)
   - talk       : ภาพปากอ้าของตัวละคร → สลับกับภาพปกติตอนพูด (ไม่บังคับ)
   - expressions: ภาพสีหน้า {happy, sad, surprised, angry} ของตัวละคร (ไม่บังคับ)
   - poses      : ภาพท่าต่อสู้ {attack, hurt, win} ของตัวละคร · มอนสเตอร์ {attack, hurt} · บอสเพิ่ม {rage} (ไม่บังคับ)
   - backgrounds: ภาพฉากต่อสู้ของแต่ละดินแดน {w1 … w9} (ไม่บังคับ)
   ภาพที่มีพื้นหลังสีเรียบจะถูกตัดพื้นหลังและขอบว่างออกให้อัตโนมัติ */

const CUSTOM={portraits:{},sprites:{},mapSprites:{},chars:{},talk:{},expressions:{},poses:{},backgrounds:{},loaded:false};
function loadImage_(src){return new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src})}

// ตัดพื้นหลังสีเรียบ (ไล่จากขอบภาพ) + ตัดขอบโปร่งใสรอบตัวละคร
function cleanImage_(img,noTrim){
  const w=img.naturalWidth,h=img.naturalHeight,cv=document.createElement("canvas");cv.width=w;cv.height=h;
  const ctx=cv.getContext("2d");ctx.drawImage(img,0,0);
  let data;try{data=ctx.getImageData(0,0,w,h)}catch(e){return {canvas:cv,url:img.src,w,h}}
  const d=data.data,idx=(x,y)=>(y*w+x)*4;
  const corners=[[0,0],[w-1,0],[0,h-1],[w-1,h-1]].map(([x,y])=>idx(x,y));
  const opaque=corners.every(i=>d[i+3]>250);
  const near=(i,j,t)=>Math.abs(d[i]-d[j])+Math.abs(d[i+1]-d[j+1])+Math.abs(d[i+2]-d[j+2])<=t;
  if(opaque&&corners.every(i=>near(i,corners[0],60))){
    const ref=corners[0],seen=new Uint8Array(w*h),stack=[];
    for(let x=0;x<w;x++){stack.push(x,0,x,h-1)}for(let y=0;y<h;y++){stack.push(0,y,w-1,y)}
    while(stack.length){
      const y=stack.pop(),x=stack.pop(),k=y*w+x;
      if(x<0||y<0||x>=w||y>=h||seen[k])continue;seen[k]=1;
      const i=k*4;if(!near(i,ref,48))continue;
      d[i+3]=0;stack.push(x+1,y,x-1,y,x,y+1,x,y-1);
    }
  }
  if(noTrim){ctx.putImageData(data,0,0);return {canvas:cv,url:null,w,h}}
  let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[idx(x,y)+3]>10){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<0)return {canvas:cv,url:cv.toDataURL(),w,h};
  ctx.putImageData(data,0,0);
  const out=document.createElement("canvas");out.width=x1-x0+1;out.height=y1-y0+1;
  out.getContext("2d").drawImage(cv,x0,y0,out.width,out.height,0,0,out.width,out.height);
  return {canvas:out,url:out.toDataURL(),w:out.width,h:out.height};
}

function downscaleBg_(img){
  let src=img,w=img.naturalWidth,h=img.naturalHeight;const W=Math.min(480,w),H=Math.round(h*W/w);
  while(w/2>=W){const t=document.createElement("canvas");t.width=Math.round(w/2);t.height=Math.round(h/2);
    const c=t.getContext("2d");c.imageSmoothingQuality="high";c.drawImage(src,0,0,t.width,t.height);src=t;w=t.width;h=t.height}
  const cv=document.createElement("canvas");cv.width=W;cv.height=H;const c=cv.getContext("2d");c.imageSmoothingQuality="high";c.drawImage(src,0,0,W,H);
  let url;try{url=cv.toDataURL()}catch(e){url=img.src}
  return {url,w:W,h:H};
}
async function loadCustomAssets(){
  try{
    const r=await fetch("assets/custom/manifest.json",{cache:"no-cache"});
    if(!r.ok)return;
    const m=await r.json(),base="assets/custom/",ver=m.version?"?v="+m.version:"";   // version: เพิ่มเลขเมื่อเปลี่ยนภาพ (กันแคชภาพเก่า)
    const loadGroup=async(group,target)=>Promise.all(Object.entries(m[group]||{}).map(async([key,src])=>{
      const img=await loadImage_(base+src+ver);if(img)target[key]=cleanImage_(img);
    }));
    await loadGroup("portraits",CUSTOM.portraits);
    await loadGroup("sprites",CUSTOM.sprites);
    await loadGroup("mapSprites",CUSTOM.mapSprites);
    await loadGroup("talk",CUSTOM.talk);
    // expressions / poses: { key: { ชื่อท่า: ไฟล์ } }
    for(const g of ["expressions","poses"])await Promise.all(Object.entries(m[g]||{}).map(async([key,set])=>{
      CUSTOM[g][key]={};
      await Promise.all(Object.entries(set||{}).map(async([name,src])=>{const img=await loadImage_(base+src+ver);if(img)CUSTOM[g][key][name]=cleanImage_(img)}));
    }));
    // ฉากพื้นหลัง: ย่อให้กว้างไม่เกิน 480 px (ขยายกลับแบบพิกเซลคมเหมือนฉากอื่น) — ไม่ตัดพื้นหลัง
    await Promise.all(Object.entries(m.backgrounds||{}).map(async([key,src])=>{
      const img=await loadImage_(base+src+ver);if(img)CUSTOM.backgrounds[key]=downscaleBg_(img);
    }));
    await Promise.all(Object.entries(m.characters||{}).map(async([key,def])=>{
      const d=typeof def==="string"?{src:def}:def,img=await loadImage_(base+d.src+ver);
      if(img)CUSTOM.chars[key]={img:cleanImage_(img,true).canvas,cols:d.cols||3,rows:d.rows||4,order:d.order||["down","left","right","up"],frames:{}};
    }));
    // โหลดภาพ Farm RPG (บ้าน ต้นไม้ รั้ว หีบ) ให้เสร็จก่อน ฉากแผนที่/ฉากต่อสู้จะได้ใช้ได้ทันที
    if(typeof FARM_IMGS!=="undefined"&&typeof packImg_==="function")await Promise.all(FARM_IMGS.map(n=>new Promise(res=>{const i=farmImg_(n);if(i.complete&&i.naturalWidth)return res();i.addEventListener("load",res,{once:true});i.addEventListener("error",res,{once:true})})));
    CUSTOM.loaded=true;
    // ล้างแคชภาพที่วาดไว้ก่อนหน้า ให้ใช้ภาพใหม่
    Object.keys(CUSTOM.sprites).concat(Object.keys(CUSTOM.mapSprites)).forEach(k=>{delete SPRITE_CANVAS[k];delete SPRITE_CACHE[k]});
    Object.keys(CHAR_CACHE).forEach(k=>{if(CUSTOM.chars[k.split("|")[0]])delete CHAR_CACHE[k]});
  }catch(e){}
}
// บนแผนที่ (canvas)
function customSprite(key){const c=CUSTOM.mapSprites[key];return c?c.canvas:null}
// ในหน้าจอ HTML
function customSpriteURL(key){const c=CUSTOM.sprites[key];return c?c.url:null}
function customSpriteInfo(key){return CUSTOM.sprites[key]||null}
// ภาพใหญ่ของตัวละคร: key = ชื่ออาชีพ (student_m) หรือ NPC (npc_flag)
function portraitInfo(key){if(!key)return null;if(key.indexOf("hero:")===0)key=key.slice(5);return CUSTOM.portraits[key]||null}
const stripKey_=k=>k&&k.indexOf("hero:")===0?k.slice(5):k;
// ภาพครึ่งตัว (หัวถึงอก) สำหรับกล่องบทสนทนา — ภาพเต็มตัว (สูงกว่ากว้าง) ตัดเอาส่วนบน ~55% · ภาพที่เป็นครึ่งตัวอยู่แล้วใช้ทั้งภาพ
const BUST_PART=0.55;
function bustOf_(info,tall){
  if(!info)return null;if(info.bust)return info.bust;
  if(info.h<info.w*(tall||1.15)){info.bust=info;return info}
  // ภาพเต็มตัว: เอาส่วนบน 55% · ภาพครึ่งตัวที่ยาวถึงเอว (สีหน้า): เอาหัวถึงอก สูง ≈ 1.15 เท่าของความกว้าง
  const h=tall?Math.min(info.h,Math.round(info.w*1.15)):Math.round(info.h*BUST_PART),cv=document.createElement("canvas");cv.width=info.w;cv.height=h;
  cv.getContext("2d").drawImage(info.canvas,0,0,info.w,h,0,0,info.w,h);
  info.bust={canvas:cv,url:cv.toDataURL(),w:info.w,h};return info.bust;
}
function bustInfo(key){return bustOf_(portraitInfo(key))}
// ภาพเพิ่มเติม (ถ้าครูใส่ไว้): ปากอ้า / สีหน้า / ท่าต่อสู้
// ภาพสีหน้า/ปากอ้ามักเป็นครึ่งตัวอยู่แล้ว (สูงกว่ากว้างเล็กน้อย) — ตัดเฉพาะภาพที่ยาวแบบเต็มตัวจริง ๆ
function talkBust(key){return bustOf_(CUSTOM.talk[stripKey_(key)],1.45)}
function expressionBust(key,mood){const s=CUSTOM.expressions[stripKey_(key)];return s&&s[mood]?bustOf_(s[mood],1.45):null}
function poseInfo(key,pose){const s=CUSTOM.poses[stripKey_(key)];return s&&s[pose]||null}
// ครูแฟล็กชุดใหม่: expressions.npc_flag มี 7 หน้า → จับคู่กับอารมณ์เดิม 18 แบบ (ไฟล์ใน assets/mascot)
const FLAG_MOOD={neutral:"neutral",hello:"neutral",wave:"neutral",
  happy:"happy",excited:"happy",celebrate:"happy",welcome:"happy",shy:"happy",
  explain:"explain",remind:"explain",homework:"explain",thinking:"thinking",confused:"thinking",
  shocked:"surprised",sad:"sad",angry:"angry",furious:"angry",determined:"angry"};
function flagExpressionURL(mood){
  const set=CUSTOM.expressions.npc_flag;if(!set)return null;
  const b=expressionBust("npc_flag",FLAG_MOOD[mood]||"neutral")||expressionBust("npc_flag","neutral");
  return b?b.url:null;
}
// ภาพ <img> ที่พอดีกรอบ size×size โดยคงสัดส่วน · ภาพใหญ่ที่ถูกย่อใช้การย่อแบบนุ่ม ภาพเล็กที่ถูกขยายใช้แบบพิกเซลคม
function fitImg_(info,size,cls){
  const s=Math.min(size/info.w,size/info.h),w=Math.round(info.w*s),h=Math.round(info.h*s);
  return `<img class="sprite ${s<1?"smooth":"pixelated"} ${cls||""}" src="${info.url}" width="${w}" height="${h}" alt="">`;
}
// ท่าเดินจาก sprite sheet สำหรับวาดบนแผนที่ (เก็บแคชทีละช่อง)
function walkFrame(key,dir,frame){
  const c=CUSTOM.chars[stripKey_(key)];if(!c)return null;
  const k=dir+frame;if(c.frames[k])return c.frames[k];
  const cv=customCharFrame(stripKey_(key),dir,frame);
  return c.frames[k]={canvas:cv,w:cv.width,h:cv.height,walk:true};
}
// sprite sheet เดิน 4 ทิศ: 3 คอลัมน์ (ก้าว-ยืน-ก้าว) × 4 แถว (ล่าง ซ้าย ขวา บน)
function customCharFrame(key,dir,frame){
  const c=CUSTOM.chars[key];if(!c)return null;
  const fw=Math.floor(c.img.width/c.cols),fh=Math.floor(c.img.height/c.rows);
  const row=Math.max(0,c.order.indexOf(dir)),col=c.cols>=3?[1,0,2][frame]:0;
  const cv=document.createElement("canvas");cv.width=fw;cv.height=fh;
  cv.getContext("2d").drawImage(c.img,col*fw,row*fh,fw,fh,0,0,fw,fh);
  return cv;
}
