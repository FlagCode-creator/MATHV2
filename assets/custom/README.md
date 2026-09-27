# ใส่ภาพของครูเอง (ภาพใหญ่สไตล์พิกเซลอนิเมะ)

เกมวาดภาพทุกอย่างด้วยโค้ดอยู่แล้ว แต่ถ้าอยากได้ภาพสวยละเอียด (แบบเดียวกับภาพครูแฟล็ก)
ให้สร้างภาพตามรายการด้านล่าง วางไว้ในโฟลเดอร์นี้ แล้วเขียนรายชื่อใน `manifest.json`
**ภาพไหนยังไม่มี เกมจะใช้ภาพที่วาดด้วยโค้ดแทนโดยอัตโนมัติ** — ทยอยเพิ่มทีละภาพได้

## ภาพใช้ที่ไหนบ้าง
| ประเภท | ใช้ที่ | จำนวนท่า |
|---|---|---|
| `portraits` ตัวละคร/NPC | ฉากต่อสู้ (ช่องผู้เล่น), กล่องบทสนทนา, หน้าตัวละคร, หน้าเลือกตัวละคร, HUD | ท่าเดียว (หันหน้าตรง) |
| `sprites` มอนสเตอร์/บอส | ฉากต่อสู้, หน้าต่างดูศัตรู, แผนที่ด่าน, หน้าแรก | ท่าเดียว |
| ตัวเดินบนแผนที่ | ใช้ตัวเล็กที่วาดด้วยโค้ด (เดินได้ 4 ทิศ) | — |

## วิธีเตรียมภาพ (สำคัญ)
- **พื้นหลังสีขาวเรียบ** หรือโปร่งใส — เกมจะตัดพื้นหลังสีเรียบและขอบว่างออกให้เอง
- ตัวละครยืนเต็มตัว หันหน้าตรง อยู่กลางภาพ ไม่ชิดขอบ ไม่มีเงาตกกระทบถึงขอบภาพ
- ขนาดไหนก็ได้ (แนะนำตัวละครสูง 256–512 px, มอนสเตอร์ 256–512 px) เกมย่อให้พอดีเอง
- ใช้ **ภาพครูแฟล็กเป็นภาพอ้างอิงสไตล์** ทุกครั้ง เพื่อให้ทุกตัวดูเป็นเกมเดียวกัน
- ห้ามใช้ภาพจากเกม/ศิลปินอื่นที่ไม่มีสิทธิ์ ใช้เป็นแนวทางได้ แต่ต้องสร้างใหม่เอง

## prompt สำหรับเครื่องมือสร้างภาพ AI
ขึ้นต้นทุกภาพด้วย **ข้อความสไตล์** แล้วต่อด้วยรายละเอียดของแต่ละตัว

**ตัวละคร/NPC:**
```
pixel art, chibi anime character, full body, front view, standing pose, detailed 16-bit JRPG sprite style,
clean dark outline, soft cel shading, vibrant colors, plain white background, centered, no text, no shadow,
```
**มอนสเตอร์/บอส:**
```
pixel art, cute fantasy RPG monster, full body, front view, detailed 16-bit JRPG enemy sprite style,
clean dark outline, soft cel shading, vibrant colors, plain white background, centered, no text, no shadow,
```

### ตัวละครผู้เล่น → `portraits/<ชื่อ>.png`
| ชื่อไฟล์ | รายละเอียดต่อท้าย prompt |
|---|---|
| `student_m` | Thai male high school student, white short-sleeve shirt with blue tie, navy blue shorts, short black hair, backpack |
| `student_f` | Thai female high school student, white blouse with blue bow, navy pleated skirt, long black hair |
| `warrior` | young knight, silver helmet with red plume, blue armor, sword and round shield |
| `warrior_r` | fire knight, silver helmet with gold plume, red armor, flaming sword |
| `mage` | old wizard, purple pointed hat with a star, long white beard, purple robe, wooden staff |
| `mage_b` | water mage, blue pointed hat, white beard, blue robe, crystal staff |
| `ninja` | ninja, dark navy hood and face mask, red belt, holding a kunai |
| `ninja_r` | red ninja, crimson hood and face mask, black belt, twin daggers |
| `archer` | forest archer, green hood, green tunic, brown leather belt, longbow |
| `archer_b` | ranger, brown hair, brown leather jacket, green pants, crossbow |
| `princess` | princess, long blonde hair, golden crown, pink ball gown, magic wand |
| `prince` | prince, blonde hair, golden crown, blue royal coat, white pants, red cape |

### NPC → `portraits/<ชื่อ>.png`
(ครูแฟล็กใช้ภาพใน `assets/mascot/` อยู่แล้ว ไม่ต้องสร้างเพิ่ม)
| ชื่อไฟล์ | รายละเอียด |
|---|---|
| `npc_shop` | friendly village shopkeeper aunt, brown hair bun, green dress, white apron |
| `npc_inn` | kind innkeeper lady, long blonde hair, pink dress, white apron |
| `npc_carpenter` | carpenter uncle, yellow hard hat, orange work shirt, blue jeans, hammer |
| `npc_farmer` | farmer uncle, straw hat, blue shirt, brown overalls, holding a carrot |
| `npc_kid` | little boy, messy orange hair, red t-shirt, blue shorts, cheerful |

