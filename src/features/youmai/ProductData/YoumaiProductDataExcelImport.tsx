import type { TableColumnsType } from 'antd'
import type { YoumaiProductDataFormValues } from '@/services/apiYoumaiProductData'
import ExcelImportModal from '@/ui/ExcelImportModal'

function loadYoumaiProductDataExcel() {
  return import('@/utils/youmaiProductDataExcel')
}

function preloadYoumaiProductDataExcel() {
  void loadYoumaiProductDataExcel()
}

export interface YoumaiProductDataExcelImportProps {
  onImport: (rows: YoumaiProductDataFormValues[]) => Promise<void>
  isImporting: boolean
  permissionKey?: string
}

type PreviewRow = YoumaiProductDataFormValues & { _idx: number }

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
    title: '物料名称',
    dataIndex: 'material_name',
    width: 160,
  },
  {
    title: '型号',
    dataIndex: 'model',
    width: 120,
  },
  {
    title: '规格',
    dataIndex: 'specification',
    width: 120,
  },
  {
    title: '比重',
    dataIndex: 'specific_gravity',
    width: 100,
    align: 'right',
  },
  {
    title: '备注',
    dataIndex: 'remarks',
    width: 180,
  },
]

export default function YoumaiProductDataExcelImport({
  onImport,
  isImporting,
  permissionKey,
}: YoumaiProductDataExcelImportProps) {
  return (
    <ExcelImportModal<YoumaiProductDataFormValues>
      title="导入优迈货品资料"
      tip="请先下载模板后填写，模板列顺序必须保持不变；空白行会自动跳过。导入时如遇到已存在物料编码，将整批失败。"
      columns={PREVIEW_COLUMNS}
      parseFile={async (file) => {
        const { parseYoumaiProductDataExcel } = await loadYoumaiProductDataExcel()
        return parseYoumaiProductDataExcel(file)
      }}
      onDownloadTemplate={async () => {
        const { downloadYoumaiProductDataTemplate } = await loadYoumaiProductDataExcel()
        downloadYoumaiProductDataTemplate()
      }}
      onImport={onImport}
      isImporting={isImporting}
      permissionKey={permissionKey}
      onPreload={preloadYoumaiProductDataExcel}
    />
  )
}
