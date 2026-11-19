import type { TableColumnsType } from 'antd'
import type { JintanMaterialsDataFormValues } from '@/services/apiJintanMaterialsData'
import ExcelImportModal from '@/ui/ExcelImportModal'

function loadExcel() {
  return import('@/utils/jintanMaterialsDataExcel')
}

function preloadExcel() {
  void loadExcel()
}

export interface JintanMaterialsDataExcelImportProps {
  onImport: (rows: JintanMaterialsDataFormValues[]) => Promise<void>
  isImporting: boolean
  permissionKey?: string
}

type PreviewRow = JintanMaterialsDataFormValues & { _idx: number }

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
    dataIndex: 'material_model',
    width: 150,
  },
  {
    title: '名称',
    dataIndex: 'material_name',
    width: 180,
  },
  {
    title: '规格',
    dataIndex: 'specification',
    width: 140,
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

export default function JintanMaterialsDataExcelImport({
  onImport,
  isImporting,
  permissionKey,
}: JintanMaterialsDataExcelImportProps) {
  return (
    <ExcelImportModal<JintanMaterialsDataFormValues>
      title="批量导入素材资料"
      tip="请先下载模板，按模板列顺序填写；表头需保持不变；空白行会自动跳过；类型列选填，留空按 A；类型、型号、名称与规格均相同的行视为重复，导入会失败。"
      columns={PREVIEW_COLUMNS}
      parseFile={async (file) => {
        const { parseJintanMaterialsDataExcel } = await loadExcel()
        return parseJintanMaterialsDataExcel(file)
      }}
      onDownloadTemplate={async () => {
        const { downloadJintanMaterialsDataTemplate } = await loadExcel()
        downloadJintanMaterialsDataTemplate()
      }}
      onImport={onImport}
      isImporting={isImporting}
      permissionKey={permissionKey}
      onPreload={preloadExcel}
    />
  )
}
