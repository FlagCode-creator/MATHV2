/* Math Quest V2 — ฉากหลังพิกเซลอาร์ตของแต่ละดินแดน (วาดด้วยโค้ดลงแคนวาสขนาดเล็ก แล้วขยายแบบ pixelated)
   ทุกฉากมี "พื้น" ช่วงล่าง (y ≥ 50) ให้มอนสเตอร์ยืน — สุ่มแบบกำหนด seed ภาพจึงเหมือนเดิมทุกครั้ง */

const BG_W=112,BG_H=64,BG_GROUND=50;
const BG_CACHE={};
const BAYER4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];

function seeded_(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

function bgKit_(ctx,seed){
  const rand=seeded_(seed);
  const K={
    rand,ri:(a,b)=>a+Math.floor(rand()*(b-a+1)),
    px(x,y,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),1,1)},
    rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))},
    // ไล่สีแบบ dither (สไตล์เกมยุค 16-bit) จากบนลงล่างในช่วง y0..y1
    grad(colors,y0,y1){
      const n=colors.length-1;
      for(let y=y0;y<y1;y++){
        const t=(y-y0)/Math.max(1,y1-y0-1)*n,i=Math.min(n-1,Math.floor(t)),f=t-i;
        for(let x=0;x<BG_W;x++)K.px(x,y,f*16>BAYER4[y%4][x%4]?colors[i+1]:colors[i]);
      }
    },
    circle(cx,cy,r,c){for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r+r*0.8)K.px(cx+x,cy+y,c)},
    // เนินเขา: ความสูงตามคลื่น sine เติมสีลงถึงพื้น + ขอบบนสว่าง
    hills(base,amp,freq,phase,c,top){
      for(let x=0;x<BG_W;x++){
        const h=Math.round(base+amp*Math.sin(x*freq+phase)+amp*0.5*Math.sin(x*freq*2.3+phase*1.7));
        K.rect(x,h,1,BG_H-h,c);if(top)K.px(x,h,top);
      }
    },
    // ภูเขาสามเหลี่ยม (มีหิมะบนยอดได้)
    mountain(cx,peak,slope,c,snow,snowDepth){
      for(let x=0;x<BG_W;x++){
        const y=Math.round(peak+Math.abs(x-cx)*slope);if(y>=BG_H)continue;
        K.rect(x,y,1,BG_H-y,c);
        if(snow)for(let s=0;s<snowDepth;s++){const yy=y+s;if(yy<peak+snowDepth*1.6&&(s<snowDepth-1||(x+yy)%2))K.px(x,yy,snow)}
      }
    },
    // ต้นสน 3 ชั้น (ชั้นล่างกว้างกว่า) + ขอบซ้ายสว่าง
    pine(cx,base,h,c,edge){
      const tiers=3,th=Math.ceil(h/tiers)+2;
      for(let t=0;t<tiers;t++){
        const top=base-h+t*(th-3);
        for(let r=0;r<th;r++){
          const w=Math.floor(r*0.55)+t,y=top+r;if(y>=base)break;
          K.rect(cx-w,y,w*2+1,1,c);if(edge)K.px(cx-w,y,edge);
        }
      }
      K.rect(cx,base,1,2,"#3b2a1f");
    },
    cloud(x,y,w,c){K.rect(x+2,y,w-4,1,c);K.rect(x,y+1,w,2,c);K.rect(x+1,y+3,w-2,1,c)},
    stars(n,yMax,colors){for(let i=0;i<n;i++)K.px(K.ri(0,BG_W-1),K.ri(0,yMax),colors[K.ri(0,colors.length-1)])},
    ground(c,top,speck,specks){
      K.rect(0,BG_GROUND,BG_W,BG_H-BG_GROUND,c);K.rect(0,BG_GROUND,BG_W,1,top);
      for(let i=0;i<(specks||40);i++)K.px(K.ri(0,BG_W-1),K.ri(BG_GROUND+2,BG_H-1),speck);
    }
  };
  return K;
}

