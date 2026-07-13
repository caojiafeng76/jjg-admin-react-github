import { useState } from 'react'
import {
  Alert,
  Button,
  Modal,
  Table,
  type TableColumnsType,
  Upload,
} from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { ArrowUpTrayIcon } from '@heroicons/react/16/solid'

import type { ToolingDataFormValues } from '@/services/apiToolingData'
import DownloadTemplateButton from '@/ui/DownloadTemplateButton'
import ImportButton from '@/ui/ImportButton'
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
  const [modalOpen, setModalOpen] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [parsedRows, setParsedRows] = useState<ToolingDataFormValues[]>([])
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
      const { parseToolingDataExcel } = await loadToolingDataExcel()
      const { rows, errors } = await parseToolingDataExcel(file)
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
    const { downloadToolingDataTemplate } = await loadToolingDataExcel()
    downloadToolingDataTemplate()
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
        permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
        onPreload={preloadToolingDataExcel}
      />

      <DownloadTemplateButton
        onClick={handleDownloadTemplate}
        permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
        onPreload={preloadToolingDataExcel}
      />

      <Modal
        title="导入刀具资料"
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
              onMouseEnter={preloadToolingDataExcel}
              onFocus={preloadToolingDataExcel}
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
