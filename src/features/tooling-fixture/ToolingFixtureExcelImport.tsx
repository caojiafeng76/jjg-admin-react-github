import type { TableColumnsType } from 'antd'
import type { ToolingFixtureFormValues } from '@/services/apiToolingFixture'
import ExcelImportModal from '@/ui/ExcelImportModal'

const loadToolingFixtureExcel = () => import('@/utils/toolingFixtureExcel')

function preloadToolingFixtureExcel() {
  void loadToolingFixtureExcel()
}

interface Props {
  onImport: (rows: ToolingFixtureFormValues[]) => Promise<void>
  isImporting: boolean
}

type PreviewRow = ToolingFixtureFormValues & { _idx: number }

const PREVIEW_COLUMNS: TableColumnsType<PreviewRow> = [
  {
    title: '#',
    dataIndex: '_idx',
    width: 60,
    render: (value: number) => value + 1,
  },
  {
    title: '工装模具编号',
    dataIndex: 'fixture_no',
    width: 130,
  },
  {
    title: '类别',
    dataIndex: 'category',
    width: 110,
  },
  {
    title: '适用产品图号',
    dataIndex: 'applicable_product_drawing_no',
    width: 130,
  },
  {
    title: '产品名称',
    dataIndex: 'product_name',
    width: 130,
  },
  {
    title: '适用设备',
    dataIndex: 'applicable_equipment',
    width: 110,
  },
  {
    title: '存放位置',
    dataIndex: 'storage_location',
    width: 110,
  },
  {
    title: '制作日期',
    dataIndex: 'manufactured_date',
    width: 110,
  },
  {
    title: '制作厂商',
    dataIndex: 'manufacturer',
    width: 100,
  },
  {
    title: '责任人',
    dataIndex: 'responsible_person',
    width: 100,
  },
]

export default function ToolingFixtureExcelImport({
  onImport,
  isImporting,
}: Props) {
  return (
    <ExcelImportModal<ToolingFixtureFormValues>
      title="导入工装资料"
      importButtonText="导入工装"
      templateButtonText="导入模板"
      permissionKey="page:fixture-data"
      tip="请先下载模板后填写，模板列顺序必须保持不变；空白行会自动跳过。"
      columns={PREVIEW_COLUMNS}
      onPreload={preloadToolingFixtureExcel}
      parseFile={async (file) => {
        const { parseToolingFixtureExcel } = await loadToolingFixtureExcel()
        return parseToolingFixtureExcel(file)
      }}
      onDownloadTemplate={async () => {
        const { downloadToolingFixtureTemplate } = await loadToolingFixtureExcel()
        downloadToolingFixtureTemplate()
      }}
      onImport={onImport}
      isImporting={isImporting}
    />
  )
}