const BG_PAINTERS=[
  // w1 ทุ่งหญ้าจำนวน
  K=>{
    K.grad(["#3b7dd8","#5fa8f0","#9fd4ff","#d6f0ff"],0,44);
    K.circle(92,11,6,"#fff3b0");K.circle(92,11,4,"#fee761");
    K.cloud(8,7,14,"#ffffff");K.cloud(40,13,10,"#eaf6ff");K.cloud(62,5,16,"#ffffff");
    K.hills(34,3,0.09,1,"#5aa0a0","#7cc0b8");
    K.hills(40,3,0.07,2.4,"#3e8948","#63c74d");
    K.hills(45,2,0.11,0.3,"#4ea83f","#7ad55e");
    K.ground("#3e8948","#63c74d","#2f6e38",50);
    for(let i=0;i<22;i++){const x=K.ri(0,BG_W-1),y=K.ri(BG_GROUND+1,BG_H-2);K.px(x,y,["#fee761","#f6757a","#ffffff"][i%3]);K.px(x,y+1,"#265c42")}
  },
  // w2 ป่าเศษส่วน
  K=>{
    K.grad(["#123a45","#1e5c5c","#3f8f78","#9ad0a6"],0,46);
    for(let i=0;i<8;i++)K.px(K.ri(0,BG_W-1),K.ri(0,20),"#cfeede");
    K.hills(40,2,0.1,0.4,"#163f36");
    for(let x=-2;x<BG_W+4;x+=8)K.pine(x+K.ri(-1,1),42,K.ri(14,19),"#1a4538","#24594a");
    for(let x=4;x<BG_W+6;x+=16)K.pine(x+K.ri(-2,2),50,K.ri(24,30),"#2d6b4a","#4f9a5c");
    K.ground("#3b2a1f","#5a3d2b","#2a1d15",40);
    for(let i=0;i<14;i++)K.px(K.ri(0,BG_W-1),K.ri(8,46),"#fee761");
    for(let i=0;i<5;i++){const x=K.ri(4,BG_W-5),y=K.ri(BG_GROUND+3,BG_H-3);K.rect(x-1,y,3,1,"#e43b44");K.px(x,y+1,"#ead4aa")}
  },
  // w3 ถ้ำเลขยกกำลัง
  K=>{
    K.grad(["#0c0816","#1f1438","#3a2560","#2a1a48"],0,BG_H);
    for(let i=0;i<30;i++)K.rect(K.ri(0,BG_W),K.ri(6,46),K.ri(2,6),K.ri(1,3),"#2a1a4c");
    [[14,36],[40,30],[86,34],[100,42],[62,40]].forEach(([x,y])=>{for(let r=6;r>0;r-=2)K.circle(x,y,r,r>4?"#2d2a66":"#2f4a86")});
    for(let x=0;x<BG_W;x+=K.ri(5,9)){const len=K.ri(5,15),w=K.ri(2,3);for(let r=0;r<len;r++){const ww=Math.max(0,Math.round(w*(1-r/len)));K.rect(x-ww,r,ww*2+1,1,"#2d1f4a");K.px(x-ww,r,"#4a3470")}}
    [[14,36],[40,30],[86,34],[100,42],[62,40]].forEach(([x,y])=>{
      K.px(x,y-2,"#b8f6ff");K.rect(x-1,y-1,3,1,"#2ce8f5");K.rect(x-1,y,3,1,"#0099db");K.px(x,y+1,"#124e89");
      K.px(x-3,y,"#3a2a6a");K.px(x+3,y,"#3a2a6a");
    });
    K.ground("#2a1c40","#4a3470","#1a1030",40);
    for(let x=4;x<BG_W;x+=K.ri(12,20)){const h=K.ri(3,7);for(let r=0;r<h;r++){const w=Math.round((r/h)*2);K.rect(x-w,BG_GROUND-h+r,w*2+1,1,"#3a2858")}}
  },
  // w4 ขุนเขาสมการ
  K=>{
    K.grad(["#4a7cc9","#79aee8","#b8dcff","#e6f4ff"],0,46);
    K.cloud(70,6,14,"#ffffff");K.cloud(20,12,10,"#f0f8ff");
    K.mountain(22,12,0.9,"#7d8fb8","#f4f8ff",5);
    K.mountain(58,6,0.8,"#6a7fa8","#ffffff",6);
    K.mountain(96,14,0.9,"#7d8fb8","#f4f8ff",5);
    K.mountain(8,26,0.7,"#4a5a80","#dfe8f5",3);
    K.mountain(76,24,0.75,"#3f4d70","#dfe8f5",3);
    K.ground("#5a6070","#8b9bb4","#454a58",50);
    for(let i=0;i<10;i++){const x=K.ri(2,BG_W-4),y=K.ri(BG_GROUND+2,BG_H-3);K.rect(x,y,3,2,"#8b9bb4");K.rect(x,y+2,3,1,"#3a4466")}
  },
  // w5 หอคอยพหุนาม
  K=>{
    K.grad(["#0d0a24","#1c1440","#35215e","#4a2d7a"],0,BG_H);
    K.stars(45,40,["#ffffff","#c0cbdc","#fee761"]);
    K.circle(18,12,6,"#fef3c7");K.px(16,10,"#e8d9a0");K.px(20,14,"#e8d9a0");K.px(19,9,"#e8d9a0");
    K.hills(42,2,0.08,1,"#241840","#33245a");
    const tx=74;
    K.rect(tx-6,14,13,36,"#1a1236");K.rect(tx-8,12,17,3,"#1a1236");
    for(let r=0;r<10;r++)K.rect(tx-r*0.8,2+r,r*1.6+1,1,"#2b1c50");
    [[tx-3,20],[tx+2,20],[tx-3,30],[tx+2,30],[tx,40]].forEach(([x,y])=>{K.rect(x,y,2,3,"#feae34");K.px(x,y,"#fee761")});
    K.ground("#2e1f4f","#4a3470","#231840",40);
    for(let i=0;i<12;i++)K.px(K.ri(0,BG_W-1),K.ri(20,48),"#c084fc");
  },
  // w6 ทะเลฟังก์ชัน
  K=>{
    K.grad(["#2f8fd0","#6cc3ec","#b5ecff"],0,28);
    K.cloud(10,5,16,"#ffffff");K.cloud(58,9,12,"#ffffff");K.cloud(88,4,14,"#f0fbff");
    K.grad(["#2aa3d6","#1f8ac0","#1b6fa8","#155a8c"],28,52);
    for(let y=30;y<50;y+=3)for(let x=(y*7)%9;x<BG_W;x+=K.ri(8,14))K.rect(x,y,K.ri(2,4),1,"#9fe6ff");
    K.rect(0,BG_GROUND-1,BG_W,1,"#ffffff");
    K.ground("#e3c98f","#f3e0b0","#c9a86a",60);
    [[12,56],[96,58]].forEach(([x,y])=>{K.rect(x,y,5,3,"#8b9bb4");K.rect(x+1,y-1,3,1,"#c0cbdc")});
    K.px(52,60,"#f6757a");K.px(53,60,"#f6757a");K.px(52,59,"#f6757a");
  },
  // w7 ตลาดโชคชะตา
  K=>{
    K.grad(["#3b1d4a","#7a2d4a","#c4503b","#f59e42","#fcd87a"],0,46);
    K.circle(56,40,9,"#fee761");
    K.hills(42,2,0.09,0.5,"#5a2a3a","#6e3444");
    const tent=(cx,base,w,h,c1,c2)=>{for(let r=0;r<h;r++){const half=Math.round(w*r/h);for(let x=-half;x<=half;x++)K.px(cx+x,base-h+r,Math.floor((x+64)/3)%2?c1:c2)}K.rect(cx-1,base-h-3,1,3,"#3b2a1f");K.px(cx,base-h-3,"#fee761")};
    tent(18,50,11,16,"#e43b44","#ffffff");tent(94,50,12,18,"#b55088","#fee761");tent(56,49,8,10,"#0099db","#ffffff");
    for(let x=0;x<BG_W;x++){const y=Math.round(8+4*Math.sin(x/BG_W*Math.PI*2));K.px(x,y,"#2a1520");if(x%8===4){K.rect(x-1,y+1,3,3,["#e43b44","#fee761","#63c74d","#2ce8f5"][(x/8|0)%4])}}
    K.ground("#7a4a30","#a8683f","#5a3420",30);
    for(let x=0;x<BG_W;x+=6)for(let y=BG_GROUND+3;y<BG_H;y+=4)K.rect(x+((y/4|0)%2)*3,y,4,1,"#5a3420");
  },
  // w8 ปราสาทเรขาคณิต
  K=>{
    K.grad(["#1e0b1e","#4a1530","#8f2b45","#d6545e","#f08a6b"],0,48);
    K.stars(12,14,["#f6b0c0"]);
    const C="#2a1420";
    K.rect(24,26,64,24,C);
    [[16,14,12],[84,14,12],[48,8,16]].forEach(([x,y,w])=>{K.rect(x,y,w,50-y,C);for(let i=0;i<w;i+=3)K.rect(x+i,y-2,2,2,C);K.px(x+w/2|0,y-6,"#e43b44");K.rect((x+w/2|0),y-6,1,4,C)});
    for(let i=24;i<88;i+=4)K.rect(i,24,2,2,C);
    [[20,24],[88,24],[54,18],[34,34],[74,34],[54,32]].forEach(([x,y])=>{K.rect(x,y,2,3,"#feae34");K.px(x,y,"#fee761")});
    K.rect(52,40,8,10,"#140a12");
    K.ground("#3e2e3a","#5e4a58","#2e2230",20);
    for(let x=0;x<BG_W;x+=8)for(let y=BG_GROUND+2;y<BG_H;y+=5)K.rect(x+((y/5|0)%2)*4,y,1,4,"#2e2230");
  },
  // w9 บัลลังก์ Z
  K=>{
    K.grad(["#07040c","#140a1c","#241022","#34141e"],0,BG_H);
    const bolt=(x)=>{let y=0,cx=x;while(y<22){const nx=cx+K.ri(-2,2);K.px(nx,y,"#fee761");K.px(nx+1,y,"#fff3b0");cx=nx;y++}};
    bolt(30);bolt(86);
    [[6,1],[24,0],[82,0],[100,1]].forEach(([x,far])=>{
      const top=far?16:10,w=far?6:8;
      K.rect(x,top,w,BG_GROUND-top,far?"#6b4a1a":"#8a6320");K.rect(x+1,top,1,BG_GROUND-top,"#fee761");K.rect(x+w-1,top,1,BG_GROUND-top,"#4a3010");
      K.rect(x-1,top-2,w+2,2,"#b8862b");K.rect(x-1,BG_GROUND-2,w+2,2,"#b8862b");
    });
    [[36,1],[70,0]].forEach(([x])=>{K.rect(x,4,8,18,"#a22633");K.rect(x+1,4,1,18,"#e43b44");for(let i=0;i<4;i++)K.px(x+2+i,22+ (i%2),"#a22633");K.rect(x+3,10,2,2,"#fee761")});
    K.rect(48,18,16,32,"#2a1420");K.rect(46,16,20,3,"#b8862b");K.rect(50,22,12,20,"#a22633");
    K.ground("#1c1018","#3a2230","#120a10",20);
    for(let y=BG_GROUND;y<BG_H;y++){const half=8+Math.round((y-BG_GROUND)*1.4);K.rect(56-half,y,half*2,1,"#a22633");K.px(56-half,y,"#fee761");K.px(56+half-1,y,"#fee761")}
  }
];

