import { useState } from 'react'
import { Upload, Button, message } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { ArrowUpTrayIcon, TableCellsIcon } from '@heroicons/react/16/solid'
import { parseWorkshopOrderExcel } from '@/utils/workshopExcel'
import type { WorkshopOrder } from './index'

interface Props {
  onParsed: (rows: WorkshopOrder[]) => void
  disabled?: boolean
}

export default function WorkshopExcelUpload({ onParsed, disabled }: Props) {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [loading, setLoading] = useState(false)

  const beforeUpload = async (file: File) => {
    // 防止重复上传
    if (loading) {
      return false
    }

    const isExcel =
      file.type === 'application/vnd.ms-excel' ||
      file.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    if (!isExcel) {
      message.error('只能上传Excel文件(.xlsx或.xls)')
      return false
    }

    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('文件大小不能超过10MB')
      return false
    }

    setLoading(true)
    try {
      const rows = await parseWorkshopOrderExcel(file)
      if (!rows.length) {
        message.warning('Excel中没有有效数据')
        setFileList([])
        onParsed([])
        return false
      }
      onParsed(rows)
      message.success(`Excel解析成功，共 ${rows.length} 条数据`)
      setFileList([
        { uid: file.name, name: file.name, status: 'done' } as UploadFile,
      ])
    } catch (error) {
      message.error(
        `Excel解析失败: ${error instanceof Error ? error.message : '未知错误'}`,
      )
      setFileList([])
      onParsed([])
    } finally {
      setLoading(false)
    }

    return false
  }

  const handleRemove = () => {
    setFileList([])
    onParsed([])
  }

  return (
    <div>
      <Upload
        fileList={fileList}
        beforeUpload={beforeUpload}
        onRemove={handleRemove}
        maxCount={1}
        accept=".xlsx,.xls"
        disabled={disabled}
      >
        <Button
          icon={<ArrowUpTrayIcon className="h-4 w-4" />}
          loading={loading}
          disabled={disabled}
        >
          {loading ? '解析中...' : '选择Excel文件'}
        </Button>
      </Upload>
      <div style={{ marginTop: 8 }}>
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <TableCellsIcon className="h-4 w-4" /> 支持 ERP 导出的《销售订单登记.xlsx》
        </span>
      </div>
    </div>
  )
}
