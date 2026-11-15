// ทดสอบในเบราว์เซอร์ (วางใน console หรือรันผ่าน javascript_tool หลังเปิดเกม):
// (โหลดเซฟที่ยืนทับบอสพอดีจะไม่เข้าฉากจนกว่าจะเดินออก)
// ชนบอส → ถอยออกจากฉากต่อสู้ → ต้องไม่เข้าฉากบอสซ้ำทันที ต้องเดินออกจากตัวบอสก่อน แล้วชนใหม่ถึงจะเข้าอีก
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const skipDlg = async () => { let n = 0; while (!$("dialog").classList.contains("hidden") && n < 200) { advanceDialog(); advanceDialog(); await sleep(40); n++; } };
  let T = performance.now();
  const step = n => { for (let i = 0; i < n && X; i++) { T += 16; updatePlayer_(T, 16); updateCombat_(T, 16); updateNpcs_(T); } };
  const put = (x, y) => { X.p.fx = x; X.p.fy = y; const [tx, ty] = footTile_(x, y); X.p.x = tx; X.p.y = ty; };
  if (!save) { continueLast(); await sleep(600); await skipDlg(); }
  enterExplore(); await sleep(800); await skipDlg();
  save.explore.bossDone = false; loadMap_("field", 100, 11, "right"); X.busy = false; X.mons = [];
  const b = X.m.boss; let calls = 0; const orig = startBossBattle_;
  window.startBossBattle_ = function () { calls++; return orig.apply(this, arguments); };
  put(b.x - 3, b.y); step(2);              // เดินเข้าหาบอสจากข้างนอก (ไม่ใช่โหลดมาทับตัวบอส)
  put(b.x, b.y); X.invulnUntil = 0; step(2); await sleep(100); await skipDlg(); await sleep(2500); await skipDlg();
  const first = calls;
  const oc = window.confirm; window.confirm = () => true; fleeBattle(); window.confirm = oc; await sleep(800); await skipDlg();
  T = performance.now(); step(30); await sleep(100);
  const afterFlee = calls;                    // ต้องยังเป็น 1
  await skipDlg(); if ($("screen-battle").classList.contains("active")) { window.confirm = () => true; fleeBattle(); window.confirm = oc; await sleep(800); await skipDlg(); }
  put(b.x - 3, b.y); T = performance.now(); step(5); put(b.x, b.y); X.invulnUntil = 0; step(2); await sleep(100);
  const rearmed = calls;                      // เดินออกแล้วชนใหม่ → 2
  window.startBossBattle_ = orig; await skipDlg();
  const result = { first, afterFlee, rearmed, pass: first === 1 && afterFlee === 1 && rearmed === 2 };
  console.log("boss-flee", JSON.stringify(result)); return result;
})();
