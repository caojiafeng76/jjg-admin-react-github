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

import type { JintanProfilesInventoryImportRow } from '@/services/apiJintanProfilesInventory'
import DownloadTemplateButton from '@/ui/DownloadTemplateButton'
import ImportButton from '@/ui/ImportButton'

const loadJintanProfilesInventoryExcel = () =>
  import('@/utils/jintanProfilesInventoryExcel')

function preloadJintanProfilesInventoryExcel() {
  void loadJintanProfilesInventoryExcel()
}

interface Props {
  onImport: (rows: JintanProfilesInventoryImportRow[]) => Promise<void>
  isImporting: boolean
  permissionKey?: string
}

type PreviewRow = JintanProfilesInventoryImportRow & { _idx: number }

const PREVIEW_COLUMNS: TableColumnsType<PreviewRow> = [
  {
    title: '#',
    dataIndex: '_idx',
    width: 60,
    render: (value: number) => value + 1,
  },
  {
    title: '型号',
    dataIndex: 'profile_model',
    width: 150,
  },
  {
    title: '名称',
    dataIndex: 'profile_name',
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

export default function JintanProfilesInventoryExcelImport({
  onImport,
  isImporting,
  permissionKey,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [parsedRows, setParsedRows] = useState<
    JintanProfilesInventoryImportRow[]
  >([])
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
      const { parseJintanProfilesInventoryExcel } =
        await loadJintanProfilesInventoryExcel()
      const { rows, errors } = await parseJintanProfilesInventoryExcel(file)
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
    const { downloadJintanProfilesInventoryTemplate } =
      await loadJintanProfilesInventoryExcel()
    downloadJintanProfilesInventoryTemplate()
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
        onPreload={preloadJintanProfilesInventoryExcel}
      />

      <DownloadTemplateButton
        onClick={handleDownloadTemplate}
        permissionKey={permissionKey}
        onPreload={preloadJintanProfilesInventoryExcel}
      />

      <Modal
        title="批量导入型材库存"
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
              onMouseEnter={preloadJintanProfilesInventoryExcel}
              onFocus={preloadJintanProfilesInventoryExcel}
            >
              {parsing ? '解析中...' : '选择 Excel 文件'}
            </Button>
          </Upload>

          <Alert
            type="info"
            showIcon
            title="请先下载模板，按模板列顺序填写；表头需保持不变；空白行会自动跳过；型号、名称与规格均相同的行视为重复；库存数量需为非负整数；导入会覆盖对应型材的库存数量与备注，型材需已存在于型材资料。"
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
                scroll={{ y: 320, x: 850 }}
              />
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
