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

const backPlates = jsonData.filter(
  (row: any) => row['物料名称'] && row['物料名称'].includes('后板'),
)

if (backPlates.length > 0) {
  const remark = backPlates[0]['备注']
  console.log('Full Remark:', remark)
} else {
  console.log('No Back Plate found')
}
