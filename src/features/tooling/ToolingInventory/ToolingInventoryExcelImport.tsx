import type { TableColumnsType } from 'antd'
import type { ToolingInventoryImportRow } from '@/services/apiToolingInventory'
import ExcelImportModal from '@/ui/ExcelImportModal'
import { TOOLING_MANAGE_PERMISSION_KEY } from '../permissions'

const loadToolingInventoryExcel = () => import('@/utils/toolingInventoryExcel')

function preloadToolingInventoryExcel() {
  void loadToolingInventoryExcel()
}

interface Props {
  onImport: (rows: ToolingInventoryImportRow[]) => Promise<void>
  isImporting: boolean
}

type PreviewRow = ToolingInventoryImportRow & { _idx: number }

const PREVIEW_COLUMNS: TableColumnsType<PreviewRow> = [
  {
    title: '#',
    dataIndex: '_idx',
    width: 60,
    render: (value: number) => value + 1,
  },
  {
    title: '刀具编号',
    dataIndex: 'tool_code',
    width: 180,
  },
  {
    title: '现有库存',
    dataIndex: 'current_stock',
    width: 120,
  },
  {
    title: '备注',
    dataIndex: 'remarks',
    width: 220,
  },
]

export default function ToolingInventoryExcelImport({
  onImport,
  isImporting,
}: Props) {
  return (
    <ExcelImportModal<ToolingInventoryImportRow>
      title="导入刀具库存"
      importButtonText="导入库存"
      templateButtonText="下载库存模板"
      tip="请先下载模板后填写，模板列顺序必须保持不变；空白行会自动跳过。导入会按刀具编号匹配刀具资料，存在库存则更新现有库存和备注，不会覆盖待入库、待出库。"
      columns={PREVIEW_COLUMNS}
      permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
      onPreload={preloadToolingInventoryExcel}
      parseFile={async (file) => {
        const { parseToolingInventoryExcel } = await loadToolingInventoryExcel()
        return parseToolingInventoryExcel(file)
      }}
      onDownloadTemplate={async () => {
        const { downloadToolingInventoryTemplate }
          = await loadToolingInventoryExcel()
        downloadToolingInventoryTemplate()
      }}
      onImport={onImport}
      isImporting={isImporting}
    />
  )
}
