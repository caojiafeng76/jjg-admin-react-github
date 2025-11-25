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

const headers = Object.keys(jsonData[0])
const firstRow = jsonData[0]
const sonos = jsonData.map((row) => row['生产编号']).filter((v) => v)
const uniqueSonos = [...new Set(sonos)]

const output = {
  headers,
  firstRow,
  uniqueSonos,
}

fs.writeFileSync(
  'e:\\code\\jjg-admin-react-github\\debug_output.txt',
  JSON.stringify(output, null, 2),
)
