/* Math Quest V2 — คลังโจทย์ (คัดลอกจาก V1 index.html เพื่อไม่ให้ V2 ไปแก้ไฟล์เดิม)
   ต้องมี rng(a,b) ประกาศไว้ก่อน (อยู่ใน js/util.js) */
/* ---- shared helpers for question generators ---- */
function gcd_(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t}return a||1}
function fracStr_(n,d){if(d<0){n=-n;d=-d}const g=gcd_(n,d);n=n/g;d=d/g;return d===1?`${n}`:`${n}/${d}`}
function shuffle_(arr){return arr.sort(()=>Math.random()-.5)}
// สร้างภาพประกอบ 2 มิติแบบง่าย (SVG) ให้ตรงกับตัวเลขจริงในโจทย์ — ใช้กับโจทย์พื้นที่/เรขาคณิต/ตรีโกณมิติ
function buildDiagramSVG_(spec){
  const vbW=320,vbH=220,pad=42;
  if(spec.type==="rect"||spec.type==="square"){
    const w=spec.w||spec.side,h=spec.h||spec.side;
    const scale=Math.min((vbW-2*pad)/w,(vbH-2*pad)/h);
    const rw=w*scale,rh=h*scale,x=(vbW-rw)/2,y=(vbH-rh)/2;
    return `<svg viewBox="0 0 ${vbW} ${vbH}" class="w-full max-w-xs"><rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="#eff6ff" stroke="#2563eb" stroke-width="2.5"/><text x="${x+rw/2}" y="${y-12}" text-anchor="middle" font-size="15" font-weight="700" fill="#1e3a8a">${w} หน่วย</text><text x="${x-14}" y="${y+rh/2}" text-anchor="middle" font-size="15" font-weight="700" fill="#1e3a8a" transform="rotate(-90 ${x-14} ${y+rh/2})">${h} หน่วย</text></svg>`;
  }
  if(spec.type==="triangle"){
    const b=spec.base,h=spec.height;
    const scale=Math.min((vbW-2*pad)/b,(vbH-2*pad)/h);
    const bw=b*scale,bh=h*scale,x0=(vbW-bw)/2,y0=vbH-pad,apexX=x0+bw*0.35;
    return `<svg viewBox="0 0 ${vbW} ${vbH}" class="w-full max-w-xs"><polygon points="${x0},${y0} ${x0+bw},${y0} ${apexX},${y0-bh}" fill="#fef9c3" stroke="#ca8a04" stroke-width="2.5"/><line x1="${apexX}" y1="${y0-bh}" x2="${apexX}" y2="${y0}" stroke="#a16207" stroke-width="1.5" stroke-dasharray="4,3"/><text x="${x0+bw/2}" y="${y0+22}" text-anchor="middle" font-size="15" font-weight="700" fill="#854d0e">${b} หน่วย</text><text x="${apexX+10}" y="${y0-bh/2}" font-size="15" font-weight="700" fill="#854d0e">${h} หน่วย</text></svg>`;
  }
  if(spec.type==="parallelogram"){
    const b=spec.base,h=spec.height,skew=Math.min(b*0.35,50);
    const scale=Math.min((vbW-2*pad)/(b+skew),(vbH-2*pad)/h);
    const bw=b*scale,bh=h*scale,sk=skew*scale,x0=(vbW-bw-sk)/2,y0=vbH-pad;
    return `<svg viewBox="0 0 ${vbW} ${vbH}" class="w-full max-w-xs"><polygon points="${x0},${y0} ${x0+bw},${y0} ${x0+bw+sk},${y0-bh} ${x0+sk},${y0-bh}" fill="#fce7f3" stroke="#db2777" stroke-width="2.5"/><line x1="${x0+sk}" y1="${y0-bh}" x2="${x0+sk}" y2="${y0}" stroke="#9d174d" stroke-width="1.5" stroke-dasharray="4,3"/><text x="${x0+bw/2}" y="${y0+22}" text-anchor="middle" font-size="15" font-weight="700" fill="#9d174d">${b} หน่วย</text><text x="${x0+sk+10}" y="${y0-bh/2}" font-size="15" font-weight="700" fill="#9d174d">${h} หน่วย</text></svg>`;
  }
  if(spec.type==="trapezoid"){
    const a=spec.a,b=spec.b,h=spec.h;
    const scale=Math.min((vbW-2*pad)/b,(vbH-2*pad)/h);
    const bw=b*scale,aw=a*scale,hh=h*scale,x0=(vbW-bw)/2,y0=vbH-pad,xoff=(bw-aw)/2;
    return `<svg viewBox="0 0 ${vbW} ${vbH}" class="w-full max-w-xs"><polygon points="${x0},${y0} ${x0+bw},${y0} ${x0+bw-xoff},${y0-hh} ${x0+xoff},${y0-hh}" fill="#f3e8ff" stroke="#7c3aed" stroke-width="2.5"/><text x="${x0+bw/2}" y="${y0-hh-12}" text-anchor="middle" font-size="14" font-weight="700" fill="#5b21b6">${a} หน่วย</text><text x="${x0+bw/2}" y="${y0+22}" text-anchor="middle" font-size="14" font-weight="700" fill="#5b21b6">${b} หน่วย</text><text x="${x0-14}" y="${y0-hh/2}" text-anchor="middle" font-size="14" font-weight="700" fill="#5b21b6" transform="rotate(-90 ${x0-14} ${y0-hh/2})">${h} หน่วย</text></svg>`;
  }
  if(spec.type==="circle"){
    const r=spec.r,scale=(vbW-2*pad)/(2*r),cx=vbW/2,cy=vbH/2,rr=Math.min(r*scale,(vbH-2*pad)/2);
    return `<svg viewBox="0 0 ${vbW} ${vbH}" class="w-full max-w-xs"><circle cx="${cx}" cy="${cy}" r="${rr}" fill="#ecfeff" stroke="#0891b2" stroke-width="2.5"/><line x1="${cx}" y1="${cy}" x2="${cx+rr}" y2="${cy}" stroke="#0e7490" stroke-width="2"/><text x="${cx+rr/2}" y="${cy-10}" text-anchor="middle" font-size="15" font-weight="700" fill="#155e75">${r} หน่วย</text></svg>`;
  }
  if(spec.type==="right-triangle"){
    const a=spec.a,b=spec.b;
    const scale=Math.min((vbW-2*pad)/a,(vbH-2*pad)/b);
    const aw=a*scale,bh=b*scale,x0=(vbW-aw)/2,y0=vbH-pad;
    return `<svg viewBox="0 0 ${vbW} ${vbH}" class="w-full max-w-xs"><polygon points="${x0},${y0} ${x0+aw},${y0} ${x0},${y0-bh}" fill="#dcfce7" stroke="#16a34a" stroke-width="2.5"/><rect x="${x0}" y="${y0-16}" width="16" height="16" fill="none" stroke="#16a34a" stroke-width="1.5"/><line x1="${x0+aw}" y1="${y0}" x2="${x0}" y2="${y0-bh}" stroke="#166534" stroke-width="2" stroke-dasharray="5,3"/><text x="${x0+aw/2}" y="${y0+22}" text-anchor="middle" font-size="14" font-weight="700" fill="#166534">${a} หน่วย</text><text x="${x0-12}" y="${y0-bh/2}" text-anchor="middle" font-size="14" font-weight="700" fill="#166534" transform="rotate(-90 ${x0-12} ${y0-bh/2})">${b} หน่วย</text></svg>`;
  }
  if(spec.type==="fraction-pair"){
    const n1=spec.n1,d1=spec.d1,n2=spec.n2,d2=spec.d2,barW=vbW-2*pad,barH=38,y1=58,y2=138,seg1=barW/d1,seg2=barW/d2;
    let r1="",r2="";
    for(let i=0;i<d1;i++)r1+=`<rect x="${pad+i*seg1}" y="${y1}" width="${seg1}" height="${barH}" fill="${i<n1?"#93c5fd":"#f8fafc"}" stroke="#1e3a8a" stroke-width="1.5"/>`;
    for(let i=0;i<d2;i++)r2+=`<rect x="${pad+i*seg2}" y="${y2}" width="${seg2}" height="${barH}" fill="${i<n2?"#fca5a5":"#f8fafc"}" stroke="#991b1b" stroke-width="1.5"/>`;
    return `<svg viewBox="0 0 ${vbW} ${vbH}" class="w-full max-w-xs">${r1}${r2}<text x="${pad}" y="${y1-10}" font-size="14" font-weight="700" fill="#1e3a8a">${n1}/${d1}</text><text x="${pad}" y="${y2-10}" font-size="14" font-weight="700" fill="#991b1b">${n2}/${d2}</text></svg>`;
  }
  if(spec.type==="percent-bar"){
    const barW=vbW-2*pad,barH=48,x=pad,y=vbH/2-barH/2,fillW=barW*Math.min(spec.pct,100)/100;
    return `<svg viewBox="0 0 ${vbW} ${vbH}" class="w-full max-w-xs"><rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="#f1f5f9" stroke="#334155" stroke-width="2"/><rect x="${x}" y="${y}" width="${fillW}" height="${barH}" fill="#fbbf24" stroke="#b45309" stroke-width="2"/><text x="${x}" y="${y-12}" font-size="13" fill="#334155">เต็มจำนวน = ${spec.base}</text></svg>`;
  }
  if(spec.type==="ratio-bar"){
    const total=spec.a+spec.b,barW=vbW-2*pad,aw=barW*spec.a/total,bw=barW-aw,x=pad,y=vbH/2-24;
    return `<svg viewBox="0 0 ${vbW} ${vbH}" class="w-full max-w-xs"><rect x="${x}" y="${y}" width="${aw}" height="48" fill="#a7f3d0" stroke="#047857" stroke-width="2"/><rect x="${x+aw}" y="${y}" width="${bw}" height="48" fill="#fbcfe8" stroke="#be185d" stroke-width="2"/><text x="${x+aw/2}" y="${y+28}" text-anchor="middle" font-size="15" font-weight="700" fill="#065f46">${spec.a}</text><text x="${x+aw+bw/2}" y="${y+28}" text-anchor="middle" font-size="15" font-weight="700" fill="#9d174d">${spec.b}</text></svg>`;
  }
  if(spec.type==="number-line"){
    const lo=Math.floor(spec.boundary)-3,hi=Math.ceil(spec.boundary)+3,x0=pad,x1=vbW-pad,y=vbH/2,scale=(x1-x0)/(hi-lo),bx=x0+(spec.boundary-lo)*scale;
    let ticks="";
    for(let v=lo;v<=hi;v++){const tx=x0+(v-lo)*scale;ticks+=`<line x1="${tx}" y1="${y-5}" x2="${tx}" y2="${y+5}" stroke="#64748b" stroke-width="1.5"/><text x="${tx}" y="${y+22}" text-anchor="middle" font-size="11" fill="#64748b">${v}</text>`;}
    return `<svg viewBox="0 0 ${vbW} ${vbH}" class="w-full max-w-xs"><line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#334155" stroke-width="2"/>${ticks}<line x1="${bx}" y1="${y}" x2="${x1}" y2="${y}" stroke="#dc2626" stroke-width="4"/><circle cx="${bx}" cy="${y}" r="6" fill="#fff" stroke="#dc2626" stroke-width="2.5"/></svg>`;
  }
  if(spec.type==="two-lines"){
    const cx=vbW/2,cy=vbH/2;
    return `<svg viewBox="0 0 ${vbW} ${vbH}" class="w-full max-w-xs"><line x1="${pad}" y1="${vbH-pad}" x2="${vbW-pad}" y2="${pad}" stroke="#2563eb" stroke-width="2.5"/><line x1="${pad}" y1="${pad}" x2="${vbW-pad}" y2="${vbH-pad}" stroke="#db2777" stroke-width="2.5"/><circle cx="${cx}" cy="${cy}" r="6" fill="#16a34a"/><text x="${cx+12}" y="${cy-10}" font-size="13" fill="#166534">จุดตัด</text></svg>`;
  }
  if(spec.type==="area-model"){
    const p=spec.p,q=spec.q,xw=90,pw=Math.min(60,20+p*6),qh=Math.min(60,20+q*6),x0=(vbW-xw-pw)/2,y0=(vbH-xw-qh)/2+10;
    return `<svg viewBox="0 0 ${vbW} ${vbH}" class="w-full max-w-xs"><rect x="${x0}" y="${y0}" width="${xw}" height="${xw}" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"/><rect x="${x0+xw}" y="${y0}" width="${pw}" height="${xw}" fill="#fef9c3" stroke="#a16207" stroke-width="2"/><rect x="${x0}" y="${y0+xw}" width="${xw}" height="${qh}" fill="#fce7f3" stroke="#be185d" stroke-width="2"/><rect x="${x0+xw}" y="${y0+xw}" width="${pw}" height="${qh}" fill="#dcfce7" stroke="#15803d" stroke-width="2"/><text x="${x0+xw/2}" y="${y0+xw/2+5}" text-anchor="middle" font-size="15" font-weight="700" fill="#1e3a8a">x²</text><text x="${x0+xw+pw/2}" y="${y0+xw/2+5}" text-anchor="middle" font-size="13" font-weight="700" fill="#78350f">px</text><text x="${x0+xw/2}" y="${y0+xw+qh/2+5}" text-anchor="middle" font-size="13" font-weight="700" fill="#9d174d">qx</text><text x="${x0+xw+pw/2}" y="${y0+xw+qh/2+5}" text-anchor="middle" font-size="13" font-weight="700" fill="#166534">${p*q}</text><text x="${x0+xw/2}" y="${y0-10}" text-anchor="middle" font-size="13" fill="#334155">x</text><text x="${x0-14}" y="${y0+xw/2}" text-anchor="middle" font-size="13" fill="#334155" transform="rotate(-90 ${x0-14} ${y0+xw/2})">x</text></svg>`;
  }
  if(spec.type==="parabola"){
    const r1=spec.r1,r2=spec.r2,lo=Math.min(r1,r2)-2,hi=Math.max(r1,r2)+2,x0=pad,x1=vbW-pad,xscale=(x1-x0)/(hi-lo),axisY=vbH-pad;
    let maxAbs=0;const pts=[];
    for(let i=0;i<=40;i++){const xv=lo+(hi-lo)*i/40,yv=(xv-r1)*(xv-r2);pts.push([xv,yv]);maxAbs=Math.max(maxAbs,Math.abs(yv));}
    const yscale=(axisY-pad)/(maxAbs||1)*0.9;
    const path=pts.map(([xv,yv],i)=>`${i===0?"M":"L"}${(x0+(xv-lo)*xscale).toFixed(1)},${(axisY-yv*yscale).toFixed(1)}`).join(" ");
    const r1x=x0+(r1-lo)*xscale,r2x=x0+(r2-lo)*xscale;
    return `<svg viewBox="0 0 ${vbW} ${vbH}" class="w-full max-w-xs"><line x1="${x0}" y1="${axisY}" x2="${x1}" y2="${axisY}" stroke="#334155" stroke-width="2"/><path d="${path}" fill="none" stroke="#7c3aed" stroke-width="2.5"/><circle cx="${r1x}" cy="${axisY}" r="5" fill="#dc2626"/><circle cx="${r2x}" cy="${axisY}" r="5" fill="#dc2626"/></svg>`;
  }
  if(spec.type==="line-graph"){
    const x1=spec.x1,y1=spec.y1,x2=spec.x2,y2=spec.y2,minX=Math.min(x1,x2,0),maxX=Math.max(x1,x2,1),minY=Math.min(y1,y2,0),maxY=Math.max(y1,y2,1);
    const px0=pad,px1=vbW-pad,py0=vbH-pad,py1=pad,xscale=(px1-px0)/((maxX-minX)||1),yscale=(py0-py1)/((maxY-minY)||1);
    const toX=v=>px0+(v-minX)*xscale,toY=v=>py0-(v-minY)*yscale,ax1=toX(x1),ay1=toY(y1),ax2=toX(x2),ay2=toY(y2);
    return `<svg viewBox="0 0 ${vbW} ${vbH}" class="w-full max-w-xs"><line x1="${px0}" y1="${py0}" x2="${px1}" y2="${py0}" stroke="#334155" stroke-width="2"/><line x1="${px0}" y1="${py0}" x2="${px0}" y2="${py1}" stroke="#334155" stroke-width="2"/><line x1="${ax1}" y1="${ay1}" x2="${ax2}" y2="${ay2}" stroke="#2563eb" stroke-width="2.5"/><circle cx="${ax1}" cy="${ay1}" r="5" fill="#dc2626"/><circle cx="${ax2}" cy="${ay2}" r="5" fill="#dc2626"/><text x="${ax1}" y="${ay1-10}" text-anchor="middle" font-size="12" font-weight="700" fill="#991b1b">(${x1},${y1})</text><text x="${ax2}" y="${ay2-10}" text-anchor="middle" font-size="12" font-weight="700" fill="#991b1b">(${x2},${y2})</text></svg>`;
  }
  if(spec.type==="bar-chart"){
    const vals=spec.values,n=vals.length,maxV=Math.max(...vals,1),chartW=vbW-2*pad,chartH=vbH-2*pad,barW=chartW/n*0.6,gap=chartW/n,baseY=vbH-pad;
    let bars="";
    vals.forEach((v,i)=>{const bh=(v/maxV)*chartH*0.85,bx=pad+i*gap+(gap-barW)/2;bars+=`<rect x="${bx}" y="${baseY-bh}" width="${barW}" height="${bh}" fill="#93c5fd" stroke="#1e40af" stroke-width="1.5"/><text x="${bx+barW/2}" y="${baseY-bh-6}" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a8a">${v}</text>`;});
    return `<svg viewBox="0 0 ${vbW} ${vbH}" class="w-full max-w-xs"><line x1="${pad}" y1="${baseY}" x2="${vbW-pad}" y2="${baseY}" stroke="#334155" stroke-width="2"/>${bars}</svg>`;
  }
  if(spec.type==="dice"){
    const k=spec.k,dir=spec.dir||"gt",w=(vbW-2*pad)/6;
    let items="";
    for(let i=1;i<=6;i++){const favorable=dir==="lt"?i<k:i>k,cx=pad+w*(i-0.5),cy=vbH/2;items+=`<rect x="${cx-22}" y="${cy-22}" width="44" height="44" rx="8" fill="${favorable?"#bbf7d0":"#f1f5f9"}" stroke="${favorable?"#15803d":"#94a3b8"}" stroke-width="2.5"/><text x="${cx}" y="${cy+7}" text-anchor="middle" font-size="20" font-weight="800" fill="${favorable?"#14532d":"#475569"}">${i}</text>`;}
    return `<svg viewBox="0 0 ${vbW} ${vbH}" class="w-full max-w-xs">${items}</svg>`;
  }
  return "";
}
function numOptions_(correctValue,distractorFn){
  const correctText=String(correctValue),options=[correctText];let guard=0;
  while(options.length<4&&guard<80){guard++;const x=String(distractorFn());if(!options.includes(x))options.push(x)}
  while(options.length<4)options.push(correctText+"·".repeat(options.length));
  return shuffle_(options);
}
function strOptions_(correctValue,pool){
  const options=[correctValue];
  shuffle_(pool.slice()).forEach(p=>{if(options.length<4&&!options.includes(p))options.push(p)});
  while(options.length<4)options.push(correctValue+" ".repeat(options.length));
  return shuffle_(options);
}

