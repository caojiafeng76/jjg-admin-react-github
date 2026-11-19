import type { TableColumnsType } from 'antd'
import type { JintanMaterialsInventoryImportRow } from '@/services/apiJintanMaterialsInventory'
import ExcelImportModal from '@/ui/ExcelImportModal'

function loadExcel() {
  return import('@/utils/jintanMaterialsInventoryExcel')
}

function preloadExcel() {
  void loadExcel()
}

export interface JintanMaterialsInventoryExcelImportProps {
  onImport: (rows: JintanMaterialsInventoryImportRow[]) => Promise<void>
  isImporting: boolean
  permissionKey?: string
}

type PreviewRow = JintanMaterialsInventoryImportRow & { _idx: number }

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

export default function JintanMaterialsInventoryExcelImport({
  onImport,
  isImporting,
  permissionKey,
}: JintanMaterialsInventoryExcelImportProps) {
  return (
    <ExcelImportModal<JintanMaterialsInventoryImportRow>
      title="批量导入素材库存"
      tip="请先下载模板，按模板列顺序填写；表头需保持不变；空白行会自动跳过；类型列选填，留空按 A；类型、型号、名称与规格均相同的行视为重复；库存数量需为非负整数；导入会覆盖对应素材的库存数量与备注，素材需已存在于素材资料。"
      columns={PREVIEW_COLUMNS}
      parseFile={async (file) => {
        const { parseJintanMaterialsInventoryExcel } = await loadExcel()
        return parseJintanMaterialsInventoryExcel(file)
      }}
      onDownloadTemplate={async () => {
        const { downloadJintanMaterialsInventoryTemplate } = await loadExcel()
        downloadJintanMaterialsInventoryTemplate()
      }}
      onImport={onImport}
      isImporting={isImporting}
      permissionKey={permissionKey}
      onPreload={preloadExcel}
    />
  )
}
