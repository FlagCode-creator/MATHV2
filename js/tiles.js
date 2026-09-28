/* Math Quest V2 — กราฟิกแผนที่แบบละเอียด (พิกเซลอาร์ต 16×16 ต่อช่อง)
   วาดพื้นลงบัฟเฟอร์พิกเซลโดยตรง (เร็ว) + ขอบหญ้า/ทาง/น้ำกลมกลืนกัน + บ้านทั้งหลัง + ต้นไม้ใหญ่ 2×2 */

const TILE_PX=16;
let INTERIOR_=false;   // กำลังวาดแผนที่ในบ้าน
const HEXRGB={};
const rgbOf=hex=>HEXRGB[hex]||(HEXRGB[hex]=hexToRgb_(hex));
const G_={base:"#79bf56",light:"#86c962",dark:"#3d993d",deep:"#347349",tip:"#a6dc78"};   // โทนหญ้าตามชุด Farm RPG
const P_={base:"#c89c66",light:"#dcb682",dark:"#ab8350",edge:"#8f6a3e",pebD:"#7e6248",pebL:"#ecd6a8"};
const W_={deep:"#2d6fc0",mid:"#3a86d4",light:"#7cc3f0",foam:"#e4f7ff",shore:"#bfe6f8"};
const PATHY=new Set([":","G","w","O","l","=","p"]);
const WATERY=new Set(["~","b","="]);
const HOUSE=new Set(["R","H","W","D"]);

// บัฟเฟอร์พิกเซลของทั้งแผนที่
function PixBuf(w,h){this.w=w;this.h=h;this.img=new ImageData(w,h);this.d=this.img.data}
PixBuf.prototype.set=function(x,y,hex){if(x<0||y<0||x>=this.w||y>=this.h)return;const c=rgbOf(hex),i=(y*this.w+x)*4,d=this.d;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255};
PixBuf.prototype.rect=function(x,y,w,h,hex){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.set(x+i,y+j,hex)};

/* ---- ลายหญ้าจาก Farm RPG Tiny Asset Pack (Tileset Grass Spring) ----
   . = หญ้า  a b c = เส้นเข้ม 3 ระดับ  ช่องว่าง = โปร่ง (เห็นพื้นข้างใต้) */
const FARM_COL={".":"#79bf56",a:"#3d993d",b:"#347349",c:"#2d594f"};
const FARM_TUFT=["....a..a....","....baab....","...acbbca...","..aac  caa..","abcc    ccba",".ab      ba.",".ab      ba.","abcc    ccba","..aac  caa..","...acbbca...","....baab....","....a......."];
const FARM_EDGE=["                ","  cc cc   ccc cc"," c.bc.b ba.cb.c ","a.ab.aba.ba..abb","..a..a....a.....","................"];
// วางลาย (หมุนได้ 0-3 = บน ขวา ล่าง ซ้าย) · ช่องว่าง: ใช้ under(i,j) ถ้ามี ไม่งั้นใช้สีหญ้าเข้ม
function stamp_(px,pat,ox,oy,rot,under){
  const h=pat.length,w=pat[0].length;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const ch=pat[j][i];let X=ox+i,Y=oy+j;
    if(rot===1){X=15-(oy+j);Y=ox+i}else if(rot===2){X=15-(ox+i);Y=15-(oy+j)}else if(rot===3){X=oy+j;Y=15-(ox+i)}
    if(X<0||Y<0||X>15||Y>15)continue;
    if(ch===" ")px(X,Y,under?under(X,Y):"#4f9a3e");else if(ch!==".")px(X,Y,FARM_COL[ch])}
}

