import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import XLSX from 'xlsx-js-style'

const SOURCE_FILE = './刀具资料导入模板(1).xlsx'
const OUTPUT_FILE = 'docs/imports/tooling_data_import_2026-05-04.sql'

const CODE_CORRECTIONS_BY_EXCEL_ROW = {
  147: 'Z-D7.8-01',
  223: 'SZ-M8-02',
}

function normalize(value) {
  return String(value ?? '').trim()
}

const workbook = XLSX.readFile(SOURCE_FILE)
const worksheet = workbook.Sheets[workbook.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

const payload = rows
  .map((row, index) => {
    const excelRow = index + 2
    const usage = normalize(row['用途']) || '未填写'

    return {
      source_row: excelRow,
      tool_code:
        CODE_CORRECTIONS_BY_EXCEL_ROW[excelRow] || normalize(row['刀具编号']),
      tool_name: normalize(row['刀具名称']),
      tool_spec: normalize(row['刀具规格']) || usage,
      material: normalize(row['材质']) || normalize(row['材质/涂层']),
      unit_price: Number(row['单价'] || 0),
      usage,
      remarks: normalize(row['备注']) || '未填写',
    }
  })
  .filter(
    (row) =>
      row.tool_code ||
      row.tool_name ||
      row.tool_spec ||
      row.material ||
      row.unit_price ||
      row.usage ||
      row.remarks,
  )

const duplicateCodeCounts = payload.reduce((counts, row) => {
  counts.set(row.tool_code, (counts.get(row.tool_code) ?? 0) + 1)
  return counts
}, new Map())

const duplicateCodes = Array.from(duplicateCodeCounts.entries()).filter(
  ([, count]) => count > 1,
)

const invalidRows = payload.filter(
  (row) =>
    !row.tool_code ||
    !row.tool_name ||
    !row.tool_spec ||
    !row.material ||
    !row.usage ||
    !row.remarks ||
    !Number.isFinite(row.unit_price) ||
    row.unit_price < 0,
)

if (duplicateCodes.length > 0 || invalidRows.length > 0) {
  console.error(JSON.stringify({ duplicateCodes, invalidRows }, null, 2))
  process.exit(1)
}

const importJson = JSON.stringify(payload)

const sql = `with import_rows as (
  select *
  from jsonb_to_recordset($json$${importJson}$json$::jsonb) as x(
    source_row integer,
    tool_code text,
    tool_name text,
    tool_spec text,
    material text,
    unit_price numeric,
    usage text,
    remarks text
  )
), upserted as (
  insert into public.tooling_data (
    tool_code,
    tool_name,
    tool_spec,
    material,
    unit_price,
    usage,
    remarks
  )
  select
    tool_code,
    tool_name,
    tool_spec,
    material,
    unit_price,
    usage,
    remarks
  from import_rows
  on conflict (tool_code) do update
  set tool_name = excluded.tool_name,
    tool_spec = excluded.tool_spec,
    material = excluded.material,
    unit_price = excluded.unit_price,
    usage = excluded.usage,
    remarks = excluded.remarks,
    updated_at = now()
  returning tool_code
)
select count(*) as affected_rows from upserted;
`

mkdirSync(dirname(OUTPUT_FILE), { recursive: true })
writeFileSync(OUTPUT_FILE, sql, 'utf8')

console.log(
  JSON.stringify(
    {
      outputFile: join(process.cwd(), OUTPUT_FILE),
      sourceRows: rows.length,
      importRows: payload.length,
      corrections: CODE_CORRECTIONS_BY_EXCEL_ROW,
      filledSpecRows: payload
        .filter((row) => [206, 207, 208, 209, 210].includes(row.source_row))
        .map(({ source_row, tool_code, tool_spec, usage }) => ({
          source_row,
          tool_code,
          tool_spec,
          usage,
        })),
    },
    null,
    2,
  ),
)
