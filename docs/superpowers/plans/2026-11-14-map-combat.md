# Real-time Map Combat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace "touch a monster → quiz screen" in explore mode with free pixel movement, real-time sword combat, armored monsters, a math-question skill and random ambush questions.

**Architecture:** Positions stay in tile units but become continuous floats (`fx`,`fy`; foot point = `fx*TS+8`, `fy*TS+14`; collision boxes sit on the foot point: `[footX-w/2, footY-h, footX+w/2, footY]`), so camera/drawing code keeps working; `x`,`y` become the derived foot tile. Pure, DOM-free rules (collision, arcs, tiers, damage, rewards) live in a new `js/combat-core.js` covered by `node --test`; game wiring (monster AI, attacks, skill modal, HUD) lives in a new `js/combat.js`; `js/explore.js` only changes where it was grid-bound.

**Tech Stack:** Plain HTML/CSS/JS (no build), canvas 2D, Node 24 `node:test` + `node:vm` for unit tests, browser preview (`.claude/launch.json` → `mathv2`, port 8766) for integration checks.

**Spec:** `docs/superpowers/specs/2026-11-14-map-combat-design.md`

## Global Constraints
- No build step, no npm dependencies. Every edited `.js`/`.css` gets its `?v=` bumped in `index.html`.
- New scripts load after `js/explore.js` and before `js/ambient.js`: `js/combat-core.js?v=1`, then `js/combat.js?v=1`.
- New image files: only what is used; credit lines in `assets/packs/CREDITS.md` already cover Soldier (Tiny RPG 01) and effects.
- Old saves must load: `save.explore.x/y` stay tile ints; new fields (`px`,`py`,`armorKills`) default when missing.
- Boss contact still calls `startBossBattle_()`; world-map stage battles unchanged.
- Wrong answers / ambush timeouts never cost HP.
- UI text is Thai.
- Numbers from the spec: sword = `ceil(effAtk()*0.2)`; skill = sword×5 (+10% per consecutive correct skill, max +50%); power buff = sword×2 for 15 s; HP tiers 1/2/3/4 = 6/8/10/12 sword hits; contact damage = stage atk×0.5×`damageTakenMul()`; player invulnerable 1 s after a hit; monster pauses 0.6 s after contact; respawn 25 s, ≥5 tiles from player; chase starts ≤5 tiles, gives up >8 tiles or outside zone; skill range 4 tiles, skill blast radius 3 tiles; skill timer 15 s, ambush timer 10 s (+`bonusTime()` each); skill cooldown 2 s after correct, 5 s after wrong; ambush every 45–90 s while a monster is chasing or within 5 tiles.

## Review Focus
1. **Diagonal into a 1-tile corridor / door gap on mobile analog stick** → the player slides in instead of sticking (corner nudge). Test: `moveBox_ nudges into a 1-tile gap` (Task 1).
2. **Skill question with a non-numeric answer** (e.g. fraction topics if zones change later) → answer buttons appear instead of the number pad. Test: browser check over stages A–E × sub 1–5 (Task 5).
3. **Modal/dialog open while monsters chase** → monsters, contact damage and ambush timers freeze while `X.busy`. Test: browser check "monster does not move during skill modal" (Task 5).
4. **Old save / save mid-field** → loads at tile centre, no NaN positions, kills counters intact. Test: browser check with a save lacking `px/py/armorKills` (Task 2, Task 6).
5. **Several monsters touching in one frame / boss touched while invulnerable** → only one hit per 1 s window; boss battle starts once. Test: `canBeHit_` assertions (Task 3).

---

### Task 1: Pure combat rules + test harness

**Files:**
- Create: `js/combat-core.js`
- Create: `tests/load.mjs` (loads browser scripts into a `vm` context with stub globals `TS=16`)
- Create: `tests/combat-core.test.mjs`
- Modify: `index.html` (add `<script src="js/combat-core.js?v=1">` after explore.js)

