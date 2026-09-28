/* Math Quest V2 — บรรยากาศบนแผนที่ (วาดทับฉากทุกเฟรม ไม่ต้องใช้ภาพเพิ่ม)
   ผีเสื้อ · ใบไม้ปลิว · เงาเมฆ · น้ำระยิบ · หญ้าไหวที่เท้า · ฟองอารมณ์เหนือหัว · เช้า-เย็น-ค่ำ (ตะเกียงสว่าง + หิ่งห้อย) */

const DAY_MS=8*60*1000;               // 1 วันในเกม = 8 นาที
// ความมืด / แสงอุ่น ตามช่วงเวลา: กลางวัน 0–0.5 · เย็น 0.5–0.62 · กลางคืน 0.62–0.85 · รุ่งเช้า 0.85–1
function dayLight_(ph){
  const lerp=(a,b,k)=>a+(b-a)*Math.max(0,Math.min(1,k));
  if(ph<0.5)return {dark:0,warm:0};
  if(ph<0.62)return {dark:lerp(0,0.2,(ph-0.5)/0.12),warm:lerp(0,0.2,(ph-0.5)/0.06)-lerp(0,0.2,(ph-0.56)/0.06)};
  if(ph<0.66)return {dark:lerp(0.2,0.42,(ph-0.62)/0.04),warm:0};
  if(ph<0.85)return {dark:0.42,warm:0};
  return {dark:lerp(0.42,0,(ph-0.85)/0.15),warm:lerp(0.14,0,(ph-0.9)/0.1)};
}
// เวลาในเกมเก็บไว้นอก X (X ถูกสร้างใหม่ทุกครั้งที่โหลดแผนที่/กลับจากการต่อสู้)
let DAY0_=null;
function dayPhase_(now){if(DAY0_===null)DAY0_=now-0.04*DAY_MS;return((now-DAY0_)/DAY_MS)%1}
function dayIndex_(now){if(DAY0_===null)dayPhase_(now);return Math.floor((now-DAY0_)/DAY_MS)}

function ambientInit_(){
  const A=X.amb={butter:[],leaves:[],flies:[],clouds:[],lastLeaf:0};
  for(let i=0;i<7;i++)A.butter.push({x:Math.random()*X.W*TS,y:Math.random()*X.H*TS,a:Math.random()*6,c:["#fef08a","#f9a8d4","#bae6fd","#fdba74"][i%4],sp:rnd_(8,16)});
  for(let i=0;i<14;i++)A.flies.push({x:Math.random()*X.W*TS,y:Math.random()*X.H*TS,a:Math.random()*6});
  for(let i=0;i<3;i++)A.clouds.push({x:Math.random()*X.W*TS,y:rnd_(0.1,0.9)*X.H*TS,rx:rnd_(50,80),ry:rnd_(22,34),v:rnd_(4,7)});
}

// วาดใต้ตัวละคร: น้ำระยิบ
function ambientUnder_(c,camX,camY,vw,vh,now){
  const x0=Math.max(0,Math.floor(camX/TS)),x1=Math.min(X.W-1,Math.ceil((camX+vw)/TS)),y0=Math.max(0,Math.floor(camY/TS)),y1=Math.min(X.H-1,Math.ceil((camY+vh)/TS));
  const f=Math.floor(now/350);c.fillStyle="rgba(255,255,255,.85)";
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(X.m.rows[y][x]!=="~")continue;
    const h=hash2_(x,y,f);if(h>0.9){const px=x*TS+Math.floor(hash2_(x,y,f+7)*13)+1-camX,py=y*TS+Math.floor(hash2_(x,y,f+3)*13)+1-camY;c.fillRect(px,py,2,1);if(h>0.97)c.fillRect(px+0.5,py-1,1,3)}}
}

// หญ้าสูงบังเท้า (วาดหลังตัวละครแต่ละตัว)
function grassOver_(c,fx,fy,camX,camY,now){
  const tx=Math.round(fx),ty=Math.round(fy);if(!X.m.rows[ty]||X.m.rows[ty][tx]!=="v")return;
  const bx=fx*TS-camX,by=fy*TS+TS-camY;
  for(let i=0;i<6;i++){const gx=bx+1+i*2.6,sw=Math.sin(now/260+i*1.3+fx*3)*1.4;
    c.strokeStyle=i%2?"#3f8f3a":"#5cb04c";c.lineWidth=1.3;c.beginPath();c.moveTo(gx,by);c.lineTo(gx+sw,by-5-(i%3));c.stroke()}
}