/* ---- stage F–Z question generators (difficulty scales with sub 1–10) ---- */
/* ---- คำใบ้ 3 ระดับต่อหัวข้อ: แนวคิดกว้าง ๆ → สูตร → เคล็ดลับขั้นตอน (อ้างอิงตามหัวข้อ ไม่อิงตัวเลขเฉพาะข้อ) ---- */
const HINTS={
  A:["โจทย์ให้รวมสองจำนวนเข้าด้วยกัน (คำสำคัญ: รวม, ทั้งหมด, เพิ่มขึ้น, มากกว่า)","วิธี: จำนวนแรก + จำนวนที่สอง — บวกทีละหลักจากขวาไปซ้าย","ตัวอย่าง 24 + 15: หลักหน่วย 4+5=9, หลักสิบ 2+1=3 → ได้ 39","เคล็ดลับ: ถ้าหลักหน่วยรวมกันเกิน 9 ให้ทด 1 ไปหลักถัดไป (เช่น 8+5=13 เขียน 3 ทด 1)"],
  B:["โจทย์ให้หาผลต่าง (คำสำคัญ: เหลือ, ต่างกัน, ใช้ไป, มากกว่ากันเท่าไร)","วิธี: จำนวนมาก − จำนวนน้อย — ลบทีละหลักจากขวาไปซ้าย","ตัวอย่าง 52 − 27: หลักหน่วย 2−7 ไม่ได้ ยืม 1 → 12−7=5, หลักสิบเหลือ 4−2=2 → ได้ 25","เคล็ดลับตรวจ: เอาผลลบ + จำนวนน้อย ต้องได้จำนวนมากกลับมา"],
  C:["โจทย์มีของหลายกลุ่ม กลุ่มละเท่า ๆ กัน แล้วหาผลรวม (คำสำคัญ: กลุ่มละ, แถวละ, คนละ)","วิธี: จำนวนกลุ่ม × จำนวนต่อกลุ่ม","ตัวอย่าง 6 × 7 = 42 (ท่องสูตรคูณ หรือบวก 6 ซ้ำ 7 ครั้ง)","เลขสองหลัก: แยกคูณแล้วบวก เช่น 23×4 = (20×4)+(3×4) = 80+12 = 92"],
  D:["โจทย์ให้แบ่งของเป็นกลุ่มเท่า ๆ กัน แล้วหาว่ากลุ่มละเท่าไร (คำสำคัญ: แบ่งเท่า ๆ กัน, เฉลี่ย)","วิธี: จำนวนทั้งหมด ÷ จำนวนกลุ่ม","ตัวอย่าง 48 ÷ 6 = 8 (เพราะ 6 × 8 = 48)","เคล็ดลับตรวจ: เอาผลหาร × ตัวหาร ต้องได้ตัวตั้งกลับมา"],
  E:["โจทย์มีหลายเครื่องหมายรวมกัน ต้องทำตามลำดับการดำเนินการ","ลำดับ: วงเล็บ → ยกกำลัง → คูณ/หาร → บวก/ลบ (ซ้ายไปขวา)","ตัวอย่าง 3 × 4 + 5: คูณก่อน 3×4=12 แล้วบวก 5 → ได้ 17 (ไม่ใช่ 3×9=27)","จุดพลาดบ่อย: อย่าบวกก่อนคูณ — ผิดลำดับคำตอบจะเพี้ยน"],
  F:["บวก/ลบเศษส่วนต้องทำตัวส่วนให้เท่ากันก่อน (ส่วนคูณ/หารไม่ต้อง)","บวก/ลบ: หา ค.ร.น. ของตัวส่วน · คูณ: เศษ×เศษ ส่วน×ส่วน · หาร: กลับเศษส่วนตัวหารแล้วคูณ","ตัวอย่าง 1/2 + 1/3: ค.ร.น.=6 → 3/6 + 2/6 = 5/6","อย่าลืมทอนเศษส่วนให้เป็นอย่างต่ำ (เช่น 4/8 = 1/2)"],
  G:["บวก/ลบทศนิยม: เรียงจุดทศนิยมให้ตรงกันในแนวตั้ง","เติมเลข 0 ต่อท้ายให้จำนวนตำแหน่งเท่ากัน แล้วคำนวณเหมือนจำนวนเต็ม","ตัวอย่าง 2.5 + 1.25: เขียน 2.50 + 1.25 = 3.75","คูณทศนิยม: คูณเหมือนจำนวนเต็มก่อน แล้วนับตำแหน่งทศนิยมรวมสองตัวมาใส่จุด"],
  H:["ร้อยละ (%) คือเศษส่วนที่มีส่วนเป็น 100 (เช่น 25% = 25/100 = 1/4)","หาค่า %: จำนวน × (เปอร์เซ็นต์ ÷ 100) · หาว่ากี่ %: (ส่วนที่ถาม ÷ ทั้งหมด) × 100","ตัวอย่าง 20% ของ 300 = 300 × 20/100 = 60","จำง่าย: 10% = หารด้วย 10, 50% = ครึ่งหนึ่ง, 25% = หนึ่งในสี่"],
  I:["อัตราส่วนที่เท่ากันเขียนเป็นสัดส่วนได้ a:b = c:x","แก้ด้วยการคูณไขว้: a×x = b×c → x = (b×c) ÷ a","ตัวอย่าง 2:3 = 8:x → x = (3×8)÷2 = 12","ทำอัตราส่วนอย่างต่ำ: หาร ห.ร.ม. ทั้งสองข้าง (เช่น 6:9 = 2:3)"],
  J:["เลขยกกำลัง aⁿ คือเอา a คูณตัวเอง n ครั้ง","คูณฐานเดียวกัน = บวกเลขชี้กำลัง: aᵐ × aⁿ = aᵐ⁺ⁿ","ตัวอย่าง 2⁴ = 2×2×2×2 = 16 · 3² × 3³ = 3⁵ = 243","จุดพลาด: 2³ ไม่เท่ากับ 2×3 — มันคือ 2×2×2 = 8"],
  K:["√n คือจำนวนที่คูณตัวเองแล้วได้ n","นึกถึงจำนวนกำลังสอง: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100...","ตัวอย่าง √49 = 7 (เพราะ 7×7 = 49)","เคล็ดลับตรวจ: ยกกำลังสองคำตอบ ต้องได้ n กลับมา"],
  L:["เป้าหมายคือหาค่า x ที่ทำให้สองข้างของสมการเท่ากัน","ax + b = c → ย้าย b ข้ามข้าง (เปลี่ยนเครื่องหมาย) แล้วหารด้วย a: x = (c − b) ÷ a","ตัวอย่าง 3x + 5 = 20 → 3x = 20−5 = 15 → x = 15÷3 = 5","ถ้ามี x สองข้าง (ax+b = cx+d): ย้าย x มารวมข้างเดียว ตัวเลขไปอีกข้าง"],
  M:["อสมการมีคำตอบเป็น 'ช่วง' (มากกว่า/น้อยกว่า) ไม่ใช่ค่าเดียว","แก้เหมือนสมการ (ย้ายข้าง, หาร) แต่คงเครื่องหมาย > หรือ < ไว้","ตัวอย่าง 2x + 1 > 7 → 2x > 6 → x > 3 (จำนวนเต็มน้อยที่สุดคือ 4)","จุดพลาด: ถ้าคูณ/หารด้วยจำนวนลบ ต้องกลับเครื่องหมายอสมการ"],
  N:["สองตัวแปร (x, y) ต้องใช้สองสมการช่วยกันหา","วิธีกำจัดตัวแปร: ทำสัมประสิทธิ์ตัวแปรหนึ่งให้เท่ากัน แล้วบวก/ลบสมการเพื่อกำจัดออก","ตัวอย่าง x+y=10 และ x−y=4 → บวกกัน 2x=14 → x=7 แล้ว y=3","ได้ตัวหนึ่งแล้ว แทนค่ากลับในสมการเดิมเพื่อหาอีกตัว"],
  O:["รวม/ลบพหุนาม = รวมเฉพาะพจน์ที่คล้ายกัน (x กับ x, ตัวเลขกับตัวเลข)","รวมสัมประสิทธิ์ของ x แยกจากพจน์คงที่","ตัวอย่าง (3x+2)+(4x+5) = 7x+7 · กระจาย 2(3x+4) = 6x+8","จุดพลาด: พจน์ x รวมกับ x² ไม่ได้ (คนละชนิด)"],
  P:["x² + bx + c แยกเป็น (x+p)(x+q) เมื่อ p×q = c และ p+q = b","หาคู่จำนวนที่คูณกันได้ c ก่อน แล้วเลือกคู่ที่บวกกันได้ b","ตัวอย่าง x²+5x+6: คู่ที่คูณได้ 6 คือ (2,3) และ 2+3=5 → (x+2)(x+3)","เครื่องหมาย: c บวก → p,q เหมือนกัน · c ลบ → p,q ต่างกัน"],
  Q:["สมการกำลังสองแยกเป็น (x−r₁)(x−r₂)=0 โดย r₁, r₂ คือคำตอบ","r₁ × r₂ = พจน์คงที่ · r₁ + r₂ = −(สัมประสิทธิ์ของ x)","ตัวอย่าง x²−5x+6=0 → (x−2)(x−3)=0 → x = 2 หรือ 3","แต่ละวงเล็บ = 0 ให้คำตอบหนึ่งค่า (x−2=0 → x=2)"],
  R:["f(x) คือกฎ: ใส่ค่า x เข้าไป จะได้ผลลัพธ์ออกมา","หา f(k): แทน x ด้วย k ในสูตร f(x) = ax + b","ตัวอย่าง f(x)=2x+3 → f(4) = 2×4+3 = 11","ถ้าโจทย์บอก f(x) แล้วถามหา x ให้ตั้งสมการแล้วแก้ย้อนกลับ"],
  S:["ความชันบอกว่ากราฟชันขึ้น/ลงเร็วแค่ไหนเมื่อ x เปลี่ยน","สูตร: m = (y₂ − y₁) ÷ (x₂ − x₁)","ตัวอย่าง จุด (1,2) และ (3,8): m = (8−2)÷(3−1) = 6÷2 = 3","จุดตัดแกน y คือค่า y เมื่อ x=0 (ในสมการ y=mx+b คือค่า b)"],
  T:["ลำดับเลขคณิตเพิ่ม/ลดทีละเท่ากัน (ผลต่างร่วม d)","พจน์ที่ n: aₙ = a₁ + (n−1)d","ตัวอย่าง 3, 7, 11,... (d=4) พจน์ที่ 5 = 3 + (5−1)×4 = 19","ลำดับเรขาคณิตคูณทีละเท่ากัน (r): aₙ = a₁ × r^(n−1)"],
  U:["ความน่าจะเป็น = จำนวนที่ต้องการ ÷ จำนวนทั้งหมด","นับผลลัพธ์ที่เข้าเงื่อนไข แล้วหารด้วยจำนวนผลลัพธ์ทั้งหมด","ตัวอย่าง ทอยลูกเต๋าออกเลขคู่: มี 3 หน้า (2,4,6) จาก 6 → 3/6 = 1/2","ตอบเป็นเศษส่วนอย่างต่ำเสมอ"],
  V:["ค่าเฉลี่ย = ผลรวม ÷ จำนวนข้อมูล · พิสัย = สูงสุด − ต่ำสุด · มัธยฐาน = ค่ากลางเมื่อเรียงแล้ว","ค่าเฉลี่ย: บวกทุกตัวให้ครบก่อน แล้วหารด้วยจำนวนตัว","ตัวอย่าง 4, 8, 6 → เฉลี่ย (4+8+6)÷3 = 6 · พิสัย 8−4 = 4","มัธยฐานต้องเรียงข้อมูลจากน้อยไปมากก่อนเสมอ"],
  W:["เลือกสูตรตามรูปทรง: สี่เหลี่ยมผืนผ้า = กว้าง×ยาว, สามเหลี่ยม = (ฐาน×สูง)÷2","คางหมู = (ด้านคู่ขนานรวม×สูง)÷2 · วงกลม: พื้นที่ = πr², เส้นรอบวง = 2πr","ตัวอย่าง สามเหลี่ยมฐาน 10 สูง 6 → (10×6)÷2 = 30","ระบุก่อนว่ารูปอะไร แล้วแทนตัวเลขในสูตรที่ตรงกัน"],
  X:["สามเหลี่ยมมุมฉากใช้พีทาโกรัส: a² + b² = c² (c = ด้านตรงข้ามมุมฉาก ยาวสุด)","หา c = √(a²+b²) · หาด้านประกอบ = √(c²−a²)","ตัวอย่าง a=3, b=4 → c = √(9+16) = √25 = 5","มุมพิเศษ: sin30° = cos60° = 0.5 (ด้านตรงข้ามมุม 30° = ครึ่งของด้านตรงข้ามมุมฉาก)"],
  Y:["อนุพันธ์ใช้กฎกำลัง: d/dx[xⁿ] = n·xⁿ⁻¹","มีสัมประสิทธิ์ a นำหน้า: d/dx[a·xⁿ] = a×n·xⁿ⁻¹","ตัวอย่าง d/dx[3x⁴] = 3×4·x³ = 12x³ (สัมประสิทธิ์ = 12)","สรุป: สัมประสิทธิ์ใหม่ = สัมประสิทธิ์เดิม × เลขชี้กำลังเดิม"]
};
const HINTS_FALLBACK_Z=["โจทย์นี้สุ่มจากหนึ่งใน 25 หัวข้อ — ดูก่อนว่าเป็นเรื่องบวก/ลบ/คูณ/หาร หรือพีชคณิต/เรขาคณิต","จับคำสำคัญในโจทย์ (รวม, เหลือ, เท่า ๆ กัน, พื้นที่, สมการ ฯลฯ) เพื่อรู้ว่าต้องใช้วิธีใด","นึกถึงสูตรของหัวข้อนั้น แล้วแทนตัวเลขจากโจทย์ลงในสูตร","ทำทีละขั้น อย่ารีบ แล้วตรวจว่าคำตอบสมเหตุสมผลกับหน่วยในโจทย์"];

