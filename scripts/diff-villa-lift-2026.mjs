/**
 * 对比 truth.json (Excel 真实数据) 与 db.json (数据库现状)，输出差异并生成 UPDATE SQL
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const truth = JSON.parse(
  readFileSync(
    join(root, 'docs/imports/villa_lift_orders_2026_truth.json'),
    'utf8',
  ),
)
const dbRaw = JSON.parse(
  readFileSync(
    join(root, 'docs/imports/villa_lift_orders_2026_db.json'),
    'utf8',
  ),
)
// 可能形态1: 直接数组；形态2: { data: [...] }；形态3: { result: '...<untrusted-data-xxx>JSON</untrusted-data-xxx>...' }
let db
if (Array.isArray(dbRaw)) db = dbRaw
else if (Array.isArray(dbRaw.data)) db = dbRaw.data
else if (typeof dbRaw.result === 'string') {
  // 第一个 <untrusted-data-XXX> ... </untrusted-data-XXX>
  const start = dbRaw.result.indexOf('>\n[')
  const endTag = '\n</untrusted-data-'
  const end = dbRaw.result.indexOf(endTag, start)
  if (start < 0 || end < 0) throw new Error('无法在 result 中定位 JSON 数组')
  db = JSON.parse(dbRaw.result.slice(start + 1, end).trim())
} else {
  throw new Error('未知 db.json 结构')
}

console.log('truth records:', truth.length, 'db records:', db.length)

// 标准化 key：只保留字母数字与 CJK 汉字，全部小写；其余（空白、标点、全角符号）全部丢弃
const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '')

// 由于 truth 中重复 project_name 已经追加 -1/-2 后缀（仅用于唯一化），DB 里也保留这些后缀。
// 所以 fuzzy 匹配时不要剥离尾部 -数字，否则会误伤 "...-103" 这种真实项目编号。
const stripSuffix = (s) => String(s || '')

const dbByPname = new Map()
const dbByFuzzy = new Map() // norm(customer)+norm(project_name) -> [records]
db.forEach((r) => {
  dbByPname.set(r.project_name, r)
  const k = norm(r.customer) + '|' + norm(r.project_name)
  if (!dbByFuzzy.has(k)) dbByFuzzy.set(k, [])
  dbByFuzzy.get(k).push(r)
})

const dateFields = [
  'schedule_date',
  'planned_delivery_date',
  'material_selection_date',
  'painting_date',
  'film_date',
  'cutting_required_date',
  'cutting_actual_date',
  'processing_required_date',
  'processing_actual_date',
  'inspection_date',
  'assembly_date',
  'packaging_date',
  'delivery_date',
]
const otherFields = ['customer', 'product_name', 'color', 'quantity', 'remarks']

const diffs = []
const missingInDb = []

for (const t of truth) {
  let d = dbByPname.get(t.project_name)
  if (!d) {
    // fuzzy: 用 customer + 标准化 project_name (truth 已剥后缀) 去匹配 DB
    const baseName = stripSuffix(t.project_name)
    const k = norm(t.customer) + '|' + norm(baseName)
    const candidates = dbByFuzzy.get(k) || []
    if (candidates.length === 1) d = candidates[0]
    else if (candidates.length > 1) {
      // 多候选时取第一个未被认领的
      d = candidates.find((c) => !c.__claimed) || candidates[0]
    }
  }
  if (!d) {
    missingInDb.push(t)
    continue
  }
  d.__claimed = true
  const fieldDiffs = {}
  for (const f of dateFields) {
    const tv = t[f] || null
    const dv = d[f] || null
    if (tv !== dv) fieldDiffs[f] = { excel: tv, db: dv }
  }
  for (const f of otherFields) {
    let tv = t[f]
    let dv = d[f]
    if (typeof tv === 'string') tv = tv.trim()
    if (typeof dv === 'string') dv = dv.trim()
    if (tv === '' && (dv === null || dv === undefined)) continue
    if (tv === null && (dv === '' || dv === undefined)) continue
    if (tv !== dv) fieldDiffs[f] = { excel: tv, db: dv }
  }
  // 当 fuzzy 匹配上时，project_name 本身可能也是差异，但通常 db 内 \n 已被替换为空格——这种情况不当作"差异"
  // 因此 project_name 不参与对比；customer/product_name/color 都用 norm 后判断
  if (Object.keys(fieldDiffs).length) {
    diffs.push({
      project_name: t.project_name,
      id: d.id,
      serial: t.serial,
      fieldDiffs,
    })
  }
}

const dbExtra = db.filter(
  (d) => !truth.find((t) => t.project_name === d.project_name),
)

console.log('差异行数:', diffs.length)
console.log('Excel 中但 DB 缺失:', missingInDb.length)
console.log('DB 中但 Excel 没有:', dbExtra.length)

writeFileSync(
  join(root, 'docs/imports/villa_lift_orders_2026_diffs.json'),
  JSON.stringify({ diffs, missingInDb, dbExtra }, null, 2),
  'utf8',
)

// 统计每个字段差异数量
const fieldCount = {}
diffs.forEach((d) => {
  Object.keys(d.fieldDiffs).forEach((f) => {
    fieldCount[f] = (fieldCount[f] || 0) + 1
  })
})
console.log('--- 字段差异统计 ---')
Object.entries(fieldCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([f, n]) => console.log(`  ${f}: ${n}`))

// 生成 UPDATE SQL
function sqlVal(v) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  return "'" + String(v).replace(/'/g, "''") + "'"
}

// 仅修复符合"raw:true 数字截断"模式的日期错误：
//   DB.year=Excel.year 且 DB.month=Excel.month 且 DB.day = Excel.day 截断成1位
//   例如 Excel 2026-04-30 → DB 2026-04-03 是因 4.30 被读成 4.3 然后被解析为 4月3日
// 其他差异（用户后期编辑、缺漏补录等）一律不动，避免覆盖人工修改
function isTruncationBug(dbDate, excelDate) {
  if (!dbDate || !excelDate) return false
  const [dy, dm, dd] = dbDate.split('-').map((x) => parseInt(x))
  const [ey, em, ed] = excelDate.split('-').map((x) => parseInt(x))
  if (dy !== ey) return false
  // case A: Excel.day=30, DB.month=Excel.month, DB.day=3 (4.30 → 4.3)
  if (dm === em && dd === Math.floor(ed / 10) && ed >= 10 && dd >= 1 && dd <= 9)
    return true
  // case B: Excel.day=20, DB.day=2 (类似 4.20 → 4.2)
  // case C: Excel.day=10, DB.day=1 (4.10 → 4.1)
  // case D: Excel "1.30" → number 1.3 → DB "2026-01-03"  (已被 case A 覆盖)
  return false
}

const stmts = []
const skippedDiffs = []
for (const d of diffs) {
  const safeDiffs = {}
  for (const [f, v] of Object.entries(d.fieldDiffs)) {
    if (f.endsWith('_date')) {
      if (isTruncationBug(v.db, v.excel)) {
        safeDiffs[f] = v
      } else {
        skippedDiffs.push({ ...d, field: f, ...v })
      }
    } else {
      // product_name / color / customer 等非日期字段：仅当 norm 后相同（即 DB 多了空格之类），才视为导入污染
      if (norm(v.db) === norm(v.excel)) {
        safeDiffs[f] = v
      } else {
        skippedDiffs.push({ ...d, field: f, ...v })
      }
    }
  }
  if (Object.keys(safeDiffs).length === 0) continue
  const sets = Object.entries(safeDiffs)
    .map(([f, { excel }]) => `${f} = ${sqlVal(excel)}`)
    .join(', ')
  stmts.push(
    `UPDATE villa_lift_orders SET ${sets} WHERE id = '${d.id}'; -- serial=${d.serial} ${d.project_name.replace(/\n/g, ' ')}`,
  )
}

console.log(`\n--- 安全修复 UPDATE: ${stmts.length} 条 ---`)
console.log(`--- 跳过(可能是人工修改/不可还原): ${skippedDiffs.length} 项 ---`)
skippedDiffs.forEach((s) => {
  console.log(
    `  [${s.serial}] ${s.project_name.replace(/\n/g, ' ')} ${s.field}: db=${s.db} excel=${s.excel}`,
  )
})

const sql = `-- villa_lift_orders 2026 数据修正
-- Generated: ${new Date().toISOString()}
-- 来源对比: 别墅梯计划进度表.xlsx (raw:false 重新解析) vs DB 当前数据
-- Total UPDATE: ${stmts.length}

BEGIN;

${stmts.join('\n')}

COMMIT;
`
writeFileSync(
  join(root, 'docs/imports/villa_lift_orders_2026_fix.sql'),
  sql,
  'utf8',
)
console.log(
  `\nUPDATE SQL: docs/imports/villa_lift_orders_2026_fix.sql (${stmts.length} statements)`,
)

// 打印前 5 条差异样例
console.log('\n--- 前 5 条差异样例 ---')
diffs.slice(0, 5).forEach((d) => {
  console.log(`[${d.serial}] ${d.project_name}`)
  Object.entries(d.fieldDiffs).forEach(([f, v]) => {
    console.log(`   ${f}: db=${v.db} → excel=${v.excel}`)
  })
})