// วาดทับทั้งฉาก: ใบไม้ ผีเสื้อ เงาเมฆ แสงกลางวัน-กลางคืน หิ่งห้อย ฟองอารมณ์
function ambientOver_(c,camX,camY,vw,vh,now,dt){
  if(!X.amb||X.amb.map!==X.mapId){ambientInit_();X.amb.map=X.mapId}
  const A=X.amb,sec=dt/1000,{dark,warm}=dayLight_(dayPhase_(now));
  // ใบไม้ร่วงจากต้นไม้ในจอ
  if(now-A.lastLeaf>260&&A.leaves.length<18){A.lastLeaf=now;
    const tx=Math.floor(rnd_(camX,camX+vw)/TS),ty=Math.floor(rnd_(camY,camY+vh)/TS);
    if(X.m.rows[ty]&&X.m.rows[ty][tx]==="T")A.leaves.push({x:tx*TS+rnd_(-10,24),y:ty*TS-rnd_(20,40),t0:now,c:pickOne(["#6fbf4a","#9ad35a","#e9b949","#d9823b"]),s:rnd_(0,6)})}
  A.leaves=A.leaves.filter(l=>now-l.t0<3200);
  A.leaves.forEach(l=>{const k=(now-l.t0)/1000;const x=l.x+Math.sin(k*2.4+l.s)*7+k*5-camX,y=l.y+k*14-camY;
    c.globalAlpha=Math.min(1,(3.2-k)*1.5);c.fillStyle=l.c;c.fillRect(x,y,2,Math.sin(k*5+l.s)>0?2:1);c.globalAlpha=1});
  // ผีเสื้อ (กลางวัน)
  if(dark<0.25)A.butter.forEach(b=>{
    b.a+=sec*rnd_(0.5,2.2);b.x+=Math.cos(b.a)*b.sp*sec;b.y+=Math.sin(b.a*1.3)*b.sp*sec*0.7;
    if(b.x<camX-30)b.x=camX+vw+20;if(b.x>camX+vw+30)b.x=camX-20;if(b.y<camY-30)b.y=camY+vh+20;if(b.y>camY+vh+30)b.y=camY-20;
    const flap=Math.abs(Math.sin(now/70+b.a*3)),x=b.x-camX,y=b.y-camY-Math.sin(now/300+b.a)*2;
    c.globalAlpha=1-dark*3;c.fillStyle=b.c;c.fillRect(x-1-2*flap,y-1,2*flap+0.6,2.4);c.fillRect(x+1,y-1,2*flap+0.6,2.4);c.fillStyle="#3b2a1a";c.fillRect(x,y-1,1,3);c.globalAlpha=1});
  // เงาเมฆลอยผ่าน
  A.clouds.forEach(cl=>{cl.x+=cl.v*sec;if(cl.x-cl.rx>X.W*TS)cl.x=-cl.rx;
    c.fillStyle="rgba(20,30,60,.07)";c.beginPath();c.ellipse(cl.x-camX,cl.y-camY,cl.rx,cl.ry,0,0,Math.PI*2);c.ellipse(cl.x+cl.rx*0.6-camX,cl.y-cl.ry*0.4-camY,cl.rx*0.6,cl.ry*0.8,0,0,Math.PI*2);c.fill()});
  // แสงเย็น
  if(warm>0.005){c.fillStyle=`rgba(255,130,50,${warm})`;c.fillRect(0,0,vw,vh)}
  // กลางคืน: มืดลง เว้นแสงรอบตะเกียงและรอบตัวผู้เล่น
  if(dark>0.01){
    const P=1;let d=X.darkCv;if(!d||d.width!==Math.ceil(vw)||d.height!==Math.ceil(vh)){d=X.darkCv=document.createElement("canvas");d.width=Math.ceil(vw);d.height=Math.ceil(vh)}
    const dc=d.getContext("2d");dc.globalCompositeOperation="source-over";dc.clearRect(0,0,d.width,d.height);
    dc.fillStyle=`rgba(10,16,52,${dark})`;dc.fillRect(0,0,d.width,d.height);dc.globalCompositeOperation="destination-out";
    const hole=(x,y,r,a)=>{const g=dc.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(0,0,0,${a})`);g.addColorStop(1,"rgba(0,0,0,0)");dc.fillStyle=g;dc.fillRect(x-r,y-r,r*2,r*2)};
    const lamps=[];const x0=Math.max(0,Math.floor(camX/TS)-3),x1=Math.min(X.W-1,Math.ceil((camX+vw)/TS)+3),y0=Math.max(0,Math.floor(camY/TS)-3),y1=Math.min(X.H-1,Math.ceil((camY+vh)/TS)+3);
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const ch=X.m.rows[y][x];if(ch==="l")lamps.push([x*TS+8-camX,y*TS-12-camY]);else if(ch==="O")hole(x*TS+8-camX,y*TS+8-camY,26,0.5)}
    lamps.forEach(([x,y])=>hole(x,y+10,48,0.95));
    hole(X.p.fx*TS+8-camX,X.p.fy*TS+2-camY,34,0.75);
    c.drawImage(d,0,0);
    c.globalCompositeOperation="lighter";
    lamps.forEach(([x,y])=>{const g=c.createRadialGradient(x,y,0,x,y,16);g.addColorStop(0,`rgba(255,200,90,${dark*0.9})`);g.addColorStop(1,"rgba(255,200,90,0)");c.fillStyle=g;c.fillRect(x-16,y-16,32,32)});
    // หิ่งห้อย
    A.flies.forEach(f=>{f.a+=sec*rnd_(0.3,1.4);f.x+=Math.cos(f.a)*6*sec;f.y+=Math.sin(f.a*0.8)*5*sec;
      if(f.x<camX-20)f.x=camX+vw+10;if(f.x>camX+vw+20)f.x=camX-10;if(f.y<camY-20)f.y=camY+vh+10;if(f.y>camY+vh+20)f.y=camY-10;
      const b=(Math.sin(now/400+f.a*5)+1)/2*dark*2;if(b<0.05)return;const x=f.x-camX,y=f.y-camY;
      const g=c.createRadialGradient(x,y,0,x,y,4);g.addColorStop(0,`rgba(220,255,120,${Math.min(1,b)})`);g.addColorStop(1,"rgba(220,255,120,0)");c.fillStyle=g;c.fillRect(x-4,y-4,8,8)});
    c.globalCompositeOperation="source-over";
  }
  drawEmotes_(c,camX,camY,now);
}

/* ---- ฟองอารมณ์เหนือหัว ---- */
function emote_(ent,icon,h){if(!X)return;X.emotes=(X.emotes||[]).filter(e=>e.ent!==ent);X.emotes.push({ent,icon,h:h||34,t0:performance.now()})}
function drawEmotes_(c,camX,camY,now){
  if(!X.emotes||!X.emotes.length)return;
  X.emotes=X.emotes.filter(e=>now-e.t0<1700);
  X.emotes.forEach(e=>{
    const k=(now-e.t0)/1700,pop=k<0.12?k/0.12:1,alpha=k>0.85?(1-k)/0.15:1;
    const x=Math.round(e.ent.fx*TS+8-camX),y=Math.round(e.ent.fy*TS+TS-e.h-camY-6-Math.sin(Math.min(1,k*3)*Math.PI)*2);
    c.save();c.globalAlpha=alpha;c.translate(x,y);c.scale(pop,pop);
    const red=e.icon==="!";
    c.fillStyle="#181425";c.fillRect(-7,-9,14,12);c.fillRect(-2,3,3,2);
    c.fillStyle=red?"#fee2e2":"#ffffff";c.fillRect(-6,-8,12,10);c.fillRect(-1,2,2,2);
    if(red){c.fillStyle="#dc2626";c.fillRect(-1,-6,2,5);c.fillRect(-1,0,2,1.5)}
    else{c.font="8px sans-serif";c.textAlign="center";c.textBaseline="middle";c.fillStyle="#181425";c.fillText(e.icon,0,-3)}
    c.restore()});
}
// ใครจะแสดงฟองอารมณ์ (เรียกทุกเฟรม)
function updateEmotes_(now){
  if(!X||X.busy)return;
  X.nextEmote=X.nextEmote||now+3000;
  if(now>X.nextEmote&&X.npcs.length){X.nextEmote=now+rng(3500,7500);
    const n=pickOne(X.npcs);emote_(n,pickOne(n.id==="kid"?["♪","!","♪"]:n.id==="flag"?["♪","…"]:["♪","…","♥"]),CHAR_ART_H+2)}
  const p=X.p;
  X.mons.forEach(m=>{const d=Math.abs(m.x-p.x)+Math.abs(m.y-p.y);
    if(d<=3&&!(m._seen&&now-m._seen<6000)){m._seen=now;emote_(m,"!",MON_ART_H+2);m.flip=p.x<m.x}});
}