const HARD_GENERATORS={
  F(sub){ // เศษส่วน
    const scale=1+Math.floor((sub-1)/2),d1=rng(2,3*scale+2),d2=rng(2,3*scale+2),n1=rng(1,d1-1)||1,n2=rng(1,d2-1)||1;
    const op=sub<=6?(rng(0,1)?"+":"-"):(rng(0,1)?"×":"÷");
    let rn,rd,text,explain;
    if(op==="+"){rn=n1*d2+n2*d1;rd=d1*d2;text=`${n1}/${d1} + ${n2}/${d2} = ?`;explain=`หา ค.ร.น. ของ ${d1} กับ ${d2} แล้วบวกเศษ`}
    else if(op==="-"){let a=n1,ad=d1,b=n2,bd=d2;if(a/ad<b/bd){[a,ad,b,bd]=[b,bd,a,ad]}rn=a*bd-b*ad;rd=ad*bd;text=`${a}/${ad} − ${b}/${bd} = ?`;explain=`หา ค.ร.น. แล้วลบเศษ`}
    else if(op==="×"){rn=n1*n2;rd=d1*d2;text=`${n1}/${d1} × ${n2}/${d2} = ?`;explain=`คูณเศษกับเศษ คูณส่วนกับส่วน แล้วทอนเศษส่วน`}
    else{rn=n1*d2;rd=d1*n2;text=`${n1}/${d1} ÷ ${n2}/${d2} = ?`;explain=`หารเศษส่วน คือคูณด้วยส่วนกลับของตัวหาร`}
    const answer=fracStr_(rn,rd);
    const pool=[fracStr_(rn+rd,rd),fracStr_(Math.max(1,rn-1),rd),fracStr_(rn,rd+1),fracStr_(rn+1,rd),fracStr_(Math.abs(rn-2)||1,rd)];
    return{text,answer,explain,options:strOptions_(answer,pool),type:"เศษส่วน",diagram:{type:"fraction-pair",n1,d1,n2,d2}};
  },
  G(sub){ // ทศนิยม — จำกัดทศนิยมไว้ไม่เกิน 2 ตำแหน่งเสมอ เพื่อไม่ให้คำนวณด้วยมือยากเกินไป
    const scale=1+Math.floor((sub-1)/2),places=sub<=5?1:2,opChoice=rng(0,2);
    let answer,text,explain;
    if(opChoice<=1){
      const a=Number((rng(10,30*scale)/Math.pow(10,places)).toFixed(places)),b=Number((rng(10,20*scale)/Math.pow(10,places)).toFixed(places));
      if(opChoice===0){answer=Number((a+b).toFixed(places));text=`${a} + ${b} = ?`;explain=`บวกทศนิยม โดยเรียงจุดทศนิยมให้ตรงกัน`}
      else{const hi=Math.max(a,b),lo=Math.min(a,b);answer=Number((hi-lo).toFixed(places));text=`${hi} − ${lo} = ?`;explain=`ลบทศนิยม โดยเรียงจุดทศนิยมให้ตรงกัน`}
    }else{
      const a=Number((rng(10,25*scale)/Math.pow(10,places)).toFixed(places)),whole=rng(2,9);
      answer=Number((a*whole).toFixed(places));text=`${a} × ${whole} = ?`;explain=`คูณทศนิยมด้วยจำนวนเต็ม: ${a} × ${whole} = ${answer}`;
    }
    return{text,answer,explain,options:numOptions_(answer,()=>Number((answer+rng(-5,5)/Math.pow(10,places)).toFixed(places+1))),type:"ทศนิยม"};
  },
  H(sub){ // ร้อยละ — เลขฐานเป็นพหุคูณของ 20 เสมอ เพื่อให้หารลงตัว ไม่มีเศษทศนิยม
    const base=rng(5,40)*20,pct=[5,10,15,20,25,50,75][rng(0,6)];
    let answer,text,explain;
    if(sub<=6){answer=base*pct/100;text=`${pct}% ของ ${base} เท่ากับเท่าใด?`;explain=`${pct}% ของ ${base} = ${base} × ${pct}/100 = ${answer}`}
    else{const part=base*pct/100;answer=pct;text=`${part} คิดเป็นกี่เปอร์เซ็นต์ของ ${base}?`;explain=`(${part} ÷ ${base}) × 100 = ${pct}%`}
    return{text,answer,explain,options:numOptions_(answer,()=>Math.max(1,answer+rng(-2,2)*5)),type:"ร้อยละ",diagram:{type:"percent-bar",pct:sub<=6?pct:Math.round((base*pct/100)/base*100),base}};
  },
  I(sub){ // อัตราส่วน — สลับระหว่างแก้สัดส่วน กับ ทำให้เป็นอัตราส่วนอย่างต่ำ
    if(rng(0,1)===0){
      const scale=1+Math.floor((sub-1)/2),a=rng(2,4*scale),b=rng(2,4*scale),k=rng(2,3*scale),c=a*k,answer=b*k;
      const text=`ถ้า ${a} : ${b} = ${c} : x แล้ว x มีค่าเท่าใด?`,explain=`อัตราส่วนเท่ากัน: x = (${b} × ${c}) ÷ ${a} = ${answer}`;
      return{text,answer,explain,options:numOptions_(answer,()=>Math.max(1,answer+rng(-6,6))),type:"อัตราส่วน",diagram:{type:"ratio-bar",a,b}};
    }else{
      const g=rng(2,5),pRaw=rng(2,6),qRaw=rng(2,6),a=pRaw*g,b=qRaw*g,divisor=gcd_(a,b),answer=a/divisor;
      const text=`อัตราส่วน ${a} : ${b} เมื่อทำให้เป็นอัตราส่วนอย่างต่ำแล้ว พจน์แรกมีค่าเท่าใด?`;
      const explain=`${a} : ${b} มี ห.ร.ม. = ${divisor} ดังนั้นอัตราส่วนอย่างต่ำคือ ${a/divisor} : ${b/divisor}`;
      return{text,answer,explain,options:numOptions_(answer,()=>Math.max(1,answer+rng(-3,3))),type:"อัตราส่วน",diagram:{type:"ratio-bar",a,b}};
    }
  },
  J(sub){ // เลขยกกำลัง — สลับระหว่างคำนวณค่า กับ กฎการคูณเลขยกกำลังฐานเดียวกัน
    if(rng(0,1)===0){
      const base=rng(2,3+Math.floor((1+Math.floor((sub-1)/2))/2)),exp=rng(2,2+Math.floor(sub/3)),answer=Math.pow(base,exp);
      const text=`${base}^${exp} มีค่าเท่าใด?`,explain=`${base} คูณตัวเอง ${exp} ครั้ง = ${answer}`;
      return{text,answer,explain,options:numOptions_(answer,()=>Math.max(1,answer+rng(-10,10))),type:"เลขยกกำลัง"};
    }else{
      const base=rng(2,4),m=rng(2,4),n=rng(2,4),answer=m+n;
      const text=`${base}^${m} × ${base}^${n} = ${base}^? จงหาเลขชี้กำลังที่หายไป`,explain=`กฎการคูณเลขยกกำลังฐานเดียวกัน: aᵐ × aⁿ = aᵐ⁺ⁿ ดังนั้นเลขชี้กำลัง = ${m} + ${n} = ${answer}`;
      return{text,answer,explain,options:numOptions_(answer,()=>Math.max(2,answer+rng(-3,3))),type:"เลขยกกำลัง"};
    }
  },
  K(sub){ // รากที่สอง
    const n=Math.pow(sub<=5?rng(2,6+sub):rng(2,10+sub),2),answer=Math.round(Math.sqrt(n));
    const text=`√${n} มีค่าเท่าใด?`,explain=`เพราะ ${answer} × ${answer} = ${n}`;
    return{text,answer,explain,options:numOptions_(answer,()=>Math.max(1,answer+rng(-3,3))),type:"รากที่สอง",diagram:{type:"square",side:answer}};
  },
  L(sub){ // สมการเชิงเส้น — สลับระหว่าง ax+b=c กับ ตัวแปรอยู่สองฝั่ง ax+b=cx+d
    const scale=1+Math.floor((sub-1)/2);
    if(rng(0,1)===0){
      const a=rng(2,3+scale),x=rng(-5-scale,5+scale)||1,b=rng(-10,10),c=a*x+b;
      const text=`จงหาค่า x จาก ${a}x ${b>=0?"+":"−"} ${Math.abs(b)} = ${c}`,explain=`x = (${c} − (${b})) ÷ ${a} = ${x}`;
      return{text,answer:x,explain,options:numOptions_(x,()=>x+rng(-4,4)||x+1),type:"สมการเชิงเส้น"};
    }else{
      let a=rng(2,3+scale),c=rng(2,3+scale);while(c===a)c=rng(2,3+scale);
      const x=rng(-5-scale,5+scale)||1,b=rng(-10,10),d=(a-c)*x+b;
      const text=`จงหาค่า x จาก ${a}x ${b>=0?"+":"−"} ${Math.abs(b)} = ${c}x ${d>=0?"+":"−"} ${Math.abs(d)}`;
      const explain=`ย้าย ${c}x ไปรวมอีกฝั่ง: (${a}−${c})x = ${d}−(${b}) → x = ${x}`;
      return{text,answer:x,explain,options:numOptions_(x,()=>x+rng(-4,4)||x+1),type:"สมการเชิงเส้น"};
    }
  },
  M(sub){ // อสมการ — สุ่มทิศทาง > หรือ < (แก้ขอบเขตให้ถูกต้องแม้กรณีขอบเขตเป็นจำนวนเต็มพอดี)
    const scale=1+Math.floor((sub-1)/2),a=rng(2,2+scale),b=rng(-8,8),dir=rng(0,1)===0?">":"<";
    const c=a*rng(-4-scale,4+scale)+b+rng(1,3)*(dir===">"?1:-1);
    const boundary=(c-b)/a;
    const answer=dir===">"?Math.floor(boundary)+1:Math.ceil(boundary)-1;
    const text=`จำนวนเต็มที่${dir===">"?"น้อยที่สุด":"มากที่สุด"}ที่สอดคล้องกับ ${a}x ${b>=0?"+":"−"} ${Math.abs(b)} ${dir} ${c} คือข้อใด?`;
    const explain=`x ${dir} (${c} − (${b})) ÷ ${a} = ${boundary.toFixed(2)} ดังนั้นจำนวนเต็ม${dir===">"?"น้อยสุด":"มากสุด"}คือ ${answer}`;
    return{text,answer,explain,options:numOptions_(answer,()=>answer+rng(-3,3)),type:"อสมการ",diagram:{type:"number-line",boundary}};
  },
  N(sub){ // ระบบสมการ — สุ่มถามค่า x, y หรือ x+y
    const x=rng(-6,6)||1,y=rng(-6,6)||1,a1=rng(1,4),b1=rng(1,4);let a2=rng(1,4),b2=rng(1,4);
    while(a1*b2===a2*b1){a2=rng(1,4);b2=rng(1,4)} // V2: กันระบบสมการที่เส้นขนาน/ทับกัน (ไม่มีคำตอบเดียว)
    const c1=a1*x+b1*y,c2=a2*x+b2*y,askType=rng(0,2);
    const answer=askType===0?x:askType===1?y:x+y,askLabel=askType===0?"ค่า x":askType===1?"ค่า y":"ค่า x + y";
    const text=`จากระบบสมการ ${a1}x + ${b1}y = ${c1} และ ${a2}x + ${b2}y = ${c2} จงหา${askLabel}`,explain=`แก้ระบบสมการสองตัวแปรได้ x = ${x}, y = ${y}`;
    return{text,answer,explain,options:numOptions_(answer,()=>answer+rng(-4,4)||answer+1),type:"ระบบสมการ",diagram:{type:"two-lines"}};
  },
  O(sub){ // พหุนาม — สลับระหว่างบวก ลบ และคูณพจน์เดี่ยวกับสองพจน์
    const variant=rng(0,2),askCoef=sub%2===1;
    let text,answer,explain;
    if(variant<=1){
      const a=rng(1,5),b=rng(-9,9),c=rng(1,5),d=rng(-9,9);
      if(variant===0){const coefSum=a+c,constSum=b+d;text=`(${a}x ${b>=0?"+":"−"} ${Math.abs(b)}) + (${c}x ${d>=0?"+":"−"} ${Math.abs(d)}) เมื่อจัดรูปแล้ว ${askCoef?"สัมประสิทธิ์ของ x":"พจน์คงที่"} มีค่าเท่าใด?`;answer=askCoef?coefSum:constSum;explain=askCoef?`${a} + ${c} = ${coefSum}`:`${b} + ${d} = ${constSum}`;}
      else{const coefDiff=a-c,constDiff=b-d;text=`(${a}x ${b>=0?"+":"−"} ${Math.abs(b)}) − (${c}x ${d>=0?"+":"−"} ${Math.abs(d)}) เมื่อจัดรูปแล้ว ${askCoef?"สัมประสิทธิ์ของ x":"พจน์คงที่"} มีค่าเท่าใด?`;answer=askCoef?coefDiff:constDiff;explain=askCoef?`${a} − ${c} = ${coefDiff}`:`${b} − ${d} = ${constDiff}`;}
    }else{
      const k=rng(2,5),a=rng(1,5),b=rng(-9,9),coef=k*a,constTerm=k*b;
      text=`${k}(${a}x ${b>=0?"+":"−"} ${Math.abs(b)}) เมื่อกระจายแล้ว ${askCoef?"สัมประสิทธิ์ของ x":"พจน์คงที่"} มีค่าเท่าใด?`;
      answer=askCoef?coef:constTerm;explain=askCoef?`${k} × ${a} = ${coef}`:`${k} × ${b} = ${constTerm}`;
    }
    return{text,answer,explain,options:numOptions_(answer,()=>answer+rng(-4,4)||answer+2),type:"พหุนาม"};
  },
  P(sub){ // แยกตัวประกอบ
    const [p,q]=distinctPair_(-6,6),b=p+q,c=p*q,small=Math.min(p,q);
    const text=`แยกตัวประกอบ x² ${b>=0?"+":"−"} ${Math.abs(b)}x ${c>=0?"+":"−"} ${Math.abs(c)} เป็น (x+p)(x+q) โดย p ≤ q จงหาค่า p`;
    const explain=`หาสองจำนวนที่คูณกันได้ ${c} และบวกกันได้ ${b} คือ ${p} กับ ${q}`;
    const diagram=(p>0&&q>0)?{type:"area-model",p,q}:undefined;
    return{text,answer:small,explain,options:numOptions_(small,()=>small+rng(-3,3)),type:"แยกตัวประกอบ",diagram};
  },
  Q(sub){ // สมการกำลังสอง
    const [r1,r2]=distinctPair_(-7,7),b=-(r1+r2),c=r1*r2,answer=Math.max(r1,r2);
    const text=`สมการ x² ${b>=0?"+":"−"} ${Math.abs(b)}x ${c>=0?"+":"−"} ${Math.abs(c)} = 0 มีคำตอบที่มากกว่าคือข้อใด?`;
    const explain=`แยกตัวประกอบได้ (x − ${r1})(x − ${r2}) = 0 ดังนั้นคำตอบคือ ${r1} และ ${r2}`;
    return{text,answer,explain,options:numOptions_(answer,()=>answer+rng(-3,3)),type:"สมการกำลังสอง",diagram:{type:"parabola",r1,r2}};
  },
  R(sub){ // ฟังก์ชัน — สลับระหว่างหา f(k) กับหา x จาก f(x) ที่กำหนด (ฟังก์ชันผกผัน)
    const a=rng(2,6),b=rng(-9,9);
    if(rng(0,1)===0){
      const k=rng(-6,6),answer=a*k+b;
      const text=`กำหนด f(x) = ${a}x ${b>=0?"+":"−"} ${Math.abs(b)} จงหาค่า f(${k})`,explain=`f(${k}) = ${a}×${k} ${b>=0?"+":"−"} ${Math.abs(b)} = ${answer}`;
      return{text,answer,explain,options:numOptions_(answer,()=>answer+rng(-6,6)||answer+3),type:"ฟังก์ชัน"};
    }else{
      const x=rng(-6,6)||1,target=a*x+b;
      const text=`กำหนด f(x) = ${a}x ${b>=0?"+":"−"} ${Math.abs(b)} ถ้า f(x) = ${target} จงหาค่า x`;
      const explain=`${a}x ${b>=0?"+":"−"} ${Math.abs(b)} = ${target} → x = (${target} − (${b})) ÷ ${a} = ${x}`;
      return{text,answer:x,explain,options:numOptions_(x,()=>x+rng(-4,4)||x+1),type:"ฟังก์ชัน"};
    }
  },
  S(sub){ // กราฟ — สลับระหว่างหาความชัน กับหาจุดตัดแกน y
    if(rng(0,1)===0){
      const m=rng(-5,5)||1,x1=rng(-8,8),y1=rng(-8,8),d=rng(1,4),x2=x1+d,y2=y1+m*d;
      const text=`จุด (${x1}, ${y1}) และ (${x2}, ${y2}) มีความชันเท่าใด?`,explain=`ความชัน = (${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${m}`;
      return{text,answer:m,explain,options:numOptions_(m,()=>m+rng(-3,3)||m+1),type:"กราฟ",diagram:{type:"line-graph",x1,y1,x2,y2}};
    }else{
      const m=rng(-5,5)||1,x1=rng(1,8),yInt=rng(-8,8),y1=m*x1+yInt;
      const text=`เส้นตรงมีความชัน ${m} และผ่านจุด (${x1}, ${y1}) จุดตัดแกน y (ค่า y เมื่อ x = 0) มีค่าเท่าใด?`;
      const explain=`y = mx + b → ${y1} = ${m}×${x1} + b → b = ${yInt}`;
      return{text,answer:yInt,explain,options:numOptions_(yInt,()=>yInt+rng(-4,4)||yInt+2),type:"กราฟ",diagram:{type:"line-graph",x1:0,y1:yInt,x2:x1,y2:y1}};
    }
  },
  T(sub){ // ลำดับ — สลับระหว่างลำดับเลขคณิต (บวกเพิ่ม) กับลำดับเรขาคณิต (คูณเพิ่ม)
    if(rng(0,1)===0){
      const a1=rng(-10,10),diff=rng(-6,6)||1,n=rng(4,6+sub),answer=a1+(n-1)*diff;
      const text=`ลำดับเลขคณิตเริ่มที่ ${a1} เพิ่มขึ้นครั้งละ ${diff} พจน์ที่ ${n} คือเท่าใด?`,explain=`aₙ = a₁ + (n−1)d = ${a1} + (${n}−1)×${diff} = ${answer}`;
      const firstThree=[a1,a1+diff,a1+2*diff];
      const diagram=firstThree.every(v=>v>0)?{type:"bar-chart",values:firstThree}:undefined;
      return{text,answer,explain,options:numOptions_(answer,()=>answer+rng(-Math.abs(diff)*2||-4,Math.abs(diff)*2||4)),type:"ลำดับ",diagram};
    }else{
      const a1=rng(1,5),r=[2,3][rng(0,1)],n=rng(3,5),answer=a1*Math.pow(r,n-1);
      const text=`ลำดับเรขาคณิตเริ่มที่ ${a1} คูณด้วย ${r} ทุกพจน์ พจน์ที่ ${n} คือเท่าใด?`,explain=`aₙ = a₁ × r^(n−1) = ${a1} × ${r}^${n-1} = ${answer}`;
      const spread=Math.max(2,Math.round(answer*0.3));
      return{text,answer,explain,options:numOptions_(answer,()=>Math.max(1,answer+rng(-spread,spread))),type:"ลำดับ",diagram:{type:"bar-chart",values:[a1,a1*r,a1*r*r]}};
    }
  },
  U(sub){ // ความน่าจะเป็น — สลับระหว่างลูกเต๋า (มากกว่า/น้อยกว่า) กับการ์ดเลขคู่
    const variant=rng(0,2);let text,explain,diagram,total,favorable;
    if(variant===0){const k=rng(1,5);total=6;favorable=6-k;text=`ทอยลูกเต๋า 1 ลูก ความน่าจะเป็นที่จะได้เลขมากกว่า ${k} คือเท่าใด (ตอบเป็นเศษส่วนอย่างต่ำ)`;explain=`มี ${favorable} หน้าที่มากกว่า ${k} จาก 6 หน้า → ${favorable}/6 ทอนเป็น ${fracStr_(favorable,6)}`;diagram={type:"dice",k,dir:"gt"};}
    else if(variant===1){const k=rng(2,6);total=6;favorable=k-1;text=`ทอยลูกเต๋า 1 ลูก ความน่าจะเป็นที่จะได้เลขน้อยกว่า ${k} คือเท่าใด (ตอบเป็นเศษส่วนอย่างต่ำ)`;explain=`มี ${favorable} หน้าที่น้อยกว่า ${k} จาก 6 หน้า → ${favorable}/6 ทอนเป็น ${fracStr_(favorable,6)}`;diagram={type:"dice",k,dir:"lt"};}
    else{total=10;favorable=5;text=`มีการ์ดหมายเลข 1 ถึง 10 ใบละ 1 ใบ สุ่มหยิบ 1 ใบ ความน่าจะเป็นที่จะได้เลขคู่คือเท่าใด (ตอบเป็นเศษส่วนอย่างต่ำ)`;explain=`มีเลขคู่ ${favorable} ใบจาก ${total} ใบ → ${favorable}/${total} ทอนเป็น ${fracStr_(favorable,total)}`;}
    const answer=fracStr_(favorable,total);
    const pool=[fracStr_(Math.min(total,favorable+1),total),fracStr_(Math.max(1,favorable-1),total),fracStr_(total-favorable,total),fracStr_(favorable,total*2)];
    return{text,answer,explain,options:strOptions_(answer,pool),type:"ความน่าจะเป็น",diagram};
  },
  V(sub){ // สถิติ — สลับระหว่างค่าเฉลี่ย พิสัย และมัธยฐาน
    const nums=Array.from({length:5},()=>rng(1,20+sub*2)),variant=rng(0,2);
    let answer,text,explain;
    if(variant===0){const sum=nums.reduce((a,b)=>a+b,0),mean=Math.round((sum/5)*10)/10;answer=mean;text=`ข้อมูล ${nums.join(", ")} มีค่าเฉลี่ยเท่าใด (ปัดทศนิยม 1 ตำแหน่ง)`;explain=`ค่าเฉลี่ย = ผลรวม ÷ จำนวนข้อมูล = ${sum} ÷ 5 = ${mean}`}
    else if(variant===1){answer=Math.max(...nums)-Math.min(...nums);text=`ข้อมูล ${nums.join(", ")} มีพิสัยเท่าใด`;explain=`พิสัย = ค่าสูงสุด − ค่าต่ำสุด = ${Math.max(...nums)} − ${Math.min(...nums)} = ${answer}`}
    else{const sorted=[...nums].sort((a,b)=>a-b);answer=sorted[2];text=`ข้อมูล ${nums.join(", ")} มีมัธยฐาน (ค่ากึ่งกลาง) เท่าใด?`;explain=`เรียงข้อมูลจากน้อยไปมาก: ${sorted.join(", ")} ค่ากึ่งกลางคือ ${answer}`}
    return{text,answer,explain,options:numOptions_(answer,()=>Math.round((answer+rng(-4,4))*10)/10),type:"สถิติ",diagram:{type:"bar-chart",values:nums}};
  },
  W(sub){ // เรขาคณิต — ขั้น 1-2 สี่เหลี่ยมผืนผ้า, 3-5 สามเหลี่ยม/ด้านขนาน, 6-7 คางหมู, 8 วงกลม
    let answer,text,explain,diagram;
    if(sub<=2){
      const w=rng(3,8+sub),h=rng(3,8+sub);answer=w*h;
      text=`สี่เหลี่ยมผืนผ้ากว้าง ${w} หน่วย ยาว ${h} หน่วย มีพื้นที่เท่าใด?`;explain=`พื้นที่ = กว้าง × ยาว = ${w} × ${h} = ${answer}`;
      diagram={type:"rect",w,h};
    }else if(sub<=5){
      const shape=rng(0,1)===0?"tri":"para";
      const b=rng(4,10+sub)*2,h=rng(3,8+sub);
      if(shape==="tri"){answer=b*h/2;text=`สามเหลี่ยมฐาน ${b} หน่วย สูง ${h} หน่วย มีพื้นที่เท่าใด?`;explain=`พื้นที่ = (ฐาน × สูง) ÷ 2 = (${b} × ${h}) ÷ 2 = ${answer}`;diagram={type:"triangle",base:b,height:h};}
      else{answer=b*h;text=`สี่เหลี่ยมด้านขนานมีฐานยาว ${b} หน่วย สูง ${h} หน่วย มีพื้นที่เท่าใด?`;explain=`พื้นที่ = ฐาน × สูง = ${b} × ${h} = ${answer}`;diagram={type:"parallelogram",base:b,height:h};}
    }else if(sub<=7){
      const top=rng(4,10),bottom=top+rng(2,8),h=rng(3,10);
      answer=(top+bottom)*h/2;
      text=`สี่เหลี่ยมคางหมูมีด้านคู่ขนานยาว ${top} หน่วย และ ${bottom} หน่วย สูง ${h} หน่วย มีพื้นที่เท่าใด?`;
      explain=`พื้นที่ = (ด้านคู่ขนานรวมกัน × สูง) ÷ 2 = (${top} + ${bottom}) × ${h} ÷ 2 = ${answer}`;
      diagram={type:"trapezoid",a:top,b:bottom,h};
    }else{
      const r=rng(3,8),findArea=rng(0,1)===0;
      if(findArea){answer=Math.round(3.14*r*r*100)/100;text=`วงกลมรัศมี ${r} หน่วย มีพื้นที่เท่าใด (ใช้ π ≈ 3.14)?`;explain=`พื้นที่ = πr² = 3.14×${r}² = ${answer}`;}
      else{answer=Math.round(2*3.14*r*100)/100;text=`วงกลมรัศมี ${r} หน่วย มีเส้นรอบวงเท่าใด (ใช้ π ≈ 3.14)?`;explain=`เส้นรอบวง = 2πr = 2×3.14×${r} = ${answer}`;}
      diagram={type:"circle",r};
    }
    const isChoice=sub<=5;
    return{text,answer,explain,type:"เรขาคณิต",diagram,...(isChoice?{options:numOptions_(answer,()=>Math.round((answer+rng(-5,5))*100)/100)}:{})};
  },
  X(sub){ // ตรีโกณมิติ — ขั้น 1-5 ทฤษฎีพีทาโกรัส, 6-8 อัตราส่วนตรีโกณมิติมุมพิเศษ (ใช้เฉพาะอัตราส่วน 0.5 ที่แน่นอน ไม่มีเศษทศนิยมไม่ลงตัว)
    let answer,text,explain,diagram;
    if(sub<=5){
      const triples=[[3,4,5],[5,12,13],[8,15,17],[7,24,25]],[p,q,r]=triples[rng(0,3)],k=rng(1,2+Math.floor(sub/3));
      const a=p*k,b=q*k,c=r*k,askHyp=sub<=2;
      if(askHyp){answer=c;text=`สามเหลี่ยมมุมฉากมีด้านประกอบมุมฉากยาว ${a} และ ${b} หน่วย ด้านตรงข้ามมุมฉากยาวเท่าใด?`;explain=`ทฤษฎีพีทาโกรัส: √(${a}² + ${b}²) = ${answer}`;diagram={type:"right-triangle",a,b};}
      else{answer=b;text=`สามเหลี่ยมมุมฉากมีด้านตรงข้ามมุมฉากยาว ${c} หน่วย และด้านประกอบมุมฉากด้านหนึ่งยาว ${a} หน่วย อีกด้านยาวเท่าใด?`;explain=`ทฤษฎีพีทาโกรัส: √(${c}² − ${a}²) = ${answer}`;diagram={type:"right-triangle",a,b};}
    }else if(sub<=7){
      const angle=rng(0,1)===0?30:60,hyp=rng(4,10)*2;
      answer=hyp*0.5;
      const legLabel=angle===30?"ด้านตรงข้ามมุม 30°":"ด้านประชิดมุม 60°",ratioName=angle===30?"sin(30°) = 0.5":"cos(60°) = 0.5";
      text=`สามเหลี่ยมมุมฉากมีด้านตรงข้ามมุมฉากยาว ${hyp} หน่วย และมีมุมหนึ่งเท่ากับ ${angle}° จงหา${legLabel}`;
      explain=`${legLabel} = ด้านตรงข้ามมุมฉาก × ${ratioName} = ${hyp} × 0.5 = ${answer}`;
      const other=Math.round(Math.sqrt(hyp*hyp-answer*answer)*10)/10;
      diagram={type:"right-triangle",a:angle===30?other:answer,b:angle===30?answer:other};
    }else{
      const angle=rng(0,1)===0?30:60,side=rng(4,10)*2;
      answer=side*2;
      const sideLabel=angle===30?"ด้านตรงข้ามมุม 30°":"ด้านประชิดมุม 60°",ratioName=angle===30?"sin(30°) = 0.5":"cos(60°) = 0.5";
      text=`สามเหลี่ยมมุมฉากมี${sideLabel}ยาว ${side} หน่วย ด้านตรงข้ามมุมฉากยาวเท่าใด?`;
      explain=`ด้านตรงข้ามมุมฉาก = ${sideLabel} ÷ ${ratioName} = ${side} ÷ 0.5 = ${answer}`;
      const other=Math.round(Math.sqrt(answer*answer-side*side)*10)/10;
      diagram={type:"right-triangle",a:angle===30?other:side,b:angle===30?side:other};
    }
    const isChoice=sub<=5;
    return{text,answer,explain,type:"ตรีโกณมิติ",diagram,...(isChoice?{options:numOptions_(answer,()=>answer+rng(-4,4)||answer+2)}:{})};
  },
  Y(sub){ // แคลคูลัสเบื้องต้น (กฎกำลัง)
    const a=rng(2,6+sub),n=rng(2,3+Math.floor(sub/4)),answer=a*n;
    const text=`อนุพันธ์ของ ${a}x^${n} มีสัมประสิทธิ์เท่าใด (ตัวเลขหน้าพจน์ x)`,explain=`ใช้กฎกำลัง: d/dx[${a}x^${n}] = ${a}×${n}·x^${n-1} สัมประสิทธิ์คือ ${a}×${n} = ${answer}`;
    return{text,answer,explain,options:numOptions_(answer,()=>answer+rng(-6,6)||answer+3),type:"แคลคูลัส"};
  }
};
HARD_GENERATORS.Z=function(sub){
  const keys=Object.keys(HARD_GENERATORS).filter(k=>k!=="Z"),key=keys[rng(0,keys.length-1)],q=HARD_GENERATORS[key](sub);
  return{...q,type:`Mathematics Challenge (${q.type})`};
};