**Interfaces:**
- Produces (all globals, no DOM access):
  - `FOOT_W=10, FOOT_H=6, MON_W=12, MON_H=8` (px)
  - `footPx_(fx, fy) -> [px, py]` — foot point in pixels (`fx*TS+8`, `fy*TS+14`)
  - `footTile_(fx, fy) -> [tx, ty]` — tile under foot point
  - `moveBox_(fx, fy, dx, dy, w, h, isBlocked) -> [fx, fy]` — dx/dy in tiles; axis-separated; `isBlocked(tx,ty)->bool`; when blocked on one axis and the box overlaps a free tile by ≤4 px on the other axis, nudge toward it by up to the move length
  - `facingTile_(fx, fy, dir, reachPx=10) -> [tx, ty]`
  - `inArc_(ox, oy, dir, tx, ty, radiusPx) -> bool` — pixel coords; true if within radius and in the front half-plane of `dir` ("left"/"right"/"up"/"down")
  - `tierFor_(zoneId, index, night) -> 1|2|3|4` — night→4; zone A→1; B,C→2; D,E→3
  - `armorFor_(tier, index) -> 0|1|2` — tier1→0; tier2→1 when `index%3===0` else 0; tier3→1; tier4→2
  - `questionSubFor_(tier, kills) -> int` — ranges: t1 [1,2], t2 [2,3], t3 [3,4], t4 [4,5]; `min(hi, lo + floor(kills/3))`
  - `swordDmg_(atk) -> int` = `max(1, ceil(atk*0.2))`
  - `skillDmg_(atk, streak) -> int` = `round(swordDmg_(atk)*5*(1+min(streak,5)*0.1))`
  - `monHp_(tier, atk) -> int` = `swordDmg_(atk) * [6,8,10,12][tier-1]`
  - `contactDmg_(stageAtk, takenMul) -> int` = `max(1, round(stageAtk*0.5*takenMul))`
  - `fieldReward_(gold, xp, strong, mul) -> {gold, xp}` — base `gold*0.5+4`, `xp*0.8`; strong ×2.5 gold, ×2 xp; then ×mul, rounded
  - `nextAmbushDelay_(r) -> ms` = `45000 + r*45000`
  - `pickAmbushReward_(r) -> "heal"|"power"|"gold"` — r<1/3 heal, <2/3 power, else gold
  - `monStateNext_(state, distTiles, inZone) -> "wander"|"chase"|"return"` — wander→chase when dist≤5 and inZone; chase→return when dist>8 or !inZone; return→wander when inZone and dist>5

- [ ] **Step 1: Write the harness and failing tests**