/* ---------------- พื้น ---------------- */
function paintGround_(buf,x,y,frame,T){
  const ox=x*TILE_PX,oy=y*TILE_PX,ch=T(x,y),H=(i)=>hash2_(x,y,i);
  const px=(i,j,c)=>buf.set(ox+i,oy+j,c),rect=(i,j,w,h,c)=>buf.rect(ox+i,oy+j,w,h,c);
  if(INTERIOR_){   // ในบ้าน: พื้นไม้กระดาน · ผนังวอลเปเปอร์ + บัวผนัง · ขอบห้องไม้เข้ม · พรมเช็ดเท้าที่ประตู
    const W=buf.w/TILE_PX,Hh=buf.h/TILE_PX;
    if(ch==="_"||ch==="e"){
      for(let j=0;j<16;j++){const row=Math.floor((oy+j)/4),off=(row*7)%16;for(let i=0;i<16;i++){const seam=(ox+i+off)%16===0;
        px(i,j,(oy+j)%4===3?"#8a5a32":seam?"#9a6a3e":row%2?"#c48a54":"#b87c48")}}
      if(ch==="e"){rect(1,4,14,10,"#8a2a2a");rect(2,5,12,8,"#b04a3a");for(let i=3;i<13;i+=2)rect(i,6,1,6,"#c86a50")}
      return;
    }
    if(ch==="#"){
      if(y<=1&&x>0&&x<W-1){
        for(let j=0;j<16;j++)for(let i=0;i<16;i++)px(i,j,(ox+i)%6<3?"#ecd8b0":"#e2cc9e");
        if(y===0){rect(0,0,16,3,"#5a3420");rect(0,3,16,1,"#8a5a32")}
        else{rect(0,6,16,1,"#c98a52");rect(0,7,16,7,"#9a6a44");for(let i=0;i<16;i+=8){rect(i+1,8,6,5,"#a87450");rect(i+1,8,6,1,"#b8845c")}rect(0,14,16,2,"#5a3420")}
        return;
      }
      rect(0,0,16,16,"#3a2618");
      if(y<Hh-1&&x===0)rect(12,0,4,16,"#6e4a30");if(y<Hh-1&&x===W-1)rect(0,0,4,16,"#6e4a30");
      if(y===Hh-1)rect(0,0,16,4,"#6e4a30");
      return;
    }
  }
  const noise=(base,light,dark,pl,pd,salt)=>{
    for(let j=0;j<16;j++)for(let i=0;i<16;i++){const h=hash2_(ox+i,oy+j,salt);px(i,j,h<pl?light:h<pl+pd?dark:base)}
  };
  const grass=flowers=>{
    noise(G_.base,G_.light,G_.base,0.03,0,3);
    if(H(7)<0.2)stamp_(px,FARM_TUFT,Math.floor(H(8)*5),Math.floor(H(9)*5),0);          // พุ่มหญ้า (ลายจากชุด Farm RPG)
    // ขอบหญ้าติดทางเดิน: ขอบหยัก ๆ มีเส้นเข้ม ส่วนที่โปร่งเห็นดินข้างใต้
    const isPlaza=(dx,dy)=>{const t=T(x+dx,y+dy);return t==="p"||(t==="O"&&T(x+dx-1,y+dy)!==":"&&T(x+dx+1,y+dy)!==":")};
    const pathy=(dx,dy)=>{const t=T(x+dx,y+dy);return PATHY.has(t)&&!isPlaza(dx,dy)&&t!=="l"||(t==="l"&&!isPlaza(dx,dy))};
    const dirt=(i,j)=>{const h=hash2_(ox+i,oy+j,11);return h<0.07?P_.light:h<0.14?P_.dark:P_.base};
    const curb=()=>"#7d7263";
    [[0,-1,0],[1,0,1],[0,1,2],[-1,0,3]].forEach(([dx,dy,rot])=>{if(isPlaza(dx,dy))stamp_(px,FARM_EDGE,0,0,rot,curb);else if(pathy(dx,dy))stamp_(px,FARM_EDGE,0,0,rot,dirt)});
    if(flowers)for(let k=0;k<3;k++){const i=1+Math.floor(H(k+40)*13),j=1+Math.floor(H(k+50)*12),c=["#fee761","#f6757a","#ffffff","#c7a0ff"][Math.floor(H(k+60)*4)];
      px(i,j+1,c);px(i+1,j,c);px(i-1,j,c);px(i,j-1,c);px(i,j,"#feae34");px(i,j+2,G_.deep)}
  };
  const path=()=>{
    noise(P_.base,P_.light,P_.dark,0.07,0.07,11);
    for(let k=0;k<2;k++){const i=2+Math.floor(H(k+70)*11),j=2+Math.floor(H(k+80)*11);px(i,j,P_.pebD);px(i+1,j,P_.pebD);px(i,j-1,P_.pebL)}

  };
  const water=()=>{
    // น้ำแบบขอบโค้ง: คำนวณระยะจากตลิ่งทุกพิกเซล → ขอบหญ้าเข้ม · ฟองคลื่น · น้ำตื้น · น้ำลึก (มุมนูนโค้งมน)
    const land=(dx,dy)=>{const t=T(x+dx,y+dy);return !WATERY.has(t)};
    const L=land(-1,0),Rr=land(1,0),U=land(0,-1),D=land(0,1),R=6;
    for(let j=0;j<16;j++)for(let i=0;i<16;i++){
      const cx=i+0.5,cy=j+0.5;let d=99,isLand=false;
      if(L)d=Math.min(d,cx);if(Rr)d=Math.min(d,16-cx);if(U)d=Math.min(d,cy);if(D)d=Math.min(d,16-cy);
      if(land(-1,-1))d=Math.min(d,Math.hypot(cx,cy));if(land(1,-1))d=Math.min(d,Math.hypot(16-cx,cy));
      if(land(-1,1))d=Math.min(d,Math.hypot(cx,16-cy));if(land(1,1))d=Math.min(d,Math.hypot(16-cx,16-cy));
      const corner=(ax,ay)=>{const qx=ax?16-cx:cx,qy=ay?16-cy:cy;if(qx<R&&qy<R){const h=Math.hypot(R-qx,R-qy);if(h>R)isLand=true;else d=Math.min(d,R-h)}};
      if(L&&U)corner(0,0);if(Rr&&U)corner(1,0);if(L&&D)corner(0,1);if(Rr&&D)corner(1,1);
      if(isLand){px(i,j,hash2_(ox+i,oy+j,3)<0.04?G_.light:G_.base);continue}
      // ระลอกคลื่น: ขีดสั้นแนวนอนเป็นแถว ๆ เลื่อนตามเฟรม
      const gy=oy+j,gx=ox+i+frame*2,seg=Math.floor(gx/5),rip=gy%7===0&&hash2_(seg,gy,31)<0.35&&gx%5<3;
      px(i,j,d<1?"#2d594f":d<2.2?((i+j+frame)%3?"#e4f7ff":"#bfe6f8"):d<3.6?"#6cc6ee":d<6?(rip?"#a8e0f8":"#4ea6de"):(rip?"#7cc3f0":W_.mid));
    }
    if(H(90)<0.3&&!L&&!Rr&&!U&&!D){const j=4+Math.floor(H(91)*8),i=4+Math.floor(H(92)*6);px(i,j,frame?"#ffffff":"#c8ecfc")}   // ประกายบนผิวน้ำ
  };
  const planks=broken=>{
    water();
    const vertical=WATERY.has(T(x,y-1))&&WATERY.has(T(x,y+1));      // สะพานข้ามลำธารที่ไหลจากบนลงล่าง
    if(vertical){
      // สะพานไม้โทนเดียวกับรั้ว Farm RPG: แผ่นไม้ตั้ง 3px เว้นร่อง 1px · ราวสะพาน + เสามุม เฉพาะด้านที่ติดน้ำ · เงาบนน้ำ
      const bridgeT=t=>t==="b"||t==="=",top=!bridgeT(T(x,y-1)),bot=!bridgeT(T(x,y+1));
      const WOOD=["#a4552e","#8a4428","#b86a3a","#6e3420"];
      for(let k=0;k<4;k++){const i0=k*4;
        if(broken&&hash2_(x*4+k,y,77)<0.55){                  // แผ่นที่หายไป: เห็นน้ำ + ปลายไม้หัก
          if(hash2_(x*4+k,y,79)<0.5){rect(i0,top?2:0,3,3,WOOD[0]);px(i0+1,(top?2:0)+3,WOOD[3]);px(i0,(top?2:0)+3,WOOD[0])}
          continue}
        for(let j=0;j<16;j++){const edge=j===0&&!top||j===15&&!bot;px(i0,j,"#c98a52");px(i0+1,j,WOOD[(k+x)%2?0:2]);px(i0+2,j,WOOD[1]);px(i0+3,j,"#3a1c10")}
        if(hash2_(x*4+k,y,81)<0.5)px(i0+1,5+Math.floor(hash2_(x,k,83)*6),"#6e3420");   // ลายไม้
        px(i0+1,top?3:1,"#2a1a10");px(i0+1,bot?12:14,"#2a1a10");                          // ตะปู
      }
      if(top){rect(0,0,16,2,"#6e3420");rect(0,0,16,1,"#c98a52");rect(0,2,16,1,"rgba(0,0,0,0)")}
      if(bot){rect(0,14,16,2,"#5a2a18");rect(0,14,16,1,"#8a4428");for(let i=0;i<16;i++)if(!broken||i%3)px(i,13,"#2a4a7a")}
      if(top&&x%1===0){const post=(i)=>{rect(i,0,3,4,"#5a2a18");rect(i,0,3,1,"#c98a52");px(i+1,1,"#e0a060")};if(!bridgeT(T(x-1,y))&&!WATERY.has(T(x-1,y)))post(0);if(!bridgeT(T(x+1,y))&&!WATERY.has(T(x+1,y)))post(13)}
      if(bot){const post=(i)=>{rect(i,12,3,4,"#5a2a18");rect(i,12,3,1,"#c98a52")};if(!bridgeT(T(x-1,y))&&!WATERY.has(T(x-1,y)))post(0);if(!bridgeT(T(x+1,y))&&!WATERY.has(T(x+1,y)))post(13)}
      return;
    }
    if(broken){[[2,3,7],[9,10,6]].forEach(([i,j,w])=>{rect(i,j,w,3,"#b87a48");rect(i,j,w,1,"#d49a60");rect(i,j+3,w,1,"#6a4020")});rect(0,0,2,5,"#7a4a28");rect(14,11,2,5,"#7a4a28");return}
    for(let j=0;j<16;j+=4){rect(2,j,12,3,"#b87a48");rect(2,j,12,1,"#d49a60");rect(2,j+3,12,1,"#6a4020");px(4,j+1,"#4a3020");px(11,j+1,"#4a3020")}
    rect(0,0,2,16,"#7a4a28");rect(14,0,2,16,"#5a3420");rect(0,0,1,16,"#a0683a");
  };
  const plazaT=t=>t==="p"||t==="O"||t==="l";
  if(ch==="p"||(ch==="O"&&T(x-1,y)!==":"&&T(x+1,y)!==":")||(ch==="l"&&((T(x-1,y)==="p"&&T(x+1,y)==="p")||(T(x,y-1)==="p"&&T(x,y+1)==="p")))){
    // ลานหินปูพื้นโทนอุ่น: แผ่นหิน 8×8 เหลื่อมแถว มีไฮไลต์/เงา · ขอบลานเป็นคันหิน
    rect(0,0,16,16,"#8f8577");
    for(let r=0;r<2;r++){const off=(y*2+r)%2?4:0;
      for(let b=-1;b<3;b++){const sx=off+b*8,col=["#d8cfbe","#cfc5b2","#e0d8c8","#c9bea9"][Math.floor(hash2_(x*4+b+off,y*2+r,61)*4)];
        for(let j=0;j<7;j++)for(let i=0;i<7;i++){const X_=sx+i;if(X_<0||X_>15)continue;
          px(X_,r*8+j,j===0||i===0?"#ece6d8":j===6||i===6?"#b3a894":col)}
        if(hash2_(x*4+b,y*2+r,63)<0.12){const cx2=sx+3;if(cx2>0&&cx2<15){px(cx2,r*8+3,"#a79c88");px(cx2+1,r*8+4,"#a79c88")}}}}
    const open=(dx,dy)=>!plazaT(T(x+dx,y+dy));
    if(open(0,-1)){rect(0,0,16,2,"#7d7263");rect(0,0,16,1,"#a89d8a")}
    if(open(0,1)){rect(0,14,16,2,"#7d7263");rect(0,15,16,1,"#5e5549")}
    if(open(-1,0)){rect(0,0,2,16,"#7d7263");rect(0,0,1,16,"#a89d8a")}
    if(open(1,0)){rect(14,0,2,16,"#7d7263");rect(15,0,1,16,"#5e5549")}
    if(H(9)>0.85){px(3,7,G_.base);px(4,7,G_.light);px(4,6,G_.dark)}   // หญ้างอกตามรอยต่อ
    return;
  }
  if(ch==="~")return water();
  if(ch==="=")return planks(false);
  if(ch==="b")return planks(true);
  if(ch==="_"){
    rect(0,0,16,16,"#a3adc2");
    for(let j=1;j<15;j++)for(let i=1;i<15;i++)if(hash2_(ox+i,oy+j,29)<0.06)px(i,j,"#949fb6");
    rect(0,0,16,1,"#cdd4e2");rect(0,0,1,16,"#cdd4e2");rect(0,15,16,1,"#6f7990");rect(15,0,1,16,"#6f7990");
    if(H(1)>0.7){const i=3+Math.floor(H(2)*8),j=3+Math.floor(H(3)*8);px(i,j,"#6f7990");px(i+1,j+1,"#6f7990");px(i+1,j+2,"#6f7990")}
    if(H(4)>0.85){px(2,13,"#5ea83c");px(3,13,"#78c24e");px(2,12,"#5ea83c")}
    return;
  }
  if(ch==="#"){
    rect(0,0,16,16,"#3d4560");
    for(let r=0;r<4;r++){const off=r%2?4:0;for(let b=-1;b<2;b++){const bx=off+b*8,col=hash2_(x*3+b,y*4+r,31)<0.5?"#6a7898":"#5e6b8a";
      for(let j=0;j<3;j++)for(let i=0;i<7;i++){const X=bx+i;if(X>=0&&X<16)px(X,r*4+j,j===0?"#8290ae":col)}}}
    return;
  }
  if(ch==="F"){   // แปลงผัก: ดินพรวนเป็นร่อง มีขอบไม้
    for(let j=0;j<16;j++)for(let i=0;i<16;i++){const h=hash2_(ox+i,oy+j,91);px(i,j,j%4===0?"#5a3420":j%4===1?"#94603c":h<0.1?"#6a4028":"#7a4a30")}
    const edge=(dx,dy)=>T(x+dx,y+dy)!=="F";
    if(edge(0,-1))rect(0,0,16,2,"#a4552e");if(edge(0,1))rect(0,14,16,2,"#6e3420");
    if(edge(-1,0))rect(0,0,2,16,"#8a4428");if(edge(1,0))rect(14,0,2,16,"#6e3420");
    return;
  }
  if(ch==="n"){
    for(let j=0;j<16;j++)for(let i=0;i<16;i++)px(i,j,j%5===3?"#5a3420":j%5===2?"#94603c":"#7a4a30");
    return;
  }
  if(PATHY.has(ch))return path();
  if(HOUSE.has(ch)&&!farmReady_())return;  // บ้านวาดทั้งหลังภายหลัง (ใช้ภาพบ้าน Farm RPG → ใต้บ้านเป็นหญ้า)
  grass(ch===",");
  if(ch==="v"){                            // หญ้าสูง
    for(let k=0;k<4;k++){const i=2+Math.floor(H(k+100)*11),j=8+Math.floor(H(k+110)*6);
      for(let b=0;b<3;b++){const hh=3+((k+b)%3);for(let q=0;q<hh;q++)px(i+b*2-(q>hh-2&&b===0?1:0)+(q>hh-2&&b===2?1:0),j-q,q>=hh-1?G_.tip:q>hh-3?G_.light:G_.deep)}}
  }
}