function bgURL(worldIndex){
  const custom=typeof CUSTOM!=="undefined"&&CUSTOM.backgrounds["w"+(worldIndex+1)];   // ภาพฉากของครูเอง (manifest: backgrounds)
  if(custom)return custom.url;
  if(worldIndex===0&&typeof farmReady_==="function"&&farmReady_())return farmBattleBg_(false);   // ทุ่งหญ้า: ฉากจาก Farm RPG
  if(BG_CACHE[worldIndex])return BG_CACHE[worldIndex];
  const cv=document.createElement("canvas");cv.width=BG_W;cv.height=BG_H;
  const ctx=cv.getContext("2d");
  const paint=BG_PAINTERS[worldIndex]||BG_PAINTERS[0];
  paint(bgKit_(ctx,1000+worldIndex*97));
  return BG_CACHE[worldIndex]=cv.toDataURL();
}

/* ---- ฉากต่อสู้ดินแดนที่ 1 (ทุ่งหญ้า) ประกอบจากภาพ Farm RPG Tiny Asset Pack ----
   ท้องฟ้า เมฆ เนินเขา บ้าน ต้นเมเปิล รั้ว และพื้นหญ้า · มีแบบกลางคืน (ใช้ในโหมดผจญภัยตอนมืด) */
const FARM_BG={};
function farmBattleBg_(night){
  const key=night?"night":"day";if(FARM_BG[key])return FARM_BG[key];
  const W=240,H=120,GY=78,cv=document.createElement("canvas");cv.width=W;cv.height=H;const c=cv.getContext("2d");c.imageSmoothingEnabled=false;
  const rnd=seeded_(night?77:33),r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
  // ท้องฟ้าไล่สีแบบเป็นแถบ + dither
  const sky=night?["#141a3c","#1b2450","#232f66","#2c3b78"]:["#5ec2f0","#7fd0f4","#a3def6","#c8ecf8"];
  for(let i=0;i<4;i++){r(0,i*14,W,14,sky[i]);if(i<3)for(let x=(i%2);x<W;x+=2)r(x,i*14+13,1,1,sky[i+1])}
  r(0,56,W,GY-56,sky[3]);
  if(night){for(let i=0;i<60;i++)r(rnd()*W,rnd()*50,1,1,rnd()<0.2?"#fff8c0":"#c8d4ff");
    r(196,10,12,12,"#fff4c0");r(198,8,8,16,"#fff4c0");r(194,12,16,8,"#fff4c0");r(200,12,4,4,"#e8dca0")}
  else{r(200,10,14,14,"#fff4a0");r(202,8,10,18,"#fff4a0");r(198,12,18,10,"#fff4a0")}
  // เมฆ
  const cloud=(x,y,s)=>{const col=night?"#3a4680":"#ffffff",sh=night?"#2e3a70":"#dff2fb";
    [[0,4,12*s,5],[4*s,0,8*s,6],[9*s,2,9*s,6]].forEach(([dx,dy,w,h])=>{r(x+dx,y+dy,w,h,col)});r(x,y+8,21*s,1,sh)};
  cloud(20,14,1.2);cloud(96,8,1);cloud(150,22,0.9);
  // เนินเขาไกล 2 ชั้น
  const hill=(base,amp,freq,ph,col)=>{for(let x=0;x<W;x++){const y=base-Math.round(amp*(0.6*Math.sin(x*freq+ph)+0.4*Math.sin(x*freq*2.3+ph*1.7)));r(x,y,1,GY-y,col)}};
  hill(62,9,0.035,1,night?"#28406a":"#8fc8b8");hill(70,7,0.05,3,night?"#2a4a5a":"#6fb07e");
  // พื้นหญ้า + พุ่มหญ้าแบบ Farm RPG
  r(0,GY,W,H-GY,night?"#3e6a3a":"#79bf56");
  for(let x=0;x<W;x+=2)if(rnd()<0.5)r(x,GY,2,1,night?"#335a32":"#86c962");
  const tuftCol=night?{a:"#2e5a30",b:"#284a2c",c:"#223e2a"}:{a:"#3d993d",b:"#347349",c:"#2d594f"};
  for(let k=0;k<9;k++){const tx=Math.floor(rnd()*(W-12)),ty=GY+6+Math.floor(rnd()*(H-GY-16));
    FARM_TUFT.forEach((row,j)=>[...row].forEach((ch,i)=>{if(ch===".")return;r(tx+i,ty+j,1,1,ch===" "?(night?"#2f5230":"#4f9a3e"):tuftCol[ch])}))}
  // ทางเดินดิน
  const dirt=night?["#6a5638","#5a4830"]:["#c89c66","#ab8350"];
  for(let x=0;x<W;x++){const y=H-16+Math.round(2*Math.sin(x*0.05));r(x,y,1,H-y,dirt[0]);if(rnd()<0.2)r(x,y+2+rnd()*8,1,1,dirt[1]);r(x,y,1,1,night?"#2e5a30":"#3d993d")}
  // ดอกไม้
  if(!night)for(let k=0;k<14;k++){const x=rnd()*W,y=GY+4+rnd()*(H-GY-22),col=["#fee761","#f6757a","#ffffff","#c7a0ff"][k%4];r(x,y,1,1,col);r(x-1,y+1,3,1,col);r(x,y+2,1,1,col)}
  // บ้าน + ต้นไม้ + รั้ว (วาดทับด้วยภาพจากชุด แล้วหรี่แสงตอนกลางคืน)
  const put=(img,sx,sy,w,h,dx,dy,flip)=>{c.save();if(flip){c.translate(dx+w,dy);c.scale(-1,1);dx=0;dy=0}c.drawImage(img,sx,sy,w,h,dx,dy,w,h);c.restore()};
  const house=farmImg_("house"),maple=farmImg_("maple"),fence=farmImg_("fence");
  put(maple,70,13,22,35,4,GY-33);put(house,148,3,72,95,14,GY-86+6);put(maple,89,0,52,48,78,GY-44);
  put(maple,89,0,52,48,176,GY-45,true);put(maple,70,13,22,35,160,GY-32);put(maple,70,13,22,35,226,GY-31,true);
  for(let x=98;x<176;x+=16)c.drawImage(fence,16,32,16,16,x,GY-10,16,16);
  if(night){c.fillStyle="rgba(16,24,70,.38)";c.fillRect(0,GY-90,W,H);
    // หน้าต่างบ้านมีไฟ
    [[51,GY-32],[36,GY-9]].forEach(([x,y])=>{c.fillStyle="rgba(255,200,100,.3)";c.fillRect(x-3,y-3,14,14);c.fillStyle="rgba(255,214,120,.85)";c.fillRect(x,y,8,8)})}
  return FARM_BG[key]=cv.toDataURL();
}
