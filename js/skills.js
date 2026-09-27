/* Math Quest V2 — ต้นไม้ทักษะทางคณิตศาสตร์
   เลเวลอัป 1 ครั้ง = แต้มทักษะ 1 แต้ม · 3 สาย สายละ 4 ขั้น ต้องอัปตามลำดับ */

const SKILL_TREE=[
  {id:"atk",name:"สายโจมตี",icon:"⚔️",color:"#f87171",nodes:[
    {name:"พลังตัวเลข",icon:"💪",desc:"พลังโจมตี +10%"},
    {name:"คอมโบทวีคูณ",icon:"🔥",desc:"โบนัสคอมโบเพิ่มจาก +10% เป็น +15% ต่อข้อ"},
    {name:"คริติคอลไว",icon:"⚡",desc:"ได้คริติคอลเมื่อตอบภายในครึ่งแรกของเวลา (เดิม 35%)"},
    {name:"สมการพิฆาต",icon:"💥",desc:"ตอบถูกครบ 5 ข้อติดกันเมื่อไร ตีแรง ×2"}]},
  {id:"def",name:"สายป้องกัน",icon:"🛡️",color:"#60a5fa",nodes:[
    {name:"ร่างกายแข็งแรง",icon:"❤️",desc:"HP สูงสุด +15%"},
    {name:"เกราะเศษส่วน",icon:"🧱",desc:"ดาเมจที่โดนลดลง 20%"},
    {name:"โล่อัตโนมัติ",icon:"🔰",desc:"เริ่มทุกการต่อสู้พร้อมโล่ กันการโจมตีครั้งแรก"},
    {name:"ฟื้นตัว",icon:"💚",desc:"ชนะแล้วฟื้น HP 25% (โหมดผจญภัย)"}]},
  {id:"wis",name:"สายปัญญา",icon:"💡",color:"#fbbf24",nodes:[
    {name:"สมาธิ",icon:"⏱️",desc:"เวลาตอบเพิ่ม +4 วินาทีทุกข้อ"},
    {name:"สายตาคม",icon:"👁️",desc:"ตัดตัวเลือกผิด 2 ข้อได้ฟรี 1 ครั้งต่อการต่อสู้"},
    {name:"ครูช่วยสอน",icon:"📖",desc:"ใช้คำใบ้แล้วตีได้แรงเท่าเดิม"},
    {name:"นักสะสม",icon:"💰",desc:"ได้ EXP และเหรียญเพิ่ม 25%"}]}
];

function skillsOf_(s){s=s||save;if(!s.skills)s.skills={atk:0,def:0,wis:0};return s.skills}
function skillLv(branch,s){return skillsOf_(s)[branch]||0}
function skillPointsTotal(s){s=s||save;return Math.max(0,s.level-1)}
function skillPointsFree(s){const k=skillsOf_(s);return skillPointsTotal(s)-(k.atk+k.def+k.wis)}

// ค่าพลังจริงหลังรวมทักษะ
function effMaxHp(s){s=s||save;return Math.round(playerMaxHp(s.level)*(skillLv("def",s)>=1?1.15:1))}
function effAtk(s){s=s||save;return Math.round(playerAtk(s.level)*(skillLv("atk",s)>=1?1.1:1))}
const comboStep=()=>skillLv("atk")>=2?0.15:0.1;
const critThreshold=()=>skillLv("atk")>=3?0.5:0.65;        // ต้องเหลือเวลา ≥ สัดส่วนนี้จึงคริติคอล
const damageTakenMul=()=>skillLv("def")>=2?0.8:1;
const bonusTime=()=>skillLv("wis")>=1?4:0;
const rewardMul=()=>skillLv("wis")>=4?1.25:1;

/* ---- หน้าจอต้นไม้ทักษะ ---- */
function openSkills(from){
  SFX.click();
  navBack=from||"map";
  renderSkills_();showScreen("skills");
}
function renderSkills_(){
  const free=skillPointsFree();
  $("skill-points").textContent=free;
  $("skill-tree").innerHTML=SKILL_TREE.map(br=>{
    const lv=skillLv(br.id);
    return `<div class="skill-branch" style="--sc:${br.color}"><h3>${br.icon} ${br.name}</h3>${br.nodes.map((n,i)=>{
      const learned=i<lv,next=i===lv,can=next&&free>0;
      return `<button type="button" class="skill-node ${learned?"learned":can?"can":"locked"}" ${can?`onclick="learnSkill('${br.id}')"`:"disabled"}>
        <span class="sk-ic">${learned||next?n.icon:"🔒"}</span><b>${n.name}</b><small>${n.desc}</small>${learned?`<span class="sk-ok">✓</span>`:""}</button>`;
    }).join(`<span class="skill-link"></span>`)}</div>`;
  }).join("");
}
function learnSkill(branch){
  if(skillPointsFree()<=0||skillLv(branch)>=4)return;
  const br=SKILL_TREE.find(b=>b.id===branch),node=br.nodes[skillLv(branch)];
  skillsOf_()[branch]++;persist();
  SFX.levelUp();toast(`เรียนรู้ทักษะ ${node.icon} ${node.name} แล้ว!`);
  renderSkills_();
}