### มอนสเตอร์ (1 ตัวต่อ 1 หัวข้อ) → `monsters/<ตัวอักษร>.png`
| ไฟล์ | ชื่อในเกม | รายละเอียด |
|---|---|---|
| `A` | สไลม์บวก | green slime with a yellow plus sign on its body |
| `B` | ค้างคาวลบ | purple bat with a minus sign on its belly |
| `C` | กระต่ายทวีคูณ | white fluffy rabbit with a multiplication sign |
| `D` | ปูแบ่งก้าม | red crab with huge claws |
| `E` | หมูป่าสี่เครื่องหมาย | angry wild boar with tusks |
| `F` | เห็ดแบ่งเสี้ยว | mushroom creature with a red cap cut into fraction slices |
| `G` | ผึ้งจุดทศนิยม | chubby bee with decimal points on its stripes |
| `H` | จิ้งจอกลดราคา | sly orange fox holding a percent price tag |
| `I` | นกฮูกสัดส่วน | wise brown owl with big round glasses |
| `J` | แมงป่องยกกำลัง | purple scorpion with a glowing stinger |
| `K` | แมงมุมถอดราก | dark grey spider with a square-root symbol on its back |
| `L` | หินปริศนา x | stone golem head with a glowing letter x |
| `M` | หมาป่ามากกว่า-น้อยกว่า | grey wolf with greater-than and less-than markings |
| `N` | อินทรีสองตัวแปร | bald eagle with spread wings |
| `O` | ซอมบี้พจน์คล้าย | cute green zombie in a torn blue shirt |
| `P` | หุ่นกลแยกชิ้น | small grey robot made of separate parts |
| `Q` | ผีสองราก | white cute ghost with two roots as tails |
| `R` | ปลาปักเป้าฟังก์ชัน | yellow spiky pufferfish |
| `S` | ฉลามความชัน | blue shark riding a sloped wave |
| `T` | งูทะเลอนุกรม | cyan sea serpent with numbered scales |
| `U` | โจ๊กเกอร์สุ่มดวง | jester with a red and purple hat holding dice |
| `V` | หนูนับสถิติ | grey rat with glasses holding a bar-chart clipboard |
| `W` | โกเลมพื้นที่ | golem made of orange bricks |
| `X` | นักธนูมุมฉาก | archer creature holding a right-triangle bow |
| `Y` | พายุอนุพันธ์ | small tornado spirit with glowing eyes |
| `Z` | เงาแห่งทุกหัวข้อ | hooded shadow villain with glowing red eyes |

### บอส → `bosses/<ชื่อ>.png` (ใหญ่และอลังการกว่ามอนสเตอร์)
| ไฟล์ | ชื่อในเกม | รายละเอียด |
|---|---|---|
| `boss_w1` | ราชาสไลม์ตัวเลข | giant green king slime wearing a golden crown |
| `boss_w2` | ต้นไม้ยักษ์พันส่วน | giant ancient tree monster with a glowing face |
| `boss_w3` | มังกรเลขชี้กำลัง | red dragon with wings spread |
| `boss_w4` | ยักษ์ตาชั่ง | giant blue troll holding a golden balance scale |
| `boss_w5` | พ่อมดพหุนาม | powerful purple wizard casting glowing symbols |
| `boss_w6` | คราเคนกราฟ | giant pink kraken rising from the sea |
| `boss_w7` | เจ้ามือลูกเต๋า | giant dice monster wearing a top hat |
| `boss_w8` | อัศวินตรีโกณ | armored triangle knight with a greatsword |

## เขียนรายชื่อใน `manifest.json`
คัดลอก `manifest.example.json` เป็น `manifest.json` แล้ว **ลบบรรทัดของภาพที่ยังไม่มี** (หรืออัปโหลดภาพแล้วบอก Claude ให้แก้ให้)
```json
{
  "portraits": { "student_m": "portraits/student_m.png", "npc_carpenter": "portraits/npc_carpenter.png" },
  "sprites":   { "A": "monsters/A.png", "boss_w1": "bosses/boss_w1.png" }
}
```

## ตัวเลือกขั้นสูง (ไม่บังคับ)
- `mapSprites`: ภาพเล็กสำหรับมอนสเตอร์/วัตถุบนแผนที่ (เช่น 32×32)
- `characters`: sprite sheet เดิน 4 ทิศแบบ RPG Maker — **3 คอลัมน์** (ก้าว-ยืน-ก้าว) × **4 แถว** (หันลง · ซ้าย · ขวา · ขึ้น)
  ```json
  "characters": { "student_m": { "src": "chars/student_m.png", "cols": 3, "rows": 4 } }
  ```

แก้ไฟล์แล้วถ้าเบราว์เซอร์ยังแสดงภาพเก่า ให้รีเฟรชแบบล้างแคช
