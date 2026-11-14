/* Math Quest V2 — เอฟเฟกต์ฉากต่อสู้ (ไม่ต้องใช้ภาพเพิ่ม)
   - battleTransition_ / battleTransitionOut_ : จอแตกเป็นแถบ + แฟลช ก่อนเข้าฉากสู้ (แบบเกม RPG)
   - attackFx_   : เอฟเฟกต์โจมตีตามอาชีพ (ฟัน · ไฟ · น้ำ · เวทมนตร์ · ลูกศร · นินจา)
   - critCutIn_  : คริติคอล — ภาพหน้าตัวละครพุ่งผ่านจอ
   - enemyBurst_ : มอนสเตอร์แตกเป็นพิกเซล + เหรียญเด้ง
   - bossBanner_ : ป้ายเปิดตัวบอส */

const HERO_FX={warrior:"slash",prince:"slash",student_m:"slash",student_f:"slash",warrior_r:"fire",
  mage:"magic",princess:"magic",mage_b:"water",ninja:"ninja",ninja_r:"ninja",archer:"arrow",archer_b:"arrow"};
const FX_COLORS={slash:["#ffffff","#e0f2fe","#fde68a"],fire:["#fff3a0","#ffb020","#ff6a00","#e02020"],
  water:["#e0f7ff","#7dd3fc","#38bdf8","#0ea5e9"],magic:["#f5d0fe","#c084fc","#a855f7","#fde047"],
  ninja:["#ffffff","#cbd5e1","#f87171"],arrow:["#fef9c3","#fde047","#a3e635"]};
const rnd_=(a,b)=>a+Math.random()*(b-a);

/* ---- ภาพเอฟเฟกต์เคลื่อนไหว: Super Pixel Effects Gigapack (Will Tice / unTied Games) ----
   assets/fx/<ชื่อ>.png = เฟรมเรียงแนวนอนเป็นแถบเดียว · [กว้าง, สูง, จำนวนเฟรม] ต่อเฟรม */
const FX_SHEETS={slash:[140,50,7],hit:[96,96,7],crit:[160,160,8],fire:[96,96,9],water:[96,96,10],magic:[96,96,10],
  ninja:[80,80,6],arrow:[80,80,5],hurt:[48,48,7],smoke:[96,96,15],coins:[64,64,31],heal:[64,64,16],shield:[64,64,18],levelup:[160,64,43]};
const FX_VER="1";
Object.keys(FX_SHEETS).forEach(k=>{const i=new Image();i.src=`assets/fx/${k}.png?v=${FX_VER}`});   // โหลดไว้ก่อน จะได้ไม่กระตุกตอนเล่น
// เล่นเอฟเฟกต์ 1 รอบแล้วลบทิ้ง · layer = กล่องที่จะวางทับ (ไม่ระบุ = กลางจอ) · x,y เป็น % ของกล่อง
function spriteFx_(name,{layer,x=50,y=50,scale=1,fps=18,flip=false,delay=0}={}){
  const m=FX_SHEETS[name];if(!m)return Promise.resolve();
  const [w,h,n]=m,W=Math.round(w*scale),H=Math.round(h*scale);
  const el=fxEl_("fx-sprite"+(layer?"":" fixed"),layer||document.body,
    `width:${W}px;height:${H}px;left:${x}%;top:${y}%;background-image:url(assets/fx/${name}.png?v=${FX_VER});background-size:${W*n}px ${H}px;`+
    `transform:translate(-50%,-50%)${flip?" scaleX(-1)":""};opacity:0`);
  return new Promise(res=>{
    const a=el.animate([{backgroundPositionX:"0px",opacity:1},{backgroundPositionX:`${-W*n}px`,opacity:1}],
      {duration:n*1000/fps,delay,easing:`steps(${n})`,fill:"forwards"});
    a.onfinish=()=>{el.remove();res()};
  });
}
const fxEl_=(cls,parent,style)=>{const d=document.createElement("div");d.className=cls;if(style)d.setAttribute("style",style);(parent||document.body).appendChild(d);return d};
const fxKill_=(el,ms)=>setTimeout(()=>el.remove(),ms);

/* ---- เปลี่ยนฉากเข้าสู่การต่อสู้ ---- */
function btOverlay_(){
  let o=document.getElementById("bt-overlay");
  if(!o){o=fxEl_("bt-overlay");o.id="bt-overlay";for(let i=0;i<8;i++)fxEl_("bt-bar",o,`top:${i*12.5}%;--d:${i%2?1:-1};animation-delay:${i*28}ms`)}
  return o;
}
function battleTransition_(){
  return new Promise(res=>{
    const o=btOverlay_();o.className="bt-overlay in";SFX.transition&&SFX.transition();
    setTimeout(res,520);
  });
}
function battleTransitionOut_(){
  const o=document.getElementById("bt-overlay");if(!o)return;
  o.className="bt-overlay out";setTimeout(()=>{if(o.classList.contains("out"))o.className="bt-overlay"},520);
}

/* ---- อนุภาค (สี่เหลี่ยมพิกเซล) ---- */
function burst_(layer,{n,colors,spread,up,size,dur,cls,x,y}){
  for(let i=0;i<n;i++){
    const a=rnd_(0,Math.PI*2),r=rnd_(spread*0.4,spread),s=Math.round(rnd_(size*0.6,size));
    fxEl_("fx-p "+(cls||""),layer,`left:${x||50}%;top:${y||50}%;width:${s}px;height:${s}px;background:${colors[i%colors.length]};`+
      `--dx:${Math.round(Math.cos(a)*r)}px;--dy:${Math.round(Math.sin(a)*r-(up||0))}px;animation-duration:${dur||600}ms;animation-delay:${Math.round(rnd_(0,60))}ms`);
  }
}

