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

import type { YoumaiProductDataFormValues } from '@/services/apiYoumaiProductData'
import DownloadTemplateButton from '@/ui/DownloadTemplateButton'
import ImportButton from '@/ui/ImportButton'

const loadYoumaiProductDataExcel = () =>
  import('@/utils/youmaiProductDataExcel')

function preloadYoumaiProductDataExcel() {
  void loadYoumaiProductDataExcel()
}

interface Props {
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
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [parsedRows, setParsedRows] = useState<YoumaiProductDataFormValues[]>(
    [],
  )
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
      const { parseYoumaiProductDataExcel } = await loadYoumaiProductDataExcel()
      const { rows, errors } = await parseYoumaiProductDataExcel(file)
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
    const { downloadYoumaiProductDataTemplate } =
      await loadYoumaiProductDataExcel()
    downloadYoumaiProductDataTemplate()
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
        permissionKey={permissionKey}
        onPreload={preloadYoumaiProductDataExcel}
      />

      <DownloadTemplateButton
        onClick={handleDownloadTemplate}
        permissionKey={permissionKey}
        onPreload={preloadYoumaiProductDataExcel}
      />

      <Modal
        title="导入优迈货品资料"
        open={modalOpen}
        onCancel={handleCancel}
        width={920}
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
              onMouseEnter={preloadYoumaiProductDataExcel}
              onFocus={preloadYoumaiProductDataExcel}
            >
              {parsing ? '解析中...' : '选择 Excel 文件'}
            </Button>
          </Upload>

          <Alert
            type="info"
            showIcon
            title="请先下载模板后填写，模板列顺序必须保持不变；空白行会自动跳过。导入时如遇到已存在物料编码，将整批失败。"
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
                scroll={{ y: 320, x: 900 }}
              />
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