/* ---------------- บ้านทั้งหลัง ---------------- */
function findHouses_(rows){
  const Hh=rows.length,Ww=rows[0].length,seen=new Set(),out=[];
  for(let y=0;y<Hh;y++)for(let x=0;x<Ww;x++){
    if(!HOUSE.has(rows[y][x])||seen.has(x+","+y))continue;
    let x1=x;while(x1+1<Ww&&HOUSE.has(rows[y][x1+1]))x1++;
    let y1=y;while(y1+1<Hh&&HOUSE.has(rows[y1+1][x]))y1++;
    for(let j=y;j<=y1;j++)for(let i=x;i<=x1;i++)seen.add(i+","+j);
    out.push({x0:x,y0:y,x1,y1});
  }
  return out;
}
const ROOF_STYLES=[
  {base:"#b8443c",light:"#d86a58",dark:"#86302c",ridge:"#5e1f22",wood:true},
  {base:"#3c7a8a",light:"#58a0ae",dark:"#2a5664",ridge:"#1c3c46",wood:false},
  {base:"#9a5a8a",light:"#bc7aac",dark:"#6e3c64",ridge:"#4c2644",wood:true},
  {base:"#5a8a3a",light:"#7aaa52",dark:"#3e6a28",ridge:"#2e5020",wood:false},
  {base:"#a8702e",light:"#c8904a",dark:"#7a5020",ridge:"#5a3a18",wood:true}
];
function paintHouse_(buf,h,rows,idx){
  const S=ROOF_STYLES[idx%ROOF_STYLES.length];
  const X0=h.x0*16,Y0=h.y0*16,Wd=(h.x1-h.x0+1)*16;
  let roofRows=0;for(let y=h.y0;y<=h.y1;y++)if(rows[y][h.x0]==="R")roofRows++;
  const RH=roofRows*16,wallY=Y0+RH,WH=(h.y1-h.y0+1-roofRows)*16;
  const set=(x,y,c)=>buf.set(x,y,c),rect=(x,y,w,hh,c)=>buf.rect(x,y,w,hh,c);
  // ผนัง
  if(S.wood){                              // ผนังไม้กระดาน
    for(let j=0;j<WH;j++)for(let i=0;i<Wd;i++){const r=j%4;set(X0+i,wallY+j,r===3?"#7a4e2c":r===0?"#c89060":hash2_(X0+i,wallY+j,43)<0.06?"#9a6838":"#b07a48")}
    for(let i=0;i<Wd;i+=12+Math.floor(hash2_(X0,i,47)*6))for(let j=0;j<WH;j+=4)set(X0+i,wallY+j+1,"#7a4e2c");
  }else{
    rect(X0,wallY,Wd,WH,"#efe0c0");
    for(let j=0;j<WH;j++)for(let i=0;i<Wd;i++)if(hash2_(X0+i,wallY+j,41)<0.05)set(X0+i,wallY+j,"#e0cfaa");
  }
  rect(X0,wallY,Wd,3,"#7a4a2a");rect(X0,wallY+3,Wd,1,"#5a3420");
  rect(X0,wallY,2,WH,"#7a4a2a");rect(X0+Wd-2,wallY,2,WH,"#5a3420");
  rect(X0,wallY+WH-3,Wd,3,"#9a8a78");rect(X0,wallY+WH-3,Wd,1,"#b8aa98");rect(X0,wallY+WH-1,Wd,1,"#6a5e52");
  for(let x=h.x0;x<=h.x1;x++){
    const ch=rows[h.y1][x],ox=x*16,oy=wallY+WH-16;
    if(x>h.x0&&x<h.x1&&ch==="H")rect(ox+7,wallY+3,2,WH-6,"#7a4a2a");
    if(ch==="W"){
      rect(ox+1,oy+4,2,8,"#4a8a4a");rect(ox+13,oy+4,2,8,"#3a7a3a");
      rect(ox+3,oy+4,10,8,"#5a3420");rect(ox+4,oy+5,8,6,"#8fd0ee");
      for(let k=0;k<4;k++)set(ox+5+k,oy+9-k,"#e0f6ff");
      rect(ox+7,oy+5,2,6,"#5a3420");rect(ox+4,oy+7,8,1,"#5a3420");
      rect(ox+2,oy+12,12,2,"#8a5a3a");rect(ox+2,oy+12,12,1,"#a8703f");
      [["#e43b44",3],["#fee761",6],["#f6757a",9],["#e43b44",12]].forEach(([c,i])=>{set(ox+i,oy+11,c);set(ox+i+1,oy+11,"#5ea83c")});
    }
    if(ch==="D"){
      rect(ox+3,oy+3,10,12,"#4a2c18");rect(ox+4,oy+4,8,11,"#9a6038");
      for(let i=6;i<12;i+=2)rect(ox+i,oy+4,1,11,"#7a4828");
      rect(ox+4,oy+4,8,1,"#b87a48");set(ox+10,oy+10,"#fee761");set(ox+10,oy+11,"#b8862b");
      rect(ox+2,oy+15,12,1,"#b0b0b8");
    }
  }
  // หลังคา (มีชายคายื่นออก 2 พิกเซล)
  const rx=X0-2,rw=Wd+4;
  for(let j=0;j<RH;j++){
    const row=Math.floor(j/4),off=row%2?3:0;
    for(let i=0;i<rw;i++){
      const inRow=j%4,sh=(i+off)%6;
      let c=S.base;
      if(inRow===0)c=S.light;else if(inRow===3)c=S.dark;
      if(sh===0&&inRow>0)c=S.dark;
      set(rx+i,Y0+j,c);
    }
  }
  rect(rx,Y0,rw,2,S.ridge);for(let i=2;i<rw;i+=4)set(rx+i,Y0,S.light);
  rect(rx,Y0,1,RH,S.ridge);rect(rx+rw-1,Y0,1,RH,S.ridge);
  rect(rx,Y0+RH-2,rw,2,S.ridge);rect(X0,Y0+RH,Wd,1,"#5a4030");
  // ปล่องไฟ
  const cx=X0+Wd-14,cy=Y0-6;
  rect(cx,cy,6,10,"#8a5a4a");for(let j=0;j<10;j+=3)rect(cx,cy+j,6,1,"#6a4034");rect(cx-1,cy,8,2,"#5a3a30");rect(cx,cy,6,1,"#a8766a");
}