`tests/load.mjs` exports `load(...files)` returning a vm context with `TS:16`, `Math`, `console`, after running each file. Tests (one `test()` each):
```js
const c = load("js/combat-core.js");
assert.deepEqual(c.footTile_(3, 4), [3, 4]);
assert.deepEqual(c.footTile_(3.49, 4), [3, 4]);           // foot = (63.8, 78) → tile (3,4)
assert.deepEqual(c.footPx_(2, 1), [40, 30]);
// moveBox_: wall at tile (5,4)
const wall = (x, y) => x === 5 && y === 4;
const [wx, wy] = c.moveBox_(4, 4, 0.5, 0, 10, 6, wall);
assert.ok(Math.abs(wx - 4.1875) < 0.01 && wy === 4);        // box right edge stops at x=80 (tile 5)
// nudges into a 1-tile gap: walls at (5,3) and (5,5), free (5,4); box top pokes 1.6 px into row 3
const gap = (x, y) => x === 5 && y !== 4;
const [nx, ny] = c.moveBox_(4.0, 3.4, 0.3, 0, 10, 6, gap);
assert.ok(ny > 3.4 && nx > 4.0);                            // slid down toward the gap and moved right
assert.equal(c.inArc_(100, 100, "right", 115, 100, 22), true);
assert.equal(c.inArc_(100, 100, "right", 85, 100, 22), false);
assert.equal(c.inArc_(100, 100, "up", 100, 80, 22), true);
assert.deepEqual([c.tierFor_("A",0,false), c.tierFor_("C",1,false), c.tierFor_("E",2,false), c.tierFor_("B",0,true)], [1,2,3,4]);
assert.deepEqual([c.armorFor_(1,0), c.armorFor_(2,0), c.armorFor_(2,1), c.armorFor_(3,4), c.armorFor_(4,0)], [0,1,0,1,2]);
assert.deepEqual([c.questionSubFor_(1,0), c.questionSubFor_(1,9), c.questionSubFor_(4,3)], [1,2,5]);
assert.equal(c.swordDmg_(22), 5); assert.equal(c.skillDmg_(22, 0), 25); assert.equal(c.skillDmg_(22, 9), 38);
assert.equal(c.monHp_(3, 22), 50);
assert.equal(c.contactDmg_(14, 0.85), 6);
assert.deepEqual(c.fieldReward_(20, 30, false, 1), {gold:14, xp:24});
assert.deepEqual(c.fieldReward_(20, 30, true, 1.25), {gold:44, xp:60});
assert.equal(c.nextAmbushDelay_(0), 45000); assert.equal(c.nextAmbushDelay_(1), 90000);
assert.deepEqual([0.1,0.5,0.9].map(c.pickAmbushReward_), ["heal","power","gold"]);
assert.equal(c.monStateNext_("wander", 4, true), "chase");
assert.equal(c.monStateNext_("chase", 9, true), "return");
assert.equal(c.monStateNext_("chase", 3, false), "return");
assert.equal(c.monStateNext_("return", 7, true), "wander");
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `node --test tests/`
Expected: FAIL (`js/combat-core.js` missing / functions undefined)

- [ ] **Step 3: Implement `js/combat-core.js` with the signatures above** (declare with `function`/`const` at top level so they become vm-context and window globals; no references to `X`, `save`, DOM).

- [ ] **Step 4: Run tests, verify they pass**

Run: `node --test tests/`
Expected: all tests pass, 0 failures

- [ ] **Step 5: Add the script tag, load the game in preview, confirm no console errors; commit**

```bash
git add js/combat-core.js tests/ index.html
git commit -m "Add pure combat rules with node tests"
```

---

### Task 2: Free pixel movement (game still uses the old quiz battles)

**Files:**
- Modify: `js/explore.js` — `loadMap_` (player state), `updatePlayer_`, remove `tryStep_` grid stepping for the player (keep the function only if still referenced), `interact_` (target tile), `bindExploreControls_` + `bindJoystick_` (analog input), `arrived_`/`checkZone_` trigger on tile change, `updateNpcs_` (don't step into the player's box), `resumeExplore`/save writes
- Modify: `js/critters.js` — `drawHeroSprite_` treats `ent.moving` as walking
- Modify: `index.html` (bump explore.js, critters.js)

**Interfaces:**
- Consumes: `moveBox_`, `footTile_`, `facingTile_`, `FOOT_W`, `FOOT_H` (Task 1)
- Produces:
  - `X.mv = {x, y}` — input vector, components in [-1,1], set by keyboard/joystick; `X.held` is no longer used for movement
  - `X.p` keeps `fx, fy` (continuous), `x, y` (foot tile, updated every frame), `dir` (last 4-way facing), `moving` (bool), `t` fixed at `1` (so existing `p.t<1` guards stay false)
  - `PLAYER_SPEED = 5.5` tiles/s
  - `playerTileChanged_()` — called when `p.x/p.y` changes; runs the old `arrived_` logic (save `e.x/e.y`, warps, `checkZone_`)
  - `tryDoorPush_(now)` — pushing "up" against a door tile for ≥150 ms calls `enterDoor_(door)`
  - Monster contact (temporary until Task 3): when the player's foot box overlaps a monster's tile box and `now>X.invulnUntil`, call `startFieldBattle_(mon)`; boss overlap calls `startBossBattle_()`

- [ ] **Step 1: Implement analog input**: keyboard keeps a `Set` of held direction keys → `X.mv` (diagonals normalised by √2); joystick sets `X.mv = {dx/r, dy/r}` (dead zone 0.28·r, clamped to length 1); release clears.
- [ ] **Step 2: Implement `updatePlayer_(now, dt)`**: if `!X.busy && |mv|>0` move by `mv*PLAYER_SPEED*dt/1000` via `moveBox_` with `isBlocked = (x,y)=>blocked_(x,y)||!!npcAt_(x,y)`; set `dir` from the dominant axis, `moving`; update `x,y` via `footTile_`; call `playerTileChanged_()` on change; dust every ~0.3 s while moving.
- [ ] **Step 3: `interact_` targets `facingTile_(p.fx,p.fy,p.dir)` instead of `p.x+dx`**, falling back to the foot tile; drop the `X.p.t<1` early return's meaning (keep it, it is always false). `loadMap_` places the player at tile centre (`fx=x`, `fy=y`), restoring `e.px/e.py` only if both are finite and not blocked. Save `e.px/e.py` with `e.x/e.y` in `playerTileChanged_` and on `persist` points already used.
- [ ] **Step 4: Bump versions; browser-verify (preview `mathv2`)** — scripted via `javascript_tool` + screenshots:
  - walk all four directions and diagonals in the village; slide along walls; go through the gap between the fountain plaza and paths without sticking
  - enter and leave each house door; walk onto each warp (village↔field)
  - talk to Kru Flag and two other NPCs; read a sign; inspect a tablet; open a chest puzzle; water a farm plot
  - in the field, touching a monster still opens the quiz battle; returning resumes in place
  - load a save whose `explore` has no `px/py` → spawns at tile centre; console shows no errors
- [ ] **Step 5: Commit** `git commit -m "Free pixel movement in explore mode"`

---

### Task 3: Monsters move freely, chase, and hurt on contact

**Files:**
- Create: `js/combat.js` (map combat runtime)
- Modify: `js/explore.js` — `loadMap_` monster records, `exLoop_` (call `updateCombat_(now, dt)` instead of `updateMonsters_`), remove the Task-2 temporary monster→`startFieldBattle_` contact, HP HUD refresh
- Modify: `js/critters.js` — `drawTinyMon_` uses `m.anim` ("idle"|"walk"|"hurt"|"death") when set, white flash when `m.flashUntil>now`
- Modify: `index.html` (add combat.js; bump explore.js, critters.js)

**Interfaces:**
- Consumes: `moveBox_`, `footTile_`, `monStateNext_`, `contactDmg_`, `tierFor_`, `armorFor_`, `monHp_`, `MON_W`, `MON_H` (Task 1); `monsterStats(stage)`, `effAtk()`, `damageTakenMul()`, `inZone_`, `blocked_`, `NIGHT_STATE`
- Produces:
  - Monster record fields (in addition to existing `id, stage, zone, tiny, hue, night`): `fx, fy` (continuous), `x, y` (foot tile), `tier, armor, hp, maxHp, state, tx, ty` (wander target), `pauseUntil, flashUntil, anim, dead, kx, ky` (knockback velocity, tiles/s)
  - `initMon_(m, index)` — fills tier/armor/hp from Task 1 helpers (`hp = monHp_(tier, effAtk())`)
  - `updateCombat_(now, dt)` — monster AI (speeds: wander 1.6, chase 3.6, return 2.4 tiles/s), knockback decay, contact check, respawn queue; does nothing to timers while `X.busy`
  - `hurtPlayer_(amount, fromFx, fromFy, now)` — applies damage to `save.explore.hp`, knockback 0.6 tile away, sets `X.invulnUntil = now+1000`, sprite blink while invulnerable, `updateExHud_()`, and on HP≤0 calls `playerDownOnMap_()`
  - `playerDownOnMap_()` — same outcome as the old loss: HP full, back to village spawn, the existing "sad" line
  - Boss: foot box overlap with boss tile → `startBossBattle_()` once (guard with `X.busy`)
  - Night monsters spawn through the existing `updateNightMons_` and get `initMon_` (tier 4)
  - Tier-3 monsters are drawn at 1.3× scale (pass a scale to `drawTinyMon_`)
  - Console test helper `spawnTestMon_(tier)` — spawns a monster of that tier 3 tiles in front of the player inside the current zone

- [ ] **Step 1: Write the failing test** in `tests/combat-core.test.mjs` for invulnerability helper added to Task 1's file:
  `canBeHit_(now, invulnUntil) -> bool`; `assert.equal(c.canBeHit_(1000, 1500), false); assert.equal(c.canBeHit_(1600, 1500), true);`
- [ ] **Step 2: Run `node --test tests/`** — expect FAIL (`canBeHit_` undefined)
- [ ] **Step 3: Implement `canBeHit_` in `js/combat-core.js`, then `js/combat.js` per Interfaces**; contact = foot boxes overlap; one `hurtPlayer_` per frame max; monster `pauseUntil=now+600` after contact.
- [ ] **Step 4: Run `node --test tests/`** — expect PASS
- [ ] **Step 5: Bump versions; browser-verify**: monsters wander inside their zone and never cross gates/water; approach → chase, run away beyond 8 tiles → they return; contact drains HP once per second with knockback; reaching 0 HP sends you to the village with full HP; two monsters touching at once still deal one hit; boss contact starts the boss battle exactly once; at night (`DAY0_` shifted in console) night monsters appear and chase.
- [ ] **Step 6: Commit** `git commit -m "Monsters roam, chase and hurt on the map"`

---

### Task 4: Sword attacks, armor, death, drops and kill bookkeeping

**Files:**
- Modify: `js/combat.js` — attack, hits, death, coin drops, respawn
- Modify: `js/explore.js` — `interact_` returns whether something was interacted with; A button / Space / J call `actionButton_()`; Z/Enter stay interact-only; `resumeExplore` no longer handles `pend.kill`
- Modify: `js/critters.js` — `drawHeroSprite_` plays `soldier_attack01` while `X.p.swingUntil>now`
- Modify: `js/life.js` — add `recordFieldKill_(name, tiny, hue, stage)` (monster book entry: `seen++`, `won++`)
- Create: `assets/packs/soldier_attack01.png` (re-extract from `_ต้นฉบับ/ชุดภาพฟรี/Tiny RPG Character Asset Pack 01 v2.0 -Free Soldier&Orc.zip`, path `.../Soldier/Soldier/Soldier_Attack01.png`, remove `(83,69,69)` shadow pixels like idle/walk)
- Modify: `index.html` (bump changed files)

**Interfaces:**
- Consumes: `inArc_`, `swordDmg_`, `fieldReward_`, `footPx_` (Task 1); `hurtPlayer_`, monster fields (Task 3); `spriteFx_` (`js/fx.js`, screen-space, only for the level-up banner); `monsterStats`, `gainXp_`, `rewardMul()`, `dailyAdd_`, `zoneMonName_`, `NIGHT_MON`
- Produces:
  - `actionButton_()` — `interact_()` first; if nothing to interact with, `swing_(now)`
  - `swing_(now)` — 330 ms swing (`X.p.swingUntil`), 380 ms repeat while held; hits every live monster with `inArc_(footPx, footPy, dir, monFootPx, monFootPy, 22)` once
  - `hitMon_(m, dmg, fromFx, fromFy, now, breaksArmor=false) -> bool killed` — armor>0 and !breaksArmor → floating "ฟันไม่เข้า!", grey spark, no damage; else damage, flash, knockback 0.7 tile, floating number, `spriteFx` "hit" drawn on canvas (see Step 3); hp≤0 → `killMon_(m, now)`
  - `killMon_(m, now)` — death anim 0.5 s then remove; `smoke` effect; drops `max(1, round(reward.gold/5))` coins that fly to the player within 1.5 tiles (each coin = its share of gold); `e.kills[stage]++`; if `m.armorMax>0` then `e.armorKills[stage]=(…||0)+1`; `dailyAdd_("kill")`; `recordFieldKill_`; XP via `gainXp_` → on level-up `SFX.levelUp()` + `spriteFx_("levelup",{scale:2.2,fps:20})` + toast; night kill sets `NIGHT_STATE.gone[kind]=true`; queue respawn of non-night monsters after 25 s at a free tile in the same zone ≥5 tiles from the player; progress toast `${ZONE_NAMES[z]}: ปราบแล้ว k/QUEST_KILLS` (and `มอนเกราะ n/1` for B–E); when the gate becomes ready, the existing "happy" line via `exSay_` (the only kill message that pauses)
  - Canvas effect helper `canvasFx_(name, wx, wy, scale)` that draws an `assets/fx` strip frame-by-frame in world space during `drawExplore_` (DOM `spriteFx_` is screen-space and cannot follow the camera)
  - `save.explore.armorKills` default `{A:0,B:0,C:0,D:0,E:0}` (set in `ensureExplore_` when missing)

- [ ] **Step 1: Write failing tests** (pure helpers added to `js/combat-core.js`):
  `coinSplit_(gold) -> number[]` — `assert.deepEqual(c.coinSplit_(14), [5,5,4]); assert.deepEqual(c.coinSplit_(3), [3]);` (max 5 gold per coin, count = ceil(gold/5))
- [ ] **Step 2: `node --test tests/`** — expect FAIL
- [ ] **Step 3: Implement `coinSplit_`, then the runtime per Interfaces**; draw armor as a 🛡️-style pixel icon + small bar above armored monsters; swing arc visible for 120 ms (white crescent) so misses read clearly.
- [ ] **Step 4: `node --test tests/`** — expect PASS
- [ ] **Step 5: Bump versions; browser-verify**: zone A monster dies in 6 swings at Lv1 (`effAtk()` 22 → 5 per hit vs 30 HP); armored monster shows "ฟันไม่เข้า!" and loses no HP; coins fly in and gold increases by the reward; kills/armorKills/daily counters and monster book update; level-up effect plays; monster respawns ~25 s later away from the player; A next to an NPC talks instead of swinging; holding Space swings repeatedly.
- [ ] **Step 6: Commit** `git commit -m "Sword combat, armor, drops and kills on the map"`

---

### Task 5: The ✨ math skill

**Files:**
- Modify: `js/combat.js` — skill flow, blast, cooldown, streak
- Modify: `js/explore.js` — add `askTimed_(opts) -> Promise<{ok:boolean, timedOut:boolean}>` next to `askNumber` (reuses `#puzzle-modal`); key K/X → `useSkill_()`
- Modify: `index.html` — add `<button id="ex-skill" class="ex-skill" type="button" aria-label="สกิลคิดเลข">✨<span class="cd"></span></button>` beside `#ex-a`
- Modify: `css/game.css` — `.ex-skill` (same size as `.ex-a`, up-left of it, never overlapping at 360×640 landscape), cooldown overlay (`conic-gradient` driven by `--cd` 0–1), `.disabled` dimming
- Modify: `index.html` versions

