/**
 * 重新解析 别墅梯计划进度表.xlsx 2026 sheet（使用 raw:false 获取格式化文本，避免 4.30 被识别为 4.3）
 * 与数据库 villa_lift_orders 现有数据对比，输出差异 + 生成 UPDATE SQL
 *
 * Usage: node scripts/compare-villa-lift-2026.mjs
 */
import * as XLSX from 'xlsx'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const xlsxPath = join(root, '别墅梯计划进度表.xlsx')
const wb = XLSX.read(readFileSync(xlsxPath), { type: 'buffer' })
const ws = wb.Sheets['别墅梯计划进度表2026']
// raw:false → 拿 Excel 显示文本（"4.30" 不会变 4.3）
const rows = XLSX.utils.sheet_to_json(ws, {
  header: 1,
  defval: null,
  raw: false,
})

const dataRows = rows
  .slice(2)
  .filter(
    (r) => r[0] !== null && r[0] !== undefined && String(r[0]).trim() !== '',
  )

/**
 * 解析日期。支持 "2026.1.5" / "1.20" / "4.30 " / "1.30     "
 * 不支持 "春节后..." / "加急" → null
 */
function parseDate(v) {
  if (v === null || v === undefined) return null
  const str = String(v).trim()
  if (!str) return null
  if (!/^\d/.test(str)) return null

  let year, month, day
  if (/^\d{4}[.]/.test(str)) {
    const p = str.split('.')
    year = parseInt(p[0])
    month = parseInt(p[1])
    day = parseInt(p[2])
  } else {
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
    serial: r[0],
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
  }))

// 对重复的 project_name 追加 -1/-2/-3，与导入脚本一致，便于 join
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

console.log(`Excel 解析有效记录数: ${records.length}`)
const outPath = join(root, 'docs/imports/villa_lift_orders_2026_truth.json')
writeFileSync(outPath, JSON.stringify(records, null, 2), 'utf8')
console.log(`已写出真实期望数据: ${outPath}`)
