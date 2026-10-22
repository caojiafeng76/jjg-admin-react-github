import type { FormInstance } from 'antd/lib'
import type { ISyneyItem } from '@/types'
import { ArrowLeftIcon } from '@heroicons/react/16/solid'
import { CurrencyYenIcon } from '@heroicons/react/24/outline'

import DetailTable from '@syney/ReportDetail/DetailTable'

import { useDetail } from '@syney/ReportDetail/useDetail'
import EditButton from '@ui/EditButton'
import { App, Button, Modal } from 'antd'
import { useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTableHeight } from '@/hooks/useTableHeight'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import SelectedSummaryBar from '@/ui/SelectedSummaryBar'
import StatusPill from '@/ui/StatusPill'
import { TableState } from '@/ui/TableState'
import { feedbackText } from '@/utils/feedbackText'
import { formatDate } from '@/utils/format'
import { getReportStatusTone, REPORT_STATUS_LABELS } from '../statusTones'
import TableSelectionProvider from '../TableSelectionProvider'
import { useTableSelection } from '../useTableSelection'
import DetailForm from './DetailForm'
import { useDeleteDetail } from './useDeleteDetail'
import { useUpdateDetail } from './useUpdateDetail'

function InfoItem({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-0.5 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
        {children}
      </div>
    </div>
  )
}

function ReportDetailContent() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const location = useLocation()
  // 从列表进入时携带列表地址（含筛选/分页）；直接打开详情时回到列表首页
  const listHref
    = (location.state as { from?: string } | null)?.from || '/syney-store-report-list'
  const { reportNo } = useParams()
  const [searchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const { tableSelectedKeys, setTableSelectedKeys } = useTableSelection()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const detailFormRef = useRef<FormInstance<ISyneyItem>>(null)

  const { report, reportInfo, reportLoading } = useDetail()
  const { updateItem, isUpdating } = useUpdateDetail()
  const { isDeleting, deleteDetail } = useDeleteDetail()

  const reportItem = useMemo(
    () => report?.find(item => item.id === Number(tableSelectedKeys?.at(0))),
    [report, tableSelectedKeys],
  )

  const records = useMemo(() => report || [], [report])
  const total = records.length
  const pagedRecords = useMemo(
    () => records.slice((page - 1) * pageSize, page * pageSize),
    [records, page, pageSize],
  )

  const reportFields = useMemo(
    () => [
      { label: '对账单号', value: reportInfo?.No ?? reportNo ?? '-' },
      {
        label: '创建日期',
        value: formatDate(reportInfo?.created_at),
      },
      { label: '明细条数', value: records.length },
    ],
    [reportInfo, reportNo, records.length],
  )

  const selectedCount = tableSelectedKeys.length
  const selectedAmount = useMemo(() => {
    if (selectedCount === 0)
      return 0
    const keySet = new Set(tableSelectedKeys.map(k => String(k)))
    let totalAmount = 0
    for (const item of records) {
      if (keySet.has(String(item.id))) {
        totalAmount += Number(item.TaxTotalPrice || 0)
      }
    }
    return totalAmount
  }, [records, selectedCount, tableSelectedKeys])

  function showModal() {
    detailFormRef?.current?.resetFields()
    setIsModalOpen(true)
  }

  function handleEdit() {
    if (tableSelectedKeys?.length !== 1) {
      message.warning('请选择一条对账单明细进行编辑')
      return
    }
    showModal()
  }

  function handleOk() {
    detailFormRef?.current?.submit()
  }

  function handleCancel() {
    detailFormRef?.current?.resetFields()
    setIsModalOpen(false)
    setTableSelectedKeys([])
  }

  function onFinishFuc(values: ISyneyItem) {
    // 失败提示由 useUpdateDetail 统一弹出；弹窗保持打开，便于修改后重试
    updateItem({ item: values }, { onSuccess: handleCancel })
  }

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 12,
    summaryRowHeight: 39,
  })

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* 对账单信息分区卡片 */}
      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              对账单信息
            </span>
          </div>
          {reportInfo?.Status && REPORT_STATUS_LABELS[reportInfo.Status]
            ? (
                <StatusPill tone={getReportStatusTone(reportInfo.Status)}>
                  {REPORT_STATUS_LABELS[reportInfo.Status]}
                </StatusPill>
              )
            : null}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          {reportFields.map(item => (
            <InfoItem key={item.label} label={item.label}>
              {item.label === '明细条数'
                ? (
                    <span className="tabular-nums">{item.value}</span>
                  )
                : (
                    item.value
                  )}
            </InfoItem>
          ))}
          <InfoItem label="总金额">
            <span className="text-lg font-bold text-slate-900 tabular-nums dark:text-slate-100">
              {reportInfo?.TotalAmount?.toLocaleString() ?? '-'}
            </span>
          </InfoItem>
        </div>
      </div>

      {/* 选中摘要条 */}
      {selectedCount > 0
        ? (
            <SelectedSummaryBar
              selectedCount={selectedCount}
              matchedCount={selectedCount}
              stats={[
                {
                  label: '选中金额合计',
                  value: selectedAmount,
                  tone: 'error',
                  icon: <CurrencyYenIcon className="size-3.5" />,
                },
              ]}
            />
          )
        : null}

      {/* 表格 + 分页 */}
      <div className="grid flex-1 grid-rows-[1fr_auto] gap-3 overflow-hidden">
        <div ref={tableContainerRef} className="min-h-0 overflow-hidden">
          <TableState loading={reportLoading}>
            <DetailTable
              data={pagedRecords}
              loading={reportLoading || isUpdating || isDeleting}
              page={page}
              pageSize={pageSize}
              scrollY={scrollY}
            />
          </TableState>
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={total} />
        </div>
      </div>

      {/* 底部吸底操作区 */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-200/60 pt-3 dark:border-slate-700">
        <Button
          icon={<ArrowLeftIcon className="h-4 w-4" />}
          onClick={() => navigate(listHref)}
        >
          返回列表
        </Button>
        <div className="flex items-center gap-2">
          <EditButton title="请选择一条数据" handleEdit={handleEdit} />
          <DeleteButton
            isDeleting={isDeleting}
            count={tableSelectedKeys.length}
            title="删除对账单明细"
            itemName="对账单明细"
            onConfirm={() => {
              if (tableSelectedKeys.length === 0) {
                message.warning(feedbackText.selectRequired('删除'))
                return
              }
              deleteDetail(tableSelectedKeys.map(String), {
                onSettled: () => {
                  setTableSelectedKeys([])
                },
              })
            }}
          />
        </div>
      </div>

      <Modal
        title="编辑参数规格"
        open={isModalOpen}
        confirmLoading={isUpdating}
        width={520}
        destroyOnHidden
        onOk={handleOk}
        onCancel={handleCancel}
        afterOpenChange={(open) => {
          if (open) {
            detailFormRef.current?.setFieldsValue(reportItem || {})
          }
        }}
      >
        <DetailForm ref={detailFormRef} onFinishFuc={onFinishFuc} />
      </Modal>
    </div>
  )
}

/** 选中状态随页面实例独立（多标签页缓存下互不影响） */
export default function ReportDetail() {
  return (
    <TableSelectionProvider>
      <ReportDetailContent />
    </TableSelectionProvider>
  )
}
