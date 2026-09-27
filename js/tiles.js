/* Math Quest V2 — กราฟิกแผนที่แบบละเอียด (พิกเซลอาร์ต 16×16 ต่อช่อง)
   วาดพื้นลงบัฟเฟอร์พิกเซลโดยตรง (เร็ว) + ขอบหญ้า/ทาง/น้ำกลมกลืนกัน + บ้านทั้งหลัง + ต้นไม้ใหญ่ 2×2 */

const TILE_PX=16;
const HEXRGB={};
const rgbOf=hex=>HEXRGB[hex]||(HEXRGB[hex]=hexToRgb_(hex));
const G_={base:"#5ea83c",light:"#78c24e",dark:"#4a9234",deep:"#3b7d2e",tip:"#9ad866"};
const P_={base:"#c89458",light:"#dcae74",dark:"#a87840",edge:"#9a6c38",pebD:"#7e6248",pebL:"#ecd0a0"};
const W_={deep:"#2d6fc0",mid:"#3a86d4",light:"#7cc3f0",foam:"#e4f7ff",shore:"#bfe6f8"};
const PATHY=new Set([":","G","w","O","l","="]);
const WATERY=new Set(["~","b","="]);
const HOUSE=new Set(["R","H","W","D"]);

// บัฟเฟอร์พิกเซลของทั้งแผนที่
function PixBuf(w,h){this.w=w;this.h=h;this.img=new ImageData(w,h);this.d=this.img.data}
PixBuf.prototype.set=function(x,y,hex){if(x<0||y<0||x>=this.w||y>=this.h)return;const c=rgbOf(hex),i=(y*this.w+x)*4,d=this.d;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255};
PixBuf.prototype.rect=function(x,y,w,h,hex){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.set(x+i,y+j,hex)};

