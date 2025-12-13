import { useState, useCallback, useEffect } from 'react'
import { App, Modal, FormInstance, Tabs, Pagination, Spin, Drawer } from 'antd'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import EditButton from '@/ui/EditButton'
import { useTableHeight } from '@/hooks/useTableHeight'
import {
  useWorkshopOrdersList,
  useCreateWorkshopOrder,
  useCreateWorkshopOrdersBatch,
} from '@/features/workshop/OrderList/useWorkshopOrders'
import WorkshopOrderTable from '@/features/workshop/OrderList/WorkshopOrderTable'
import WorkshopOrderForm from '@/features/workshop/OrderList/WorkshopOrderForm'
import WorkshopOrderSearch from '@/features/workshop/OrderList/WorkshopOrderSearch'
import type { WorkshopOrder } from '@/features/workshop/OrderList'
import {
  useProductionSheetsList,
  useCreateProductionSheet,
  useUpdateProductionSheet,
  useProductionSheetById,
} from '@/features/workshop/ProductionRecord/useProductionSheets'
import ProductionSheetTable from '@/features/workshop/ProductionRecord/ProductionSheetTable'
import ProductionSheetForm from '@/features/workshop/ProductionRecord/ProductionSheetForm'
import ProductionSheetSearch from '@/features/workshop/ProductionRecord/ProductionSheetSearch'
import ProductionRecordTable from '@/features/workshop/ProductionRecord/ProductionRecordTable'
import type { ProductionSheetRecord } from '@/services/apiProductionSheets'
import type { ProductionSheetFormValues } from '@/features/workshop/ProductionRecord/ProductionSheetForm'

