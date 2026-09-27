/* Math Quest V2 — บันทึกความก้าวหน้า (localStorage แยกตามผู้เล่น)
   ใช้ key ขึ้นต้น mq2_ ทั้งหมด จึงไม่ชนกับข้อมูลของ V1 (mc_...) */
const SAVE_VERSION=1;
const LAST_PLAYER_KEY="mq2_last_player";

function saveKey_(playerId){return "mq2_save_"+playerId}
function newSave_(playerId,name,avatar,studentId){
  return {
    version:SAVE_VERSION,playerId,name,avatar:avatar||AVATARS[0],studentId:studentId||null,
    level:1,xp:0,gold:60,
    items:{potion:2,shield:0,fifty:1,time:1},
    stages:{},   // {A:{stars:3,clears:2}}
    bosses:{},   // {w1:{stars:2,clears:1}}
    stats:{battles:0,wins:0,losses:0,correct:0,wrong:0,crits:0,bestCombo:0,bossKills:0},
    introSeen:false,finalCleared:false,createdAt:Date.now()
  };
}
function loadSave_(playerId){
  try{
    const raw=localStorage.getItem(saveKey_(playerId));
    if(!raw)return null;
    const s=JSON.parse(raw);
    // เติมฟิลด์ที่อาจขาด (กันเซฟเก่าพังเมื่อเพิ่มฟีเจอร์)
    const base=newSave_(playerId,s.name,s.avatar,s.studentId);
    return {...base,...s,items:{...base.items,...(s.items||{})},stats:{...base.stats,...(s.stats||{})},stages:s.stages||{},bosses:s.bosses||{}};
  }catch(e){return null}
}
function writeSave_(save){
  try{localStorage.setItem(saveKey_(save.playerId),JSON.stringify(save));localStorage.setItem(LAST_PLAYER_KEY,save.playerId)}catch(e){}
}
function deleteSave_(playerId){
  try{localStorage.removeItem(saveKey_(playerId));if(localStorage.getItem(LAST_PLAYER_KEY)===playerId)localStorage.removeItem(LAST_PLAYER_KEY)}catch(e){}
}
function listSaves_(){
  const out=[];
  try{
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k&&k.indexOf("mq2_save_")===0){const s=loadSave_(k.slice(9));if(s)out.push(s)}
    }
  }catch(e){}
  return out.sort((a,b)=>(b.lastPlayed||b.createdAt||0)-(a.lastPlayed||a.createdAt||0));
}

// ---- ความก้าวหน้า: ปลดล็อกด่าน/บอส ----
function stageCleared_(save,id){return !!(save.stages[id]&&save.stages[id].clears>0)}
function bossCleared_(save,wi){const b=save.bosses[WORLDS[wi].id];return !!(b&&b.clears>0)}
function worldUnlocked_(save,wi){return wi===0||bossCleared_(save,wi-1)}
function stageUnlocked_(save,id){
  const wi=worldOfStage(id);
  if(!worldUnlocked_(save,wi))return false;
  const list=WORLDS[wi].stages,idx=list.indexOf(id);
  return idx===0||stageCleared_(save,list[idx-1]);
}
function bossUnlocked_(save,wi){return worldUnlocked_(save,wi)&&WORLDS[wi].stages.every(id=>stageCleared_(save,id))}
function totalStars_(save){
  let n=0;Object.values(save.stages).forEach(s=>n+=s.stars||0);Object.values(save.bosses).forEach(s=>n+=s.stars||0);return n;
}
const MAX_STARS=(26+WORLDS.length)*3;
