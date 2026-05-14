import { useState } from 'react'
import {
  Alert,
  App,
  Button,
  Input,
  Modal,
  Table,
  type TableColumnsType,
  Tooltip,
  Upload,
} from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/16/solid'

import type { YoumaiFinishedGoodsStockOutImportRow } from '@/services/apiYoumaiFinishedGoodsStockOut'
import { fetchYoumaiPurchaseOrder } from '@/services/apiYoumaiPurchaseOrder'
import { usePermission } from '@/hooks/usePermission'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import ImportButton from '@/ui/ImportButton'
import { parseYoumaiFinishedGoodsStockOutExcel } from '@/utils/youmaiFinishedGoodsStockOutExcel'

interface Props {
  onImport: (rows: YoumaiFinishedGoodsStockOutImportRow[]) => Promise<void>
  isImporting: boolean
  permissionKey?: string
}

type PreviewRow = YoumaiFinishedGoodsStockOutImportRow & { _idx: number }

const PREVIEW_COLUMNS: TableColumnsType<PreviewRow> = [
  {
    title: '#',
    dataIndex: '_idx',
    width: 60,
    render: (value: number) => value + 1,
  },
  {
    title: '采购订单号',
    dataIndex: 'purchase_order_no',
    width: 200,
  },
  {
    title: '行号',
    dataIndex: 'purchase_order_line_no',
    width: 90,
  },
  {
    title: '物料编码',
    dataIndex: 'material_code',
    width: 180,
  },
  {
    title: '物料名称',
    dataIndex: 'material_name',
    width: 180,
  },
  {
    title: '出库数量',
    dataIndex: 'stock_out_quantity',
    width: 120,
  },
  {
    title: '交货日期',
    dataIndex: 'delivery_date',
    width: 120,
  },
  {
    title: '备注',
    dataIndex: 'remarks',
    width: 240,
  },
]

export default function YoumaiFinishedGoodsStockOutExcelImport({
  onImport,
  isImporting,
  permissionKey,
}: Props) {
  const { message } = App.useApp()
  const allowed = usePermission(permissionKey ?? '')
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: permissionKey,
  })
  const denied = viewerDenied || (Boolean(permissionKey) && !allowed)
  const deniedTip = viewerDenied ? viewerOperationTip : '无优迈模块操作权限'
  const [modalOpen, setModalOpen] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [purchaseOrderNo, setPurchaseOrderNo] = useState('')
  const [parsedRows, setParsedRows] = useState<
    YoumaiFinishedGoodsStockOutImportRow[]
  >([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [parsing, setParsing] = useState(false)
  const [fetchingPurchaseOrder, setFetchingPurchaseOrder] = useState(false)
  const [modalMode, setModalMode] = useState<'purchaseOrder' | 'excel'>(
    'purchaseOrder',
  )

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
      const { rows, errors } = await parseYoumaiFinishedGoodsStockOutExcel(file)
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

  const handleOpenModal = (mode: 'purchaseOrder' | 'excel') => {
    setModalOpen(true)
    setModalMode(mode)
    setPurchaseOrderNo('')
    setParsedRows([])
    setParseErrors([])
    setFileList([])
  }

  const handleCancel = () => {
    setModalOpen(false)
    setPurchaseOrderNo('')
    setParsedRows([])
    setParseErrors([])
    setFileList([])
  }

  const handleFetchPurchaseOrder = async () => {
    const normalizedPurchaseOrderNo = purchaseOrderNo.trim()

    if (!normalizedPurchaseOrderNo) {
      message.warning('请输入采购订单号')
      return
    }

    setFetchingPurchaseOrder(true)
    try {
      const rows = await fetchYoumaiPurchaseOrder(normalizedPurchaseOrderNo)
      setParsedRows(rows)
      setParseErrors([])
      setFileList([])
      message.success(`已获取 ${rows.length} 条采购订单明细`)
    } catch (error) {
      setParsedRows([])
      setParseErrors([
        error instanceof Error ? error.message : '优迈采购订单获取失败',
      ])
    } finally {
      setFetchingPurchaseOrder(false)
    }
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

  const fetchButton = (
    <Button
      type="text"
      icon={<ArrowDownTrayIcon className="size-4 text-cyan-500/80!" />}
      onClick={() => handleOpenModal('purchaseOrder')}
      disabled={denied}
    >
      获取采购订单
    </Button>
  )

  return (
    <>
      {denied ? (
        <Tooltip title={deniedTip}>{fetchButton}</Tooltip>
      ) : (
        fetchButton
      )}
      <ImportButton
        onClick={() => handleOpenModal('excel')}
        permissionKey={permissionKey}
      >
        导入Excel
      </ImportButton>

      <Modal
        title={
          modalMode === 'purchaseOrder'
            ? '获取优迈采购订单'
            : '导入优迈成品出库'
        }
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
          {modalMode === 'purchaseOrder' && (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="max-w-sm"
                allowClear
                autoFocus
                placeholder="输入采购订单号"
                value={purchaseOrderNo}
                onChange={(event) => setPurchaseOrderNo(event.target.value)}
                onPressEnter={handleFetchPurchaseOrder}
              />
              <Button
                type="primary"
                loading={fetchingPurchaseOrder}
                onClick={handleFetchPurchaseOrder}
              >
                获取采购订单
              </Button>
            </div>
          )}

          {modalMode === 'excel' && (
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
                {parsing ? '解析中...' : '选择采购订单 Excel'}
              </Button>
            </Upload>
          )}

          {modalMode === 'purchaseOrder' ? (
            <Alert
              type="info"
              showIcon
              title="输入优迈采购订单号后，系统会自动获取订单明细；确认导入时按物料编码匹配货品资料，并按采购订单号 + 行号幂等写入，默认导入为待审核。"
            />
          ) : (
            <Alert
              type="info"
              showIcon
              title="支持直接导入采购订单导出 Excel。系统会按物料编码匹配货品资料，并按采购订单号 + 行号幂等写入，默认导入为待审核。"
            />
          )}

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
                scroll={{ y: 320, x: 1160 }}
              />
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