/* ---------------- น้ำพุ (2×2 ช่อง) ---------------- */
function paintFountains_(buf,rows,frame){
  // น้ำพุหินแปดเหลี่ยม 2×2 ช่อง: ขอบอ่างหินอุ่น (มีเงา) · น้ำในอ่างมีระลอกวงกลม · แท่นกลาง + ชามบน (สายน้ำวาดแยกเป็นแอนิเมชัน)
  const seen=new Set();
  rows.forEach((r,y)=>[...r].forEach((ch,x)=>{
    if(ch!=="O"||seen.has(x+","+y))return;
    for(let j=0;j<2;j++)for(let i=0;i<2;i++)seen.add((x+i)+","+(y+j));
    const cx=x*16+16,cy=y*16+16,oct=(i,j)=>Math.max(Math.abs(i),Math.abs(j),(Math.abs(i)+Math.abs(j))*0.72);
    for(let j=-16;j<16;j++)for(let i=-16;i<16;i++){
      const d=oct(i+0.5,j+0.5);if(d>15.6)continue;let c;
      if(d>15)c="#5e5549";                                                  // เส้นขอบนอก
      else if(d>12.2)c=j<-9?"#ece6d8":j>9?"#a79c88":(hash2_(cx+i,cy+j,71)<0.1?"#c9bea9":"#d8cfbe");   // ขอบอ่าง
      else if(d>11.2)c="#6a6052";                                           // ขอบในอ่าง (เงา)
      else{const rd=Math.hypot(i+0.5,j+0.5),ring=Math.abs(rd-(4+frame*3))<0.6||Math.abs(rd-(8.5-frame))<0.5;
        c=j<-7&&d>9?"#2f78c4":ring?"#bfe6f8":hash2_(cx+i,cy+j+frame,53)<0.06?"#7cc3f0":"#4a96dc"}
      buf.set(cx+i,cy+j,c);
    }
    // แท่นกลางและชามบน
    buf.rect(cx-2,cy-3,4,7,"#d8cfbe");buf.rect(cx-2,cy-3,1,7,"#ece6d8");buf.rect(cx+1,cy-3,1,7,"#a79c88");
    buf.rect(cx-5,cy-5,10,2,"#d8cfbe");buf.rect(cx-5,cy-5,10,1,"#ece6d8");buf.rect(cx-4,cy-3,8,1,"#a79c88");
    buf.rect(cx-4,cy-6,8,1,"#4a96dc");buf.rect(cx-6,cy-5,1,2,"#5e5549");buf.rect(cx+5,cy-5,1,2,"#5e5549");
  }));
}
/* ---------------- ต้นไม้ใหญ่ / พุ่มไม้ / เสาไฟ (วาดเป็นวัตถุสูงเพื่อซ้อนหน้า-หลังตัวละคร) ---------------- */
const TALL_CACHE={};
function canopyCanvas_(w,h,lumps,trunk,seed){
  const cv=document.createElement("canvas");cv.width=w;cv.height=h;
  const ctx=cv.getContext("2d"),img=ctx.createImageData(w,h),d=img.data;
  const PAL=["#9ad866","#76c04a","#5aa23c","#468a34","#356e2c"],OUT="#1f4424";
  const inside=(x,y)=>lumps.some(([cx,cy,r])=>(x-cx)**2+(y-cy)**2<=r*r);
  const set=(x,y,hex)=>{const c=rgbOf(hex),i=(y*w+x)*4;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255};
  if(trunk){const [tx,ty,tw,th]=trunk;
    for(let j=0;j<th;j++)for(let i=-1;i<tw+1;i++){const flare=j>th-3?1:0;if(i<-flare||i>tw-1+flare)continue;
      set(tx+i,ty+j,i<=0?"#9a6a3a":i>=tw-2?"#4a2c18":"#7a4a2a")}
    for(let j=0;j<th;j+=3)set(tx+2,ty+j,"#5a3420");
  }
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    if(!inside(x,y))continue;
    let L=null;for(const lp of lumps)if((x-lp[0])**2+(y-lp[1])**2<=lp[2]*lp[2])L=lp;   // ก้อนที่อยู่หน้าสุด
    const [cx,cy,r]=L,dx=x-(cx-r*0.35),dy=y-(cy-r*0.45),t=Math.sqrt(dx*dx+dy*dy)/(r*1.25);
    const v=t*4+(BAYER4[y%4][x%4]/16-0.5)*0.9;
    let c=PAL[clamp(Math.floor(v),0,4)];
    if(hash2_(x,y,seed)<0.05)c=PAL[0];
    const edge=!inside(x-1,y)||!inside(x+1,y)||!inside(x,y-1)||!inside(x,y+1);
    set(x,y,edge?OUT:c);
    // เส้นแบ่งก้อนใบไม้
    if(!edge){for(const lp of lumps){if(lp===L)continue;const dd=Math.sqrt((x-lp[0])**2+(y-lp[1])**2);if(Math.abs(dd-lp[2])<0.6&&y>lp[1]){set(x,y,"#356e2c");break}}}
  }
  ctx.putImageData(img,0,0);
  return cv;
}
function pineCanvas_(variant){
  const w=32,h=60,cv=document.createElement("canvas");cv.width=w;cv.height=h;
  const ctx=cv.getContext("2d"),img=ctx.createImageData(w,h),d=img.data;
  const set=(x,y,hex)=>{if(x<0||y<0||x>=w||y>=h)return;const c=rgbOf(hex),i=(y*w+x)*4;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255};
  const tiers=[[4,14,6],[12,26,10],[22,40,14]],PAL=["#6aa850","#4f8e40","#3c7434","#2c5a2a"],OUT="#16341c";
  const inside=(x,y)=>tiers.some(([t,b,hw])=>y>=t&&y<=b&&Math.abs(x-15.5)<=(y-t+2)/(b-t+2)*hw+0.5);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    if(y>=40&&y<52&&x>=13&&x<19){set(x,y,x===13?"#8a5a34":x>=17?"#4a2c18":"#6a4424");continue}
    if(!inside(x,y))continue;
    const edge=!inside(x-1,y)||!inside(x+1,y)||!inside(x,y-1)||!inside(x,y+1);
    const t=(x-15.5)/12+(hash2_(x,y,variant+70)-0.5)*0.35;
    set(x,y,edge?OUT:PAL[clamp(Math.floor((t+0.8)*2.2),0,3)]);
  }
  ctx.putImageData(img,0,0);return cv;
}
function tallCanvas(kind,variant){
  const id=kind+variant;if(TALL_CACHE[id])return TALL_CACHE[id];
  let cv;
  if(kind==="tree"&&farmReady_()){
    // ต้นเมเปิลจาก Farm RPG: ต้นใหญ่ 2 แบบ (กลับด้าน) + ต้นเล็ก 1 แบบ
    const big=variant%3!==2,src=big?[90,0,50,48]:[71,13,20,35],m=mapleCrop_(src[0],src[1],src[2],src[3],variant%3===1);
    cv=document.createElement("canvas");cv.width=src[2];cv.height=src[3]+2;cv.getContext("2d").drawImage(m,0,0);
  }else if(kind==="tree"){
    if(variant%3===2){cv=pineCanvas_(variant);}
    else{
      const L=variant%3===0
        ?[[24,22,14],[13,27,10],[35,27,10],[17,13,10],[31,12,10],[24,9,9],[24,31,11]]
        :[[24,21,15],[12,28,10],[36,28,10],[24,10,11],[16,17,9],[32,17,9],[24,32,11]];
      cv=canopyCanvas_(48,64,L,[20,40,8,23],variant+5);
    }
  }else if(kind==="sunflower"){
    // ทานตะวันพิกเซล 20×32: หัวดอกใหญ่ 12 กลีบ มีเงา+ขอบ · เกสรลายจุด · ก้านหนา ใบใหญ่ · พุ่มใบที่โคน (3 แบบหันต่างกัน)
    cv=document.createElement("canvas");cv.width=20;cv.height=32;const c=cv.getContext("2d");
    const P=(x,y,col)=>{if(x<0||y<0||x>=20||y>=32)return;c.fillStyle=col;c.fillRect(x,y,1,1)};
    const tilt=[-0.7,0,0.7][variant%3],cx=9.5+tilt,cy=8,petal=new Set();
    const rOf=a=>6.2+2.0*Math.pow(Math.abs(Math.cos(a*6)),0.75);
    // ก้าน (วาดก่อน ให้หัวดอกทับ)
    for(let y=12;y<30;y++){P(9,y,"#2d594f");P(10,y,"#3d993d");P(11,y,"#347349")}
    // ใบใหญ่ 2 ใบ
    const leaf=(x0,y0,dir)=>{const L=[[0,2],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3],[3,1],[3,2],[4,1],[4,2],[5,1]];
      L.forEach(([i,j])=>P(x0+dir*i,y0+j,j===0||(j===1&&i>=3)?"#86c962":j>=3?"#2d594f":"#3d993d"));P(x0+dir*2,y0+4,"#2d594f");
      for(let i=1;i<5;i++)P(x0+dir*i,y0+2,"#347349")};
    leaf(8,17,-1);leaf(12,21,1);
    // พุ่มใบที่โคน
    [[5,28,3],[9,27,4],[14,28,3]].forEach(([bx,by,r])=>{for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){if(i*i+j*j>r*r+1||by+j>31)continue;P(bx+i,by+j,j<-r/2?"#86c962":j>r/3?"#2d594f":"#3d993d")}});
    // หัวดอก
    for(let y=0;y<17;y++)for(let x=0;x<20;x++){const dx=x-cx,dy=(y-cy)*1.1,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
      if(d<=3.9){const ring=d>3.1;P(x,y,ring?"#5a2e12":((x+y)%2?"#6a3a16":"#8a5226"));if(!ring&&(x*3+y*5)%6===0)P(x,y,"#c08a4a");petal.add(x+","+y);continue}
      const r=rOf(a);if(d<=r){petal.add(x+","+y);const k=(d-3.9)/(r-3.9);
        P(x,y,dy>2&&k>0.3?"#e08a10":k>0.82?"#ffbf1a":(dx<-1.5&&dy<0&&k>0.25?"#fff08a":"#ffd43a"))}}
    for(let y=0;y<17;y++)for(let x=0;x<20;x++){if(petal.has(x+","+y))continue;
      if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>petal.has((x+a)+","+(y+b))))P(x,y,"#9a4a0c")}
  }else if(kind==="bush"){
    cv=canopyCanvas_(16,16,[[8,9,6],[4,10,4],[12,10,4],[8,6,4]],null,variant+9);
    const c=cv.getContext("2d");if(variant%2){[[5,8],[10,7],[8,11]].forEach(([x,y])=>{c.fillStyle="#e43b44";c.fillRect(x,y,1,1)})}
  }else if(kind==="lamp"){
    cv=document.createElement("canvas");cv.width=16;cv.height=32;const c=cv.getContext("2d");
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
    r(7,10,3,20,"#3a3a4a");r(7,10,1,20,"#6a6a80");r(5,29,7,3,"#2a2a36");r(5,29,7,1,"#5a5a70");
    r(4,4,9,7,"#2a2a36");r(5,5,7,5,"#fee761");r(6,6,3,2,"#fff8d0");r(3,3,11,2,"#3a3a4a");r(7,1,3,2,"#3a3a4a");
    c.fillStyle="rgba(254,231,97,.25)";c.fillRect(2,2,13,11);
  }
  return TALL_CACHE[id]=cv;
}
// วัตถุเล็กเพิ่มเติม (ถัง ลัง) ใช้ตัววาดสไปรต์เดิม
Object.assign(SPRITES,{
obj_barrel:["................","................","....nnnnnnnn....","...nNNNNNNNNn...",
"...eeeeeeeeee...","...nnnnnnnnnn...","...nnnnnnnnnn...","...nNnnnnnnNn...",
"...eeeeeeeeee...","...nnnnnnnnnn...","...nnnnnnnnnn...","...nNnnnnnnNn...",
"...eeeeeeeeee...","....NNNNNNNN....","................","................"],
obj_crate:["................","................","..nnnnnnnnnnnn..","..nNNNNNNNNNNn..",
"..nNnnnnnnnnNn..","..nnNnnnnnnNnn..","..nnnNnnnnNnnn..","..nnnnNnnNnnnn..",
"..nnnnnNNnnnnn..","..nnnnNnnNnnnn..","..nnnNnnnnNnnn..","..nnNnnnnnnNnn..",
"..nNnnnnnnnnNn..","..nNNNNNNNNNNn..","..NNNNNNNNNNNN..","................"]
});