/* ---------------- พื้น ---------------- */
function paintGround_(buf,x,y,frame,T){
  const ox=x*TILE_PX,oy=y*TILE_PX,ch=T(x,y),H=(i)=>hash2_(x,y,i);
  const px=(i,j,c)=>buf.set(ox+i,oy+j,c),rect=(i,j,w,h,c)=>buf.rect(ox+i,oy+j,w,h,c);
  const noise=(base,light,dark,pl,pd,salt)=>{
    for(let j=0;j<16;j++)for(let i=0;i<16;i++){const h=hash2_(ox+i,oy+j,salt);px(i,j,h<pl?light:h<pl+pd?dark:base)}
  };
  const grass=flowers=>{
    noise(G_.base,G_.light,G_.dark,0.05,0.06,3);
    for(let k=0;k<3;k++){const i=1+Math.floor(H(k)*12),j=3+Math.floor(H(k+5)*11);px(i,j,G_.deep);px(i+2,j,G_.deep);px(i+1,j+1,G_.deep);px(i,j-1,G_.tip);px(i+2,j-1,G_.tip)}
    if(flowers)for(let k=0;k<3;k++){const i=1+Math.floor(H(k+40)*13),j=1+Math.floor(H(k+50)*12),c=["#fee761","#f6757a","#ffffff","#c7a0ff"][Math.floor(H(k+60)*4)];
      px(i,j+1,c);px(i+1,j,c);px(i-1,j,c);px(i,j-1,c);px(i,j,"#feae34");px(i,j+2,G_.deep)}
  };
  const path=()=>{
    noise(P_.base,P_.light,P_.dark,0.07,0.07,11);
    for(let k=0;k<2;k++){const i=2+Math.floor(H(k+70)*11),j=2+Math.floor(H(k+80)*11);px(i,j,P_.pebD);px(i+1,j,P_.pebD);px(i,j-1,P_.pebL)}
    // ขอบหญ้ายื่นเข้าทาง (ทำให้ทางดูกลมกลืน)
    const grassy=(dx,dy)=>{const t=T(x+dx,y+dy);return !PATHY.has(t)&&!HOUSE.has(t)&&!WATERY.has(t)&&t!=="#"&&t!=="_"};
    const fr=(k,s)=>1+(hash2_(ox+k,oy+s,17)>0.55?1:0)+(hash2_(ox+k,oy+s,19)>0.85?1:0);
    if(grassy(0,-1))for(let i=0;i<16;i++){const d=fr(i,1);for(let j=0;j<d;j++)px(i,j,j===d-1?G_.dark:G_.base);px(i,d,P_.edge)}
    if(grassy(0,1))for(let i=0;i<16;i++){const d=fr(i,2);for(let j=0;j<d;j++)px(i,15-j,j===0?G_.light:G_.base);px(i,15-d,P_.light)}
    if(grassy(-1,0))for(let j=0;j<16;j++){const d=fr(j,3);for(let i=0;i<d;i++)px(i,j,G_.base);px(d,j,P_.edge)}
    if(grassy(1,0))for(let j=0;j<16;j++){const d=fr(j,4);for(let i=0;i<d;i++)px(15-i,j,G_.dark);px(15-d,j,P_.edge)}
  };
  const water=()=>{
    for(let j=0;j<16;j++)for(let i=0;i<16;i++){const h=hash2_(ox+i,oy+j,23);px(i,j,h<0.04?W_.deep:W_.mid)}
    for(let k=0;k<3;k++){const j=(2+k*5+(frame?2:0))%16,i=Math.floor(H(k+90)*9)+(frame?1:0);rect(i,j,4,1,W_.light);px(i+4,j,W_.shore);rect(i+1,j+1,3,1,W_.deep)}
    const land=(dx,dy)=>!WATERY.has(T(x+dx,y+dy));
    if(land(0,-1))for(let i=0;i<16;i++){px(i,0,"#e8d29a");px(i,1,(i+frame)%3?W_.foam:W_.shore);if((i+frame)%2)px(i,2,W_.light)}
    if(land(0,1))for(let i=0;i<16;i++){px(i,15,"#3d6d2e");px(i,14,W_.deep)}
    if(land(-1,0))for(let j=0;j<16;j++){px(0,j,W_.foam);if((j+frame)%2)px(1,j,W_.light)}
    if(land(1,0))for(let j=0;j<16;j++){px(15,j,W_.foam);if((j+frame)%2)px(14,j,W_.light)}
  };
  const planks=broken=>{
    water();
    if(broken){[[2,3,7],[9,10,6]].forEach(([i,j,w])=>{rect(i,j,w,3,"#b87a48");rect(i,j,w,1,"#d49a60");rect(i,j+3,w,1,"#6a4020")});rect(0,0,2,5,"#7a4a28");rect(14,11,2,5,"#7a4a28");return}
    for(let j=0;j<16;j+=4){rect(2,j,12,3,"#b87a48");rect(2,j,12,1,"#d49a60");rect(2,j+3,12,1,"#6a4020");px(4,j+1,"#4a3020");px(11,j+1,"#4a3020")}
    rect(0,0,2,16,"#7a4a28");rect(14,0,2,16,"#5a3420");rect(0,0,1,16,"#a0683a");
  };
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
  if(ch==="n"){
    for(let j=0;j<16;j++)for(let i=0;i<16;i++)px(i,j,j%5===3?"#5a3420":j%5===2?"#94603c":"#7a4a30");
    return;
  }
  if(PATHY.has(ch))return path();
  if(HOUSE.has(ch))return;                 // บ้านวาดทั้งหลังภายหลัง
  grass(ch===",");
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
  {base:"#c0413a",light:"#dd6a55",dark:"#8e2a2a",ridge:"#6e1f22"},
  {base:"#3f6fb8",light:"#5f92d8",dark:"#2a4a86",ridge:"#1f3566"},
  {base:"#b8742e",light:"#d8964a",dark:"#8a5220",ridge:"#6a3c18"},
  {base:"#5a8a3a",light:"#7aaa52",dark:"#3e6a28",ridge:"#2e5020"}
];
function paintHouse_(buf,h,rows,idx){
  const S=ROOF_STYLES[idx%ROOF_STYLES.length];
  const X0=h.x0*16,Y0=h.y0*16,Wd=(h.x1-h.x0+1)*16;
  let roofRows=0;for(let y=h.y0;y<=h.y1;y++)if(rows[y][h.x0]==="R")roofRows++;
  const RH=roofRows*16,wallY=Y0+RH,WH=(h.y1-h.y0+1-roofRows)*16;
  const set=(x,y,c)=>buf.set(x,y,c),rect=(x,y,w,hh,c)=>buf.rect(x,y,w,hh,c);
  // ผนัง
  rect(X0,wallY,Wd,WH,"#efe0c0");
  for(let j=0;j<WH;j++)for(let i=0;i<Wd;i++)if(hash2_(X0+i,wallY+j,41)<0.05)set(X0+i,wallY+j,"#e0cfaa");
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
  const seen=new Set();
  rows.forEach((r,y)=>[...r].forEach((ch,x)=>{
    if(ch!=="O"||seen.has(x+","+y))return;
    for(let j=0;j<2;j++)for(let i=0;i<2;i++)seen.add((x+i)+","+(y+j));
    const cx=x*16+16,cy=y*16+16;
    for(let j=-16;j<16;j++)for(let i=-16;i<16;i++){
      const d=Math.sqrt((i+0.5)**2+(j+0.5)**2);
      if(d>15.5)continue;
      let c;
      if(d>13.5)c="#6f7990";else if(d>11.5)c=j<0?"#d2d8e4":"#b8c0d0";else if(d>10.5)c="#6f7990";
      else{c=hash2_(cx+i,cy+j+frame,53)<0.12?"#7cc3f0":"#4f9ce0";if(Math.abs(d-4-frame*2)<0.6||Math.abs(d-8+frame)<0.5)c="#bfe6f8"}
      buf.set(cx+i,cy+j,c);
    }
    buf.rect(cx-2,cy-5,4,8,"#c8d0de");buf.rect(cx-2,cy-5,1,8,"#e8ecf4");buf.rect(cx+1,cy-5,1,8,"#8a94a8");
    buf.rect(cx-3,cy-6,6,2,"#aab4c6");
    const spray=frame?[[-3,-9],[3,-9],[-5,-6],[5,-6],[0,-11]]:[[-2,-10],[2,-10],[-4,-7],[4,-7],[0,-12]];
    spray.forEach(([i,j])=>{buf.set(cx+i,cy+j,"#e4f7ff");buf.set(cx+i,cy+j+1,"#7cc3f0")});
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
function tallCanvas(kind,variant){
  const id=kind+variant;if(TALL_CACHE[id])return TALL_CACHE[id];
  let cv;
  if(kind==="tree"){
    const L=[[[16,15,10],[9,19,7],[23,19,7],[12,10,7],[20,9,7],[16,21,8]],
             [[16,14,11],[8,20,7],[24,20,7],[16,8,7],[16,21,8]],
             [[15,15,10],[10,11,7],[22,12,7],[9,20,7],[23,21,6],[16,21,8]]][variant%3];
    cv=canopyCanvas_(32,40,L,[13,26,6,13],variant+5);
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