**Interfaces:**
- Consumes: `questionSubFor_`, `skillDmg_` (Task 1); `hitMon_(m,dmg,fx,fy,now,true)` (Task 4); `makeQuestion({id:stage}, sub)`; `HERO_FX`, `heroKey`; `canvasFx_` (Task 4); `bonusTime()`; `save.stats`
- Produces:
  - `askTimed_({title, text, answer, options, seconds}) -> Promise<{ok, timedOut}>` — sets `X.busy`; numeric answers (`/^-?\d+(\.\d+)?$/`) use the number pad, otherwise renders `options` as buttons; one submission only; visible countdown; "ข้าม" button resolves `{ok:false, timedOut:false}`; on wrong/timeout shows "คำตอบคือ …" for 2 s before resolving
  - `useSkill_(now)` — no live monster within 4 tiles → toast "ไม่มีเป้าหมาย" and return; target = nearest; question from target's `zone.stage` at `questionSubFor_(m.tier, e.kills[stage])`; `seconds = 15 + bonusTime()`; correct → blast: every live monster within 3 tiles takes `skillDmg_(effAtk(), X.skillStreak)` with `breaksArmor=true` (armor -1), class effect `canvasFx_(HERO_FX[heroKey(save.avatar)], …, 2)` + `crit`; `X.skillStreak++`; cooldown 2 s. Wrong/timeout → `X.skillStreak=0`, cooldown 5 s. Always `save.stats.correct/wrong++`, `persist()`
  - `X.skillReadyAt` (ms timestamp) and `updateSkillButton_(now)` (sets `--cd`, `.disabled` when no target in range)

