// โหลดไฟล์ JS ของเกม (แบบ <script> ธรรมดา) เข้า vm context เพื่อทดสอบฟังก์ชันที่ไม่แตะ DOM
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function load(...files) {
  const ctx = createContext({ TS: 16, Math, console });
  for (const f of files) runInContext(readFileSync(join(root, f), "utf8"), ctx, { filename: f });
  return ctx;
}