export default function Dashboard() {
  const { message } = App.useApp()
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()

  // 车间订单相关状态
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [orderFormRef, setOrderFormRef] =
    useState<FormInstance<WorkshopOrder> | null>(null)
  const orderPage = Number(searchParamsURL.get('orderPage')) || 1
  const orderPageSize = Number(searchParamsURL.get('orderPageSize')) || 10
  const [orderSearchParams, setOrderSearchParams] = useState<{
    project_no?: string
    product_model?: string
    customer_model?: string
    model_search?: string
    startDate?: string
    endDate?: string
  }>({})

  // 产量录入相关状态
  const [productionModalOpen, setProductionModalOpen] = useState(false)
  const [productionModalTitle, setProductionModalTitle] = useState('录入产量单')
  const [productionIsEdit, setProductionIsEdit] = useState(false)
  const [productionEditingSheetId, setProductionEditingSheetId] = useState<
    string | null
  >(null)
  const [productionSelectedRowKeys, setProductionSelectedRowKeys] = useState<
    React.Key[]
  >([])
  const [productionFormRef, setProductionFormRef] =
    useState<FormInstance<ProductionSheetFormValues> | null>(null)
  const [productionDetailDrawerOpen, setProductionDetailDrawerOpen] =
    useState(false)
  const [productionSelectedSheetId, setProductionSelectedSheetId] = useState<
    string | null
  >(null)
  const productionPage = Number(searchParamsURL.get('productionPage')) || 1
  const productionPageSize =
    Number(searchParamsURL.get('productionPageSize')) || 10
  const [productionSearchParams, setProductionSearchParams] = useState<{
    startDate?: string
    endDate?: string
  }>(() => {
    const start = dayjs().startOf('month')
    const end = dayjs().endOf('month')
    return {
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
    }
  })

  // 车间订单数据
  const { data: orderData, isLoading: orderLoading } = useWorkshopOrdersList({
    page: orderPage,
    pageSize: orderPageSize,
    searchParams: orderSearchParams,
  })

  const createOrderMutation = useCreateWorkshopOrder()
  const batchCreateOrderMutation = useCreateWorkshopOrdersBatch()

  // 产量录入数据
  const { data: productionData, isLoading: productionLoading } =
    useProductionSheetsList({
      page: productionPage,
      pageSize: productionPageSize,
      searchParams: productionSearchParams,
    })

  const createProductionMutation = useCreateProductionSheet()
  const updateProductionMutation = useUpdateProductionSheet()
  const {
    data: productionEditingSheetDetail,
    isLoading: productionEditingDetailLoading,
  } = useProductionSheetById(productionEditingSheetId)
  const { data: productionSheetDetail, isLoading: productionDetailLoading } =
    useProductionSheetById(productionSelectedSheetId)

  // 表格高度计算
  const {
    tableContainerRef: orderTableContainerRef,
    paginationRef: orderPaginationRef,
    scrollY: orderScrollY,
    rowHeight: orderRowHeight,
  } = useTableHeight({
    targetRowCount: 10, // 显示10行数据
    headerHeight: 37, // size="small" 的表头高度（稍微减小以增加可用空间）
    gap: 14, // 稍微减小gap，与布局中的 gap-4 匹配但留出更多空间
  })

  const {
    tableContainerRef: productionTableContainerRef,
    paginationRef: productionPaginationRef,
    scrollY: productionScrollY,
    rowHeight: productionRowHeight,
  } = useTableHeight({
    targetRowCount: 10,
    headerHeight: 39,
    summaryRowHeight: 40,
  })

  // 车间订单处理函数
  const handleCreateOrder = useCallback(() => {
    setOrderModalOpen(true)
    orderFormRef?.resetFields()
  }, [orderFormRef])

  const handleOrderFinish = useCallback(
    (values: WorkshopOrder | WorkshopOrder[]) => {
      const handleSuccess = (successMessage: string) => {
        message.success(successMessage)
        setOrderModalOpen(false)
        orderFormRef?.resetFields()
      }
      const handleError = (error: unknown) => {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('操作失败，请稍后重试')
        }
      }

      if (Array.isArray(values)) {
        // Excel 批量导入
        batchCreateOrderMutation.mutate(values, {
          onSuccess: () => handleSuccess('订单批量导入成功'),
          onError: handleError,
        })
      } else {
        // 手动输入单条
        createOrderMutation.mutate(values, {
          onSuccess: () => handleSuccess('订单创建成功'),
          onError: handleError,
        })
      }
    },
    [batchCreateOrderMutation, createOrderMutation, message, orderFormRef],
  )

  const handleOrderSearch = useCallback(
    (params: typeof orderSearchParams) => {
      setOrderSearchParams(params)
      searchParamsURL.set('orderPage', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleOrderResetSearch = useCallback(() => {
    setOrderSearchParams({})
    searchParamsURL.set('orderPage', '1')
    setSearchParamsURL(searchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

  // 产量录入处理函数
  const handleCreateProduction = useCallback(() => {
    setProductionIsEdit(false)
    setProductionEditingSheetId(null)
    setProductionModalTitle('录入产量单')
    setProductionModalOpen(true)
    productionFormRef?.resetFields()
  }, [productionFormRef])

  const handleEditProduction = useCallback(() => {
    if (productionSelectedRowKeys.length !== 1) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    const sheetId = productionSelectedRowKeys[0] as string
    setProductionEditingSheetId(sheetId)
    setProductionIsEdit(true)
    setProductionModalTitle('编辑产量单')
    setProductionModalOpen(true)
  }, [message, productionSelectedRowKeys])

  const handleProductionFinish = useCallback(
    (values: {
      production_date: string
      operator_ids: string[]
      working_hours?: number | null
      remark?: string | null
      records: ProductionSheetRecord[]
    }) => {
      if (values.records.length === 0) {
        message.warning('至少需要添加一条产量记录')
        return
      }
      if (!values.operator_ids || values.operator_ids.length === 0) {
        message.warning('请至少选择一个操作者')
        return
      }

      if (productionIsEdit && productionEditingSheetId) {
        updateProductionMutation.mutate(
          {
            id: productionEditingSheetId,
            ...values,
          },
          {
            onSuccess: () => {
              message.success('更新产量单成功')
              setProductionModalOpen(false)
              setProductionIsEdit(false)
              setProductionEditingSheetId(null)
              setProductionSelectedRowKeys([])
              productionFormRef?.resetFields()
            },
            onError: (error) => {
              if (error instanceof Error) {
                message.error(error.message)
              } else {
                message.error('更新失败，请稍后重试')
              }
            },
          },
        )
      } else {
        createProductionMutation.mutate(values, {
          onSuccess: () => {
            message.success('创建产量单成功')
            setProductionModalOpen(false)
            setProductionSelectedRowKeys([])
            productionFormRef?.resetFields()
          },
          onError: (error) => {
            if (error instanceof Error) {
              message.error(error.message)
            } else {
              message.error('创建失败，请稍后重试')
            }
          },
        })
      }
    },
    [
      createProductionMutation,
      updateProductionMutation,
      productionIsEdit,
      productionEditingSheetId,
      message,
      productionFormRef,
    ],
  )

  const handleProductionSearch = useCallback(
    (params: typeof productionSearchParams) => {
      setProductionSearchParams(params)
      searchParamsURL.set('productionPage', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleProductionResetSearch = useCallback(() => {
    const start = dayjs().startOf('month')
    const end = dayjs().endOf('month')
    setProductionSearchParams({
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
    })
    searchParamsURL.set('productionPage', '1')
    setSearchParamsURL(searchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

  const handleProductionViewDetail = useCallback((sheetId: string) => {
    setProductionSelectedSheetId(sheetId)
    setProductionDetailDrawerOpen(true)
  }, [])

  // 监听 mutation 成功状态，重置表单
  useEffect(() => {
    if (createOrderMutation.isSuccess || batchCreateOrderMutation.isSuccess) {
      createOrderMutation.reset()
      batchCreateOrderMutation.reset()
    }
  }, [
    createOrderMutation.isSuccess,
    batchCreateOrderMutation.isSuccess,
    createOrderMutation,
    batchCreateOrderMutation,
  ])

  useEffect(() => {
    if (
      createProductionMutation.isSuccess ||
      updateProductionMutation.isSuccess
    ) {
      createProductionMutation.reset()
      updateProductionMutation.reset()
    }
  }, [
    createProductionMutation.isSuccess,
    updateProductionMutation.isSuccess,
    createProductionMutation,
    updateProductionMutation,
  ])

  // 处理分页变化
  useEffect(() => {
    if (orderPage > 1 && orderData && orderData.items.length === 0) {
      searchParamsURL.set('orderPage', Math.max(orderPage - 1, 1).toString())
      setSearchParamsURL(searchParamsURL)
    }
  }, [orderData, orderPage, searchParamsURL, setSearchParamsURL])

  useEffect(() => {
    if (
      productionPage > 1 &&
      productionData &&
      productionData.items.length === 0
    ) {
      searchParamsURL.set(
        'productionPage',
        Math.max(productionPage - 1, 1).toString(),
      )
      setSearchParamsURL(searchParamsURL)
    }
  }, [productionData, productionPage, searchParamsURL, setSearchParamsURL])

  const tabItems = [
    {
      key: 'orders',
      label: '车间订单',
      children: (
        <div className="grid h-full min-h-0 grid-rows-[auto_auto_1fr] gap-4">
          {/* 工具栏 */}
          <div className="flex flex-wrap items-center gap-2">
            <AddButton handleCreate={handleCreateOrder} />
          </div>

          {/* 搜索栏 */}
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-gray-600">搜索：</span>
            <WorkshopOrderSearch
              onSearch={handleOrderSearch}
              onReset={handleOrderResetSearch}
            />
          </div>

          {/* 表格和分页 */}
          <div
            ref={orderTableContainerRef}
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
          >
            <div className="min-h-0 flex-1 overflow-x-auto">
              <WorkshopOrderTable
                loading={orderLoading}
                data={orderData?.items || []}
                selectedRowKeys={[]}
                onSelect={() => {}}
                scrollY={orderScrollY}
                rowHeight={orderRowHeight}
              />
            </div>
            <div
              ref={orderPaginationRef}
              className="flex shrink-0 justify-end pr-2"
            >
              <Pagination
                current={orderPage}
                pageSize={orderPageSize}
                onChange={(page, size) => {
                  searchParamsURL.set('orderPage', page.toString())
                  searchParamsURL.set('orderPageSize', size.toString())
                  setSearchParamsURL(searchParamsURL)
                }}
                total={orderData?.total || 0}
                showSizeChanger
                pageSizeOptions={['10', '20', '50', '100']}
                showTotal={(total) => `共 ${total} 条`}
              />
            </div>
          </div>

          {/* 创建订单弹窗 */}
          <Modal
            title="创建订单"
            open={orderModalOpen}
            confirmLoading={
              createOrderMutation.isPending ||
              batchCreateOrderMutation.isPending
            }
            destroyOnClose
            onOk={() => orderFormRef?.submit()}
            onCancel={() => {
              setOrderModalOpen(false)
              orderFormRef?.resetFields()
            }}
          >
            <WorkshopOrderForm
              onFinish={handleOrderFinish}
              setFormRef={setOrderFormRef}
              isCreating={
                createOrderMutation.isPending ||
                batchCreateOrderMutation.isPending
              }
              isEdit={false}
            />
          </Modal>
        </div>
      ),
    },
    {
      key: 'production',
      label: '产量录入',
      children: (
        <div className="grid h-full min-h-0 grid-rows-[auto_auto_1fr] gap-4">
          {/* 工具栏 */}
          <div className="flex flex-wrap items-center gap-2">
            <AddButton handleCreate={handleCreateProduction} />
            <EditButton title="编辑" handleEdit={handleEditProduction} />
          </div>

          {/* 搜索栏 */}
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-gray-600">搜索：</span>
            <ProductionSheetSearch
              onSearch={handleProductionSearch}
              onReset={handleProductionResetSearch}
              initialStartDate={productionSearchParams.startDate}
              initialEndDate={productionSearchParams.endDate}
            />
          </div>

          {/* 表格和分页 */}
          <div
            ref={productionTableContainerRef}
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
          >
            <div className="min-h-0 flex-1 overflow-x-auto">
              <ProductionSheetTable
                loading={productionLoading}
                data={productionData?.items || []}
                selectedRowKeys={productionSelectedRowKeys}
                onSelect={setProductionSelectedRowKeys}
                page={productionPage}
                pageSize={productionPageSize}
                scrollY={productionScrollY}
                rowHeight={productionRowHeight}
                onViewDetail={handleProductionViewDetail}
              />
            </div>
            <div
              ref={productionPaginationRef}
              className="flex shrink-0 justify-end"
            >
              <div className="mt-4 mr-2 flex justify-end">
                <Pagination
                  current={productionPage}
                  pageSize={productionPageSize}
                  onChange={(page, size) => {
                    searchParamsURL.set('productionPage', page.toString())
                    searchParamsURL.set('productionPageSize', size.toString())
                    setSearchParamsURL(searchParamsURL)
                  }}
                  total={productionData?.total || 0}
                  showSizeChanger
                  pageSizeOptions={[
                    '10',
                    '20',
                    '30',
                    '50',
                    '100',
                    '200',
                    '300',
                    '500',
                  ]}
                  showTotal={(total) => `共 ${total} 条`}
                />
              </div>
            </div>
          </div>

          {/* 创建/编辑产量单弹窗 */}
          <Modal
            title={productionModalTitle}
            open={productionModalOpen}
            confirmLoading={
              createProductionMutation.isPending ||
              updateProductionMutation.isPending
            }
            destroyOnClose
            okButtonProps={{
              disabled: productionIsEdit && productionEditingDetailLoading,
            }}
            onOk={async () => {
              try {
                await productionFormRef?.validateFields()
                productionFormRef?.submit()
              } catch (error) {
                console.error('表单验证失败:', error)
              }
            }}
            onCancel={() => {
              setProductionModalOpen(false)
              setProductionIsEdit(false)
              setProductionEditingSheetId(null)
              productionFormRef?.resetFields()
            }}
            width={1000}
            style={{ top: 20 }}
          >
            <Spin
              spinning={productionIsEdit && productionEditingDetailLoading}
              tip="正在加载产量单数据..."
            >
              <ProductionSheetForm
                onFinish={handleProductionFinish}
                setFormRef={setProductionFormRef}
                isCreating={
                  createProductionMutation.isPending ||
                  updateProductionMutation.isPending
                }
                initialValues={
                  productionIsEdit && productionEditingSheetDetail
                    ? {
                        production_date:
                          productionEditingSheetDetail.production_date,
                        operator_ids:
                          productionEditingSheetDetail.records?.[0]
                            ?.operator_ids || [],
                        working_hours:
                          productionEditingSheetDetail.working_hours || null,
                        remark: productionEditingSheetDetail.remark || null,
                        records: productionEditingSheetDetail.records || [],
                      }
                    : undefined
                }
              />
            </Spin>
          </Modal>

          {/* 产量单详情抽屉 */}
          <Drawer
            title={`产量单详情 - ${productionSheetDetail?.production_date ? dayjs(productionSheetDetail.production_date).format('YYYY-MM-DD') : ''}`}
            placement="right"
            size="large"
            open={productionDetailDrawerOpen}
            onClose={() => {
              setProductionDetailDrawerOpen(false)
              setProductionSelectedSheetId(null)
            }}
          >
            {productionDetailLoading ? (
              <div>加载中...</div>
            ) : productionSheetDetail?.records &&
              productionSheetDetail.records.length > 0 ? (
              <ProductionRecordTable
                loading={false}
                data={productionSheetDetail.records}
                selectedRowKeys={[]}
                onSelect={() => {}}
                page={1}
                pageSize={productionSheetDetail.records.length}
                scrollY={600}
                rowHeight={40}
              />
            ) : (
              <div>暂无记录</div>
            )}
          </Drawer>
        </div>
      ),
    },
  ]

  return (
    <div className="flex h-full flex-col">
      <Tabs
        defaultActiveKey="orders"
        items={tabItems}
        className="flex flex-1 flex-col overflow-hidden"
        style={{ height: '100%' }}
        tabBarStyle={{ marginBottom: 0 }}
      />
    </div>
  )
}
