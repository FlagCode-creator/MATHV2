/* Math Quest V2 — ตัวช่วยทั่วไป (โหลดก่อนไฟล์อื่นทั้งหมด) */
const rng=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pickOne=arr=>arr[rng(0,arr.length-1)];
function toast(text){
  const el=$("toast");if(!el)return;
  el.textContent=text;el.classList.add("show");
  clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove("show"),2600);
}
