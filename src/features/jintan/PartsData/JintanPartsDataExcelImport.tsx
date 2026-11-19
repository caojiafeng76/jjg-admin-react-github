import type { TableColumnsType } from 'antd'
import type { JintanPartsDataFormValues } from '@/services/apiJintanPartsData'
import ExcelImportModal from '@/ui/ExcelImportModal'

function loadExcel() {
  return import('@/utils/jintanPartsDataExcel')
}

function preloadExcel() {
  void loadExcel()
}

export interface JintanPartsDataExcelImportProps {
  onImport: (rows: JintanPartsDataFormValues[]) => Promise<void>
  isImporting: boolean
  permissionKey?: string
}

type PreviewRow = JintanPartsDataFormValues & { _idx: number }

const PREVIEW_COLUMNS: TableColumnsType<PreviewRow> = [
  {
    title: '#',
    dataIndex: '_idx',
    width: 60,
    render: (value: number) => value + 1,
  },
  {
    title: '类型',
    dataIndex: 'item_type',
    width: 70,
  },
  {
    title: '名称',
    dataIndex: 'part_name',
    width: 180,
  },
  {
    title: '规格',
    dataIndex: 'specification',
    width: 140,
  },
  {
    title: '颜色',
    dataIndex: 'color',
    width: 100,
    render: (value: string) => value || '-',
  },
  {
    title: '材质',
    dataIndex: 'material',
    width: 120,
  },
  {
    title: '采购厂家',
    dataIndex: 'supplier',
    width: 150,
  },
  {
    title: '备注',
    dataIndex: 'remarks',
    width: 180,
  },
]

export default function JintanPartsDataExcelImport({
  onImport,
  isImporting,
  permissionKey,
}: JintanPartsDataExcelImportProps) {
  return (
    <ExcelImportModal<JintanPartsDataFormValues>
      title="批量导入配件资料"
      tip="请先下载模板，按模板列顺序填写；表头需保持不变；空白行会自动跳过；类型、颜色列选填，类型留空按 A；类型、名称、规格与颜色均相同的行视为重复，导入会失败。"
      columns={PREVIEW_COLUMNS}
      parseFile={async (file) => {
        const { parseJintanPartsDataExcel } = await loadExcel()
        return parseJintanPartsDataExcel(file)
      }}
      onDownloadTemplate={async () => {
        const { downloadJintanPartsDataTemplate } = await loadExcel()
        downloadJintanPartsDataTemplate()
      }}
      onImport={onImport}
      isImporting={isImporting}
      permissionKey={permissionKey}
      onPreload={preloadExcel}
    />
  )
}
