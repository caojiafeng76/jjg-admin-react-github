import { useEffect, useRef, useState, useMemo } from 'react'
import { App, Button, Input, Modal } from 'antd'
import {
  ArrowDownCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'

import { ISyneyItem, ISyneyStoreReportFormRef } from '@/types'
import { useDeleteReport } from '@syney/ReportList/useDeleteReport'

import AddButton from '@ui/AddButton'
import DeleteButton from '@ui/DeleteButton'
import ReportForm from '@syney/ReportList/ReportForm'
import ReportTable from '@syney/ReportList/ReportTable'
import PrintButton from '@/ui/PrintButton'
import ReportSelect from './ReportSelect'
import { useAppStore } from '@/store'
import ConfirmButton from './ConfirmButton'
import UnConfirmedButton from './UnConfirmedButton'
import AppPagination from '@/ui/AppPagination'
import { useReports } from './useReports'
import ExportAsExcelButton from './ExportAsExcelButton'
import { useGenerateSyneyStoreReportPDF } from './useGenerateSyneyStoreReportPDF'
import ExportPDFButton from './ExportPDFButton'
import { useFetchSyneyStoreReport } from './useFetchSyneyStoreReport'
import { usePrintSyneyStoreReceipt } from './usePrintSyneyStoreReceipt'
import { useSyneySpecs } from '../SpecList/useSyneySpecs'
import { useCreateReport } from './useCreateReport'
import {
  buildSyneyStoreReportPayload,
  SyneyStoreReportPayload,
} from '@utils/syneyStoreReport'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useSearchParams } from 'react-router-dom'

