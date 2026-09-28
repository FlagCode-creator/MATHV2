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
  if(type==="slash"){
    fxEl_("fx-slash",box,`--r0:-70deg;--r1:25deg;--s:${big}`);
    if(crit)fxEl_("fx-slash",box,`--r0:110deg;--r1:205deg;--s:${big};animation-delay:90ms`);
  }else if(type==="ninja"){
    [-35,25,80].forEach((r,i)=>fxEl_("fx-cut",box,`--r:${r}deg;animation-delay:${i*70}ms;--s:${big}`));
    fxEl_("fx-star",box,"");
  }else if(type==="arrow"){
    fxEl_("fx-arrow",box,"");if(crit)fxEl_("fx-arrow",box,"animation-delay:90ms;top:44%");
  }else if(type==="fire"){
    fxEl_("fx-glow",box,"--g:rgba(255,120,20,.85)");
    burst_(box,{n:crit?26:18,colors:col,spread:70*big,up:60,size:12,dur:700,cls:"rise"});
  }else if(type==="water"){
    fxEl_("fx-ring",box,"--c:#7dd3fc");if(crit)fxEl_("fx-ring",box,"--c:#e0f7ff;animation-delay:120ms");
    burst_(box,{n:crit?26:18,colors:col,spread:95*big,up:-10,size:10,dur:650,cls:"drop"});
  }else if(type==="magic"){
    fxEl_("fx-ring",box,"--c:#c084fc");fxEl_("fx-glow",box,"--g:rgba(192,132,252,.7)");
    for(let i=0;i<(crit?12:8);i++){const a=i/(crit?12:8)*Math.PI*2,r=rnd_(60,95)*big;
      const st=fxEl_("fx-twinkle",box,`--dx:${Math.round(Math.cos(a)*r)}px;--dy:${Math.round(Math.sin(a)*r)}px;color:${col[i%col.length]};animation-delay:${i*20}ms`);st.textContent="✦"}
  }
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
  const layer=document.getElementById("fx-layer"),img=document.querySelector("#enemy-sprite img");if(!layer)return;
  let colors=["#a3e635","#65a30d","#fef08a"];
  try{
    if(img&&img.complete){const cv=document.createElement("canvas");cv.width=cv.height=16;const c=cv.getContext("2d");c.drawImage(img,0,0,16,16);
      const d=c.getImageData(0,0,16,16).data,cs=[];for(let i=0;i<d.length;i+=4)if(d[i+3]>200)cs.push(`rgb(${d[i]},${d[i+1]},${d[i+2]})`);
      if(cs.length>4){colors=[];for(let i=0;i<14;i++)colors.push(cs[Math.floor(Math.random()*cs.length)])}}
  }catch(e){}
  const box=fxEl_("fx-box",layer);fxKill_(box,1600);
  burst_(box,{n:34,colors,spread:110,up:30,size:10,dur:900,cls:"fall"});
  for(let i=0;i<5;i++)fxEl_("fx-coin",box,`--dx:${Math.round(rnd_(-70,70))}px;animation-delay:${250+i*70}ms`);
}

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