- [ ] **Step 1: Write failing test** (pure helper in `js/combat-core.js`): `isNumericAnswer_(a) -> bool` — `assert.deepEqual(["14","-3","2.5","1/2","x"].map(c.isNumericAnswer_), [true,true,true,false,false]);`
- [ ] **Step 2: `node --test tests/`** — expect FAIL
- [ ] **Step 3: Implement `isNumericAnswer_`, `askTimed_`, `useSkill_`, button + CSS**
- [ ] **Step 4: `node --test tests/`** — expect PASS
- [ ] **Step 5: Bump versions; browser-verify**:
  - console loop over stages A–E × sub 1–5 calling `makeQuestion` 20× each: every answer passes `isNumericAnswer_` (if any fails, confirm the options-buttons path renders it)
  - skill on an armored monster removes 1 armor and deals 5× sword; the next sword hit now damages it; night monster needs two correct skills
  - while the skill modal is open, monsters don't move and contact damage doesn't happen
  - wrong answer: no HP loss, answer shown, 5 s cooldown ring; correct: 2 s ring; streak raises damage
  - mobile preset (375×812 landscape via `resize_window` 812×375): ✨ and A don't overlap and are tappable
- [ ] **Step 6: Commit** `git commit -m "Math skill: answer to blast and break armor"`

