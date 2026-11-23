import type { FormInstance } from 'antd'
import type { ISyneyItem } from '@/types'
import { ArrowLeftIcon } from '@heroicons/react/16/solid'
import { CurrencyYenIcon } from '@heroicons/react/24/outline'

import DetailTable from '@syney/ReportDetail/DetailTable'

import { useDetail } from '@syney/ReportDetail/useDetail'
import EditButton from '@ui/EditButton'
import { App, Button, Modal } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useUrlListState } from '@/hooks/useUrlListState'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import FormErrorAlert from '@/ui/FormErrorAlert'
import SelectedSummaryBar from '@/ui/SelectedSummaryBar'
import StatusPill from '@/ui/StatusPill'
import { TableState } from '@/ui/TableState'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { formatDate } from '@/utils/format'
import { getReportStatusTone, REPORT_STATUS_LABELS } from '../statusTones'
import SyneyDetailInfoItem from '../SyneyDetailInfoItem'
import TableSelectionProvider from '../TableSelectionProvider'
import { useTableSelection } from '../useTableSelection'
import DetailForm from './DetailForm'
import { useDeleteDetail } from './useDeleteDetail'
import { useUpdateDetail } from './useUpdateDetail'

function ReportDetailContent() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const location = useLocation()
  // 从列表进入时携带列表地址（含筛选/分页）；直接打开详情时回到列表首页
  const listHref
    = (location.state as { from?: string } | null)?.from || '/syney-store-report-list'
  const { reportNo } = useParams()
  const { page, pageSize } = useUrlListState([] as const)
  const { tableSelectedKeys, setTableSelectedKeys } = useTableSelection()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formError, setFormError] = useState<unknown>(null)
  const [detailFormRef, setDetailFormRef] = useState<FormInstance<ISyneyItem> | null>(null)

  const { report, reportInfo, reportLoading, isFetching, error: detailError, refetch } = useDetail()
  const { updateItem, isUpdating } = useUpdateDetail()
  const { isDeleting, deleteDetail } = useDeleteDetail()

  useEffect(() => {
    setTableSelectedKeys([])
  }, [reportNo, setTableSelectedKeys])

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

  function handleEdit() {
    if (tableSelectedKeys?.length !== 1) {
      message.warning('请选择一条对账单明细进行编辑')
      return
    }
    setFormError(null)
    setIsModalOpen(true)
  }

  function handleOk() {
    detailFormRef?.submit()
  }

  function handleCancel() {
    setFormError(null)
    detailFormRef?.resetFields()
    setIsModalOpen(false)
    setTableSelectedKeys([])
  }

  async function handleFinish(values: ISyneyItem) {
    setFormError(null)
    try {
      await updateItem({ item: values })
      message.success(feedbackText.updated('对账单明细'))
      handleCancel()
    }
    catch (err) {
      setFormError(err)
    }
  }

  async function handleDeleteSelected() {
    if (tableSelectedKeys.length === 0) {
      message.warning(feedbackText.selectRequired('删除'))
      return
    }
    const ids = tableSelectedKeys.map(String)
    try {
      await deleteDetail(ids)
      message.success(feedbackText.deleted('对账单明细', ids.length))
    }
    catch (err) {
      message.error(getUserErrorMessage(err, feedbackText.failed('删除', '对账单明细')))
    }
    finally {
      setTableSelectedKeys([])
    }
  }

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 12,
    summaryRowHeight: 39,
  })

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* 对账单信息轻量分栏区 */}
      <div className="border-b border-slate-200 pb-3 dark:border-slate-700">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            对账单信息
          </span>
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
            <SyneyDetailInfoItem key={item.label} label={item.label}>
              {item.label === '明细条数'
                ? (
                    <span className="tabular-nums">{item.value}</span>
                  )
                : (
                    item.value
                  )}
            </SyneyDetailInfoItem>
          ))}
          <SyneyDetailInfoItem label="总金额">
            <span className="text-lg font-bold text-slate-900 tabular-nums dark:text-slate-100">
              {reportInfo?.TotalAmount?.toLocaleString() ?? '-'}
            </span>
          </SyneyDetailInfoItem>
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
          <TableState
            loading={reportLoading && !report}
            error={detailError}
            onRetry={refetch}
          >
            <DetailTable
              data={pagedRecords}
              loading={isFetching || isUpdating || isDeleting}
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
          icon={<ArrowLeftIcon className="size-4" />}
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
            onConfirm={handleDeleteSelected}
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
      >
        <div className="space-y-4">
          <FormErrorAlert
            error={formError}
            reason={
              formError
                ? getUserErrorMessage(formError, feedbackText.failed('更新', '对账单明细'))
                : undefined
            }
          />
          <DetailForm
            setFormRef={setDetailFormRef}
            onFinish={handleFinish}
            isSubmitting={isUpdating}
            initialValues={reportItem}
          />
        </div>
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
