import { App, Input, message, Modal } from 'antd'
import { useEffect, useRef, useState } from 'react'

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

export default function ReportList() {
  const { message: messageApi } = App.useApp()
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
  const { count } = useReports()

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
    // 调用deleteSyneySpecs函数，传入specIds以删除对应的规格信息
    if (tableSelectedKeys.length === 0) {
      message.warning('请选择至少一条数据')
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
      message.warning('请选择至少一条数据')
      return
    }

    // 如果正在加载，提示用户
    if (isPrinting) {
      messageApi.loading('数据加载中，请稍候...', 1)
      return
    }

    // 调用打印函数，根据返回值显示消息
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

  return (
    <div className="grid grid-rows-[32px_1fr] gap-4">
      <div className="flex h-full items-center gap-2">
        <div className="actions flex grow items-center gap-4">
          <span className="text-[16px] font-semibold">操作</span>
          <AddButton handleCreate={handleCreate} />
          <DeleteButton onConfirm={handleDelete} isDeleting={isDeleting} />
          <PrintButton handlePrint={handlePrint}>打印对账单</PrintButton>
          <ExportAsExcelButton />
          <ExportPDFButton />

          <ConfirmButton />
          <UnConfirmedButton />
          <Input.Search
            allowClear
            className="max-w-[260px]"
            enterButton="获取"
            loading={isFetching || isCreatingFromScm}
            placeholder="输入西尼入库单号"
            value={storeInNo}
            onChange={(event) => setStoreInNo(event.target.value)}
            onSearch={handleFetchStoreReport}
          />
          <PrintButton
            disabled={!storeInNo.trim()}
            handlePrint={handlePrintStoreReceipt}
            loading={isPrintingStoreReceipt}
          >
            打印入库单
          </PrintButton>
        </div>

        <div className="flex items-center gap-4 filter">
          <span className="text-[16px] font-semibold">过滤</span>
          <ReportSelect />
        </div>
      </div>

      <div className="flex flex-col gap-4 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-x-auto">
          <ReportTable />
        </div>
        <div className="flex shrink-0 justify-end">
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