/* ---- word-problem generators (used for sub-level 9–10) ---- */
const WORD_SUBJECTS=["แม่ค้า","ชาวสวน","นักเรียน","พนักงานร้าน","ชาวประมง","เจ้าของฟาร์ม"];
const WORD_ITEMS=["ส้ม","แอปเปิ้ล","สมุด","ดินสอ","ขวดน้ำ","กล่องขนม"];
function pick_(arr){return arr[rng(0,arr.length-1)]}
function distinctPair_(lo,hi){let a=rng(lo,hi)||1,b=rng(lo,hi)||1;while(b===a)b=rng(lo,hi)||1;return[a,b]}
function pickVariant_(arr){return arr[rng(0,arr.length-1)]}
const WORD_GENERATORS={
  A(sub){const scale=1+Math.floor((sub-1)/2),a=rng(10*scale,30*scale),b=rng(5*scale,20*scale),subj=pick_(WORD_SUBJECTS),item=pick_(WORD_ITEMS);
    const text=pickVariant_([
      `${subj}มี${item} ${a} ชิ้น ซื้อเพิ่มอีก ${b} ชิ้น รวมมี${item}ทั้งหมดกี่ชิ้น?`,
      `ห้องสมุดมีหนังสือ ${a} เล่ม ได้รับบริจาคเพิ่มอีก ${b} เล่ม ตอนนี้มีหนังสือทั้งหมดกี่เล่ม?`,
      `${subj}เก็บเงินได้ ${a} บาท ได้รับเงินขวัญถุงเพิ่มอีก ${b} บาท ตอนนี้มีเงินทั้งหมดกี่บาท?`,
      `สวนผลไม้เก็บผลไม้ได้วันแรก ${a} ผล วันที่สองเก็บได้เพิ่มอีก ${b} ผล รวมสองวันเก็บได้กี่ผล?`
    ]);
    return{text,answer:a+b,explain:`${a} + ${b} = ${a+b}`,type:"บวก — โจทย์ปัญหา"};},
  B(sub){const scale=1+Math.floor((sub-1)/2),total=rng(20*scale,50*scale),used=rng(5*scale,total-5),subj=pick_(WORD_SUBJECTS),item=pick_(WORD_ITEMS);
    const text=pickVariant_([
      `${subj}มี${item} ${total} ชิ้น แจกไปให้ลูกค้า ${used} ชิ้น เหลือ${item}กี่ชิ้น?`,
      `ห้องสมุดมีหนังสือ ${total} เล่ม นักเรียนยืมไป ${used} เล่ม เหลือหนังสือบนชั้นกี่เล่ม?`,
      `ถังน้ำมี ${total} ลิตร ใช้รดน้ำต้นไม้ไป ${used} ลิตร เหลือน้ำอยู่กี่ลิตร?`,
      `นักเรียนมีเงินเก็บ ${total} บาท ซื้อของไป ${used} บาท เหลือเงินกี่บาท?`
    ]);
    return{text,answer:total-used,explain:`${total} − ${used} = ${total-used}`,type:"ลบ — โจทย์ปัญหา"};},
  C(sub){const scale=1+Math.floor((sub-1)/2),a=rng(3,6+scale),b=rng(4*scale,12*scale),subj=pick_(WORD_SUBJECTS),item=pick_(WORD_ITEMS);
    const text=pickVariant_([
      `${subj}แบ่ง${item}ให้เด็ก ${a} คน คนละ ${b} ชิ้นเท่ากัน ใช้${item}ทั้งหมดกี่ชิ้น?`,
      `ห้องประชุมจัดเก้าอี้ ${a} แถว แถวละ ${b} ตัว มีเก้าอี้ทั้งหมดกี่ตัว?`,
      `โรงงานบรรจุขนมใส่กล่อง ${a} กล่อง กล่องละ ${b} ชิ้น ใช้ขนมทั้งหมดกี่ชิ้น?`,
      `รถโรงเรียน ${a} คัน จุนักเรียนคันละ ${b} คน รับนักเรียนได้ทั้งหมดกี่คน?`
    ]);
    return{text,answer:a*b,explain:`${a} × ${b} = ${a*b}`,type:"คูณ — โจทย์ปัญหา"};},
  D(sub){const scale=1+Math.floor((sub-1)/2),a=rng(4,8+scale),b=rng(4*scale,10*scale),subj=pick_(WORD_SUBJECTS),item=pick_(WORD_ITEMS);
    const text=pickVariant_([
      `${subj}มี${item} ${a*b} ชิ้น แบ่งใส่กล่องเท่า ๆ กัน ${b} กล่อง แต่ละกล่องมี${item}กี่ชิ้น?`,
      `ครูแจกดินสอ ${a*b} แท่งให้นักเรียน ${b} คนเท่า ๆ กัน แต่ละคนได้ดินสอกี่แท่ง?`,
      `เงิน ${a*b} บาท แบ่งให้เพื่อน ${b} คนเท่า ๆ กัน แต่ละคนได้เงินกี่บาท?`,
      `สวนปลูกต้นไม้ ${a*b} ต้น แบ่งเป็น ${b} แปลงเท่า ๆ กัน แต่ละแปลงมีต้นไม้กี่ต้น?`
    ]);
    return{text,answer:a,explain:`${a*b} ÷ ${b} = ${a}`,type:"หาร — โจทย์ปัญหา"};},
  E(sub){const scale=1+Math.floor((sub-1)/2),a=rng(3*scale,8*scale),b=rng(5,10+scale),subj=pick_(WORD_SUBJECTS),item=pick_(WORD_ITEMS);
    const text=pickVariant_([
      `${subj}ซื้อ${item} ${a} ชิ้น ราคาชิ้นละ ${b} บาท แล้วต้องจ่ายค่าจัดส่งเพิ่มอีก ${b} บาท ต้องจ่ายเงินทั้งหมดกี่บาท?`,
      `ร้านค้าขาย${item} ${a} ชิ้น ชิ้นละ ${b} บาท และมีค่าธรรมเนียมบัตรเพิ่ม ${b} บาท ลูกค้าต้องจ่ายกี่บาท?`,
      `นักเรียนซื้อสมุด ${a} เล่ม เล่มละ ${b} บาท และซื้อปากกาเพิ่มราคา ${b} บาท รวมจ่ายกี่บาท?`
    ]);
    return{text,answer:a*b+b,explain:`(${a} × ${b}) + ${b} = ${a*b+b}`,type:"บวก ลบ คูณ หาร — โจทย์ปัญหา"};},
  F(sub){const scale=1+Math.floor((sub-1)/2),d1=rng(2,3*scale+2),d2=rng(2,3*scale+2),n1=rng(1,d1-1)||1,n2=rng(1,d2-1)||1;
    let a=n1,ad=d1,b=n2,bd=d2;if(a/ad<b/bd){[a,ad,b,bd]=[b,bd,a,ad]}const rn=a*bd-b*ad,rd=ad*bd,answer=fracStr_(rn,rd);
    const text=pickVariant_([
      `ชาวสวนมีเชือกยาว ${a}/${ad} เมตร ตัดออกไปผูกต้นไม้ ${b}/${bd} เมตร เชือกที่เหลือยาวเท่าใด (ตอบเป็นเศษส่วนอย่างต่ำ)?`,
      `${pick_(WORD_SUBJECTS)}มีน้ำมันพืช ${a}/${ad} ลิตร ใช้ทอดอาหารไป ${b}/${bd} ลิตร เหลือน้ำมันกี่ลิตร (ตอบเป็นเศษส่วนอย่างต่ำ)?`,
      `เค้ก ${a}/${ad} ถาด แบ่งให้เพื่อนไป ${b}/${bd} ถาด เหลือเค้กกี่ถาด (ตอบเป็นเศษส่วนอย่างต่ำ)?`
    ]);
    return{text,answer,explain:`${a}/${ad} − ${b}/${bd} = ${answer}`,type:"เศษส่วน — โจทย์ปัญหา",diagram:{type:"fraction-pair",n1:a,d1:ad,n2:b,d2:bd}};},
  G(sub){const places=sub<=9?1:2,a=Number((rng(50,300)/Math.pow(10,places)).toFixed(places)),b=Number((rng(20,150)/Math.pow(10,places)).toFixed(places)),answer=Number((a+b).toFixed(places));
    const text=pickVariant_([
      `${pick_(WORD_SUBJECTS)}ซื้อ${pick_(WORD_ITEMS)}ราคา ${a} บาท และอีกชิ้นราคา ${b} บาท รวมจ่ายเงินทั้งหมดกี่บาท?`,
      `ชั่งน้ำหนักแตงโมได้ ${a} กก. และฟักทองได้ ${b} กก. รวมน้ำหนักทั้งหมดกี่กก.?`,
      `นักวิ่งวิ่งได้ ${a} กม. ในวันแรก และ ${b} กม. ในวันที่สอง รวมระยะทางที่วิ่งทั้งหมดกี่กม.?`
    ]);
    return{text,answer,explain:`${a} + ${b} = ${answer}`,type:"ทศนิยม — โจทย์ปัญหา"};},
  H(sub){const base=rng(5,40)*20,pct=[10,15,20,25,50][rng(0,4)],answer=base*pct/100;
    const text=pickVariant_([
      `ร้านค้าลดราคาสินค้าจาก ${base} บาท ลง ${pct}% จะลดราคาลงกี่บาท?`,
      `ตั๋วหนังราคา ${base} บาท มีส่วนลดสำหรับนักเรียน ${pct}% จะได้ส่วนลดกี่บาท?`,
      `พนักงานขายได้คอมมิชชัน ${pct}% จากยอดขาย ${base} บาท จะได้ค่าคอมมิชชันกี่บาท?`
    ]);
    return{text,answer,explain:`${base} × ${pct}/100 = ${answer}`,type:"ร้อยละ — โจทย์ปัญหา",diagram:{type:"percent-bar",pct,base}};},
  I(sub){const a=rng(2,6),b=rng(2,6),c=a*rng(2,5),answer=b*c/a;
    const text=pickVariant_([
      `สูตรอาหารใช้แป้ง : น้ำตาล ในอัตราส่วน ${a} : ${b} ถ้าต้องการใช้แป้ง ${c} ถ้วย ต้องใช้น้ำตาลกี่ถ้วย?`,
      `ผสมสีน้ำเงินกับสีเหลืองในอัตราส่วน ${a} : ${b} ถ้าใช้สีน้ำเงิน ${c} ช้อน ต้องใช้สีเหลืองกี่ช้อน?`,
      `น้ำเชื่อมผสมน้ำในอัตราส่วน ${a} : ${b} ถ้าใช้น้ำเชื่อม ${c} ถ้วย ต้องใช้น้ำกี่ถ้วย?`
    ]);
    return{text,answer,explain:`${a}:${b} = ${c}:x → x = (${b}×${c})÷${a} = ${answer}`,type:"อัตราส่วน — โจทย์ปัญหา",diagram:{type:"ratio-bar",a,b}};},
  J(sub){const base=rng(2,3),exp=rng(3,5),answer=Math.pow(base,exp);
    const text=pickVariant_([
      `แบคทีเรียในจานเพาะเลี้ยงเพิ่มจำนวนเป็น ${base} เท่าทุกชั่วโมง เริ่มจาก 1 ตัว ผ่านไป ${exp} ชั่วโมงจะมีแบคทีเรียกี่ตัว?`,
      `ข้อความในโซเชียลถูกแชร์ต่อเป็น ${base} เท่าทุกรอบ เริ่มจาก 1 คนแชร์ ผ่านไป ${exp} รอบจะมีผู้แชร์สะสมกี่คน?`,
      `ต้นไม้ชนิดหนึ่งแตกกิ่งใหม่เป็น ${base} เท่าทุกเดือน เริ่มจาก 1 กิ่ง ผ่านไป ${exp} เดือนจะมีกี่กิ่ง?`
    ]);
    return{text,answer,explain:`${base}^${exp} = ${answer}`,type:"เลขยกกำลัง — โจทย์ปัญหา"};},
  K(sub){const side=rng(6,15),n=side*side;
    const text=pickVariant_([
      `ที่ดินรูปสี่เหลี่ยมจัตุรัสมีพื้นที่ ${n} ตารางเมตร แต่ละด้านยาวกี่เมตร?`,
      `ห้องรูปสี่เหลี่ยมจัตุรัสปูกระเบื้องได้พื้นที่ ${n} ตารางเมตร ห้องนี้มีด้านยาวกี่เมตร?`,
      `สนามหญ้ารูปสี่เหลี่ยมจัตุรัสมีพื้นที่ ${n} ตารางเมตร รั้วรอบสนามแต่ละด้านยาวกี่เมตร?`
    ]);
    return{text,answer:side,explain:`√${n} = ${side}`,type:"รากที่สอง — โจทย์ปัญหา",diagram:{type:"square",side}};},
  L(sub){const a=rng(3,8),x=rng(20,80),b=rng(10,50),c=a*x+b,item2=pick_(WORD_ITEMS);
    const text=pickVariant_([
      `${pick_(WORD_SUBJECTS)}ซื้อ${item2} ${a} ชิ้นราคาชิ้นละเท่ากัน รวมกับค่าจัดส่ง ${b} บาท จ่ายเงินทั้งหมด ${c} บาท ${item2}ราคาชิ้นละกี่บาท?`,
      `เช่าจักรยาน ${a} ชั่วโมง ราคาชั่วโมงละเท่ากัน บวกค่ามัดจำ ${b} บาท รวมจ่าย ${c} บาท ค่าเช่าต่อชั่วโมงกี่บาท?`,
      `ซื้อตั๋วรถทัวร์ ${a} ใบราคาใบละเท่ากัน บวกค่าธรรมเนียม ${b} บาท รวมจ่าย ${c} บาท ตั๋วราคาใบละกี่บาท?`
    ]);
    return{text,answer:x,explain:`${a}x + ${b} = ${c} → x = ${x}`,type:"สมการเชิงเส้น — โจทย์ปัญหา"};},
  M(sub){const a=rng(15,40),b=rng(5,30),c=a*rng(3,8)+b+rng(1,20),boundary=(c-b)/a,answer=Math.ceil(boundary);
    const text=pickVariant_([
      `สมุดราคาเล่มละ ${a} บาท ถ้ามีค่าธรรมเนียมร้านค้าเพิ่ม ${b} บาท และต้องจ่ายเงินมากกว่า ${c} บาท จำนวนสมุดน้อยที่สุด (จำนวนเต็ม) ที่ทำให้เป็นไปตามเงื่อนไขคือกี่เล่ม?`,
      `ดินสอราคาแท่งละ ${a} บาท บวกค่าห่อของขวัญ ${b} บาท ถ้าต้องจ่ายมากกว่า ${c} บาท จำนวนดินสอน้อยที่สุด (จำนวนเต็ม) คือกี่แท่ง?`,
      `ขนมถุงละ ${a} บาท บวกค่าตกแต่งถุง ${b} บาท ถ้าต้องจ่ายมากกว่า ${c} บาท จำนวนถุงขนมน้อยที่สุด (จำนวนเต็ม) คือกี่ถุง?`
    ]);
    return{text,answer,explain:`${a}x + ${b} > ${c} → x > ${boundary.toFixed(2)} ดังนั้น x น้อยสุด = ${answer}`,type:"อสมการ — โจทย์ปัญหา",diagram:{type:"number-line",boundary}};},
  N(sub){const x=rng(50,150),y=rng(20,80),a1=rng(1,3),b1=rng(1,3);let a2=rng(1,3),b2=rng(1,3);while(a1*b2===a2*b1){a2=rng(1,3);b2=rng(1,3)}const c1=a1*x+b1*y,c2=a2*x+b2*y;
    const text=pickVariant_([
      `ตั๋วผู้ใหญ่ ${a1} ใบ และตั๋วเด็ก ${b1} ใบ รวมราคา ${c1} บาท ส่วนตั๋วผู้ใหญ่ ${a2} ใบ และตั๋วเด็ก ${b2} ใบ รวมราคา ${c2} บาท ตั๋วผู้ใหญ่ราคาใบละกี่บาท?`,
      `ปากกา ${a1} ด้าม และดินสอ ${b1} แท่ง รวมราคา ${c1} บาท ส่วนปากกา ${a2} ด้าม และดินสอ ${b2} แท่ง รวมราคา ${c2} บาท ปากการาคาด้ามละกี่บาท?`,
      `แอปเปิล ${a1} ผล และส้ม ${b1} ผล รวมราคา ${c1} บาท ส่วนแอปเปิล ${a2} ผล และส้ม ${b2} ผล รวมราคา ${c2} บาท แอปเปิลราคาผลละกี่บาท?`
    ]);
    return{text,answer:x,explain:`แก้ระบบสมการได้ x = ${x} บาท (y = ${y} บาท)`,type:"ระบบสมการ — โจทย์ปัญหา",diagram:{type:"two-lines"}};},
  O(sub){const a=rng(10,30),b=rng(5,20),c=rng(10,30),d=rng(5,20),coefSum=a+c;
    const text=pickVariant_([
      `ร้านค้ามีรายรับวันที่ 1 เท่ากับ (${a}x + ${b}) บาท และวันที่ 2 เท่ากับ (${c}x + ${d}) บาท เมื่อ x คือจำนวนสินค้าที่ขายได้ รายรับรวมสองวันมีสัมประสิทธิ์ของ x เท่าใด?`,
      `สาขา A มียอดขาย (${a}x + ${b}) บาท และสาขา B มียอดขาย (${c}x + ${d}) บาท เมื่อ x คือจำนวนลูกค้า ยอดขายรวมมีสัมประสิทธิ์ของ x เท่าใด?`,
      `แปลงที่ 1 ให้ผลผลิต (${a}x + ${b}) กก. และแปลงที่ 2 ให้ผลผลิต (${c}x + ${d}) กก. เมื่อ x คือจำนวนต้นที่ปลูก ผลผลิตรวมมีสัมประสิทธิ์ของ x เท่าใด?`
    ]);
    return{text,answer:coefSum,explain:`${a} + ${c} = ${coefSum}`,type:"พหุนาม — โจทย์ปัญหา"};},
  P(sub){const [p,q]=distinctPair_(-6,6),b=p+q,c=p*q,small=Math.min(p,q);
    const text=pickVariant_([
      `มีจำนวนเต็มสองจำนวน คูณกันได้ ${c} และบวกกันได้ ${b} จำนวนที่น้อยกว่าคือเท่าใด?`,
      `ครูตั้งปริศนาว่า มีเลขสองจำนวนคูณกันได้ ${c} และรวมกันได้ ${b} นักเรียนต้องหาจำนวนที่น้อยกว่า คำตอบคือเท่าใด?`,
      `กล่องของขวัญสองกล่องมีจำนวนลูกอมคูณกันได้ ${c} เม็ด และรวมกันได้ ${b} เม็ด กล่องที่มีน้อยกว่ามีลูกอมกี่เม็ด?`
    ]);
    return{text,answer:small,explain:`สองจำนวนคือ ${p} กับ ${q}`,type:"แยกตัวประกอบ — โจทย์ปัญหา",diagram:(p>0&&q>0)?{type:"area-model",p,q}:undefined};},
  Q(sub){const [r1,r2]=distinctPair_(-7,7),c=r1*r2,sum=r1+r2,answer=Math.max(r1,r2);
    const text=pickVariant_([
      `มีจำนวนเต็มสองจำนวน คูณกันได้ ${c} และบวกกันได้ ${sum} จำนวนที่มากกว่าคือเท่าใด?`,
      `สวนสัตว์มีนกกับกระต่ายสองกลุ่ม จำนวนคูณกันได้ ${c} และรวมกันได้ ${sum} กลุ่มที่มากกว่ามีจำนวนเท่าใด?`,
      `เลขสองจำนวนคูณกันได้ ${c} และบวกกันได้ ${sum} เลขที่มากกว่าคือเท่าใด?`
    ]);
    return{text,answer,explain:`สองจำนวนคือ ${r1} กับ ${r2}`,type:"สมการกำลังสอง — โจทย์ปัญหา",diagram:{type:"parabola",r1,r2}};},
  R(sub){const a=rng(50,150),b=rng(100,500),k=rng(3,10),answer=a*k+b;
    const text=pickVariant_([
      `พนักงานได้ค่าจ้างวันละ ${b} บาท บวกค่าคอมมิชชัน ${a} บาทต่อสินค้าที่ขายได้ 1 ชิ้น ถ้าวันนี้ขายได้ ${k} ชิ้น จะได้ค่าจ้างรวมกี่บาท?`,
      `ค่าแท็กซี่เริ่มต้น ${b} บาท บวกกิโลเมตรละ ${a} บาท ถ้านั่งไป ${k} กิโลเมตร ต้องจ่ายค่าแท็กซี่กี่บาท?`,
      `ร้านซ่อมคิดค่าแรงเริ่มต้น ${b} บาท บวกชั่วโมงละ ${a} บาท ถ้าซ่อม ${k} ชั่วโมง ต้องจ่ายค่าซ่อมกี่บาท?`
    ]);
    return{text,answer,explain:`${a}×${k} + ${b} = ${answer}`,type:"ฟังก์ชัน — โจทย์ปัญหา"};},
  S(sub){const m=rng(2,8),x1=0,y1=rng(0,20),d=rng(2,5),x2=x1+d,y2=y1+m*d;
    const text=pickVariant_([
      `รถยนต์อยู่ที่ตำแหน่ง ${y1} กม. เมื่อเวลา ${x1} ชั่วโมง และอยู่ที่ตำแหน่ง ${y2} กม. เมื่อเวลา ${x2} ชั่วโมง รถวิ่งด้วยอัตราเร็วกี่กม./ชม.?`,
      `ถังน้ำมีน้ำ ${y1} ลิตร เมื่อเวลา ${x1} นาที และมีน้ำ ${y2} ลิตร เมื่อเวลา ${x2} นาที น้ำไหลเข้าด้วยอัตราเท่าใด (ลิตร/นาที)?`,
      `ร้านมีกำไร ${y1} บาท เมื่อขายได้ ${x1} ชิ้น และมีกำไร ${y2} บาท เมื่อขายได้ ${x2} ชิ้น กำไรเพิ่มขึ้นชิ้นละกี่บาท?`
    ]);
    return{text,answer:m,explain:`(${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${m}`,type:"กราฟ — โจทย์ปัญหา",diagram:{type:"line-graph",x1,y1,x2,y2}};},
  T(sub){const a1=rng(500,2000),diff=rng(50,300),n=rng(4,8),answer=a1+(n-1)*diff;
    const text=pickVariant_([
      `${pick_(WORD_SUBJECTS)}ฝากเงินเดือนแรก ${a1} บาท และฝากเพิ่มขึ้นเดือนละ ${diff} บาททุกเดือน เดือนที่ ${n} จะฝากเงินกี่บาท?`,
      `สวนปลูกต้นไม้เดือนแรก ${a1} ต้น และปลูกเพิ่มขึ้นเดือนละ ${diff} ต้นทุกเดือน เดือนที่ ${n} จะปลูกกี่ต้น?`,
      `ชมรมมีสมาชิกเดือนแรก ${a1} คน และเพิ่มขึ้นเดือนละ ${diff} คนทุกเดือน เดือนที่ ${n} จะมีสมาชิกกี่คน?`
    ]);
    return{text,answer,explain:`aₙ = ${a1} + (${n}−1)×${diff} = ${answer}`,type:"ลำดับ — โจทย์ปัญหา",diagram:{type:"bar-chart",values:[a1,a1+diff,a1+2*diff]}};},
  U(sub){const k=rng(1,5),favorable=6-k,answer=fracStr_(favorable,6);
    const text=pickVariant_([
      `กล่องมีลูกบอลหมายเลข 1 ถึง 6 อย่างละ 1 ลูก ถ้าสุ่มหยิบ 1 ลูก ความน่าจะเป็นที่จะได้เลขมากกว่า ${k} คือเท่าใด (ตอบเป็นเศษส่วนอย่างต่ำ)?`,
      `กล่องสลากมีบัตรหมายเลข 1 ถึง 6 อย่างละ 1 ใบ สุ่มหยิบ 1 ใบ ความน่าจะเป็นที่จะได้เลขมากกว่า ${k} คือเท่าใด (ตอบเป็นเศษส่วนอย่างต่ำ)?`,
      `ทอยลูกเต๋า 1 ลูก 1 ครั้ง ความน่าจะเป็นที่จะได้เลขมากกว่า ${k} คือเท่าใด (ตอบเป็นเศษส่วนอย่างต่ำ)?`
    ]);
    return{text,answer,explain:`มี ${favorable} หน้าที่มากกว่า ${k} จาก 6 หน้า → ${favorable}/6 ทอนเป็น ${answer}`,type:"ความน่าจะเป็น — โจทย์ปัญหา",diagram:{type:"dice",k}};},
  V(sub){const nums=Array.from({length:5},()=>rng(40,100)),sum=nums.reduce((a,b)=>a+b,0),mean=Math.round((sum/5)*10)/10,range=Math.max(...nums)-Math.min(...nums),useMean=sub%2===0;
    let text,answer,explain;
    if(useMean){text=pickVariant_([
        `คะแนนสอบของนักเรียน 5 คนคือ ${nums.join(", ")} คะแนน ค่าเฉลี่ยของคะแนนคือเท่าใด (ปัดทศนิยม 1 ตำแหน่ง)?`,
        `น้ำหนักผลมะม่วง 5 ผลคือ ${nums.join(", ")} กรัม ค่าเฉลี่ยน้ำหนักคือเท่าใด (ปัดทศนิยม 1 ตำแหน่ง)?`,
        `อุณหภูมิ 5 วันที่วัดได้คือ ${nums.join(", ")} องศา ค่าเฉลี่ยอุณหภูมิคือเท่าใด (ปัดทศนิยม 1 ตำแหน่ง)?`
      ]);answer=mean;explain=`${sum} ÷ 5 = ${mean}`;}
    else{text=pickVariant_([
        `คะแนนสอบของนักเรียน 5 คนคือ ${nums.join(", ")} คะแนน คะแนนมีพิสัยเท่าใด?`,
        `น้ำหนักผลมะม่วง 5 ผลคือ ${nums.join(", ")} กรัม น้ำหนักมีพิสัยเท่าใด?`,
        `อุณหภูมิ 5 วันที่วัดได้คือ ${nums.join(", ")} องศา อุณหภูมิมีพิสัยเท่าใด?`
      ]);answer=range;explain=`${Math.max(...nums)} − ${Math.min(...nums)} = ${range}`;}
    return{text,answer,explain,type:"สถิติ — โจทย์ปัญหา",diagram:{type:"bar-chart",values:nums}};},
  W(sub){const shape=["rect","tri","trap","circle"][rng(0,3)];let text,answer,explain,diagram;
    if(shape==="rect"){const w=rng(6,15),h=rng(6,15);answer=w*h;text=pickVariant_([`สวนรูปสี่เหลี่ยมผืนผ้ากว้าง ${w} เมตร ยาว ${h} เมตร มีพื้นที่กี่ตารางเมตร?`,`ห้องเรียนรูปสี่เหลี่ยมผืนผ้ากว้าง ${w} เมตร ยาว ${h} เมตร มีพื้นที่กี่ตารางเมตร?`,`ลานจอดรถรูปสี่เหลี่ยมผืนผ้ากว้าง ${w} เมตร ยาว ${h} เมตร มีพื้นที่กี่ตารางเมตร?`]);explain=`${w} × ${h} = ${answer}`;diagram={type:"rect",w,h};}
    else if(shape==="tri"){const b=rng(8,24),h=rng(6,15);answer=b*h/2;text=pickVariant_([`แปลงผักรูปสามเหลี่ยมมีฐานยาว ${b} เมตร สูง ${h} เมตร มีพื้นที่กี่ตารางเมตร?`,`ป้ายธงรูปสามเหลี่ยมมีฐานยาว ${b} เมตร สูง ${h} เมตร มีพื้นที่กี่ตารางเมตร?`]);explain=`(${b} × ${h}) ÷ 2 = ${answer}`;diagram={type:"triangle",base:b,height:h};}
    else if(shape==="trap"){const top=rng(4,10),bottom=top+rng(2,8),h=rng(3,10);answer=(top+bottom)*h/2;text=pickVariant_([`สนามหญ้ารูปสี่เหลี่ยมคางหมูมีด้านคู่ขนานยาว ${top} เมตร และ ${bottom} เมตร สูง ${h} เมตร มีพื้นที่กี่ตารางเมตร?`,`ที่ดินรูปสี่เหลี่ยมคางหมูมีด้านคู่ขนานยาว ${top} เมตร และ ${bottom} เมตร สูง ${h} เมตร มีพื้นที่กี่ตารางเมตร?`]);explain=`(${top} + ${bottom}) × ${h} ÷ 2 = ${answer}`;diagram={type:"trapezoid",a:top,b:bottom,h};}
    else{const r=rng(3,8);answer=Math.round(2*3.14*r*100)/100;text=pickVariant_([`สระน้ำวงกลมมีรัศมี ${r} เมตร มีเส้นรอบวงเท่าใด (ใช้ π ≈ 3.14)?`,`ลานวงกลมมีรัศมี ${r} เมตร มีเส้นรอบวงเท่าใด (ใช้ π ≈ 3.14)?`]);explain=`2×3.14×${r} = ${answer}`;diagram={type:"circle",r};}
    return{text,answer,explain,type:"เรขาคณิต — โจทย์ปัญหา",diagram};},
  X(sub){const useElevation=rng(0,3)===0;let text,answer,explain,diagram;
    if(useElevation){
      const dist=rng(5,20)*2;answer=dist; // มุมเงย 45° ทำให้สูง = ระยะทาง พอดี (คำนวณง่าย ไม่มีเศษทศนิยม)
      text=pickVariant_([
        `คนยืนห่างจากตึกตามแนวราบ ${dist} เมตร มองยอดตึกเป็นมุมเงย 45° ตึกสูงกี่เมตร?`,
        `เรือจอดห่างจากประภาคารตามแนวราบ ${dist} เมตร มองยอดประภาคารเป็นมุมเงย 45° ประภาคารสูงกี่เมตร?`
      ]);
      explain=`มุมเงย 45° ทำให้ด้านตรงข้ามมุมเท่ากับด้านประชิดมุม ดังนั้นความสูง = ระยะทาง = ${dist} เมตร`;
      diagram={type:"right-triangle",a:dist,b:answer};
    }else{
      const triples=[[3,4,5],[5,12,13],[8,15,17]],[p,q,r]=triples[rng(0,2)],k=rng(1,3),a=p*k,b=q*k,c=r*k;
      text=pickVariant_([
        `บันไดพาดกำแพง ฐานบันไดห่างจากกำแพง ${a} เมตร ปลายบันไดสูงจากพื้นถึงกำแพง ${b} เมตร บันไดยาวกี่เมตร?`,
        `เรือแล่นไปทางทิศตะวันออก ${a} กม. แล้วเลี้ยวไปทางทิศเหนือ ${b} กม. เรืออยู่ห่างจากจุดเริ่มต้นเป็นเส้นตรงกี่กม.?`,
        `ว่าวลอยสูงจากพื้น ${b} เมตร คนถือเชือกยืนห่างจากจุดใต้ว่าวตามแนวราบ ${a} เมตร เชือกว่าวยาวเท่าใด (เส้นตรงจากมือถึงว่าว)?`
      ]);
      answer=c;explain=`√(${a}² + ${b}²) = ${c}`;diagram={type:"right-triangle",a,b};
    }
    return{text,answer,explain,type:"ตรีโกณมิติ — โจทย์ปัญหา",diagram};},
  Y(sub){const a=rng(2,8),n=rng(2,3),answer=a*n;
    const text=pickVariant_([
      `ระยะทาง s(t) = ${a}t^${n} เมตร (t คือเวลาเป็นวินาที) ความเร็วขณะเวลาใด ๆ มีสัมประสิทธิ์เท่าใด (ตัวเลขหน้าพจน์ t)?`,
      `ปริมาตรน้ำในถัง V(t) = ${a}t^${n} ลิตร (t คือเวลาเป็นนาที) อัตราการไหลเข้าขณะเวลาใด ๆ มีสัมประสิทธิ์เท่าใด (ตัวเลขหน้าพจน์ t)?`,
      `จำนวนแบคทีเรีย N(t) = ${a}t^${n} ตัว (t คือเวลาเป็นชั่วโมง) อัตราการเพิ่มขณะเวลาใด ๆ มีสัมประสิทธิ์เท่าใด (ตัวเลขหน้าพจน์ t)?`
    ]);
    return{text,answer,explain:`d/dt[${a}t^${n}] = ${a}×${n}·t^${n-1} สัมประสิทธิ์ = ${answer}`,type:"แคลคูลัส — โจทย์ปัญหา"};}
};
WORD_GENERATORS.Z=function(sub){
  const keys=Object.keys(WORD_GENERATORS).filter(k=>k!=="Z"),key=keys[rng(0,keys.length-1)],q=WORD_GENERATORS[key](sub);
  return{...q,type:`Mathematics Challenge (${q.type})`};
};

