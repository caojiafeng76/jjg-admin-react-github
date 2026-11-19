import type { TableColumnsType } from 'antd'
import type { JintanProfilesDataFormValues } from '@/services/apiJintanProfilesData'
import ExcelImportModal from '@/ui/ExcelImportModal'

function loadExcel() {
  return import('@/utils/jintanProfilesDataExcel')
}

function preloadExcel() {
  void loadExcel()
}

export interface JintanProfilesDataExcelImportProps {
  onImport: (rows: JintanProfilesDataFormValues[]) => Promise<void>
  isImporting: boolean
  permissionKey?: string
}

type PreviewRow = JintanProfilesDataFormValues & { _idx: number }

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
    title: '型号',
    dataIndex: 'profile_model',
    width: 150,
  },
  {
    title: '名称',
    dataIndex: 'profile_name',
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
    title: '备注',
    dataIndex: 'remarks',
    width: 180,
  },
]

export default function JintanProfilesDataExcelImport({
  onImport,
  isImporting,
  permissionKey,
}: JintanProfilesDataExcelImportProps) {
  return (
    <ExcelImportModal<JintanProfilesDataFormValues>
      title="批量导入型材资料"
      tip="请先下载模板，按模板列顺序填写；表头需保持不变；空白行会自动跳过；类型、颜色列选填，类型留空按 A；类型、型号、名称、规格与颜色均相同的行视为重复，导入会失败。"
      columns={PREVIEW_COLUMNS}
      parseFile={async (file) => {
        const { parseJintanProfilesDataExcel } = await loadExcel()
        return parseJintanProfilesDataExcel(file)
      }}
      onDownloadTemplate={async () => {
        const { downloadJintanProfilesDataTemplate } = await loadExcel()
        downloadJintanProfilesDataTemplate()
      }}
      onImport={onImport}
      isImporting={isImporting}
      permissionKey={permissionKey}
      onPreload={preloadExcel}
    />
  )
}
