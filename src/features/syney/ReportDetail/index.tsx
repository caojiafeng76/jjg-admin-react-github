import { useRef, useState, useMemo } from 'react'
import { App, Button, Modal } from 'antd'
import { ArrowLeftIcon } from '@heroicons/react/16/solid'
import dayjs from 'dayjs'

import { useDetail } from '@syney/ReportDetail/useDetail'

import { ISyneyItem } from '@/types'
import DetailTable from '@syney/ReportDetail/DetailTable'
import EditButton from '@ui/EditButton'
import DetailForm from './DetailForm'
import { useUpdateDetail } from './useUpdateDetail'
import DeleteButton from '@/ui/DeleteButton'
import { useDeleteDetail } from './useDeleteDetail'
import { FormInstance } from 'antd/lib'
import { useAppStore } from '@/store'
import { useTableHeight } from '@/hooks/useTableHeight'
import AppPagination from '@/ui/AppPagination'
import { TableState } from '@/ui/TableState'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

// 状态 pill 语义色（与 ReportList ReportTable STATUS_STYLES 一致）
const STATUS_PILL: Record<string, string> = {
  confirmed: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  unconfirmed: 'bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
  已校对: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  未校对: 'bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: '已校对',
  unconfirmed: '未校对',
  已校对: '已校对',
  未校对: '未校对',
}

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

export default function ReportDetail() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { reportNo } = useParams()
  const [searchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const tableSelectedKeys = useAppStore((state) => state.tableSelectedKeys)
  const setTableSelectedKeys = useAppStore(
    (state) => state.setTableSelectedKeys,
  )
  const [isModalOpen, setIsModalOpen] = useState(false)

  const detailFormRef = useRef<FormInstance<ISyneyItem>>(null)

  const { report, reportInfo, reportLoading } = useDetail()
  const { updateItem, isUpdating } = useUpdateDetail()
  const { isDeleting, deleteDetail } = useDeleteDetail()

  const reportItem = useMemo(
    () => report?.find((item) => item.id === Number(tableSelectedKeys?.at(0))),
    [report, tableSelectedKeys],
  )

  const records = useMemo(() => report || [], [report])
  const total = records.length

  const reportFields = useMemo(
    () => [
      { label: '对账单号', value: reportInfo?.No ?? reportNo ?? '-' },
      {
        label: '创建日期',
        value: reportInfo?.created_at
          ? dayjs(reportInfo.created_at).format('YYYY-MM-DD')
          : '-',
      },
      { label: '明细条数', value: records.length },
    ],
    [reportInfo, reportNo, records.length],
  )

  const selectedCount = tableSelectedKeys.length
  const selectedAmount = useMemo(() => {
    if (selectedCount === 0) return 0
    const keySet = new Set(tableSelectedKeys.map((k) => String(k)))
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
      message.warning('只能选择一条数据')
      return
    }
    showModal()
  }

  function handleOk() {
    detailFormRef?.current?.submit()
    setTableSelectedKeys([])
  }

  function handleCancel() {
    detailFormRef?.current?.resetFields()
    setIsModalOpen(false)
    setTableSelectedKeys([])
  }

  function onFinishFuc(values: ISyneyItem) {
    updateItem({ item: values }, { onSettled: handleCancel })
  }

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 12,
    summaryRowHeight: 39,
  })

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* 对账单信息分区卡片 */}
      <div className="app-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              对账单信息
            </span>
          </div>
          {reportInfo?.Status && STATUS_PILL[reportInfo.Status] ? (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_PILL[reportInfo.Status]}`}
            >
              {STATUS_LABEL[reportInfo.Status]}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          {reportFields.map((item) => (
            <InfoItem key={item.label} label={item.label}>
              {item.label === '明细条数' ? (
                <span className="tabular-nums">{item.value}</span>
              ) : (
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
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-blue-50/80 px-5 py-3 shadow-[0_8px_30px_rgba(59,130,246,0.12)] backdrop-blur-sm dark:border-blue-900/50 dark:from-blue-950/60 dark:via-indigo-950/60 dark:to-blue-950/60">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <svg
                className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            已选
            <span className="mx-1 text-lg font-bold text-blue-600 dark:text-blue-400">
              {selectedCount}
            </span>
            条
          </span>
          {selectedAmount > 0 ? (
            <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/40">
                <svg
                  className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </div>
              选中金额合计：
              <span className="text-xl font-bold text-rose-600 tabular-nums dark:text-rose-400">
                {selectedAmount.toLocaleString()}
              </span>
            </span>
          ) : null}
        </div>
      ) : null}

      {/* 表格 + 分页 */}
      <div className="grid flex-1 grid-rows-[1fr_auto] gap-3 overflow-hidden">
        <div ref={tableContainerRef} className="min-h-0 overflow-hidden">
          <TableState loading={reportLoading && records.length === 0}>
            <DetailTable
              data={records}
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
          onClick={() => navigate(-1)}
        >
          返回列表
        </Button>
        <div className="flex items-center gap-2">
          <EditButton title="请选择一条数据" handleEdit={handleEdit} />
          <DeleteButton
            isDeleting={isDeleting}
            onConfirm={() => {
              if (tableSelectedKeys.length === 0) {
                message.error('请选择要删除的数据')
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
        title={'编辑参数规格'}
        open={isModalOpen}
        confirmLoading={isUpdating}
        width={560}
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
