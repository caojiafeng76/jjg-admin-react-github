import { useState } from 'react'
import {
  Alert,
  App,
  Button,
  Modal,
  Table,
  TableColumnsType,
  Upload,
} from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { ArrowUpTrayIcon, TableCellsIcon } from '@heroicons/react/16/solid'

import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import { parseAttendanceExcel } from '@/utils/attendanceExcel'
import type { AttendanceDetailFormValues } from '@/services/apiAttendanceDetails'

interface Props {
  onImport: (rows: AttendanceDetailFormValues[]) => Promise<void>
  isImporting: boolean
}

const PREVIEW_COLUMNS: TableColumnsType<
  AttendanceDetailFormValues & { _idx: number }
> = [
  {
    title: '#',
    dataIndex: '_idx',
    width: 60,
    render: (v) => v + 1,
  },
  {
    title: '姓名',
    dataIndex: 'name',
    width: 120,
  },
  {
    title: '日期',
    dataIndex: 'date',
    width: 140,
  },
  {
    title: '时间',
    dataIndex: 'time',
    width: 100,
    render: (v: string) => v?.slice(0, 5) ?? '-',
  },
]

export default function AttendanceExcelImport({
  onImport,
  isImporting,
}: Props) {
  const { message } = App.useApp()
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const [modalOpen, setModalOpen] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [parsedRows, setParsedRows] = useState<AttendanceDetailFormValues[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [removedCount, setRemovedCount] = useState(0)
  const [parsing, setParsing] = useState(false)

  const handleBeforeUpload = async (file: File) => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return Upload.LIST_IGNORE
    }

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
      const {
        rows,
        errors,
        removedCount: rc,
      } = await parseAttendanceExcel(file)
      setParsedRows(rows)
      setParseErrors(errors)
      setRemovedCount(rc)
      setFileList([
        { uid: file.name, name: file.name, status: 'done' } as UploadFile,
      ])
    } catch (err) {
      setParseErrors([err instanceof Error ? err.message : 'Excel 解析失败'])
      setParsedRows([])
      setRemovedCount(0)
      setFileList([])
    } finally {
      setParsing(false)
    }

    return false
  }

  const handleOpenModal = () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    setModalOpen(true)
    setParsedRows([])
    setParseErrors([])
    setFileList([])
  }

  const handleCancel = () => {
    setModalOpen(false)
    setParsedRows([])
    setParseErrors([])
    setRemovedCount(0)
    setFileList([])
  }

  const handleConfirmImport = async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    if (parsedRows.length === 0) return
    await onImport(parsedRows)
    setModalOpen(false)
    setParsedRows([])
    setParseErrors([])
    setRemovedCount(0)
    setFileList([])
  }

  const tableData = parsedRows.map((row, idx) => ({ ...row, _idx: idx }))

  return (
    <>
      <Button
        icon={<ArrowUpTrayIcon className="h-4 w-4" />}
        onClick={handleOpenModal}
        disabled={viewerDenied}
      >
        导入 Excel
      </Button>

      <Modal
        title="导入考勤明细"
        open={modalOpen}
        onCancel={handleCancel}
        width={680}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button
            key="import"
            type="primary"
            disabled={viewerDenied || parsedRows.length === 0}
            loading={isImporting}
            onClick={handleConfirmImport}
          >
            确认导入{' '}
            {parsedRows.length > 0 ? `（${parsedRows.length} 条）` : ''}
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
              icon={<ArrowUpTrayIcon className="h-4 w-4" />}
              loading={parsing}
              disabled={viewerDenied}
            >
              {parsing ? '解析中...' : '选择 Excel 文件'}
            </Button>
          </Upload>

          <p className="flex items-center gap-1 text-xs text-slate-500">
            <TableCellsIcon className="h-4 w-4" />
            支持 ZKTeco 考勤管理系统导出文件，列名需包含：姓名、日期、时间
          </p>

          {removedCount > 0 && (
            <Alert
              type="info"
              showIcon
              message={`自动去重：已合并 ${removedCount} 条重复打卡记录（同一人同一天 10 分钟内保留最晚一条）`}
            />
          )}

          {parseErrors.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`解析时发现 ${parseErrors.length} 条问题（已跳过）`}
              description={
                <ul className="mt-1 list-inside list-disc text-xs">
                  {parseErrors.slice(0, 10).map((e, i) => (
                    <li key={i}>{e}</li>
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
                dataSource={tableData}
                columns={PREVIEW_COLUMNS}
                pagination={{ pageSize: 10, size: 'small' }}
                scroll={{ y: 300 }}
              />
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
