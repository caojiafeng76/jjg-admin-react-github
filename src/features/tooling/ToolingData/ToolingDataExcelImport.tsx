import type { TableColumnsType } from 'antd'
import type { ToolingDataFormValues } from '@/services/apiToolingData'
import ExcelImportModal from '@/ui/ExcelImportModal'
import { TOOLING_MANAGE_PERMISSION_KEY } from '../permissions'

const loadToolingDataExcel = () => import('@/utils/toolingDataExcel')

function preloadToolingDataExcel() {
  void loadToolingDataExcel()
}

interface Props {
  onImport: (rows: ToolingDataFormValues[]) => Promise<void>
  isImporting: boolean
}

type PreviewRow = ToolingDataFormValues & { _idx: number }

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
    width: 140,
  },
  {
    title: '刀具名称',
    dataIndex: 'tool_name',
    width: 160,
  },
  {
    title: '刀具规格',
    dataIndex: 'tool_spec',
    width: 160,
  },
  {
    title: '材质',
    dataIndex: 'material',
    width: 120,
  },
  {
    title: '单价',
    dataIndex: 'unit_price',
    width: 100,
  },
]

export default function ToolingDataExcelImport({
  onImport,
  isImporting,
}: Props) {
  return (
    <ExcelImportModal<ToolingDataFormValues>
      title="导入刀具资料"
      tip="请先下载模板后填写，模板列顺序必须保持不变；空白行会自动跳过。"
      columns={PREVIEW_COLUMNS}
      permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
      onPreload={preloadToolingDataExcel}
      parseFile={async (file) => {
        const { parseToolingDataExcel } = await loadToolingDataExcel()
        return parseToolingDataExcel(file)
      }}
      onDownloadTemplate={async () => {
        const { downloadToolingDataTemplate } = await loadToolingDataExcel()
        downloadToolingDataTemplate()
      }}
      onImport={onImport}
      isImporting={isImporting}
    />
  )
}
