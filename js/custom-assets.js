/* Math Quest V2 — ใช้ภาพ PNG ของครูเองแทนภาพที่วาดด้วยโค้ด
   วางไฟล์ภาพใน assets/custom/ แล้วสร้าง assets/custom/manifest.json (ดูตัวอย่างใน assets/custom/README.md)
   ถ้าไม่มี manifest เกมจะใช้ภาพที่วาดด้วยโค้ดตามปกติ */

const CUSTOM={sprites:{},chars:{},loaded:false};
function loadImage_(src){return new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src})}
async function loadCustomAssets(){
  try{
    const r=await fetch("assets/custom/manifest.json",{cache:"no-cache"});
    if(!r.ok)return;
    const m=await r.json(),base="assets/custom/";
    await Promise.all(Object.entries(m.sprites||{}).map(async([key,src])=>{const img=await loadImage_(base+src);if(img)CUSTOM.sprites[key]={img,url:base+src}}));
    await Promise.all(Object.entries(m.characters||{}).map(async([key,def])=>{
      const d=typeof def==="string"?{src:def}:def,img=await loadImage_(base+d.src);
      if(img)CUSTOM.chars[key]={img,cols:d.cols||3,rows:d.rows||4,order:d.order||["down","left","right","up"]};
    }));
    CUSTOM.loaded=true;
    // ล้างแคชภาพที่วาดไว้ก่อนหน้า ให้ใช้ภาพใหม่
    Object.keys(CUSTOM.sprites).forEach(k=>{delete SPRITE_CANVAS[k];delete SPRITE_CACHE[k]});
    Object.keys(CHAR_CACHE).forEach(k=>{if(CUSTOM.chars[k.split("|")[0]])delete CHAR_CACHE[k]});
  }catch(e){}
}
function customSprite(key){const c=CUSTOM.sprites[key];return c?c.img:null}
function customSpriteURL(key){const c=CUSTOM.sprites[key];return c?c.url:null}
// ตัดเฟรมจาก sprite sheet แบบ RPG Maker: 3 คอลัมน์ (ก้าว-ยืน-ก้าว) × 4 แถว (ล่าง ซ้าย ขวา บน)
function customCharFrame(key,dir,frame){
  const c=CUSTOM.chars[key];if(!c)return null;
  const fw=Math.floor(c.img.width/c.cols),fh=Math.floor(c.img.height/c.rows);
  const row=Math.max(0,c.order.indexOf(dir)),col=c.cols>=3?[1,0,2][frame]:0;
  const cv=document.createElement("canvas");cv.width=fw;cv.height=fh;
  cv.getContext("2d").drawImage(c.img,col*fw,row*fh,fw,fh,0,0,fw,fh);
  return cv;
}
