import { useState, useCallback, useEffect } from 'react'
import { App, Modal, FormInstance, Splitter } from 'antd'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import EditButton from '@/ui/EditButton'
import DeleteButton from '@/ui/DeleteButton'
import PrintButton from '@/ui/PrintButton'
import AppPagination from '@/ui/AppPagination'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useAuth } from '@/contexts/AuthContext'
import { getWorkshopOrderDeleteBlockers } from '@/services/apiWorkshopOrders'
import {
  useWorkshopOrdersList,
  useCreateWorkshopOrder,
  useUpdateWorkshopOrder,
  useCreateWorkshopOrdersBatch,
  useDeleteWorkshopOrders,
} from './useWorkshopOrders'
import WorkshopOrderTable from './WorkshopOrderTable'
import WorkshopOrderForm from './WorkshopOrderForm'
import WorkshopOrderSearch from './WorkshopOrderSearch'
import WorkshopOrderProductionStats from './WorkshopOrderProductionStats'
import { usePrintWorkshopOrders } from './usePrintWorkshopOrders'

export interface WorkshopOrder {
  id?: string
  product_delivery_date: string | null
  project_no: string | null
  product_model: string | null
  length_mm: number | null
  customer: string | null
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
  const { message, modal } = App.useApp()
  const { role } = useAuth()
  const canDelete = role === 'admin'

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建订单')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [activeOrder, setActiveOrder] = useState<WorkshopOrder | null>(null)
  // 使用 URL 参数管理分页，与 AppPagination 保持一致
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [formRef, setFormRef] = useState<FormInstance<WorkshopOrder> | null>(
    null,
  )
  const [searchParams, setSearchParams] = useState<{
    project_no?: string
    product_model?: string
    customer_model?: string
    model_search?: string // 统一的搜索字段，支持项目号、产品型号、客户型号
    startDate?: string
    endDate?: string
  }>({})

  const { data, isLoading } = useWorkshopOrdersList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateWorkshopOrder()

  const updateMutation = useUpdateWorkshopOrder()

  const batchCreateMutation = useCreateWorkshopOrdersBatch()

  const deleteMutation = useDeleteWorkshopOrders()

  const { generatePDF, isPrinting } = usePrintWorkshopOrders()

