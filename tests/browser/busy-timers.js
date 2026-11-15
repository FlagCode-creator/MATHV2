// ทดสอบในเบราว์เซอร์: ระหว่างมีหน้าต่างเปิด (X.busy) ตัวจับเวลาของการต่อสู้ต้องหยุดเดิน
// - พลังคณิต / เวลารอโจทย์จู่โจม / เหรียญบนพื้น ไม่ถูกกินเวลาระหว่างเปิดหน้าต่าง 20 วิ
// - เหรียญที่หมดเวลา → ได้เงินอยู่ดี (ไม่หายไปเฉย ๆ)
// - ปิดโจทย์จับเวลาแล้ว มอนที่ยืนติดตัวต้องไม่ตีทันที (อมตะอย่างน้อย 1 วิ) — "ตอบผิดไม่เสีย HP"
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const skipDlg = async () => { let n = 0; while (!$("dialog").classList.contains("hidden") && n < 200) { advanceDialog(); advanceDialog(); await sleep(40); n++; } };
  let T;
  const step = n => { for (let i = 0; i < n && X; i++) { T += 16; updatePlayer_(T, 16); updateCombat_(T, 16); updateNpcs_(T); } };
  if (!save) { continueLast(); await sleep(600); await skipDlg(); }
  enterExplore(); await sleep(800); await skipDlg();
  loadMap_("field", 8, 12, "right"); X.busy = false; X.mons = []; X.coins = []; T = performance.now(); step(1);
  const [px, py] = footPx_(X.p.fx, X.p.fy);
  X.powerUntil = T + 15000; X.nextAmbushAt = T + 30000;
  X.coins.push({ wx: px + 200, wy: py, vx: 0, vy: 0, gold: 5, t0: T });           // ไกลเกินระยะดูด
  X.busy = true; step(1250); X.busy = false; step(1);                              // เปิดหน้าต่าง ~20 วิ
  const powerLeft = Math.round((X.powerUntil - T) / 1000), ambushIn = Math.round((X.nextAmbushAt - T) / 1000), coinKept = X.coins.length === 1;
  // เหรียญหมดเวลาจริง (20 วิ ไม่มีหน้าต่าง) → เงินเข้า
  const g0 = save.gold; step(1300); const coinCredited = X.coins.length === 0 && save.gold === g0 + 5;
  // ตอบผิดในโจทย์จับเวลา แล้วมอนยืนติดตัว
  X.mons = []; const e = save.explore; e.hp = effMaxHp(); const hp0 = e.hp;
  const m = spawnTestMon_(1); m.fx = X.p.fx; m.fy = X.p.fy; m.pauseUntil = 0; X.invulnUntil = 0;
  X.nextAmbushAt = Infinity; X.powerUntil = 0;
  await askTimed_({ title: "t", text: "1+1=?", answer: 2, seconds: 0.2 });          // หมดเวลา → ผิด (โชว์เฉลย 2 วิ)
  T = performance.now(); step(1); const noHitAfterModal = e.hp === hp0;
  X.mons = [];
  const result = { powerLeft, ambushIn, coinKept, coinCredited, noHitAfterModal,
    pass: powerLeft >= 14 && ambushIn >= 29 && coinKept && coinCredited && noHitAfterModal };
  console.log("busy-timers", JSON.stringify(result)); return result;
})();
