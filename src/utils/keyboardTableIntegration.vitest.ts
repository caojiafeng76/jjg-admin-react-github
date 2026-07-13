import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const INTERACTIVE_TABLES = [
  'src/features/extrusion-production/ExtrusionProductionTable.tsx',
  'src/features/labor-protection/LaborProtectionData/LaborProtectionDataTable.tsx',
  'src/features/labor-protection/LaborProtectionRequisition/LaborProtectionRequisitionTable.tsx',
  'src/features/machine-runtime/MachineRuntimeSummaryTable.tsx',
  'src/features/material-transfer/MaterialTransferTable.tsx',
  'src/features/packaging-process/EmployeeList/EmployeeTable.tsx',
  'src/features/packaging-process/StandardTimeList/StandardTimeTable.tsx',
  'src/features/packaging-process/WorkOrderList/WorkOrderTable.tsx',
  'src/features/precision-cutting-transfer/MaterialTransferTable.tsx',
  'src/features/precision-finishing-cutting/PrecisionFinishingCuttingTable.tsx',
  'src/features/production-order/ProductionOrderList.tsx',
  'src/features/quality/IssueRecord/IssueRecordTable.tsx',
  'src/features/quality/ReworkRepair/ReworkRepairTable.tsx',
  'src/features/syney/PoDetail/DetailTable.tsx',
  'src/features/syney/PoList/PoTable.tsx',
  'src/features/syney/ReportDetail/DetailTable.tsx',
  'src/features/syney/ReportList/ReportTable.tsx',
  'src/features/syney/SpecList/SpecTable.tsx',
  'src/features/tooling/ToolingData/ToolingDataTable.tsx',
  'src/features/tooling/ToolingInventory/ToolingInventoryTable.tsx',
  'src/features/tooling/ToolingStockIn/ToolingStockInTable.tsx',
  'src/features/tooling/ToolingStockOut/ToolingStockOutTable.tsx',
  'src/features/workshop/JobBaseSetting/JobBaseSettingTable.tsx',
  'src/features/workshop/MachineEquipmentMaintenance/MachineEquipmentMaintenanceTable.tsx',
  'src/features/workshop/OrderList/WorkshopOrderTable.tsx',
  'src/features/workshop/StandardTimeList/StandardTimeTable.tsx',
  'src/features/youmai/FinishedGoodsInventory/YoumaiFinishedGoodsInventoryTable.tsx',
  'src/features/youmai/FinishedGoodsStockIn/YoumaiFinishedGoodsStockInTable.tsx',
  'src/features/youmai/FinishedGoodsStockOut/YoumaiFinishedGoodsStockOutTable.tsx',
  'src/features/youmai/ProductData/YoumaiProductDataTable.tsx',
] as const

describe('interactive table keyboard integration', () => {
  it.each(INTERACTIVE_TABLES)(
    '%s exposes the shared keyboard row behavior',
    (file) => {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8')
      const usages = source.match(/createKeyboardTableRowProps/g) ?? []

      expect(usages.length).toBeGreaterThanOrEqual(2)
    },
  )
})
