import { useState, useCallback, useEffect } from 'react'
import { App, Modal, FormInstance } from 'antd'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import AddButton from '@/ui/AddButton'
import EditButton from '@/ui/EditButton'
import DeleteButton from '@/ui/DeleteButton'
import PrintButton from '@/ui/PrintButton'
import AppPagination from '@/ui/AppPagination'
import { getWorkshopOrders, createWorkshopOrder, updateWorkshopOrder, deleteWorkshopOrders, createWorkshopOrdersBatch } from '@/services/apiWorkshopOrders'
import WorkshopOrderTable from './WorkshopOrderTable'
import WorkshopOrderForm from './WorkshopOrderForm'
import WorkshopOrderSearch from './WorkshopOrderSearch'
import { usePrintWorkshopOrders } from './usePrintWorkshopOrders'

export interface WorkshopOrder {
  id?: string
  product_delivery_date: string
  project_no: string | null
  product_model: string | null
  length_mm: number | null
  customer_model: string | null
  order_quantity: number | null
  weight_per_meter_kg: number | null
  color_name: string | null
  package_name: string | null
  product_category: string | null
  material_name: string | null
  material_code: string | null
}

export default function WorkshopOrderList() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建订单')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  // 使用 URL 参数管理分页，与 AppPagination 保持一致
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [formRef, setFormRef] = useState<FormInstance<WorkshopOrder> | null>(null)
  const [searchParams, setSearchParams] = useState<{
    project_no?: string
    product_model?: string
    customer_model?: string
    startDate?: string
    endDate?: string
  }>({})

  const { data, isLoading } = useQuery({
    queryKey: ['workshop-orders', page, pageSize, searchParams],
    queryFn: () => getWorkshopOrders({ page, pageSize, ...searchParams }),
    placeholderData: (previousData) => previousData,
  })

  const createMutation = useMutation({
    mutationFn: createWorkshopOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-orders'] })
      message.success('创建成功')
      setIsModalOpen(false)
      setIsEdit(false)
      setSelectedRowKeys([])
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '创建失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateWorkshopOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-orders'] })
      message.success('更新成功')
      setIsModalOpen(false)
      setIsEdit(false)
      setSelectedRowKeys([])
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '更新失败')
    },
  })

  const batchCreateMutation = useMutation({
    mutationFn: createWorkshopOrdersBatch,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workshop-orders'] })
      message.success(`批量导入成功，共导入 ${variables.length} 条数据`)
      setIsModalOpen(false)
      setIsEdit(false)
      setSelectedRowKeys([])
    },
    onError: (error) => {
      message.error(`批量导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWorkshopOrders,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-orders'] })
      setSelectedRowKeys([])
      message.success('删除成功')
    },
  })

  const { generatePDF, isPrinting } = usePrintWorkshopOrders()

  const handlePrint = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要打印的订单')
      return
    }
    const selectedOrders = data?.items.filter((item) =>
      selectedRowKeys.includes(item.id || ''),
    ) || []
    generatePDF(selectedOrders)
  }, [selectedRowKeys, data?.items, generatePDF, message])

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setModalTitle('创建订单')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef])

  const [editingRecord, setEditingRecord] = useState<WorkshopOrder | null>(null)

  const handleEdit = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    const record = data?.items.find((item) => item.id === selectedRowKeys[0])
    if (!record) return

    // 将日期字符串转换为 dayjs 对象用于表单显示
    const formValues: WorkshopOrder & { product_delivery_date: dayjs.Dayjs | undefined } = {
      ...record,
      product_delivery_date: record.product_delivery_date
        ? dayjs(record.product_delivery_date)
        : undefined,
    } as WorkshopOrder & { product_delivery_date: dayjs.Dayjs | undefined }
    setEditingRecord(formValues as unknown as WorkshopOrder)
    setIsEdit(true)
    setModalTitle('编辑订单')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }
    deleteMutation.mutate(selectedRowKeys as string[])
  }, [deleteMutation, message, selectedRowKeys])

  const handleFinish = useCallback(
    (values: WorkshopOrder | WorkshopOrder[]) => {
      if (isEdit && selectedRowKeys[0]) {
        // 编辑模式：单条更新
        updateMutation.mutate({
          id: selectedRowKeys[0] as string,
          values: values as WorkshopOrder,
        })
      } else if (Array.isArray(values)) {
        // 新建模式：Excel 批量导入
        batchCreateMutation.mutate(values)
      } else {
        // 新建模式：手动输入单条
        createMutation.mutate(values)
      }
    },
    [createMutation, isEdit, selectedRowKeys, updateMutation, batchCreateMutation],
  )

  const handleSearch = useCallback((params: typeof searchParams) => {
    setSearchParams(params)
    searchParamsURL.set('page', '1')
    setSearchParamsURL(searchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

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
        />
        <PrintButton
          handlePrint={handlePrint}
          loading={isPrinting}
          count={selectedRowKeys.length}
        />
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center gap-2">
        <span className="text-gray-600 whitespace-nowrap">搜索：</span>
        <WorkshopOrderSearch onSearch={handleSearch} onReset={handleResetSearch} />
      </div>

      {/* 表格和分页 */}
      <div className="grid grid-rows-[1fr_auto] gap-4 overflow-hidden">
        <div className="overflow-hidden">
          <WorkshopOrderTable
            loading={isLoading}
            data={data?.items || []}
            selectedRowKeys={selectedRowKeys}
            onSelect={setSelectedRowKeys}
          />
        </div>
        <div className="flex justify-end">
          <AppPagination total={data?.total || 0} />
        </div>
      </div>

      <Modal
        title={modalTitle}
        open={isModalOpen}
        confirmLoading={createMutation.isPending || updateMutation.isPending || batchCreateMutation.isPending}
        destroyOnClose
        onOk={() => formRef?.submit()}
        onCancel={() => {
          setIsModalOpen(false)
          setIsEdit(false)
          setEditingRecord(null)
        }}
      >
        <WorkshopOrderForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isCreating={createMutation.isPending || batchCreateMutation.isPending}
          isEdit={isEdit}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
        />
      </Modal>
    </div>
  )
}
