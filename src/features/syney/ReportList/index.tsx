import type {
  SyneyStoreReportPayload,
} from '@utils/syneyStoreReport'
import type { ISyneyItem, ISyneyStoreReportFormRef } from '@/types'
import {
  ArrowDownCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import { CurrencyYenIcon } from '@heroicons/react/24/outline'

import ReportForm from '@syney/ReportList/ReportForm'
import ReportTable from '@syney/ReportList/ReportTable'

import { useDeleteReport } from '@syney/ReportList/useDeleteReport'
import AddButton from '@ui/AddButton'
import DeleteButton from '@ui/DeleteButton'
import {
  buildSyneyStoreReportPayload,
} from '@utils/syneyStoreReport'
import { App, Button, Input, Modal } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTableHeight } from '@/hooks/useTableHeight'
import AppPagination from '@/ui/AppPagination'
import PrintButton from '@/ui/PrintButton'
import SelectedSummaryBar from '@/ui/SelectedSummaryBar'
import { TableState } from '@/ui/TableState'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { useSyneySpecs } from '../SpecList/useSyneySpecs'
import TableSelectionProvider from '../TableSelectionProvider'
import { useTableSelection } from '../useTableSelection'
import ConfirmButton from './ConfirmButton'
import ExportAsExcelButton from './ExportAsExcelButton'
import ExportPDFButton from './ExportPDFButton'
import ReportSelect from './ReportSelect'
import UnConfirmedButton from './UnConfirmedButton'
import { useCreateReport } from './useCreateReport'
import { useFetchSyneyStoreReport } from './useFetchSyneyStoreReport'
import { useGenerateSyneyStoreReportPDF } from './useGenerateSyneyStoreReportPDF'
import { usePrintSyneyStoreReceipt } from './usePrintSyneyStoreReceipt'
import { useReports } from './useReports'

function ReportListContent() {
  const { message: messageApi } = App.useApp()
  const [searchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [specsLoading, setSpecsLoading] = useState(false)
  const [storeInNo, setStoreInNo] = useState('')

  const { tableSelectedKeys, setTableSelectedKeys } = useTableSelection()
  const [isCreating, setIsCreating] = useState(false)
  const {
    print,
    preloadPDF,
    isLoading: isPrinting,
  } = useGenerateSyneyStoreReportPDF()
  const { syneySpecs, isLoading: importSpecsLoading } = useSyneySpecs({
    isAll: true,
  })
  const { fetchSyneyStoreReport, isFetching } = useFetchSyneyStoreReport()
  const { createReport, isCreating: isCreatingFromScm } = useCreateReport()
  const { printByStoreInNo, preloadStoreReceiptPDF, isPrintingStoreReceipt }
    = usePrintSyneyStoreReceipt()

  const reportFormRef = useRef<ISyneyStoreReportFormRef>(null)

  const { isDeleting, deleteReport } = useDeleteReport()
  const { count, reports, isLoading: reportsLoading, error, refetch } = useReports()

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
      messageApi.warning(feedbackText.selectRequired('删除'))
      return
    }
    const count = tableSelectedKeys.length
    deleteReport(tableSelectedKeys.map(String), {
      onSuccess: () => {
        messageApi.success(feedbackText.deleted('对账单', count))
        setTableSelectedKeys([])
      },
      onError: (err) => {
        messageApi.error(
          getUserErrorMessage(err, feedbackText.failed('删除', '对账单')),
        )
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
      messageApi.warning('踏板规格加载中，请稍后再试')
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
        }
        catch (error) {
          messageApi.error(
            getUserErrorMessage(error, '入库单数据解析失败，请稍后重试'),
          )
          return
        }

        createReport(payload, {
          onSuccess: () => {
            messageApi.success(feedbackText.created('对账单'))
            setStoreInNo('')
          },
          onError: (err) => {
            messageApi.error(
              getUserErrorMessage(err, feedbackText.failed('创建', '对账单')),
            )
          },
        })
      },
      onError: (err) => {
        messageApi.error(
          getUserErrorMessage(err, '西尼入库单获取失败，请稍后重试'),
        )
      },
    })
  }

  async function handlePrint() {
    if (tableSelectedKeys.length === 0) {
      messageApi.warning(feedbackText.selectRequired('打印'))
      return
    }

    if (isPrinting) {
      messageApi.warning('对账单数据加载中，请稍后再试')
      return
    }

    // 成功 / 失败提示由 useGenerateSyneyStoreReportPDF 统一弹出
    const success = await print()
    if (success) {
      setTableSelectedKeys([])
    }
  }

  async function handlePrintStoreReceipt() {
    if (isPrintingStoreReceipt) {
      messageApi.warning('入库单打印准备中，请稍后再试')
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
    if (selectedCount === 0)
      return 0
    const keySet = new Set(tableSelectedKeys.map(k => String(k)))
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
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={isDeleting}
          count={tableSelectedKeys.length}
          title="删除对账单"
          itemName="对账单"
        />
        <PrintButton handlePrint={handlePrint} onPreload={preloadPDF}>
          打印对账单
        </PrintButton>
        <ExportAsExcelButton />
        <ExportPDFButton />
        <ConfirmButton />
        <UnConfirmedButton />

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Input
            allowClear={{
              clearIcon: <XMarkIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />,
            }}
            className="w-60 rounded-lg"
            placeholder="输入西尼入库单号"
            value={storeInNo}
            onChange={event => setStoreInNo(event.target.value)}
            onPressEnter={e =>
              handleFetchStoreReport((e.target as HTMLInputElement).value)}
            prefix={
              <MagnifyingGlassIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
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
            onPreload={preloadStoreReceiptPDF}
          >
            打印入库单
          </PrintButton>
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

      {/* 过滤栏 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-300">对账状态：</span>
          <ReportSelect />
        </div>
      </div>

      {/* 表格 + 分页 */}
      <div className="grid flex-1 grid-rows-[1fr_auto] gap-3 overflow-hidden">
        <div ref={tableContainerRef} className="min-h-0 overflow-hidden">
          <TableState
            loading={reportsLoading}
            error={error}
            onRetry={refetch}
          >
            <ReportTable
              loading={reportsLoading}
              data={records}
              page={page}
              pageSize={pageSize}
              scrollY={scrollY}
            />
          </TableState>
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={count || 0} />
        </div>
      </div>

      <Modal
        title="新建对账单"
        open={isModalOpen}
        confirmLoading={isCreating || specsLoading}
        width={720}
        destroyOnHidden
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <ReportForm
          ref={reportFormRef}
          handleCancel={handleCancel}
          onSpecsLoadingChange={setSpecsLoading}
          onCreatingChange={setIsCreating}
        />
      </Modal>
    </div>
  )
}

/** 选中状态随页面实例独立（多标签页缓存下互不影响） */
export default function ReportList() {
  return (
    <TableSelectionProvider>
      <ReportListContent />
    </TableSelectionProvider>
  )
}