export default function ReportList() {
  const { message: messageApi } = App.useApp()
  const [searchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [specsLoading, setSpecsLoading] = useState(false)
  const [storeInNo, setStoreInNo] = useState('')

  const {
    tableSelectedKeys,
    setTableSelectedKeys,
    isLoading: isCreating,
  } = useAppStore()
  const { print, isLoading: isPrinting } = useGenerateSyneyStoreReportPDF()
  const { syneySpecs, isLoading: importSpecsLoading } = useSyneySpecs({
    isAll: true,
  })
  const { fetchSyneyStoreReport, isFetching } = useFetchSyneyStoreReport()
  const { createReport, isCreating: isCreatingFromScm } = useCreateReport()
  const { printByStoreInNo, isPrintingStoreReceipt } =
    usePrintSyneyStoreReceipt()

  const reportFormRef = useRef<ISyneyStoreReportFormRef>(null)

  const { isDeleting, deleteReport } = useDeleteReport()
  const { count, reports, isLoading: reportsLoading } = useReports()

  function handleCreate() {
    reportFormRef.current?.getInstance().resetFields()
    setIsModalOpen(true)
  }

  function handleOk() {
    reportFormRef.current?.getInstance().submit()
  }

  function handleCancel() {
    reportFormRef.current?.getInstance().resetFields()
    setIsModalOpen(false)
  }

  function handleDelete() {
    if (tableSelectedKeys.length === 0) {
      messageApi.warning('请选择至少一条数据')
      return
    }
    deleteReport(tableSelectedKeys.map(String), {
      onSuccess: () => {
        messageApi.success('删除对账单成功')
        setTableSelectedKeys([])
      },
      onError: (err) => {
        console.error(err)
        messageApi.error('删除对账单失败')
      },
    })
  }

  function handleFetchStoreReport(value: string) {
    const trimmedStoreInNo = value.trim()

    if (!trimmedStoreInNo) {
      messageApi.warning('请输入入库单号')
      return
    }

    if (importSpecsLoading) {
      messageApi.loading('规格数据加载中，请稍后再试', 1)
      return
    }

    fetchSyneyStoreReport(trimmedStoreInNo, {
      onSuccess: (items) => {
        if (items.length === 0) {
          messageApi.warning('未获取到该入库单数据')
          return
        }

        let payload: SyneyStoreReportPayload

        try {
          payload = buildSyneyStoreReportPayload(
            items as ISyneyItem[],
            syneySpecs || [],
          )
        } catch (error) {
          messageApi.error(
            error instanceof Error ? error.message : '入库单数据解析失败',
          )
          return
        }

        createReport(payload, {
          onSuccess: () => {
            messageApi.success('入库单生成成功')
            setStoreInNo('')
          },
          onError: (err) => {
            console.error(err)
            messageApi.error('入库单生成失败')
          },
        })
      },
      onError: (err) => {
        console.error(err)
        messageApi.error(err instanceof Error ? err.message : '西尼入库单获取失败')
      },
    })
  }

  async function handlePrint() {
    if (tableSelectedKeys.length === 0) {
      messageApi.warning('请选择至少一条数据')
      return
    }

    if (isPrinting) {
      messageApi.loading('数据加载中，请稍候...', 1)
      return
    }

    const success = await print()
    if (success) {
      messageApi.success('PDF 文件生成成功')
      setTableSelectedKeys([])
    } else {
      messageApi.warning('没有可打印的数据')
    }
  }

  async function handlePrintStoreReceipt() {
    if (isPrintingStoreReceipt) {
      messageApi.loading('入库单打印准备中，请稍候...', 1)
      return
    }

    await printByStoreInNo(storeInNo)
  }

  useEffect(() => {
    return () => {
      setTableSelectedKeys([])
    }
  }, [setTableSelectedKeys])

  const selectedCount = tableSelectedKeys.length
  const records = useMemo(() => reports || [], [reports])
  const selectedAmount = useMemo(() => {
    if (selectedCount === 0) return 0
    const keySet = new Set(tableSelectedKeys.map((k) => String(k)))
    let total = 0
    for (const item of records) {
      if (keySet.has(String(item.No))) {
        total += Number(item.TotalAmount || 0)
      }
    }
    return total
  }, [records, selectedCount, tableSelectedKeys])

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 12,
    summaryRowHeight: 39,
  })

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={handleCreate} />
        <DeleteButton onConfirm={handleDelete} isDeleting={isDeleting} />
        <PrintButton handlePrint={handlePrint}>打印对账单</PrintButton>
        <ExportAsExcelButton />
        <ExportPDFButton />
        <ConfirmButton />
        <UnConfirmedButton />

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Input
            allowClear={{
              clearIcon: <XMarkIcon className="h-3.5 w-3.5 text-slate-400" />,
            }}
            className="w-60 rounded-lg"
            placeholder="输入西尼入库单号"
            value={storeInNo}
            onChange={(event) => setStoreInNo(event.target.value)}
            onPressEnter={(e) =>
              handleFetchStoreReport((e.target as HTMLInputElement).value)
            }
            prefix={
              <MagnifyingGlassIcon className="h-3.5 w-3.5 text-slate-400" />
            }
          />
          <Button
            type="text"
            icon={<ArrowDownCircleIcon className="size-4 text-blue-500/80!" />}
            className="rounded-lg"
            loading={isFetching || isCreatingFromScm}
            disabled={!storeInNo.trim()}
            onClick={() => handleFetchStoreReport(storeInNo)}
          >
            获取
          </Button>
          <PrintButton
            disabled={!storeInNo.trim()}
            handlePrint={handlePrintStoreReceipt}
            loading={isPrintingStoreReceipt}
          >
            打印入库单
          </PrintButton>
        </div>
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
                    d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
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

      {/* 过滤栏 */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200/60 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="text-sm font-medium text-slate-600">筛选条件</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">对账状态：</span>
            <ReportSelect />
          </div>
        </div>
      </div>

      {/* 表格 + 分页 */}
      <div className="grid flex-1 grid-rows-[1fr_auto] gap-3 overflow-hidden">
        <div ref={tableContainerRef} className="min-h-0 overflow-hidden">
          <ReportTable
            loading={reportsLoading}
            data={records}
            page={page}
            pageSize={pageSize}
            scrollY={scrollY}
          />
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={count || 0} />
        </div>
      </div>

      <Modal
        title="创建对账单"
        open={isModalOpen}
        confirmLoading={isCreating || specsLoading}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <ReportForm
          ref={reportFormRef}
          handleCancel={handleCancel}
          onSpecsLoadingChange={setSpecsLoading}
        />
      </Modal>
    </div>
  )
}
