/* Math Quest V2 — เปลี่ยนอีโมจิในหน้าจอเป็นไอคอนพิกเซล (assets/icons)
   ไอคอนส่วนใหญ่มาจาก "Raven Fantasy Icons" (เวอร์ชันฟรี) โดย Clockwork Raven Studios — ดู assets/icons/CREDITS.md
   ทำงานอัตโนมัติกับทุกข้อความที่แสดงบนจอ (ใช้ MutationObserver) · ใส่ data-noicon เพื่อยกเว้น */
const ICON_OF={"🪙":"coin","🧪":"potion","🛡️":"shield","🔮":"orb","⏳":"hourglass","⏱️":"hourglass","💡":"bulb","⭐":"star",
  "❤️":"heart","⚔️":"swords","💪":"muscle","🔥":"flame","⚡":"bolt","💥":"burst","🧱":"armor","🔰":"shieldplus","💚":"heartgreen",
  "👁️":"eye","📖":"book","💰":"moneybag","🗝️":"key","✨":"sparkle","🏆":"trophy","💀":"skull","🎁":"chest","📜":"scroll"};
const ICON_BASE_={};Object.keys(ICON_OF).forEach(k=>{ICON_BASE_[k.replace(/\uFE0F/g,"")]=ICON_OF[k]});
const ICON_RE_=new RegExp("("+Object.keys(ICON_BASE_).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")\uFE0F?","gu");
const ICON_SKIP_=new Set(["SCRIPT","STYLE","TEXTAREA","INPUT","OPTION","SELECT","TITLE","CANVAS"]);
function iconImg_(name,alt){return `<img class="ico" src="assets/icons/${name}.png" alt="${alt||""}" draggable="false">`}
function iconize_(root,force){
  if(!root)return;
  const nodes=[];
  if(root.nodeType===3)nodes.push(root);
  else{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))nodes.push(n)}
  nodes.forEach(t=>{
    const p=t.parentNode;if(!p||ICON_SKIP_.has(p.nodeName))return;
    if(!force&&p.closest&&p.closest("[data-noicon],#dialog-line"))return;
    const s=t.nodeValue;ICON_RE_.lastIndex=0;if(!s||!ICON_RE_.test(s))return;
    ICON_RE_.lastIndex=0;const frag=document.createDocumentFragment();let last=0,m;
    while((m=ICON_RE_.exec(s))){if(m.index>last)frag.appendChild(document.createTextNode(s.slice(last,m.index)));
      const tpl=document.createElement("template");tpl.innerHTML=iconImg_(ICON_BASE_[m[1]],m[0]);frag.appendChild(tpl.content.firstChild);last=m.index+m[0].length}
    if(last<s.length)frag.appendChild(document.createTextNode(s.slice(last)));
    p.replaceChild(frag,t);
  });
}
(function(){
  const start=()=>{iconize_(document.body);
    new MutationObserver(list=>{list.forEach(m=>{if(m.type==="characterData")iconize_(m.target);else m.addedNodes.forEach(n=>{if(n.nodeType===1||n.nodeType===3)iconize_(n)})})})
      .observe(document.body,{childList:true,subtree:true,characterData:true})};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
