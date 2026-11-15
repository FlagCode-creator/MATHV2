/* Math Quest V2 — กฎการต่อสู้บนแผนที่ (ฟังก์ชันล้วน ไม่แตะ DOM / X / save · ทดสอบด้วย node --test "tests/*.test.mjs")
   ตำแหน่งเป็นหน่วย "ช่อง" แบบทศนิยม (fx, fy) · จุดเท้า = (fx*TS+8, fy*TS+14)
   กล่องชนวางบนจุดเท้า: [เท้าX-w/2, เท้าY-h, เท้าX+w/2, เท้าY] */

const FOOT_W=10,FOOT_H=6,MON_W=12,MON_H=8;
const FOOT_DY=14;

function footPx_(fx,fy){return [fx*TS+8,fy*TS+FOOT_DY]}
// เท้าแตะขอบบนของช่องข้างล่างพอดี ยังนับว่าอยู่ช่องเดิม (ลบ 1e-6 กันปัดลงไปช่องกำแพง)
function footTile_(fx,fy){const [px,py]=footPx_(fx,fy);return [Math.floor(px/TS),Math.floor((py-1e-6)/TS)]}

// ช่องที่กล่องทับ (ขอบขวา/ล่างไม่นับช่องถัดไปถ้าแตะพอดี)
function boxTiles_(x0,y0,x1,y1){
  const out=[],e=1e-6;
  for(let ty=Math.floor(y0/TS);ty<=Math.floor((y1-e)/TS);ty++)
    for(let tx=Math.floor(x0/TS);tx<=Math.floor((x1-e)/TS);tx++)out.push([tx,ty]);
  return out;
}
function boxHits_(px,py,w,h,isBlocked){return boxTiles_(px-w/2,py-h,px+w/2,py).some(([tx,ty])=>isBlocked(tx,ty))}

// เลื่อนกล่องทีละแกน · ชนแกนหนึ่งแล้วถ้าเหลื่อมช่องว่างข้าง ๆ ไม่เกิน 4 px จะปัดเข้าไป (เดินเข้าทางแคบ/ประตูไม่ติด)
const NUDGE_PX=4;
function moveBox_(fx,fy,dx,dy,w,h,isBlocked){
  let [px,py]=footPx_(fx,fy);
  const step=(axis,d)=>{
    if(!d)return;
    const dpx=d*TS,nx=axis==="x"?px+dpx:px,ny=axis==="y"?py+dpx:py;
    if(!boxHits_(nx,ny,w,h,isBlocked)){px=nx;py=ny;return}
    // ชน: ขยับชิดขอบที่สุด
    if(axis==="x"){
      if(dpx>0){const edge=Math.floor((px+w/2+dpx-1e-6)/TS)*TS;px=Math.max(px,edge-w/2)}
      else{const edge=Math.floor((px-w/2+dpx)/TS+1)*TS;px=Math.min(px,edge+w/2)}
    }else{
      if(dpx>0){const edge=Math.floor((py+dpx-1e-6)/TS)*TS;py=Math.max(py,edge)}
      else{const edge=Math.floor((py-h+dpx)/TS+1)*TS;py=Math.min(py,edge+h)}
    }
    // ปัดเข้าช่องว่าง: ลองเลื่อนแกนตั้งฉากไม่เกิน NUDGE_PX แล้วเดินต่อได้
    const amt=Math.min(Math.abs(dpx),NUDGE_PX);
    for(const s of [1,-1])for(let k=1;k<=NUDGE_PX;k++){
      const ox=axis==="x"?0:s*k,oy=axis==="x"?s*k:0;
      if(boxHits_(px+ox,py+oy,w,h,isBlocked))break;
      const tx=axis==="x"?px+ox+Math.sign(dpx)*0.5:px+ox,ty=axis==="x"?py+oy:py+oy+Math.sign(dpx)*0.5;
      if(!boxHits_(tx,ty,w,h,isBlocked)){
        if(axis==="x"){py+=s*Math.min(k,amt);if(!boxHits_(px+Math.sign(dpx)*amt,py,w,h,isBlocked))px+=Math.sign(dpx)*amt}
        else{px+=s*Math.min(k,amt);if(!boxHits_(px,py+Math.sign(dpx)*amt,w,h,isBlocked))py+=Math.sign(dpx)*amt}
        return;
      }
    }
  };
  step("x",dx);step("y",dy);
  return [(px-8)/TS,(py-FOOT_DY)/TS];
}

