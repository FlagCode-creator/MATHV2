// ทดสอบในเบราว์เซอร์: คีย์บอร์ดต้องใช้ได้แม้เปลี่ยนเป็นภาษาไทย (ดูจากปุ่มจริง ev.code ไม่ใช่ตัวอักษร ev.key)
// - K (แป้นไทยพิมพ์ "า") เปิดสกิล · พิมพ์ตัวเลข + Enter ตอบโจทย์จับเวลาได้
// - D (แป้นไทย "ก") เดินขวา
// - เปิดบทสนทนาระหว่างกดฟันค้าง → ปิดแล้วต้องไม่ฟันต่อเอง
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const skipDlg = async () => { let n = 0; while (!$("dialog").classList.contains("hidden") && n < 200) { advanceDialog(); advanceDialog(); await sleep(40); n++; } };
  const key = (type, code, k) => document.dispatchEvent(new KeyboardEvent(type, { code, key: k, bubbles: true }));
  let T;
  const step = n => { for (let i = 0; i < n && X; i++) { T += 16; updatePlayer_(T, 16); updateCombat_(T, 16); updateNpcs_(T); } };
  if (!save) { continueLast(); await sleep(600); await skipDlg(); }
  enterExplore(); await sleep(800); await skipDlg();
  loadMap_("field", 8, 12, "right"); X.busy = false; X.mons = []; X.skillReadyAt = 0; X.nextAmbushAt = Infinity; T = performance.now(); step(1);
  const m = spawnTestMon_(1); m.fx = X.p.fx + 2; m.fy = X.p.fy; m.pauseUntil = 1e15; X.invulnUntil = 1e15;
  let lastQ = null; const mq = makeQuestion; window.makeQuestion = function () { lastQ = mq.apply(this, arguments); return lastQ; };
  key("keydown", "KeyK", "า"); key("keyup", "KeyK", "า"); await sleep(100);
  const skillOpen = !$("puzzle-modal").classList.contains("hidden");
  let answered = false;
  if (skillOpen) {
    for (const ch of String(lastQ.answer)) { key("keydown", "Digit" + ch, ch); }
    key("keydown", "Enter", "Enter"); await sleep(400);
    answered = $("puzzle-modal").classList.contains("hidden") && X.skillStreak >= 1;
  }
  window.makeQuestion = mq;
  // เดินด้วย D ในโหมดภาษาไทย
  const x0 = X.p.fx; key("keydown", "KeyD", "ก"); T = performance.now(); step(20); key("keyup", "KeyD", "ก"); const walked = X.p.fx > x0 + 0.5;
  // กดฟันค้าง แล้วมีบทสนทนาแทรก
  X.mons = []; X.attackHeld = true; const p = exSay_([{ mood: "happy", text: "ทดสอบ" }]); await sleep(50); await skipDlg(); await p;
  const notStuck = !X.attackHeld;
  const result = { skillOpen, answered, walked, notStuck, pass: skillOpen && answered && walked && notStuck };
  console.log("keyboard", JSON.stringify(result)); return result;
})();
