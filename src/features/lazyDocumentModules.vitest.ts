import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const PAGE_DOCUMENT_MODULES = [
  [
    'src/features/attendance/AttendanceStats/index.tsx',
    '@/utils/attendanceMonthlyExcel',
  ],
  [
    'src/features/attendance/AttendanceDetail/AttendanceExcelImport.tsx',
    '@/utils/attendanceExcel',
  ],
  [
    'src/features/extrusion-production-daily-report/index.tsx',
    '@/utils/extrusionProductionDailyReportExcel',
  ],
  ['src/features/material-transfer/index.tsx', '@/utils/materialTransferExcel'],
  [
    'src/features/precision-cutting-transfer/index.tsx',
    '@/utils/precisionCuttingTransferExcel',
  ],
  [
    'src/features/precision-finishing-cutting/index.tsx',
    '@/utils/precisionFinishingCuttingExcel',
  ],
  [
    'src/features/production-report/index.tsx',
    '@/utils/productionDailyReportExcel',
  ],
  ['src/features/production-order/index.tsx', '@/utils/productionOrderExcel'],
  [
    'src/features/production-order/index.tsx',
    '@/utils/productionOrderNightSnackExcel',
  ],
  [
    'src/features/quality/IssueRecord/index.tsx',
    '@/utils/qualityIssueRecordExcel',
  ],
  [
    'src/features/labor-protection/LaborProtectionRequisition/index.tsx',
    '@/utils/laborProtectionRequisitionExport',
  ],
  ['src/features/tooling/ToolingData/index.tsx', '@/utils/toolingDataExcel'],
  [
    'src/features/tooling/ToolingData/ToolingDataExcelImport.tsx',
    '@/utils/toolingDataExcel',
  ],
  [
    'src/features/tooling/ToolingInventory/ToolingInventoryExcelImport.tsx',
    '@/utils/toolingInventoryExcel',
  ],
  [
    'src/features/tooling/ToolingStockOut/index.tsx',
    '@/utils/toolingStockOutExport',
  ],
  [
    'src/features/tooling/ToolingStockOut/ToolingStockOutExcelImport.tsx',
    '@/utils/toolingStockOutExcel',
  ],
  [
    'src/features/youmai/RawMaterialInventory/index.tsx',
    '@/utils/youmaiRawMaterialInventoryExcel',
  ],
  [
    'src/features/youmai/FinishedGoodsInventory/YoumaiFinishedGoodsInventoryExcelImport.tsx',
    '@/utils/youmaiFinishedGoodsInventoryExcel',
  ],
  [
    'src/features/youmai/ProductData/YoumaiProductDataExcelImport.tsx',
    '@/utils/youmaiProductDataExcel',
  ],
  [
    'src/features/youmai/FinishedGoodsStockOut/index.tsx',
    '@/utils/youmaiFinishedGoodsStockOutExport',
  ],
  [
    'src/features/youmai/FinishedGoodsStockOut/YoumaiFinishedGoodsStockOutExcelImport.tsx',
    '@/utils/youmaiFinishedGoodsStockOutExcel',
  ],
  [
    'src/features/workshop/StandardTimeList/index.tsx',
    '@/utils/costAccountingExcel',
  ],
  [
    'src/features/workshop/ProductionScheduling/index.tsx',
    '@/utils/productionSchedulingPlanExcel',
  ],
  [
    'src/features/workshop/OrderStatusDashboard/index.tsx',
    '@/utils/orderStatusDashboardExcel',
  ],
] as const

const DIRECT_HEAVY_MODULES = [
  'src/features/tooling/ToolingStockOut/usePrintToolingStockOut.ts',
  'src/features/youmai/FinishedGoodsStockOut/usePrintYoumaiLabel.ts',
  'src/features/youmai/FinishedGoodsStockOut/usePrintYoumaiFinishedGoodsStockOut.ts',
  'src/features/workshop/OrderList/useExportWorkshopOrdersAsExcel.ts',
  'src/features/workshop/OrderList/usePrintWorkshopOrders.ts',
  'src/features/villa-lift/OrderList/useExportVillaLiftOrdersAsExcel.ts',
  'src/features/packaging-process/WorkOrderList/useExportWorkOrdersAsExcel.ts',
  'src/utils/workshopExcel.ts',
] as const

const PDF_RUNTIME_MODULES = [
  [
    'src/features/tooling/ToolingStockOut/usePrintToolingStockOut.ts',
    ['jspdf-autotable', '@/utils/pdfUtils'],
  ],
  [
    'src/features/youmai/FinishedGoodsStockOut/usePrintYoumaiLabel.ts',
    ['jspdf', '@/utils/pdfUtils'],
  ],
  [
    'src/features/youmai/FinishedGoodsStockOut/usePrintYoumaiFinishedGoodsStockOut.ts',
    ['jspdf-autotable', '@/utils/pdfUtils'],
  ],
] as const

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

function getStaticImportSpecifiers(source: string): string[] {
  return Array.from(
    source.matchAll(/^import\s+(?!type\b)[\s\S]*?\sfrom\s+['"]([^'"]+)['"]/gm),
    (match) => match[1],
  )
}

describe('lazy document modules', () => {
  it.each(PAGE_DOCUMENT_MODULES)(
    '%s loads %s only after an export interaction',
    (file, documentModule) => {
      const source = readProjectFile(file)

      expect(getStaticImportSpecifiers(source)).not.toContain(documentModule)
      expect(source).toContain(`import('${documentModule}')`)
      expect(source).toMatch(/onPreload|onMouseEnter/)
      expect(source).toMatch(/onPreload|onFocus/)
    },
  )

  it.each(DIRECT_HEAVY_MODULES)(
    '%s does not statically load PDF or spreadsheet runtimes',
    (file) => {
      const source = readProjectFile(file)
      const staticImports = getStaticImportSpecifiers(source)

      expect(staticImports).not.toContain('xlsx-js-style')
      expect(staticImports).not.toContain('jspdf')
      expect(staticImports).not.toContain('jspdf-autotable')
      expect(staticImports).not.toContain('@/utils/pdfUtils')
    },
  )

  it.each(PDF_RUNTIME_MODULES)(
    '%s dynamically loads its PDF runtime and exposes a preloader',
    (file, runtimeModules) => {
      const source = readProjectFile(file)

      runtimeModules.forEach((runtimeModule) => {
        expect(source).toContain(`import('${runtimeModule}')`)
      })
      expect(source).toMatch(/preloadPrint/)
    },
  )
})
