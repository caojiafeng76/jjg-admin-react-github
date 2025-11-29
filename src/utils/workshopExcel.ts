import * as XLSX from 'xlsx'
import type { WorkshopOrder } from '@/features/workshop/OrderList'

const TEMPLATE_HEADERS = [
  '产品交货日期(yyyy-mm-dd)',
  '项目号',
  '产品型号',
  '长度(mm)',
  '客户型号',
  '订支数',
  '每米理论重(kg/m)',
  '颜色名称',
  '包装名称',
  '产品类别',
  '材质名称',
  '料号',
]

export function downloadWorkshopOrderTemplate() {
  const wb = XLSX.utils.book_new()
  const wsData = [TEMPLATE_HEADERS]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  XLSX.utils.book_append_sheet(wb, ws, '车间订单模板')
  XLSX.writeFile(wb, '车间订单导入模板.xlsx')
}

export interface WorkshopOrderExcelRow {
  '产品交货日期(yyyy-mm-dd)': string
  项目号: string
  产品型号: string
  '长度(mm)': number
  客户型号: string
  订支数: number
  '每米理论重(kg/m)': number
  颜色名称: string
  包装名称: string
  产品类别: string
  材质名称: string
  料号: string
}

export async function parseWorkshopOrderExcel(file: File): Promise<WorkshopOrder[]> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  const rows = XLSX.utils.sheet_to_json<WorkshopOrderExcelRow>(sheet, {
    defval: '',
  })

  return rows
    .filter((row) => !!row.项目号 || !!row.产品型号)
    .map((row) => ({
      product_delivery_date: row['产品交货日期(yyyy-mm-dd)'] || '',
      project_no: row.项目号 || null,
      product_model: row.产品型号 || null,
      length_mm: row['长度(mm)'] ?? null,
      customer_model: row.客户型号 || null,
      order_quantity: row.订支数 ?? null,
      weight_per_meter_kg: row['每米理论重(kg/m)'] ?? null,
      color_name: row.颜色名称 || null,
      package_name: row.包装名称 || null,
      product_category: row.产品类别 || null,
      material_name: row.材质名称 || null,
      material_code: row.料号 || null,
    }))
}
