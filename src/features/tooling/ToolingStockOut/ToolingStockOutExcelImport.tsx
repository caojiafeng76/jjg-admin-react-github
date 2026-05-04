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

import type { ToolingStockOutImportRow } from '@/services/apiToolingStockOut'
import DownloadTemplateButton from '@/ui/DownloadTemplateButton'
import ImportButton from '@/ui/ImportButton'
import { TOOLING_MANAGE_PERMISSION_KEY } from '../permissions'
import {
  downloadToolingStockOutTemplate,
  parseToolingStockOutExcel,
} from '@/utils/toolingStockOutExcel'

interface Props {
  onImport: (rows: ToolingStockOutImportRow[]) => Promise<void>
  isImporting: boolean
}

type PreviewRow = ToolingStockOutImportRow & { _idx: number }

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
    width: 180,
  },
  {
    title: '刀具名称',
    dataIndex: 'tool_name',
    width: 180,
  },
  {
    title: '领用人',
    dataIndex: 'recipient',
    width: 120,
  },
  {
    title: '用途',
    dataIndex: 'purpose',
    width: 180,
  },
  {
    title: '出库日期',
    dataIndex: 'stock_out_date',
    width: 120,
  },
  {
    title: '出库数量',
    dataIndex: 'stock_out_quantity',
    width: 120,
  },
  {
    title: '备注',
    dataIndex: 'remarks',
    width: 240,
  },
]

export default function ToolingStockOutExcelImport({
  onImport,
  isImporting,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [parsedRows, setParsedRows] = useState<ToolingStockOutImportRow[]>([])
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
      const { rows, errors } = await parseToolingStockOutExcel(file)
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
      >
        导入出库
      </ImportButton>

      <DownloadTemplateButton
        onClick={downloadToolingStockOutTemplate}
        permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
      >
        下载出库模板
      </DownloadTemplateButton>

      <Modal
        title="导入刀具出库"
        open={modalOpen}
        onCancel={handleCancel}
        width={1080}
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
            >
              {parsing ? '解析中...' : '选择 Excel 文件'}
            </Button>
          </Upload>

          <Alert
            type="info"
            showIcon
            title="请先下载模板后填写，必须包含刀具编号、领用人、用途、出库日期、出库数量。系统会按刀具编号匹配刀具资料，默认导入为待审核。"
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
                scroll={{ y: 320, x: 1220 }}
              />
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
