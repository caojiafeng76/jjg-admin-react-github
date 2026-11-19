import type { TableColumnsType } from 'antd'
import type { JintanPartsInventoryImportRow } from '@/services/apiJintanPartsInventory'
import ExcelImportModal from '@/ui/ExcelImportModal'

function loadExcel() {
  return import('@/utils/jintanPartsInventoryExcel')
}

function preloadExcel() {
  void loadExcel()
}

export interface JintanPartsInventoryExcelImportProps {
  onImport: (rows: JintanPartsInventoryImportRow[]) => Promise<void>
  isImporting: boolean
  permissionKey?: string
}

type PreviewRow = JintanPartsInventoryImportRow & { _idx: number }

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
    title: '库存数量',
    dataIndex: 'quantity',
    width: 100,
    align: 'right',
  },
  {
    title: '备注',
    dataIndex: 'remarks',
    width: 180,
  },
]

export default function JintanPartsInventoryExcelImport({
  onImport,
  isImporting,
  permissionKey,
}: JintanPartsInventoryExcelImportProps) {
  return (
    <ExcelImportModal<JintanPartsInventoryImportRow>
      title="批量导入配件库存"
      tip="请先下载模板，按模板列顺序填写；表头需保持不变；空白行会自动跳过；类型、颜色列选填，类型留空按 A；类型、名称、规格与颜色均相同的行视为重复；库存数量需为非负整数；导入会覆盖对应配件的库存数量与备注，配件需已存在于配件资料。"
      columns={PREVIEW_COLUMNS}
      parseFile={async (file) => {
        const { parseJintanPartsInventoryExcel } = await loadExcel()
        return parseJintanPartsInventoryExcel(file)
      }}
      onDownloadTemplate={async () => {
        const { downloadJintanPartsInventoryTemplate } = await loadExcel()
        downloadJintanPartsInventoryTemplate()
      }}
      onImport={onImport}
      isImporting={isImporting}
      permissionKey={permissionKey}
      onPreload={preloadExcel}
    />
  )
}