function makeQuestion(stage,sub){
  let q;
  if(HARD_GENERATORS[stage.id]){
    q=HARD_GENERATORS[stage.id](sub);
  }else{
    const scale=1+Math.floor((sub-1)/2),a=rng(2*scale,10*scale+sub),b=rng(2,8*scale+sub);let answer,text,explain;
    if(stage.id==="A"){
      if(rng(0,1)===0){answer=a+b;text=`${a} + ${b} = ?`;explain=`บวก ${a} กับ ${b} ได้ ${answer}`}
      else{const sum=a+b;answer=a;text=`? + ${b} = ${sum} จงหาจำนวนที่หายไป`;explain=`${sum} − ${b} = ${a}`}
    }
    else if(stage.id==="B"){
      if(rng(0,1)===0){answer=b;text=`${a+b} − ${a} = ?`;explain=`${a+b} ลบ ${a} เหลือ ${b}`}
      else{const total=a+b;answer=a;text=`${total} − ? = ${b} จงหาจำนวนที่หายไป`;explain=`${total} − ${b} = ${a}`}
    }
    else if(stage.id==="C"){
      if(rng(0,1)===0){answer=a*b;text=`${a} × ${b} = ?`;explain=`คูณ ${a} ด้วย ${b} ได้ ${answer}`}
      else{const product=a*b;answer=a;text=`? × ${b} = ${product} จงหาจำนวนที่หายไป`;explain=`${product} ÷ ${b} = ${a}`}
    }
    else if(stage.id==="D"){answer=a;text=`${a*b} ÷ ${b} = ?`;explain=`${a*b} หารด้วย ${b} ได้ ${a}`}
    else {answer=a*b+b;text=`${a} × ${b} + ${b} = ?`;explain=`คูณก่อน: ${a} × ${b} = ${a*b} แล้วบวก ${b} ได้ ${answer}`}
    const options=[String(answer)];
    while(options.length<4){const x=String(Number(answer)+rng(-10-scale,10+scale));if(!options.includes(x))options.push(x)}
    q={text,answer,explain,options:shuffle_(options),type:"เลือกคำตอบที่ถูกต้อง"};
  }
  q.answer=String(q.answer);
  q.topicKey=stage.id;
  return q;
}
// เลือกโหมดคำถามตามขั้นย่อย: 1–5 เลือกคำตอบ, 6–8 เติมคำตอบ, 9–10 โจทย์ปัญหา (เติมคำตอบ)
function pickMode_(sub){return sub>=9?"word":sub>=6?"fill":"choice"}
// สร้างโจทย์ทั้งชุดของด่านหนึ่ง — สำหรับ Stage Z (Mathematics Challenge) จะสับลำดับหัวข้อ
// แล้วแจกแบบไม่ซ้ำก่อน เพื่อให้ชุด 10 ข้อครอบคลุมหลายหัวข้อจริง ๆ แทนการสุ่มอิสระที่อาจซ้ำหัวข้อเดิมได้
function makeQuestionBatch(stage,sub,count){
  const mode=pickMode_(sub);
  if(stage.id==="Z"){
    const pool=mode==="word"?WORD_GENERATORS:HARD_GENERATORS;
    const topics=shuffle_(Object.keys(pool).filter(k=>k!=="Z"));
    return Array.from({length:count},(_,i)=>{
      const topicKey=topics[i%topics.length],q=pool[topicKey](sub);
      q.type=`Mathematics Challenge (${q.type})`;q.answer=String(q.answer);q.mode=mode;q.topicKey=topicKey;
      return q;
    });
  }
  return Array.from({length:count},()=>{
    const q=(mode==="word"&&WORD_GENERATORS[stage.id])?WORD_GENERATORS[stage.id](sub):makeQuestion(stage,sub);
    q.answer=String(q.answer);q.mode=mode;q.topicKey=stage.id;
    return q;
  });
}

