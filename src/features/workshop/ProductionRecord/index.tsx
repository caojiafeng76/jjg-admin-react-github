import { useState, useCallback, useEffect } from 'react'
import { App, Modal, FormInstance } from 'antd'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'

import AddButton from '@/ui/AddButton'
import EditButton from '@/ui/EditButton'
import DeleteButton from '@/ui/DeleteButton'
import PrintButton from '@/ui/PrintButton'
import ExportButton from '@/ui/ExportButton'
import AppPagination from '@/ui/AppPagination'
import type { ProductionRecord } from '@/services/apiProductionRecords'
import {
  useProductionRecordsList,
  useCreateProductionRecord,
  useUpdateProductionRecord,
  useDeleteProductionRecords,
} from './useProductionRecords'
import ProductionRecordTable from './ProductionRecordTable'
import ProductionRecordForm from './ProductionRecordForm'
import ProductionRecordSearch from './ProductionRecordSearch'
import { usePrintProductionRecords } from './usePrintProductionRecords'
import { useExportProductionRecordsAsExcel } from './useExportProductionRecordsAsExcel'

export default function ProductionRecordList() {
  const { message } = App.useApp()

  const { printProductionRecords, contextHolder, isPrinting } = usePrintProductionRecords(message)
  const {
    exportProductionRecordsAsExcel,
    contextHolder: exportContextHolder,
    isExporting,
  } = useExportProductionRecordsAsExcel(message)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('录入产量')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [formRef, setFormRef] = useState<FormInstance<any> | null>(null)
  
  // 初始化当月日期范围
  const getCurrentMonthRange = () => {
    const start = dayjs().startOf('month')
    const end = dayjs().endOf('month')
    return {
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
    }
  }

  const [searchParams, setSearchParams] = useState<{
    startDate?: string
    endDate?: string
    order_id?: string
    process_id?: string
    product_model?: string
    operator_id?: string
  }>(() => {
    // 初始化时设置为当月日期范围
    const monthRange = getCurrentMonthRange()
    return {
      startDate: monthRange.startDate,
      endDate: monthRange.endDate,
    }
  })

  const { data, isLoading } = useProductionRecordsList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateProductionRecord()

  const updateMutation = useUpdateProductionRecord()

  const deleteMutation = useDeleteProductionRecords()

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setModalTitle('录入产量')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef])

  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null)

  const handleEdit = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    const record = data?.items.find((item) => item.id === selectedRowKeys[0])
    if (!record) return

    setEditingRecord(record)
    setIsEdit(true)
    setModalTitle('编辑产量记录')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }
    deleteMutation.mutate(selectedRowKeys as string[])
  }, [deleteMutation, message, selectedRowKeys])

  const handlePrint = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }
    // 获取选中的记录
    const selectedRecords = data?.items.filter((item) => item.id && selectedRowKeys.includes(item.id)) || []
    printProductionRecords(selectedRecords)
  }, [data?.items, message, printProductionRecords, selectedRowKeys])

  const handleExport = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }
    // 获取选中的记录
    const selectedRecords = data?.items.filter((item) => item.id && selectedRowKeys.includes(item.id)) || []
    exportProductionRecordsAsExcel(selectedRecords)
  }, [data?.items, exportProductionRecordsAsExcel, message, selectedRowKeys])

  const handleFinish = useCallback(
    (values: ProductionRecord) => {
      if (isEdit && selectedRowKeys[0]) {
        updateMutation.mutate({
          id: selectedRowKeys[0] as string,
          values,
        })
      } else {
        createMutation.mutate(values)
      }
    },
    [createMutation, isEdit, selectedRowKeys, updateMutation],
  )

  const handleSearch = useCallback(
    (params: typeof searchParams) => {
      setSearchParams(params)
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setSearchParams({})
    searchParamsURL.set('page', '1')
    setSearchParamsURL(searchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      searchParamsURL.set('page', Math.max(page - 1, 1).toString())
      setSearchParamsURL(searchParamsURL)
    }
  }, [data, page, searchParamsURL, setSearchParamsURL])

  // 初始化时自动应用当月日期范围（仅在首次加载时执行）
  useEffect(() => {
    // 检查URL参数中是否已有日期范围，如果没有则使用当月
    const urlStartDate = searchParamsURL.get('startDate')
    const urlEndDate = searchParamsURL.get('endDate')
    
    // 如果URL中没有日期参数，且当前searchParams也没有日期，则使用当月日期范围
    if (!urlStartDate && !urlEndDate && !searchParams.startDate && !searchParams.endDate) {
      // URL中没有日期参数，使用当月日期范围
      const monthRange = getCurrentMonthRange()
      setSearchParams({
        startDate: monthRange.startDate,
        endDate: monthRange.endDate,
      })
    }
  }, []) // 仅在组件首次加载时执行

  return (
    <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={handleCreate} />
        <EditButton title="编辑" handleEdit={handleEdit} />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除产量记录"
          itemName="产量记录"
        />
        <PrintButton
          handlePrint={handlePrint}
          loading={isPrinting}
          count={selectedRowKeys.length}
        />
        <ExportButton
          handleExport={handleExport}
          loading={isExporting}
          count={selectedRowKeys.length}
        />
      </div>
      {contextHolder}
      {exportContextHolder}

      {/* 搜索栏 */}
      <div className="flex items-center gap-2">
        <span className="text-gray-600 whitespace-nowrap">搜索：</span>
        <ProductionRecordSearch 
          onSearch={handleSearch} 
          onReset={handleResetSearch}
          initialStartDate={searchParams.startDate}
          initialEndDate={searchParams.endDate}
        />
      </div>

      {/* 表格和分页 */}
      <div className="flex flex-col gap-4 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <ProductionRecordTable
            loading={isLoading}
            data={data?.items || []}
            selectedRowKeys={selectedRowKeys}
            onSelect={setSelectedRowKeys}
            page={page}
            pageSize={pageSize}
          />
        </div>
        <div className="flex justify-end flex-shrink-0">
          <AppPagination
            total={data?.total || 0}
            pageSizeOptions={['10', '20', '30', '50', '100', '200', '300', '500']}
            defaultPageSize={10}
          />
        </div>
      </div>

      <Modal
        title={modalTitle}
        open={isModalOpen}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
        onOk={() => formRef?.submit()}
        onCancel={() => {
          setIsModalOpen(false)
          setIsEdit(false)
          setEditingRecord(null)
        }}
        width={800}
      >
        <ProductionRecordForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isCreating={createMutation.isPending}
          isEdit={isEdit}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
        />
      </Modal>
    </div>
  )
}