/* ---- ภาพจาก Farm RPG Tiny Asset Pack: บ้าน ต้นเมเปิล รั้ว หีบ ---- */
const FARM_IMGS=["house","maple","fence","chest","interior"];
function farmImg_(n){return packImg_("farm_"+n)}
function farmReady_(){return typeof packImg_==="function"&&FARM_IMGS.every(n=>{const i=farmImg_(n);return i.complete&&i.naturalWidth})}
// รอภาพโหลดเสร็จแล้ววาดแผนที่ใหม่
function whenFarmReady_(fn){FARM_IMGS.forEach(n=>{const i=farmImg_(n);if(!(i.complete&&i.naturalWidth))i.addEventListener("load",()=>{if(farmReady_()){Object.keys(TALL_CACHE).forEach(k=>delete TALL_CACHE[k]);fn()}},{once:true})})}
// บ้านทั้งหลัง (72×95) วางให้ประตูตรงช่องประตูของแผนที่
const FARM_HOUSE={sx:148,sy:3,w:72,h:95,doorCx:50,doorBottom:87};
function farmHouseCanvas_(flip){
  const id="house"+(flip?1:0);if(TALL_CACHE[id])return TALL_CACHE[id];
  const H=FARM_HOUSE,cv=document.createElement("canvas");cv.width=H.w;cv.height=H.h;const c=cv.getContext("2d");c.imageSmoothingEnabled=false;
  if(flip){c.translate(H.w,0);c.scale(-1,1)}
  c.drawImage(farmImg_("house"),H.sx,H.sy,H.w,H.h,0,0,H.w,H.h);return TALL_CACHE[id]=cv;
}
// รั้วต่อกันตามช่องข้าง ๆ
function drawFarmFence_(c,x,y,T){
  const img=farmImg_("fence"),f=(dx,dy)=>T(x+dx,y+dy)==="f",E=f(1,0),W=f(-1,0),N=f(0,-1),S=f(0,1);
  let src;
  if((N||S)&&!E&&!W)src=[0,16];                 // เสาแนวตั้ง
  else if(E&&W)src=[16,32];else if(E)src=[16,48];else if(W)src=[32,48];else src=[16,64];
  c.drawImage(img,src[0],src[1],16,16,x*TILE_PX,y*TILE_PX,16,16);
}

