import * as XLSX from 'xlsx'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const xlsxBuf = readFileSync(
  'C:\\Users\\Administrator\\Downloads\\\u522b\u5885\u68af\u8ba1\u5212\u8fdb\u5ea6\u8868.xlsx',
)
const wb = XLSX.read(xlsxBuf, { type: 'buffer' })
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws, {
  header: 1,
  defval: null,
  raw: true,
})

// Row 0 = title, Row 1 = header, Row 2+ = data
const dataRows = rows
  .slice(2)
  .filter((r) => r[0] !== null && r[0] !== undefined && r[0] !== '')

/**
 * 解析日期
 * 支持格式：
 *   "2026.1.5" → 2026-01-05
 *   "1.20"     → 2026-01-20
 *   3.28 (number) → 2026-03-28
 *   "春节后..." / "加急" → null
 */
function parseDate(v) {
  if (v === null || v === undefined) return null
  const str = String(v).trim()
  if (!str) return null
  // Must start with digit
  if (!/^\d/.test(str)) return null

  let year, month, day
  if (/^\d{4}[.]/.test(str)) {
    // "2026.1.5"
    const p = str.split('.')
    year = parseInt(p[0])
    month = parseInt(p[1])
    day = parseInt(p[2])
  } else {
    // "1.20" or 3.28 (as number → "3.28")
    const p = str.split('.')
    year = 2026
    month = parseInt(p[0])
    day = p[1] ? parseInt(p[1]) : null
  }

  if (
    !day ||
    isNaN(month) ||
    isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  )
    return null

  // Validate with JS Date (catch invalid like Feb 30)
  const d = new Date(year, month - 1, day)
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  )
    return null

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseQty(v) {
  if (v === null || v === undefined) return null
  const n = parseInt(String(v))
  return isNaN(n) ? null : n
}

function sqlVal(v, isInt = false) {
  if (v === null || v === undefined) return 'NULL'
  if (isInt) return String(v)
  return "'" + String(v).replace(/'/g, "''") + "'"
}

// Filter: must have customer, project_name, product_name, color
const records = dataRows
  .filter(
    (r) =>
      r[3] &&
      String(r[3]).trim() &&
      r[4] &&
      String(r[4]).trim() &&
      r[5] &&
      String(r[5]).trim() &&
      r[6] &&
      String(r[6]).trim(),
  )
  .map((r) => ({
    schedule_date: parseDate(r[1]),
    planned_delivery_date: parseDate(r[2]),
    customer: String(r[3]).trim(),
    project_name: String(r[4]).trim(),
    product_name: String(r[5]).trim(),
    color: String(r[6]).trim(),
    quantity: parseQty(r[7]) ?? 1,
    material_selection_date: parseDate(r[8]),
    painting_date: parseDate(r[9]),
    film_date: parseDate(r[10]),
    cutting_required_date: parseDate(r[11]),
    cutting_actual_date: parseDate(r[12]),
    processing_required_date: parseDate(r[13]),
    processing_actual_date: parseDate(r[14]),
    inspection_date: parseDate(r[15]),
    assembly_date: parseDate(r[16]),
    packaging_date: parseDate(r[17]),
    delivery_date: parseDate(r[18]),
    remarks: r[19] ? String(r[19]).trim() : '',
    // tinting_plan_date, painting_plan_date, film_plan_date — not in Excel
  }))

// 对重复的 project_name 追加 -1/-2/-3 编号
const pnameCount = {}
records.forEach((r) => {
  pnameCount[r.project_name] = (pnameCount[r.project_name] || 0) + 1
})
const dupNames = new Set(
  Object.entries(pnameCount)
    .filter(([, v]) => v > 1)
    .map(([k]) => k),
)
const pnameSeq = {}
records.forEach((r) => {
  if (dupNames.has(r.project_name)) {
    pnameSeq[r.project_name] = (pnameSeq[r.project_name] || 0) + 1
    r.project_name = `${r.project_name}-${pnameSeq[r.project_name]}`
  }
})

console.log(`Valid records to import: ${records.length}`)
console.log('Skipped (empty rows):', dataRows.length - records.length)
console.log('')
console.log('--- Preview first 3 records ---')
records
  .slice(0, 3)
  .forEach((r, i) => console.log(`[${i + 1}]`, JSON.stringify(r)))
console.log('...')
console.log('--- Preview last 3 records ---')
records
  .slice(-3)
  .forEach((r, i) =>
    console.log(`[${records.length - 2 + i}]`, JSON.stringify(r)),
  )

// Generate SQL
const cols = [
  'id',
  'schedule_date',
  'planned_delivery_date',
  'customer',
  'project_name',
  'product_name',
  'color',
  'quantity',
  'remarks',
  'status',
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
  'tinting_plan_date',
  'painting_plan_date',
  'film_plan_date',
].join(', ')

const batchSize = 50
const batches = []

for (let i = 0; i < records.length; i += batchSize) {
  const batch = records.slice(i, i + batchSize)
  const values = batch
    .map((r) => {
      const v = [
        'gen_random_uuid()',
        sqlVal(r.schedule_date),
        sqlVal(r.planned_delivery_date),
        sqlVal(r.customer),
        sqlVal(r.project_name),
        sqlVal(r.product_name),
        sqlVal(r.color),
        sqlVal(r.quantity, true),
        sqlVal(r.remarks),
        sqlVal('open'),
        sqlVal(r.material_selection_date),
        sqlVal(r.painting_date),
        sqlVal(r.film_date),
        sqlVal(r.cutting_required_date),
        sqlVal(r.cutting_actual_date),
        sqlVal(r.processing_required_date),
        sqlVal(r.processing_actual_date),
        sqlVal(r.inspection_date),
        sqlVal(r.assembly_date),
        sqlVal(r.packaging_date),
        sqlVal(r.delivery_date),
        'NULL', // tinting_plan_date
        'NULL', // painting_plan_date
        'NULL', // film_plan_date
      ]
      return `(${v.join(', ')})`
    })
    .join(',\n')

  batches.push(`INSERT INTO villa_lift_orders (${cols}) VALUES\n${values};`)
}

const header = `-- villa_lift_orders import from 别墅梯计划进度表.xlsx (2026 sheet)
-- Generated: ${new Date().toISOString()}
-- Total records: ${records.length}
-- Skipped empty rows: ${dataRows.length - records.length}
-- Strategy: INSERT only (no conflict key — each row is a new order)
-- Status defaults to 'open'
-- tinting_plan_date / painting_plan_date / film_plan_date not in source Excel → NULL

`

const sql = header + batches.join('\n\n')
const outPath = join(root, 'docs/imports/villa_lift_orders_import_2026.sql')
writeFileSync(outPath, sql, 'utf8')
console.log(`\nSQL written to: docs/imports/villa_lift_orders_import_2026.sql`)
console.log(`Batches: ${batches.length} × up to ${batchSize} rows each`)
