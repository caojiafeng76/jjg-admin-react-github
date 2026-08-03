import { useState } from 'react'
import { ArrowUpTrayIcon } from '@heroicons/react/16/solid'
import {
  Alert,
  Button,
  Modal,
  Table,
  type TableColumnsType,
  Upload,
} from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'

import type { ToolingFixtureFormValues } from '@/services/apiToolingFixture'
import DownloadTemplateButton from '@/ui/DownloadTemplateButton'
import ImportButton from '@/ui/ImportButton'

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
  const [modalOpen, setModalOpen] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [parsedRows, setParsedRows] = useState<ToolingFixtureFormValues[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [parsing, setParsing] = useState(false)

  const handleBeforeUpload = async (file: File) => {
    const isExcel =
      file.type === 'application/vnd.ms-excel' ||
      file.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.xlsx')

    if (!isExcel) {
      return Upload.LIST_IGNORE
    }

    setParsing(true)
    try {
      const { parseToolingFixtureExcel } = await loadToolingFixtureExcel()
      const { rows, errors } = await parseToolingFixtureExcel(file)
      setParsedRows(rows)
      setParseErrors(errors)
      setFileList([
        { uid: file.name, name: file.name, status: 'done' } as UploadFile,
      ])
    } catch (error) {
      setParseErrors([
        error instanceof Error ? error.message : 'Excel 解析失败',
      ])
      setParsedRows([])
      setFileList([])
    } finally {
      setParsing(false)
    }

    return false
  }

  const handleOpenModal = () => {
    setModalOpen(true)
    setParsedRows([])
    setParseErrors([])
    setFileList([])
  }

  const handleDownloadTemplate = async () => {
    const { downloadToolingFixtureTemplate } = await loadToolingFixtureExcel()
    downloadToolingFixtureTemplate()
  }

  const handleCancel = () => {
    setModalOpen(false)
    setParsedRows([])
    setParseErrors([])
    setFileList([])
  }

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) {
      return
    }

    await onImport(parsedRows)
    handleCancel()
  }

  const previewData = parsedRows.map((row, index) => ({
    ...row,
    _idx: index,
  }))

  return (
    <>
      <ImportButton
        onClick={handleOpenModal}
        permissionKey="page:fixture-data"
        onPreload={preloadToolingFixtureExcel}
      >
        导入工装
      </ImportButton>

      <DownloadTemplateButton
        onClick={handleDownloadTemplate}
        permissionKey="page:fixture-data"
        onPreload={preloadToolingFixtureExcel}
      >
        导入模板
      </DownloadTemplateButton>

      <Modal
        title="导入工装资料"
        open={modalOpen}
        onCancel={handleCancel}
        width={880}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button
            key="import"
            type="primary"
            loading={isImporting}
            disabled={parsedRows.length === 0}
            onClick={handleConfirmImport}
          >
            确认导入{parsedRows.length > 0 ? `（${parsedRows.length} 条）` : ''}
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <Upload
            fileList={fileList}
            beforeUpload={handleBeforeUpload}
            onRemove={() => {
              setFileList([])
              setParsedRows([])
              setParseErrors([])
            }}
            maxCount={1}
            accept=".xlsx,.xls"
          >
            <Button
              loading={parsing}
              icon={<ArrowUpTrayIcon className="h-4 w-4" />}
              onMouseEnter={preloadToolingFixtureExcel}
              onFocus={preloadToolingFixtureExcel}
            >
              {parsing ? '解析中...' : '选择 Excel 文件'}
            </Button>
          </Upload>

          <Alert
            type="info"
            showIcon
            title="请先下载模板后填写，模板列顺序必须保持不变；空白行会自动跳过。"
          />

          {parseErrors.length > 0 && (
            <Alert
              type="warning"
              showIcon
              title={`解析时发现 ${parseErrors.length} 条问题`}
              description={
                <ul className="mt-1 list-inside list-disc text-xs">
                  {parseErrors.slice(0, 10).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {parseErrors.length > 10 && (
                    <li>...还有 {parseErrors.length - 10} 条</li>
                  )}
                </ul>
              }
            />
          )}

          {parsedRows.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">
                预览（共 {parsedRows.length} 条）
              </p>
              <Table
                size="small"
                rowKey="_idx"
                dataSource={previewData}
                columns={PREVIEW_COLUMNS}
                pagination={{ pageSize: 10, size: 'small' }}
                scroll={{ y: 320, x: 780 }}
              />
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
