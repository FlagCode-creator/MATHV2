# ใส่ภาพของครูเอง (ไม่บังคับ)

เกมวาดภาพทุกอย่างด้วยโค้ดอยู่แล้ว แต่ถ้าอยากใช้ภาพที่สวยกว่า (เช่น สร้างด้วย AI แบบเดียวกับภาพครูแฟล็ก)
ให้วางไฟล์ PNG ไว้ในโฟลเดอร์นี้ แล้วสร้างไฟล์ `manifest.json` บอกว่าภาพไหนใช้แทนอะไร
ภาพที่ไม่ได้ระบุ เกมจะใช้ภาพที่วาดด้วยโค้ดตามเดิม

## ตัวอย่าง `manifest.json`
```json
{
  "sprites": {
    "A": "monsters/slime.png",
    "boss_w1": "bosses/king_slime.png",
    "obj_chest": "objects/chest.png"
  },
  "characters": {
    "student_m": { "src": "chars/student_m.png", "cols": 3, "rows": 4 },
    "npc_flag":  { "src": "chars/kru_flag.png" }
  }
}
```

## ภาพนิ่ง (`sprites`)
- ใช้กับมอนสเตอร์ `A`–`Z`, บอส `boss_w1`–`boss_w8`, วัตถุ `obj_tree`, `obj_rock`, `obj_chest`, `obj_sign` ฯลฯ
- พื้นหลังโปร่งใส ขนาดสี่เหลี่ยมจัตุรัส เช่น 32×32, 48×48 หรือ 64×64 (ใหญ่แค่ไหนก็ได้ เกมย่อ/ขยายให้พอดี)
- ภาพพิกเซลควรเป็นขนาดจริง (ไม่เบลอ) เกมจะขยายแบบคมชัดให้เอง

## ตัวละครเดิน 4 ทิศ (`characters`)
- รูปแบบเดียวกับ RPG Maker: **3 คอลัมน์ × 4 แถว**
  - คอลัมน์: ก้าวเท้าซ้าย · ยืน · ก้าวเท้าขวา
  - แถว (บนลงล่าง): หันลง · หันซ้าย · หันขวา · หันขึ้น
- แต่ละช่องขนาดเท่ากัน เช่น 48×48 (ทั้งภาพ 144×192) หรือ 32×48
- ชื่อตัวละคร: ผู้เล่น `student_m` `student_f` `warrior` `warrior_r` `mage` `mage_b` `ninja` `ninja_r` `archer` `archer_b` `princess` `prince`
  และ NPC `npc_flag` (ครูแฟล็ก) `npc_shop` `npc_inn` `npc_carpenter` `npc_farmer` `npc_kid`
- ถ้าลำดับแถวไม่ตรง ใส่ `"order": ["down","left","right","up"]` ให้ตรงกับภาพ

แก้ไฟล์แล้วอย่าลืมเพิ่มเลข `?v=` ของ `js/custom-assets.js` ใน `index.html` ถ้าเบราว์เซอร์ยังแสดงภาพเก่า