const DIR_V={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
function facingTile_(fx,fy,dir,reachPx=10){
  const [px,py]=footPx_(fx,fy),[vx,vy]=DIR_V[dir]||[0,1];
  // ใช้กลางกล่องเท้าเป็นจุดอ้างอิงแนวตั้ง แล้วยื่นไปข้างหน้า
  const cx=px+vx*(reachPx+FOOT_W/2),cy=py-FOOT_H/2+vy*(reachPx+FOOT_H/2+2);
  return [Math.floor(cx/TS),Math.floor(cy/TS)];
}

// ช่องที่จะลองคุย/ตรวจสอบตามลำดับ: ช่องตรงหน้า (จากกลางเท้า) → ช่องใต้มุมหน้าอีกสองมุมของกล่องเท้า → ช่องที่ยืนอยู่
function interactTargets_(fx,fy,dir){
  const [px,py]=footPx_(fx,fy),[vx,vy]=DIR_V[dir]||[0,1],reach=10,out=[],seen=new Set();
  const add=(x,y)=>{const t=[Math.floor(x/TS),Math.floor((y-1e-6)/TS)],k=t.join(",");if(!seen.has(k)){seen.add(k);out.push(t)}};
  out.push(facingTile_(fx,fy,dir));seen.add(out[0].join(","));
  if(vx){const x=px+vx*(reach+FOOT_W/2);add(x,py-FOOT_H+1);add(x,py-1)}
  else{const y=py-FOOT_H/2+vy*(reach+FOOT_H/2+2);add(px-FOOT_W/2+1,y);add(px+FOOT_W/2-1,y)}
  add(px,py);
  return out;
}
// อยู่ในระยะและอยู่ครึ่งด้านหน้าของทิศที่หัน
function inArc_(ox,oy,dir,tx,ty,radiusPx){
  const dx=tx-ox,dy=ty-oy;if(dx*dx+dy*dy>radiusPx*radiusPx)return false;
  const [vx,vy]=DIR_V[dir]||[1,0];return dx*vx+dy*vy>=0;
}

/* ---- ชั้นความแข็งแรง → เกราะ → ระดับโจทย์ ---- */
function tierFor_(zoneId,index,night){if(night)return 4;return zoneId==="A"?1:(zoneId==="B"||zoneId==="C")?2:3}
function armorFor_(tier,index){return tier===1?0:tier===2?(index%3===0?1:0):tier===3?1:2}
const SUB_RANGE={1:[1,2],2:[2,3],3:[3,4],4:[4,5]};
function questionSubFor_(tier,kills){const [lo,hi]=SUB_RANGE[tier]||SUB_RANGE[1];return Math.min(hi,lo+Math.floor((kills||0)/3))}

/* ---- ความเสียหาย / HP / รางวัล ---- */
function swordDmg_(atk){return Math.max(1,Math.ceil(atk*0.2))}
function skillDmg_(atk,streak){return Math.round(swordDmg_(atk)*5*(1+Math.min(streak||0,5)*0.1))}
function monHp_(tier,atk){return swordDmg_(atk)*[6,8,10,12][tier-1]}
function contactDmg_(stageAtk,takenMul){return Math.max(1,Math.round(stageAtk*0.5*takenMul))}
function fieldReward_(gold,xp,strong,mul){
  let g=gold*0.5+4,x=xp*0.8;if(strong){g*=2.5;x*=2}
  return {gold:Math.round(g*mul),xp:Math.round(x*mul)};
}

/* ---- โจทย์จู่โจม ---- */
function nextAmbushDelay_(r){return 45000+r*45000}
function pickAmbushReward_(r){return r<1/3?"heal":r<2/3?"power":"gold"}

/* ---- สถานะมอนสเตอร์: เดินเล่น → ไล่ → กลับ ---- */
function monStateNext_(state,distTiles,inZone){
  if(state==="wander")return distTiles<=5&&inZone?"chase":"wander";
  if(state==="chase")return distTiles>8||!inZone?"return":"chase";
  if(state==="return")return inZone&&distTiles>5?"wander":"return";
  return "wander";
}

/* ---- ผู้เล่นอมตะชั่วครู่หลังโดนตี ---- */
function canBeHit_(now,invulnUntil){return now>invulnUntil}

/* ---- เหรียญดรอป: เหรียญละไม่เกิน 5 ---- */
function coinSplit_(gold){const out=[];let g=Math.max(0,Math.round(gold));while(g>0){const v=Math.min(5,g);out.push(v);g-=v}return out}

/* ---- คำตอบเป็นตัวเลขล้วน → ใช้แป้นตัวเลข · ไม่ใช่ (เศษส่วน/ข้อความ) → ใช้ปุ่มตัวเลือก ---- */
function isNumericAnswer_(a){return /^-?\d+(\.\d+)?$/.test(String(a).trim())}

/* ---- ภารกิจเปิดประตูทุ่ง: ปราบครบ + (ทุ่ง B–E) ต้องมีมอนเกราะอย่างน้อย 1 ตัว ---- */
function gateNeedsArmor_(stage){return "BCDE".includes(stage)}
function gateReady_(stage,kills,armorKills,questKills){return (kills||0)>=questKills&&(!gateNeedsArmor_(stage)||(armorKills||0)>=1)}
