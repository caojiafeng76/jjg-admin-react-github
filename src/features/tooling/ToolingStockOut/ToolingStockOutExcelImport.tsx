import type { TableColumnsType } from 'antd'
import type { ToolingStockOutImportRow } from '@/services/apiToolingStockOut'
import ExcelImportModal from '@/ui/ExcelImportModal'
import { TOOLING_MANAGE_PERMISSION_KEY } from '../permissions'

const loadToolingStockOutExcel = () => import('@/utils/toolingStockOutExcel')

function preloadToolingStockOutExcel() {
  void loadToolingStockOutExcel()
}

interface Props {
  onImport: (rows: ToolingStockOutImportRow[]) => Promise<void>
  isImporting: boolean
}

type PreviewRow = ToolingStockOutImportRow & { _idx: number }

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
    title: '刀具名称',
    dataIndex: 'tool_name',
    width: 180,
  },
  {
    title: '领用人',
    dataIndex: 'recipient',
    width: 120,
  },
  {
    title: '用途',
    dataIndex: 'purpose',
    width: 180,
  },
  {
    title: '出库日期',
    dataIndex: 'stock_out_date',
    width: 120,
  },
  {
    title: '出库数量',
    dataIndex: 'stock_out_quantity',
    width: 120,
  },
  {
    title: '领用方式',
    dataIndex: 'collection_method',
    width: 100,
  },
  {
    title: '备注',
    dataIndex: 'remarks',
    width: 240,
  },
]

export default function ToolingStockOutExcelImport({
  onImport,
  isImporting,
}: Props) {
  return (
    <ExcelImportModal<ToolingStockOutImportRow>
      title="导入刀具出库"
      importButtonText="导入出库"
      templateButtonText="下载出库模板"
      tip="请先下载模板后填写，必须包含刀具编号、领用人、用途、出库日期、出库数量。系统会按刀具编号匹配刀具资料，默认导入为待审核。"
      columns={PREVIEW_COLUMNS}
      permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
      onPreload={preloadToolingStockOutExcel}
      parseFile={async (file) => {
        const { parseToolingStockOutExcel } = await loadToolingStockOutExcel()
        return parseToolingStockOutExcel(file)
      }}
      onDownloadTemplate={async () => {
        const { downloadToolingStockOutTemplate } = await loadToolingStockOutExcel()
        downloadToolingStockOutTemplate()
      }}
      onImport={onImport}
      isImporting={isImporting}
    />
  )
}