/* ---- V2: เติมตัวเลือกให้โจทย์ที่ไม่มี (โจทย์ปัญหา/เติมคำตอบ) เพื่อใช้ในฉากต่อสู้แบบเลือกตอบ ---- */
function decPlaces_(s){const i=s.indexOf(".");return i<0?0:s.length-i-1}
function ensureOptions_(q){
  const ans=String(q.answer);
  if(Array.isArray(q.options)&&q.options.length===4&&q.options.includes(ans)&&new Set(q.options).size===4)return q;
  const opts=new Set([ans]);let guard=0;
  const fm=ans.match(/^(-?\d+)\/(\d+)$/);
  if(fm){
    const n=Number(fm[1]),d=Number(fm[2]);
    const pool=[[n+1,d],[n-1,d],[n,d+1],[n+d,d],[d,n],[n*2,d],[n+2,d],[n,d*2]];
    shuffle_(pool).forEach(([a,b])=>{if(opts.size<4&&a!==0&&b>0){const f=fracStr_(a,b);if(f!==ans)opts.add(f)}});
  }else{
    const v=Number(ans),dp=decPlaces_(ans),step=dp?Math.pow(10,-dp):1,mag=Math.abs(v);
    const spread=Math.max(step*3,dp?mag*0.15:Math.round(mag*0.12));
    const nonNeg=v>=0;
    while(opts.size<4&&guard++<200){
      let c=v+(rng(0,1)?1:-1)*(guard<60?rng(1,4)*step:Math.max(step,Math.round(Math.random()*spread/step)*step));
      if(guard%7===0&&!dp&&v!==0)c=v+(rng(0,1)?10:-10);
      if(nonNeg&&c<0)continue;
      const cs=dp?c.toFixed(dp).replace(/\.?0+$/,""):String(Math.round(c));
      if(cs!==ans)opts.add(cs);
    }
  }
  let k=1;while(opts.size<4)opts.add(String(Number(ans)+k++*7));
  q.options=shuffle_([...opts]);
  return q;
}
// สร้างโจทย์ 1 ข้อสำหรับฉากต่อสู้: stageId = A–Z, sub = ความยาก 1–10
function battleQuestion_(stageId,sub){
  sub=Math.max(1,Math.min(10,sub));
  const q=makeQuestionBatch({id:stageId},sub,1)[0];
  if(!q.topicKey)q.topicKey=stageId;
  return ensureOptions_(q);
}
