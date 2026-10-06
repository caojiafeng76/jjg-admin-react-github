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

import type { JintanMaterialsDataFormValues } from '@/services/apiJintanMaterialsData'
import DownloadTemplateButton from '@/ui/DownloadTemplateButton'
import ImportButton from '@/ui/ImportButton'

const loadJintanMaterialsDataExcel = () =>
  import('@/utils/jintanMaterialsDataExcel')

function preloadJintanMaterialsDataExcel() {
  void loadJintanMaterialsDataExcel()
}

interface Props {
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
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [parsedRows, setParsedRows] = useState<JintanMaterialsDataFormValues[]>(
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
      const { parseJintanMaterialsDataExcel } =
        await loadJintanMaterialsDataExcel()
      const { rows, errors } = await parseJintanMaterialsDataExcel(file)
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
    const { downloadJintanMaterialsDataTemplate } =
      await loadJintanMaterialsDataExcel()
    downloadJintanMaterialsDataTemplate()
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
        onPreload={preloadJintanMaterialsDataExcel}
      />

      <DownloadTemplateButton
        onClick={handleDownloadTemplate}
        permissionKey={permissionKey}
        onPreload={preloadJintanMaterialsDataExcel}
      />

      <Modal
        title="批量导入素材资料"
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
              onMouseEnter={preloadJintanMaterialsDataExcel}
              onFocus={preloadJintanMaterialsDataExcel}
            >
              {parsing ? '解析中...' : '选择 Excel 文件'}
            </Button>
          </Upload>

          <Alert
            type="info"
            showIcon
            title="请先下载模板，按模板列顺序填写；表头需保持不变；空白行会自动跳过；型号、名称与规格均相同的行视为重复，导入会失败。"
          />

          {parseErrors.length > 0 && (
            <Alert
              type="warning"
              showIcon
              title={`解析时发现 ${parseErrors.length} 个问题`}
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
