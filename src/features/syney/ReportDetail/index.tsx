import { useEffect, useRef, useState, useMemo } from 'react'
import { App, Modal } from 'antd'

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
import { useSearchParams } from 'react-router-dom'

export default function ReportDetail() {
  const { message } = App.useApp()
  const [searchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const tableSelectedKeys = useAppStore((state) => state.tableSelectedKeys)
  const setTableSelectedKeys = useAppStore(
    (state) => state.setTableSelectedKeys,
  )
  const [isModalOpen, setIsModalOpen] = useState(false)

  const detailFormRef = useRef<FormInstance<ISyneyItem>>(null)

  const { report, reportLoading } = useDetail()
  const { updateItem, isUpdating } = useUpdateDetail()
  const { isDeleting, deleteDetail } = useDeleteDetail()

  const reportItem = useMemo(
    () => report?.find((item) => item.id === Number(tableSelectedKeys?.at(0))),
    [report, tableSelectedKeys],
  )

  const records = useMemo(() => report || [], [report])
  const total = records.length

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

  useEffect(() => {
    if (isModalOpen) {
      detailFormRef?.current?.setFieldsValue(reportItem || {})
    }
  }, [isModalOpen, reportItem])

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 12,
    summaryRowHeight: 39,
  })

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
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

      {/* 选中摘要条 */}
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-blue-50/80 px-5 py-3 shadow-[0_8px_30px_rgba(59,130,246,0.12)] backdrop-blur-sm">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100">
              <svg
                className="h-3.5 w-3.5 text-blue-600"
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
            <span className="mx-1 text-lg font-bold text-blue-600">
              {selectedCount}
            </span>
            条
          </span>
          {selectedAmount > 0 ? (
            <span className="flex items-center gap-2 text-sm text-slate-600">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100">
                <svg
                  className="h-3.5 w-3.5 text-rose-600"
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
              <span className="text-xl font-bold text-rose-600 tabular-nums">
                {selectedAmount.toLocaleString()}
              </span>
            </span>
          ) : null}
        </div>
      ) : null}

      {/* 表格 + 分页 */}
      <div className="grid flex-1 grid-rows-[1fr_auto] gap-3 overflow-hidden">
        <div ref={tableContainerRef} className="min-h-0 overflow-hidden">
          <DetailTable
            data={records}
            loading={reportLoading || isUpdating || isDeleting}
            page={page}
            pageSize={pageSize}
            scrollY={scrollY}
          />
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={total} />
        </div>
      </div>

      <Modal
        title={'编辑参数规格'}
        open={isModalOpen}
        confirmLoading={isUpdating}
        width={560}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <DetailForm ref={detailFormRef} onFinishFuc={onFinishFuc} />
      </Modal>
    </div>
  )
}
