import type { TableColumnsType } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import type { SyneyMaterialsExcelModule } from './loadSyneyMaterialsExcel'
import type { ParseExcelResult } from '@/utils/syneyMaterialsExcel'
import { ArrowUpTrayIcon } from '@heroicons/react/16/solid'
import { Alert, Button, Modal, Table, Upload } from 'antd'
import { useState } from 'react'

import DownloadTemplateButton from '@/ui/DownloadTemplateButton'
import ExcelParseErrorList from '@/ui/ExcelParseErrorList'
import ImportButton from '@/ui/ImportButton'

import { loadSyneyMaterialsExcel, preloadSyneyMaterialsExcel } from './loadSyneyMaterialsExcel'

type ExcelModule = SyneyMaterialsExcelModule

export interface SyneyMaterialsExcelImportProps<T extends object> {
  title: string
  tip: string
  columns: TableColumnsType<T & { _idx: number }>
  parse: (excel: ExcelModule, file: File) => Promise<ParseExcelResult<T>>
  downloadTemplate: (excel: ExcelModule) => void
  onImport: (rows: T[]) => Promise<void>
  isImporting: boolean
  permissionKey?: string
}

function isExcelFile(file: File) {
  return file.type === 'application/vnd.ms-excel'
    || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || file.name.endsWith('.xls')
    || file.name.endsWith('.xlsx')
}

/** 导入按钮 + 下载模板按钮 + 解析预览弹窗；Excel 模块按需加载 */
export default function SyneyMaterialsExcelImport<T extends object>({
  title,
  tip,
  columns,
  parse,
  downloadTemplate,
  onImport,
  isImporting,
  permissionKey,
}: SyneyMaterialsExcelImportProps<T>) {
  const [modalOpen, setModalOpen] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [parsedRows, setParsedRows] = useState<T[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [parsing, setParsing] = useState(false)

  const reset = () => {
    setParsedRows([])
    setParseErrors([])
    setFileList([])
  }

  const handleBeforeUpload = async (file: File) => {
    if (!isExcelFile(file))
      return Upload.LIST_IGNORE

    setParsing(true)
    try {
      const { rows, errors } = await parse(await loadSyneyMaterialsExcel(), file)
      setParsedRows(rows)
      setParseErrors(errors)
      setFileList([{ uid: file.name, name: file.name, status: 'done' } as UploadFile])
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
    setModalOpen(false)
    reset()
  }

  const handleConfirm = async () => {
    if (parsedRows.length === 0)
      return
    await onImport(parsedRows)
    handleCancel()
  }

  const handleDownloadTemplate = async () => {
    downloadTemplate(await loadSyneyMaterialsExcel())
  }

  const previewData = parsedRows.map((row, index) => ({ ...row, _idx: index }))

  return (
    <>
      <ImportButton
        onClick={handleOpen}
        permissionKey={permissionKey}
        onPreload={preloadSyneyMaterialsExcel}
      />
      <DownloadTemplateButton
        onClick={handleDownloadTemplate}
        permissionKey={permissionKey}
        onPreload={preloadSyneyMaterialsExcel}
      />

      <Modal
        title={title}
        open={modalOpen}
        onCancel={handleCancel}
        width={820}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button
            key="import"
            type="primary"
            loading={isImporting}
            disabled={parsedRows.length === 0}
            onClick={handleConfirm}
          >
            确认导入{parsedRows.length > 0 ? `（${parsedRows.length} 条）` : ''}
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <Upload
            fileList={fileList}
            beforeUpload={handleBeforeUpload}
            onRemove={reset}
            maxCount={1}
            accept=".xlsx,.xls"
          >
            <Button
              loading={parsing}
              icon={<ArrowUpTrayIcon className="h-4 w-4" />}
              onMouseEnter={preloadSyneyMaterialsExcel}
              onFocus={preloadSyneyMaterialsExcel}
            >
              {parsing ? '解析中...' : '选择 Excel 文件'}
            </Button>
          </Upload>

          <Alert type="info" showIcon title={tip} />

          {parseErrors.length > 0 && (
            <Alert
              type="warning"
              showIcon
              title={`解析时发现 ${parseErrors.length} 个问题`}
              description={<ExcelParseErrorList errors={parseErrors} />}
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
                columns={columns}
                pagination={{ pageSize: 10, size: 'small' }}
                scroll={{ y: 320 }}
              />
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
