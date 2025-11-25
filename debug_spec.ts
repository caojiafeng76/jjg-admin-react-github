import * as XLSX from 'xlsx'
import * as fs from 'fs'

const filePath = 'e:\\code\\jjg-admin-react-github\\11.27.xlsx'
const fileBuffer = fs.readFileSync(filePath)
const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
const sheetName = workbook.SheetNames[0]
const worksheet = workbook.Sheets[sheetName]
const jsonData = XLSX.utils.sheet_to_json(worksheet, {
  raw: true,
  defval: null,
})

// Helper function to simulate extractSpecFromRows logic
function debugInference(rows: any[]) {
  console.log('Total rows:', rows.length)

  // 1. Find Front Plate
  const frontPlateRow = rows.find(
    (row) =>
      (row['物料名称'] && String(row['物料名称']).includes('前沿板')) ||
      (row['物料件号'] && String(row['物料件号']).startsWith('XN2808EB')) ||
      (row['物料件号'] && String(row['物料件号']).startsWith('XN3024BR')),
  )
  console.log(
    'Front Plate Row:',
    frontPlateRow
      ? {
          物料名称: frontPlateRow['物料名称'],
          物料件号: frontPlateRow['物料件号'],
          规格: frontPlateRow['规格'],
        }
      : 'Not Found',
  )

  // 2. Find Middle Plate
  const middlePlateRow = rows.find(
    (row) =>
      (row['物料名称'] && String(row['物料名称']).includes('中板')) ||
      (row['物料件号'] && String(row['物料件号']).startsWith('XN2808BP')) ||
      (row['物料件号'] && String(row['物料件号']).startsWith('XN2808BQ')) ||
      (row['物料件号'] && String(row['物料件号']).startsWith('XN3024BS')) ||
      (row['物料件号'] && String(row['物料件号']).startsWith('XN3024BT')),
  )
  console.log(
    'Middle Plate Row:',
    middlePlateRow
      ? {
          物料名称: middlePlateRow['物料名称'],
          物料件号: middlePlateRow['物料件号'],
          规格: middlePlateRow['规格'],
        }
      : 'Not Found',
  )
}

debugInference(jsonData)
