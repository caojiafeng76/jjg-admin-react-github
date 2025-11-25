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

// Filter for rows that might be "Back Plate" (后板)
const backPlates = jsonData.filter(
  (row: any) => row['物料名称'] && row['物料名称'].includes('后板'),
)

console.log('Found Back Plates:', backPlates.length)
if (backPlates.length > 0) {
  console.log(
    'Back Plate Samples:',
    JSON.stringify(
      backPlates.map((row: any) => ({
        物料名称: row['物料名称'],
        备注: row['备注'],
      })),
      null,
      2,
    ),
  )
} else {
  console.log('No "后板" found. Listing all PartNames and Remarks:')
  console.log(
    JSON.stringify(
      jsonData.map((row: any) => ({
        物料名称: row['物料名称'],
        备注: row['备注'],
      })),
      null,
      2,
    ),
  )
}
