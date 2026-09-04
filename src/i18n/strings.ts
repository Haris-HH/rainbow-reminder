import type { Lang } from '@/types/database'

// dictionary กลาง — key เดียว แปลสองภาษา
export const dict = {
  appName: { th: 'เรนโบว์ น้ำดื่ม', my: 'Rainbow သောက်ရေ' },

  // auth
  login: { th: 'เข้าสู่ระบบ', my: 'အကောင့်ဝင်ရန်' },
  logout: { th: 'ออกจากระบบ', my: 'ထွက်ရန်' },
  username: { th: 'ชื่อผู้ใช้', my: 'အသုံးပြုသူအမည်' },
  email: { th: 'อีเมล', my: 'အီးမေးလ်' },
  password: { th: 'รหัสผ่าน', my: 'စကားဝှက်' },
  signingIn: { th: 'กำลังเข้าสู่ระบบ...', my: 'ဝင်နေသည်...' },
  loginFailed: { th: 'เข้าสู่ระบบไม่สำเร็จ', my: 'အကောင့်ဝင်၍မရပါ' },

  // nav
  dashboard: { th: 'หน้าหลัก', my: 'ပင်မ' },
  villages: { th: 'หมู่บ้าน', my: 'ရွာများ' },
  deliverers: { th: 'คนส่ง', my: 'ပို့ဆောင်သူ' },
  users: { th: 'ผู้ใช้งาน', my: 'အသုံးပြုသူ' },
  settings: { th: 'ตั้งค่า', my: 'ဆက်တင်' },

  // common
  add: { th: 'เพิ่ม', my: 'ထည့်ရန်' },
  edit: { th: 'แก้ไข', my: 'ပြင်ရန်' },
  delete: { th: 'ลบ', my: 'ဖျက်ရန်' },
  save: { th: 'บันทึก', my: 'သိမ်းရန်' },
  cancel: { th: 'ยกเลิก', my: 'ပယ်ဖျက်' },
  confirm: { th: 'ยืนยัน', my: 'အတည်ပြု' },
  search: { th: 'ค้นหา', my: 'ရှာဖွေ' },
  name: { th: 'ชื่อ', my: 'အမည်' },
  address: { th: 'ที่อยู่', my: 'လိပ်စာ' },
  loading: { th: 'กำลังโหลด...', my: 'ဖွင့်နေသည်...' },
  empty: { th: 'ยังไม่มีข้อมูล', my: 'ဒေတာမရှိသေးပါ' },
  total: { th: 'รวม', my: 'စုစုပေါင်း' },
  map: { th: 'แผนที่', my: 'မြေပုံ' },

  // deliverer
  delivererName: { th: 'ชื่อคนส่ง', my: 'ပို့ဆောင်သူအမည်' },
  deliverMode: { th: 'รูปแบบการส่ง', my: 'ပို့ဆောင်ပုံစံ' },
  byVillage: { th: 'ส่งเป็นหมู่บ้าน', my: 'ရွာအလိုက်' },
  byDay: { th: 'ส่งเป็นวัน', my: 'ရက်အလိုက်' },
  assignedVillages: { th: 'หมู่บ้านที่รับผิดชอบ', my: 'တာဝန်ယူရွာများ' },
  assignedDays: { th: 'วันที่รับผิดชอบ', my: 'တာဝန်ယူရက်များ' },
  addVillage: { th: 'เพิ่มหมู่บ้าน', my: 'ရွာထည့်ရန်' },
  addDay: { th: 'เพิ่มวัน', my: 'ရက်ထည့်ရန်' },
  remove: { th: 'เอาออก', my: 'ဖယ်ရှားရန်' },

  // village
  villageName: { th: 'ชื่อหมู่บ้าน', my: 'ရွာအမည်' },
  lat: { th: 'ละติจูด', my: 'လတ္တီတွဒ်' },
  lng: { th: 'ลองจิจูด', my: 'လောင်ဂျီတွဒ်' },
  searchPlace: { th: 'ค้นหาสถานที่...', my: 'နေရာရှာဖွေ...' },
  myLocation: { th: 'ตำแหน่งปัจจุบัน', my: 'လက်ရှိတည်နေရာ' },
  noResults: { th: 'ไม่พบสถานที่', my: 'နေရာမတွေ့ပါ' },
  tapMapHint: { th: 'แตะบนแผนที่เพื่อปักหมุด', my: 'မြေပုံပေါ်နှိပ်၍ အမှတ်ချပါ' },

  // delivery records
  addRecord: { th: 'เพิ่มรายการส่ง', my: 'ပို့ဆောင်မှုထည့်ရန်' },
  houseNo: { th: 'บ้านเลขที่', my: 'အိမ်နံပါတ်' },
  quantity: { th: 'จำนวน', my: 'အရေအတွက်' },
  amount: { th: 'ยอดเงิน', my: 'ငွေပမာဏ' },
  paid: { th: 'ชำระแล้ว', my: 'ပေးပြီး' },
  unpaid: { th: 'ค้างชำระ', my: 'ကြွေးကျန်' },
  outstanding: { th: 'ยอดค้างรวม', my: 'ကြွေးကျန်စုစုပေါင်း' },
  date: { th: 'วันที่', my: 'ရက်စွဲ' },
  note: { th: 'หมายเหตุ', my: 'မှတ်ချက်' },
  markPaid: { th: 'ทำเป็นชำระแล้ว', my: 'ပေးပြီးအဖြစ်မှတ်' },
  markUnpaid: { th: 'ทำเป็นค้างชำระ', my: 'ကြွေးကျန်အဖြစ်မှတ်' },
  records: { th: 'รายการ', my: 'မှတ်တမ်း' },
  groupTotal: { th: 'รวมทั้งบ้าน', my: 'အိမ်စုစုပေါင်း' },
  searchRecord: { th: 'ค้นหาบ้านเลขที่ / หมายเหตุ', my: 'အိမ်နံပါတ် / မှတ်ချက် ရှာဖွေ' },

  // days
  day0: { th: 'อาทิตย์', my: 'တနင်္ဂနွေ' },
  day1: { th: 'จันทร์', my: 'တနင်္လာ' },
  day2: { th: 'อังคาร', my: 'အင်္ဂါ' },
  day3: { th: 'พุธ', my: 'ဗုဒ္ဓဟူး' },
  day4: { th: 'พฤหัสบดี', my: 'ကြာသပတေး' },
  day5: { th: 'ศุกร์', my: 'သောကြာ' },
  day6: { th: 'เสาร์', my: 'စနေ' },

  // settings
  theme: { th: 'ธีม', my: 'အသွင်အပြင်' },
  light: { th: 'สว่าง', my: 'အလင်း' },
  dark: { th: 'มืด', my: 'အမှောင်' },
  language: { th: 'ภาษา', my: 'ဘာသာစကား' },
  currency: { th: 'สกุลเงิน', my: 'ငွေကြေး' },

  // user mgmt
  role: { th: 'สิทธิ์', my: 'အခွင့်အရေး' },
  admin: { th: 'ผู้ดูแล', my: 'အက်ဒမင်' },
  staff: { th: 'พนักงาน', my: 'ဝန်ထမ်း' },
  newPassword: { th: 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)', my: 'စကားဝှက်အသစ်' },
  adminOnly: { th: 'เฉพาะผู้ดูแลระบบ', my: 'အက်ဒမင်သာ' },

  confirmDelete: { th: 'ยืนยันการลบ?', my: 'ဖျက်ရန်သေချာပါသလား?' },
} as const

export type StringKey = keyof typeof dict

export function t(key: StringKey, lang: Lang): string {
  return dict[key][lang]
}

export function dayName(day: number, lang: Lang): string {
  const key = `day${day}` as StringKey
  return dict[key]?.[lang] ?? String(day)
}