// ตัดภาพต้นเมเปิลจากแผ่น แล้วเก็บเฉพาะชิ้นที่ใหญ่ที่สุด (ตัดเศษของต้นข้าง ๆ ที่ติดมาตามขอบ)
function mapleCrop_(sx,sy,w,h,flip){
  const id="maple"+[sx,sy,w,h,flip?1:0].join("_");if(TALL_CACHE[id])return TALL_CACHE[id];
  const cv=document.createElement("canvas");cv.width=w;cv.height=h;const c=cv.getContext("2d");c.imageSmoothingEnabled=false;
  if(flip){c.translate(w,0);c.scale(-1,1)}c.drawImage(farmImg_("maple"),sx,sy,w,h,0,0,w,h);c.setTransform(1,0,0,1,0,0);
  const img=c.getImageData(0,0,w,h),d=img.data,lab=new Int32Array(w*h).fill(-1),sizes=[];
  for(let q0=0;q0<w*h;q0++){if(lab[q0]>=0||d[q0*4+3]<10)continue;const id2=sizes.length,st=[q0];lab[q0]=id2;let n=0;
    while(st.length){const q=st.pop();n++;const x=q%w,y=(q-x)/w;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X2=x+dx,Y2=y+dy;if(X2<0||Y2<0||X2>=w||Y2>=h)continue;const k=Y2*w+X2;if(lab[k]<0&&d[k*4+3]>=10){lab[k]=id2;st.push(k)}}}
    sizes.push(n)}
  const keep=sizes.indexOf(Math.max(...sizes));
  for(let q=0;q<w*h;q++)if(lab[q]!==keep)d[q*4+3]=0;
  c.putImageData(img,0,0);return TALL_CACHE[id]=cv;
}
