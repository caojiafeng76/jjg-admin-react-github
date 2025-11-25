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

console.log('All Headers:', Object.keys(jsonData[0]))
// Print first 5 rows to see data distribution
console.log('First 5 Rows Data:', JSON.stringify(jsonData.slice(0, 5), null, 2))
