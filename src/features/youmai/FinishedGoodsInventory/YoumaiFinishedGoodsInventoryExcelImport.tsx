import type { TableColumnsType } from 'antd'
import type { YoumaiFinishedGoodsInventoryImportRow } from '@/services/apiYoumaiFinishedGoodsInventory'
import ExcelImportModal from '@/ui/ExcelImportModal'

function loadYoumaiFinishedGoodsInventoryExcel() {
  return import('@/utils/youmaiFinishedGoodsInventoryExcel')
}

function preloadYoumaiFinishedGoodsInventoryExcel() {
  void loadYoumaiFinishedGoodsInventoryExcel()
}

export interface YoumaiFinishedGoodsInventoryExcelImportProps {
  onImport: (rows: YoumaiFinishedGoodsInventoryImportRow[]) => Promise<void>
  isImporting: boolean
  permissionKey?: string
}

type PreviewRow = YoumaiFinishedGoodsInventoryImportRow & { _idx: number }

const PREVIEW_COLUMNS: TableColumnsType<PreviewRow> = [
  {
    title: '#',
    dataIndex: '_idx',
    width: 60,
    render: (value: number) => value + 1,
  },
  {
    title: '物料编码',
    dataIndex: 'material_code',
    width: 180,
  },
  {
    title: '现有库存',
    dataIndex: 'current_stock',
    width: 120,
    align: 'right',
  },
  {
    title: '备注',
    dataIndex: 'remarks',
    width: 220,
  },
]

export default function YoumaiFinishedGoodsInventoryExcelImport({
  onImport,
  isImporting,
  permissionKey,
}: YoumaiFinishedGoodsInventoryExcelImportProps) {
  return (
    <ExcelImportModal<YoumaiFinishedGoodsInventoryImportRow>
      title="导入优迈成品库存"
      tip="请先下载模板后填写，模板列顺序必须保持不变；空白行会自动跳过。导入会按物料编码匹配货品资料，存在库存则更新现有库存和备注，不会覆盖待入库、待出库。"
      columns={PREVIEW_COLUMNS}
      parseFile={async (file) => {
        const { parseYoumaiFinishedGoodsInventoryExcel }
          = await loadYoumaiFinishedGoodsInventoryExcel()
        return parseYoumaiFinishedGoodsInventoryExcel(file)
      }}
      onDownloadTemplate={async () => {
        const { downloadYoumaiFinishedGoodsInventoryTemplate }
          = await loadYoumaiFinishedGoodsInventoryExcel()
        downloadYoumaiFinishedGoodsInventoryTemplate()
      }}
      onImport={onImport}
      isImporting={isImporting}
      permissionKey={permissionKey}
      onPreload={preloadYoumaiFinishedGoodsInventoryExcel}
      importButtonText="导入库存"
      templateButtonText="下载库存模板"
    />
  )
}
