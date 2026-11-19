import type { TableColumnsType } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import type { ReactNode } from 'react'
import { ArrowUpTrayIcon } from '@heroicons/react/16/solid'
import { Alert, Button, Modal, Table, Upload } from 'antd'
import { useState } from 'react'

import DownloadTemplateButton from './DownloadTemplateButton'
import ExcelParseErrorList from './ExcelParseErrorList'
import FormErrorAlert from './FormErrorAlert'
import ImportButton from './ImportButton'
import { zebraRowClassName } from './tableStyles'

export interface ExcelParseResult<T extends object> {
  rows: T[]
  errors: string[]
}

export interface ExcelImportModalProps<T extends object> {
  title: string
  tip: ReactNode
  columns: TableColumnsType<T & { _idx: number }>
  parseFile: (file: File) => Promise<ExcelParseResult<T>>
  onImport: (rows: T[]) => Promise<void>
  isImporting: boolean
  onDownloadTemplate?: () => void | Promise<void>
  onPreload?: () => void
  permissionKey?: string
  importButtonText?: ReactNode
  templateButtonText?: ReactNode
  /** 仅允许在无解析错误时确认导入，默认 false（允许导入有效行） */
  blockWhenParseErrors?: boolean
}

function isExcelFile(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  return file.type === 'application/vnd.ms-excel'
    || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || lowerName.endsWith('.xls')
    || lowerName.endsWith('.xlsx')
}

/**
 * 全站通用 Excel 批量导入弹窗（遵循 docs/前端页面风格规范与设计指南.md §5.4）。
 * - 统一 960px 宽弹窗与 destroyOnHidden
 * - 统一「下载模板 → 选择文件 → 解析错误列表 → 预览表 → 确认导入」五步交互
 * - 导入失败时保留预览与弹窗，通过 FormErrorAlert 展示结构化失败原因
 */
export default function ExcelImportModal<T extends object>({
  title,
  tip,
  columns,
  parseFile,
  onImport,
  isImporting,
  onDownloadTemplate,
  onPreload,
  permissionKey,
  importButtonText,
  templateButtonText,
  blockWhenParseErrors = false,
}: ExcelImportModalProps<T>) {
  const [modalOpen, setModalOpen] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [parsedRows, setParsedRows] = useState<T[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [importError, setImportError] = useState<unknown>(null)
  const [parsing, setParsing] = useState(false)

  const reset = () => {
    setParsedRows([])
    setParseErrors([])
    setImportError(null)
    setFileList([])
  }

  const handleBeforeUpload = async (file: File) => {
    if (!isExcelFile(file)) {
      return Upload.LIST_IGNORE
    }

    setParsing(true)
    setImportError(null)
    try {
      const { rows, errors } = await parseFile(file)
      setParsedRows(rows)
      setParseErrors(errors)
      setFileList([{ uid: file.name, name: file.name, status: 'done' }])
    }
    catch (error) {
      setParseErrors([error instanceof Error ? error.message : 'Excel 解析失败'])
      setParsedRows([])
      setFileList([])
    }
    finally {
      setParsing(false)
    }
    return false
  }

  const handleOpen = () => {
    reset()
    setModalOpen(true)
  }

  const handleCancel = () => {
    if (isImporting) {
      return
    }
    setModalOpen(false)
    reset()
  }

  const handleConfirm = async () => {
    if (parsedRows.length === 0) {
      return
    }
    if (blockWhenParseErrors && parseErrors.length > 0) {
      return
    }

    setImportError(null)
    try {
      await onImport(parsedRows)
      setModalOpen(false)
      reset()
    }
    catch (error) {
      setImportError(error)
    }
  }

  const previewData = parsedRows.map((row, index) => ({ ...row, _idx: index }))
  const confirmDisabled
    = parsedRows.length === 0 || (blockWhenParseErrors && parseErrors.length > 0)

  return (
    <>
      <ImportButton
        onClick={handleOpen}
        permissionKey={permissionKey}
        onPreload={onPreload}
      >
        {importButtonText}
      </ImportButton>
      {onDownloadTemplate
        ? (
            <DownloadTemplateButton
              onClick={() => void onDownloadTemplate()}
              permissionKey={permissionKey}
              onPreload={onPreload}
            >
              {templateButtonText}
            </DownloadTemplateButton>
          )
        : null}

      <Modal
        title={title}
        open={modalOpen}
        destroyOnHidden
        onCancel={handleCancel}
        width={960}
        footer={[
          <Button key="cancel" disabled={isImporting} onClick={handleCancel}>
            取消
          </Button>,
          <Button
            key="import"
            type="primary"
            loading={isImporting}
            disabled={confirmDisabled}
            onClick={() => void handleConfirm()}
          >
            确认导入{parsedRows.length > 0 ? `（${parsedRows.length} 条）` : ''}
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <FormErrorAlert error={importError} />

          <Upload
            fileList={fileList}
            beforeUpload={handleBeforeUpload}
            onRemove={reset}
            maxCount={1}
            accept=".xlsx,.xls"
          >
            <Button
              loading={parsing}
              icon={<ArrowUpTrayIcon className="size-4" />}
              onMouseEnter={onPreload}
              onFocus={onPreload}
            >
              {parsing ? '解析中...' : '选择 Excel 文件'}
            </Button>
          </Upload>

          <Alert type="info" showIcon title={tip} />

          {parseErrors.length > 0
            ? (
                <Alert
                  type="warning"
                  showIcon
                  title={`解析时发现 ${parseErrors.length} 个问题`}
                  description={<ExcelParseErrorList errors={parseErrors} />}
                />
              )
            : null}

          {parsedRows.length > 0
            ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    预览（共 {parsedRows.length} 条）
                  </p>
                  <Table
                    size="small"
                    rowKey="_idx"
                    rowClassName={zebraRowClassName}
                    dataSource={previewData}
                    columns={columns}
                    pagination={{ pageSize: 10, size: 'small' }}
                    scroll={{ y: 320 }}
                  />
                </div>
              )
            : null}
        </div>
      </Modal>
    </>
  )
}