  // 动态计算表格高度（目标行数适应上半面板）
  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 12,
    headerHeight: 34,
  })

  const handlePrint = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要打印的订单')
      return
    }
    const selectedOrders =
      data?.items.filter((item) => selectedRowKeys.includes(item.id || '')) ||
      []
    const printed = await generatePDF(selectedOrders)
    if (printed) {
      setSelectedRowKeys([])
    }
  }, [selectedRowKeys, data?.items, generatePDF, message])

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setModalTitle('创建订单')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef])

  const [editingRecord, setEditingRecord] = useState<WorkshopOrder | null>(null)

  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    formRef?.resetFields()
  }, [formRef])

  const handleEdit = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    const record = data?.items.find((item) => item.id === selectedRowKeys[0])
    if (!record) return

    // 将日期字符串转换为 dayjs 对象用于表单显示
    const formValues: WorkshopOrder & {
      product_delivery_date: dayjs.Dayjs | undefined
    } = {
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

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    const ids = selectedRowKeys as string[]

    try {
      const blockers = await getWorkshopOrderDeleteBlockers(ids)

      if (blockers.length > 0) {
        modal.warning({
          title: '无法删除订单',
          okText: '知道了',
          width: 620,
          content: (
            <div className="space-y-3">
              <p>以下订单已被生产记录引用，请先处理关联数据：</p>
              <ul className="list-disc space-y-2 pl-5">
                {blockers.map((item) => (
                  <li key={item.orderId}>
                    <div className="font-medium text-gray-800">
                      {item.projectNo?.trim() || '未填写项目号'}
                    </div>
                    <div className="text-sm text-gray-500">
                      已关联 {item.productionItemCount} 条生产工单明细
                      {item.orderDates.length > 0
                        ? `，工单日期：${item.orderDates.slice(0, 3).join('、')}`
                        : ''}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ),
        })
        return
      }

      modal.confirm({
        title: '删除订单',
        okText: '确认删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        content: (
          <div>
            <p>
              确定删除选中的 <strong>{ids.length}</strong> 个订单吗？
            </p>
            <p className="mt-2 text-xs text-red-500">
              此操作不可撤销，将同时删除订单及其所有明细。
            </p>
          </div>
        ),
        onOk: async () => {
          try {
            await deleteMutation.mutateAsync(ids)
            message.success('删除成功')
            setSelectedRowKeys([])
          } catch (error) {
            if (error instanceof Error) {
              message.error(error.message)
            } else {
              message.error('删除失败，请稍后重试')
            }

            throw error
          }
        },
      })
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除失败，请稍后重试')
      }
    }
  }, [deleteMutation, message, modal, selectedRowKeys])

  const handleFinish = useCallback(
    (values: WorkshopOrder | WorkshopOrder[]) => {
      const handleSuccess = (successMessage: string) => {
        message.success(successMessage)
        resetFormState()
      }
      const handleError = (error: unknown) => {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('操作失败，请稍后重试')
        }
      }

      if (isEdit && selectedRowKeys[0]) {
        // 编辑模式：单条更新
        updateMutation.mutate(
          {
            id: selectedRowKeys[0] as string,
            values: values as WorkshopOrder,
          },
          {
            onSuccess: () => handleSuccess('订单更新成功'),
            onError: handleError,
          },
        )
      } else if (Array.isArray(values)) {
        // 新建模式：Excel 批量导入
        batchCreateMutation.mutate(values, {
          onSuccess: () => handleSuccess('订单批量导入成功'),
          onError: handleError,
        })
      } else {
        // 新建模式：手动输入单条
        createMutation.mutate(values, {
          onSuccess: () => handleSuccess('订单创建成功'),
          onError: handleError,
        })
      }
    },
    [
      batchCreateMutation,
      createMutation,
      isEdit,
      message,
      resetFormState,
      selectedRowKeys,
      updateMutation,
    ],
  )

  const handleSearch = useCallback(
    (params: typeof searchParams) => {
      setSearchParams(params)
      setSelectedRowKeys([])
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  /**
   * 防止 Excel 批量导入后成功提示出现但模态框仍保持打开状态。
   * 监听所有创建/更新类 mutation 成功态，统一做收尾并重置 mutation 状态。
   */
  useEffect(() => {
    if (
      createMutation.isSuccess ||
      updateMutation.isSuccess ||
      batchCreateMutation.isSuccess
    ) {
      resetFormState()
      createMutation.reset()
      updateMutation.reset()
      batchCreateMutation.reset()
    }
  }, [
    batchCreateMutation.isSuccess,
    createMutation.isSuccess,
    updateMutation.isSuccess,
    resetFormState,
    batchCreateMutation,
    createMutation,
    updateMutation,
  ])

  const handleResetSearch = useCallback(() => {
    setSearchParams({})
    setSelectedRowKeys([])
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
    <div className="flex h-full flex-col gap-2">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={handleCreate} />
        <EditButton title="编辑" handleEdit={handleEdit} />
        {canDelete ? (
          <DeleteButton
            onClick={handleDelete}
            isDeleting={deleteMutation.isPending}
            count={selectedRowKeys.length}
          />
        ) : null}
        <PrintButton
          handlePrint={handlePrint}
          loading={isPrinting}
          count={selectedRowKeys.length}
        />
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-gray-600">搜索：</span>
        <WorkshopOrderSearch
          onSearch={handleSearch}
          onReset={handleResetSearch}
        />
      </div>

      {/* 上下分割布局 */}
      <Splitter layout="vertical" style={{ flex: 1, minHeight: 0 }}>
        {/* 上半部分：订单列表 */}
        <Splitter.Panel defaultSize="60%" min="30%">
          <div
            ref={tableContainerRef}
            className="flex h-full flex-col gap-2 overflow-hidden"
          >
            <div className="min-h-0 flex-1">
              <WorkshopOrderTable
                loading={isLoading}
                data={data?.items || []}
                selectedRowKeys={selectedRowKeys}
                onSelect={setSelectedRowKeys}
                activeRowId={activeOrder?.id ?? null}
                onRowClick={setActiveOrder}
                scrollY={scrollY}
              />
            </div>
            <div ref={paginationRef} className="flex shrink-0 justify-end">
              <AppPagination total={data?.total || 0} />
            </div>
          </div>
        </Splitter.Panel>

        {/* 下半部分：生产工单统计 */}
        <Splitter.Panel min="20%">
          <div className="h-full overflow-hidden">
            <WorkshopOrderProductionStats selectedOrder={activeOrder} />
          </div>
        </Splitter.Panel>
      </Splitter>

      <Modal
        title={modalTitle}
        open={isModalOpen}
        confirmLoading={
          createMutation.isPending ||
          updateMutation.isPending ||
          batchCreateMutation.isPending
        }
        destroyOnClose
        onOk={() => formRef?.submit()}
        onCancel={() => {
          resetFormState()
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