/* ---- เอฟเฟกต์โจมตีตามอาชีพ ---- */
function attackFx_(avatar,crit){
  const layer=document.getElementById("fx-layer");if(!layer)return;
  const type=HERO_FX[avatar]||"slash",col=FX_COLORS[type],big=crit?1.35:1;
  const box=fxEl_("fx-box",layer);fxKill_(box,1000);
  // ภาพเอฟเฟกต์ตามอาชีพ + แรงกระแทกตอนโดน (คริติคอล = ระเบิดใหญ่เพิ่ม) · ลูกศรบินเข้าไปก่อนแล้วค่อยระเบิด
  const late=type==="arrow"?170:0;
  if(type==="arrow"){fxEl_("fx-arrow",box,"");if(crit)fxEl_("fx-arrow",box,"animation-delay:90ms;top:44%")}
  spriteFx_(type,{layer,y:52,scale:1.7*big,flip:type==="slash"&&Math.random()<0.5,delay:late});
  spriteFx_("hit",{layer,x:rnd_(44,56),y:rnd_(46,58),scale:1.1*big,delay:late+90});
  if(crit)spriteFx_("crit",{layer,y:50,scale:1.3,delay:late+60});
  if(type==="fire")burst_(box,{n:crit?20:12,colors:col,spread:70*big,up:60,size:10,dur:700,cls:"rise"});
  else if(type==="water")burst_(box,{n:crit?20:12,colors:col,spread:95*big,up:-10,size:9,dur:650,cls:"drop"});
  else if(type==="magic")burst_(box,{n:crit?20:12,colors:col,spread:90*big,size:7,dur:650});
  // ประกายตอนโดน (ทุกอาชีพ)
  setTimeout(()=>burst_(box,{n:crit?14:9,colors:["#ffffff","#fef08a","#fde047"],spread:60*big,size:6,dur:420}),type==="arrow"?170:60);
}

/* ---- คริติคอล: ภาพหน้าตัวละครพุ่งผ่านจอ ---- */
function critCutIn_(avatar){
  return new Promise(res=>{
    const key=heroKey(avatar);
    const b=(typeof expressionBust==="function"&&(expressionBust(key,"angry")||expressionBust(key,"neutral")))||(typeof bustInfo==="function"&&bustInfo(key));
    const o=fxEl_("cutin");
    fxEl_("cutin-lines",o);
    const pic=fxEl_("cutin-pic",o);
    pic.innerHTML=b?`<img class="pixelated" src="${b.url}" alt="">`:heroImg(avatar,150,"pixelated");
    const t=fxEl_("cutin-text",o);t.textContent="CRITICAL!";
    document.body.classList.add("flash");setTimeout(()=>document.body.classList.remove("flash"),160);
    setTimeout(res,620);fxKill_(o,900);
  });
}

/* ---- มอนสเตอร์แตกเป็นพิกเซล (ใช้สีจากภาพจริง) + เหรียญ ---- */
function enemyBurst_(){
  const layer=document.getElementById("fx-layer"),img=document.querySelector("#enemy-sprite img, #enemy-sprite canvas");if(!layer)return;
  let colors=["#a3e635","#65a30d","#fef08a"];
  try{
    if(img&&(img.complete||img.getContext)){const cv=document.createElement("canvas");cv.width=cv.height=16;const c=cv.getContext("2d");c.drawImage(img,0,0,16,16);
      const d=c.getImageData(0,0,16,16).data,cs=[];for(let i=0;i<d.length;i+=4)if(d[i+3]>200)cs.push(`rgb(${d[i]},${d[i+1]},${d[i+2]})`);
      if(cs.length>4){colors=[];for(let i=0;i<14;i++)colors.push(cs[Math.floor(Math.random()*cs.length)])}}
  }catch(e){}
  const box=fxEl_("fx-box",layer);fxKill_(box,1600);
  burst_(box,{n:34,colors,spread:110,up:30,size:10,dur:900,cls:"fall"});
  spriteFx_("smoke",{layer,y:55,scale:1.8,fps:20});
  spriteFx_("coins",{layer,y:45,scale:2.2,fps:24,delay:250});
}
// เอฟเฟกต์ที่ตัวผู้เล่น (โดนตี · ฟื้นพลัง · โล่) — วางทับรูปผู้เล่นในแถบล่าง
function playerFx_(name){spriteFx_(name,{layer:document.getElementById("player-avatar"),scale:name==="hurt"?1.6:1.3,fps:name==="hurt"?20:22})}

/* ---- ป้ายเปิดตัวบอส ---- */
function bossBanner_(name,title){
  return new Promise(res=>{
    const o=fxEl_("boss-banner");
    o.innerHTML=`<div class="bb-warn"><span>⚠ WARNING ⚠ WARNING ⚠ WARNING ⚠ WARNING ⚠ WARNING ⚠</span></div>
      <div class="bb-mid"><small>${esc(title||"BOSS")}</small><b>${esc(name)}</b></div>
      <div class="bb-warn low"><span>⚠ WARNING ⚠ WARNING ⚠ WARNING ⚠ WARNING ⚠ WARNING ⚠</span></div>`;
    SFX.boss&&SFX.boss();
    const scr=document.getElementById("screen-battle");if(scr){scr.classList.remove("quake");void scr.offsetWidth;scr.classList.add("quake")}
    let done=false;const fin=()=>{if(done)return;done=true;o.classList.add("bye");setTimeout(()=>o.remove(),300);res()};
    o.addEventListener("pointerdown",fin);setTimeout(fin,1500);
  });
}
function screenShake_(){const scr=document.getElementById("screen-battle");if(!scr)return;scr.classList.remove("quake");void scr.offsetWidth;scr.classList.add("quake")}
