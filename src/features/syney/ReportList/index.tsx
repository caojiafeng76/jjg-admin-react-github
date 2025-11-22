import { message, Modal } from 'antd'
import { useRef, useState } from 'react'

import { ISyneyStoreReportFormRef } from '@/types'
import { useDeleteReport } from '@syney/ReportList/useDeleteReport'

import AddButton from '@ui/AddButton'
import DeleteButton from '@ui/DeleteButton'
import ReportForm from '@syney/ReportList/ReportForm'
import ReportTable from '@syney/ReportList/ReportTable'
import { useSelectedReports } from './useSelectedReports'
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

export default function ReportList() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { tableSelectedKeys, isLoading: isCreating } = useAppStore()
  const { selectedReportsLoading } = useSelectedReports()
  const { print } = useGenerateSyneyStoreReportPDF()

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
    deleteReport(tableSelectedKeys.map(String))
  }

  function handlePrint() {
    if (tableSelectedKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }
    if (!selectedReportsLoading) print()
  }

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
        </div>

        <div className="flex items-center gap-4 filter">
          <span className="text-[16px] font-semibold">过滤</span>
          <ReportSelect />
        </div>
      </div>

      <div className="no-scrollbar overflow-y-scroll">
        <ReportTable />

        <AppPagination total={count || 0} />

        <Modal
          title="创建对账单"
          open={isModalOpen}
          confirmLoading={isCreating}
          onOk={handleOk}
          onCancel={handleCancel}
        >
          <ReportForm ref={reportFormRef} handleCancel={handleCancel} />
        </Modal>
      </div>
    </div>
  )
}