---

### Task 6: Ambush questions, gate rule, skill-tree effects, potions, docs

**Files:**
- Modify: `js/combat.js` — ambush scheduler, power buff, def shield
- Modify: `js/explore.js` — gate readiness (the `ready` check inside `drawStoneGate_` at line ~172 and the gate puzzle at ~706 call `gateReady_`), menu ☰ shows armored-kill progress and a "ใช้ยาฟื้นพลัง" button, `updateExHud_` shows the power-buff countdown chip
- Modify: `CLAUDE.md` — file table rows for `combat-core.js`, `combat.js`, `tests/`, test command; "done" list
- Modify: `index.html` versions

**Interfaces:**
- Consumes: `nextAmbushDelay_`, `pickAmbushReward_` (Task 1); `askTimed_` (Task 5); `skillLv`, `damageTakenMul`, `bonusTime`
- Produces:
  - `X.nextAmbushAt` — scheduled with `nextAmbushDelay_(Math.random())` when entering the field; fires only if a monster is chasing or within 5 tiles and `!X.busy`; question = current zone's stage, sub `1 + floor(Math.random()*3)`, `seconds = 10 + bonusTime()`; reward per `pickAmbushReward_`: heal 20% max HP / `X.powerUntil = now+15000` (sword ×2) / gold `10 + floor(Math.random()*11)`; wrong → answer shown, nothing else
  - `gateNeedsArmor_(stage) -> bool` = stage in B–E; gate ready = kills ≥ `QUEST_KILLS` and (`!gateNeedsArmor_` or `armorKills[stage] ≥ 1`); the ☰ menu line becomes `ทุ่ง… 2/3 · มอนเกราะ 0/1`
  - Def skill: `skillLv("def")>=3` → first contact after entering the field is blocked (`canvasFx_("shield", …)` on the player, floating "BLOCK!"); contact damage already uses `damageTakenMul()` (Task 3)
  - Potion from menu: same effect as in battle (+40% max HP), decrements `save.items.potion`

