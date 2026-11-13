// Very small, deliberately cautious keyword check for free text.
// This is NOT a screening tool. It only decides whether to show the special-care screen
// (psychologist + 1323 hotline) instead of the normal flow. Nothing typed is stored or sent.

const RISK_PATTERNS = [
  'อยากตาย', 'อยากจะตาย', 'ไม่อยากอยู่', 'ไม่อยากมีชีวิต', 'ไม่อยากตื่น',
  'ฆ่าตัวตาย', 'ฆ่าตัวเอง', 'จบชีวิต', 'ปลิดชีพ', 'ทำร้ายตัวเอง', 'ทำร้ายตนเอง',
  'กรีดข้อมือ', 'กรีดแขน', 'กินยาเกิน', 'กินยาตาย', 'โดดตึก', 'กระโดดตึก',
  'หายไปจากโลก', 'ตายๆไป', 'ตายไปเลย', 'ไม่มีใครต้องการ', 'เป็นภาระ', 'ไม่ไหวแล้วจริงๆ',
  'suicide', 'kill myself', 'end my life', 'self harm', 'self-harm', 'want to die',
]

export function hasRisk(text) {
  if (!text) return false
  const t = text.toLowerCase().replace(/\s+/g, '')
  return RISK_PATTERNS.some((p) => t.includes(p.replace(/\s+/g, '')))
}
