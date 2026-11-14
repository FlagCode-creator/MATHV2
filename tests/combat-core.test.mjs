import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const c = load("js/combat-core.js");

test("footTile_ and footPx_ map tile floats to the foot point", () => {
  assert.deepEqual([...c.footTile_(3, 4)], [3, 4]);
  assert.deepEqual([...c.footTile_(3.49, 4)], [3, 4]);   // foot = (63.8, 78) → tile (3,4)
  assert.deepEqual([...c.footPx_(2, 1)], [40, 30]);
});

test("moveBox_ stops at a wall", () => {
  const wall = (x, y) => x === 5 && y === 4;
  const [wx, wy] = c.moveBox_(4, 4, 0.5, 0, 10, 6, wall);
  assert.ok(Math.abs(wx - 4.1875) < 0.01 && wy === 4, `got ${wx},${wy}`);
});

test("moveBox_ nudges into a 1-tile gap", () => {
  const gap = (x, y) => x === 5 && y !== 4;
  const [nx, ny] = c.moveBox_(4.0, 3.4, 0.3, 0, 10, 6, gap);
  assert.ok(ny > 3.4 && nx > 4.0, `got ${nx},${ny}`);
});

test("moveBox_ moves freely in open space", () => {
  const [x, y] = c.moveBox_(4, 4, 0.25, -0.25, 10, 6, () => false);
  assert.deepEqual([x, y], [4.25, 3.75]);
});

test("facingTile_ looks one step ahead of the foot", () => {
  assert.deepEqual([...c.facingTile_(3, 4, "right")], [4, 4]);
  assert.deepEqual([...c.facingTile_(3, 4, "up")], [3, 3]);
  assert.deepEqual([...c.facingTile_(3, 4, "left")], [2, 4]);
  assert.deepEqual([...c.facingTile_(3, 4, "down")], [3, 5]);
});

test("inArc_ hits in front only", () => {
  assert.equal(c.inArc_(100, 100, "right", 115, 100, 22), true);
  assert.equal(c.inArc_(100, 100, "right", 85, 100, 22), false);
  assert.equal(c.inArc_(100, 100, "up", 100, 80, 22), true);
  assert.equal(c.inArc_(100, 100, "right", 140, 100, 22), false);
});

test("tierFor_ / armorFor_ / questionSubFor_", () => {
  assert.deepEqual([c.tierFor_("A",0,false), c.tierFor_("C",1,false), c.tierFor_("E",2,false), c.tierFor_("B",0,true)], [1,2,3,4]);
  assert.deepEqual([c.armorFor_(1,0), c.armorFor_(2,0), c.armorFor_(2,1), c.armorFor_(3,4), c.armorFor_(4,0)], [0,1,0,1,2]);
  assert.deepEqual([c.questionSubFor_(1,0), c.questionSubFor_(1,9), c.questionSubFor_(4,3)], [1,2,5]);
});

test("damage, HP and contact formulas", () => {
  assert.equal(c.swordDmg_(22), 5);
  assert.equal(c.swordDmg_(1), 1);
  assert.equal(c.skillDmg_(22, 0), 25);
  assert.equal(c.skillDmg_(22, 9), 38);
  assert.equal(c.monHp_(3, 22), 50);
  assert.equal(c.contactDmg_(14, 0.85), 6);
});

test("fieldReward_", () => {
  assert.deepEqual({ ...c.fieldReward_(20, 30, false, 1) }, { gold: 14, xp: 24 });
  assert.deepEqual({ ...c.fieldReward_(20, 30, true, 1.25) }, { gold: 44, xp: 60 });
});

test("ambush timing and reward pick", () => {
  assert.equal(c.nextAmbushDelay_(0), 45000);
  assert.equal(c.nextAmbushDelay_(1), 90000);
  assert.deepEqual([0.1, 0.5, 0.9].map(c.pickAmbushReward_), ["heal", "power", "gold"]);
});

test("monStateNext_", () => {
  assert.equal(c.monStateNext_("wander", 4, true), "chase");
  assert.equal(c.monStateNext_("wander", 6, true), "wander");
  assert.equal(c.monStateNext_("chase", 9, true), "return");
  assert.equal(c.monStateNext_("chase", 3, false), "return");
  assert.equal(c.monStateNext_("return", 7, true), "wander");
});