- [ ] **Step 1: Write failing test**: `gateReady_(stage, kills, armorKills, questKills) -> bool` in `js/combat-core.js` —
  `assert.equal(c.gateReady_("A",3,0,3), true); assert.equal(c.gateReady_("B",3,0,3), false); assert.equal(c.gateReady_("B",3,1,3), true); assert.equal(c.gateReady_("C",2,1,3), false);`
- [ ] **Step 2: `node --test tests/`** — expect FAIL
- [ ] **Step 3: Implement `gateReady_` and wire it into explore.js; implement ambush, power buff chip, def shield, potion button; update CLAUDE.md**
- [ ] **Step 4: `node --test tests/`** — expect PASS
- [ ] **Step 5: Bump versions; full browser regression** (spec "การทดสอบ" list): movement + every door/warp/NPC/sign/tablet/chest/gate/bridge/farm; all monster tiers; skill; ambush (force with `X.nextAmbushAt=0`); power buff chip counts down and doubles sword damage; gate B refuses with 3 plain kills and opens after an armored kill; potion from menu; def-3 shield blocks first hit; death/respawn; boss battle and return; save → reload mid-field; old save without `armorKills`/`px`. Screenshots of: sword hit, armored "ฟันไม่เข้า!", skill modal, skill blast, ambush reward, mobile layout.
- [ ] **Step 6: Commit** `git commit -m "Ambush questions, armored gate rule, skill-tree effects on the map"`
