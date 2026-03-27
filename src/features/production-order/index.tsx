import { useState, useCallback, useEffect } from 'react'
import {
  ArrowPathIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/16/solid'
import {
  KeyIcon,
  LockClosedIcon,
  LockOpenIcon,
} from '@heroicons/react/24/outline'
import { App, Button, Card, Form, Input, Modal, Space, Typography } from 'antd'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import EditButton from '@/ui/EditButton'
import DeleteButton from '@/ui/DeleteButton'
import ExportButton from '@/ui/ExportButton'
import AppPagination from '@/ui/AppPagination'
import { useTableHeight } from '@/hooks/useTableHeight'
import {
  getProductionOrdersForExport,
  type ProductionOrder,
  type ProductionOrderShift,
} from '@/services/apiProductionOrders'
import { exportProductionOrdersToExcel } from '@/utils/productionOrderExcel'
import {
  useProductionOrders,
  useProductionOrder,
  useCreateProductionOrder,
  useUpdateProductionOrder,
  useBatchUpdateProductionOrders,
  useDeleteProductionOrders,
} from './useProductionOrders'
import {
  useAddProductionOrderItem,
  useUpdateProductionOrderItem,
  useDeleteProductionOrderItems,
} from './useProductionOrderItems'
import { useAllEmployees } from '../workshop/EmployeeList/useEmployees'
import ProductionOrderList from './ProductionOrderList'
import ProductionOrderMobileList from './ProductionOrderMobileList'
import ProductionOrderForm from './ProductionOrderForm'
import ProductionOrderDetail from './ProductionOrderDetail'
import ProductionOrderSearch from './ProductionOrderSearch'
import type { ProductionOrderItem } from '@/services/apiProductionOrderItems'
import {
  updateAdminManagementPassword,
  verifyAdminManagementPassword,
} from '@/services/apiAdminManagementPassword'
import { isEmployeeSideRole } from '@/config/access'
import { useAuth } from '@/contexts/AuthContext'

type UnlockManagementFormValues = {
  password: string
}

type ChangeManagementPasswordFormValues = {
  currentPassword: string
  nextPassword: string
  confirmPassword: string
}

const { Paragraph, Text, Title } = Typography

async function syncOrderItemsSequentially({
  items,
  orderId,
  addItem,
  updateItem,
}: {
  items: {
    id?: string
    project_no: string
    product_model: string | null
    length_mm: number | null
    customer_model: string | null
    operation: string
    standard_seconds: number
    incoming_qualified_quantity: number
    qualified_quantity: number
    defect_reason_1: string | null
    defect_quantity_1: number
    defect_reason_2: string | null
    defect_quantity_2: number
  }[]
  orderId: string
  addItem: (item: ProductionOrderItem) => Promise<unknown>
  updateItem: (params: {
    id: string
    values: Partial<ProductionOrderItem>
  }) => Promise<unknown>
}) {
  for (const item of items) {
    if (item.id) {
      await updateItem({
        id: item.id,
        values: {
          project_no: item.project_no,
          product_model: item.product_model,
          length_mm: item.length_mm,
          customer_model: item.customer_model,
          operation: item.operation,
          standard_seconds: item.standard_seconds,
          incoming_qualified_quantity: item.incoming_qualified_quantity,
          qualified_quantity: item.qualified_quantity,
          defect_reason_1: item.defect_reason_1,
          defect_quantity_1: item.defect_quantity_1,
          defect_reason_2: item.defect_reason_2,
          defect_quantity_2: item.defect_quantity_2,
        },
      })
      continue
    }

    await addItem({
      ...item,
      order_id: orderId,
    } as ProductionOrderItem)
  }
}

export default function ProductionOrderPage() {
  const { message, modal } = App.useApp()
  const { role, employeeProfile } = useAuth()
  const isEmployeeView = isEmployeeSideRole(role)
  const isAdminManagementView = role === 'admin' && !isEmployeeView
  const fixedEmployee =
    isEmployeeView && employeeProfile?.id
      ? { id: employeeProfile.id, name: employeeProfile.name }
      : null

  const isAuditedRecord = (
    record?: Partial<ProductionOrder> & { is_audited?: boolean },
  ) => Boolean(record?.is_audited)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建工单')
  const [isEdit, setIsEdit] = useState(false)
  const [isView, setIsView] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ProductionOrder | null>(
    null,
  )
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [isManagementUnlocked, setIsManagementUnlocked] = useState(
    !isAdminManagementView,
  )
  const [isUnlockingManagement, setIsUnlockingManagement] = useState(false)
  const [isManagementPasswordModalOpen, setIsManagementPasswordModalOpen] =
    useState(false)
  const [isUpdatingManagementPassword, setIsUpdatingManagementPassword] =
    useState(false)
  const [unlockForm] = Form.useForm<UnlockManagementFormValues>()
  const [changePasswordForm] =
    Form.useForm<ChangeManagementPasswordFormValues>()
  const isManagementLocked = isAdminManagementView && !isManagementUnlocked

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [filters, setFilters] = useState<{
    startDate?: string
    endDate?: string
    employeeId?: string
    shift?: ProductionOrderShift
    productModel?: string
    customerModel?: string
    isAudited?: boolean
  }>(() => ({
    employeeId:
      (isEmployeeView ? employeeProfile?.id : undefined) ||
      searchParamsURL.get('employeeId') ||
      undefined,
    isAudited:
      searchParamsURL.get('isAudited') === null
        ? undefined
        : searchParamsURL.get('isAudited') === 'true',
    shift:
      searchParamsURL.get('shift') === '白班' ||
      searchParamsURL.get('shift') === '夜班'
        ? (searchParamsURL.get('shift') as ProductionOrderShift)
        : undefined,
  }))

  const { data: orderData, isLoading } = useProductionOrders({
    page,
    pageSize,
    filters,
    options: {
      enabled: !isManagementLocked,
      realtime: isEmployeeView && !isModalOpen,
    },
  })

  const { data: detailData, isLoading: isLoadingDetail } = useProductionOrder(
    editingRecord?.id,
    {
      enabled: !isManagementLocked,
      realtime: isEmployeeView && isModalOpen && isView,
    },
  )

  const { data: allEmployees } = useAllEmployees()
  const employees = fixedEmployee ? [fixedEmployee] : allEmployees || []

  const createMutation = useCreateProductionOrder()
  const updateMutation = useUpdateProductionOrder()
  const batchUpdateMutation = useBatchUpdateProductionOrders()
  const deleteMutation = useDeleteProductionOrders()
  const addItemMutation = useAddProductionOrderItem()
  const updateItemMutation = useUpdateProductionOrderItem()
  const deleteItemMutation = useDeleteProductionOrderItems()

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 10,
  })

  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setIsView(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
  }, [])

  const handleLockManagement = useCallback(() => {
    resetFormState()
    unlockForm.resetFields()
    setIsManagementUnlocked(false)
    setIsManagementPasswordModalOpen(false)
    message.success('生产工单管理已锁定')
  }, [message, resetFormState, unlockForm])

  const handleUnlockManagement = useCallback(
    async (values: UnlockManagementFormValues) => {
      setIsUnlockingManagement(true)

      try {
        await verifyAdminManagementPassword(values.password)
        setIsManagementUnlocked(true)
        unlockForm.resetFields()
        message.success('管理权限已解锁')
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('管理密码验证失败')
        }
      } finally {
        setIsUnlockingManagement(false)
      }
    },
    [message, unlockForm],
  )

  const handleChangeManagementPassword = useCallback(
    async (values: ChangeManagementPasswordFormValues) => {
      setIsUpdatingManagementPassword(true)

      try {
        await updateAdminManagementPassword({
          currentPassword: values.currentPassword,
          nextPassword: values.nextPassword,
        })
        changePasswordForm.resetFields()
        setIsManagementPasswordModalOpen(false)
        message.success('管理密码修改成功')
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('管理密码修改失败')
        }
      } finally {
        setIsUpdatingManagementPassword(false)
      }
    },
    [changePasswordForm, message],
  )

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setIsView(false)
    setModalTitle('创建工单')
    setEditingRecord(null)
    setIsModalOpen(true)
  }, [])

  const handleEdit = useCallback(
    (record?: ProductionOrder) => {
      const targetRecord =
        record ||
        orderData?.items.find((item) => item.id === selectedRowKeys[0])

      if (!targetRecord) {
        message.warning('请选择一条数据进行编辑')
        return
      }

      if (!record && selectedRowKeys.length !== 1) {
        message.warning('请选择一条数据进行编辑')
        return
      }

      if (isEmployeeView && isAuditedRecord(targetRecord)) {
        message.warning('已审核工单员工无法编辑')
        return
      }

      setEditingRecord(targetRecord)
      setIsEdit(true)
      setIsView(false)
      setModalTitle('编辑工单')
      setIsModalOpen(true)
    },
    [message, orderData?.items, selectedRowKeys],
  )

  const handleView = useCallback((record: ProductionOrder) => {
    setEditingRecord(record)
    setIsView(true)
    setIsEdit(false)
    setModalTitle('工单详情')
    setIsModalOpen(true)
  }, [])

  const handleDelete = useCallback(
    (ids?: string[]) => {
      const deleteIds = ids || selectedRowKeys
      if (deleteIds.length === 0) {
        message.warning('请选择至少一条数据')
        return
      }
      deleteMutation.mutate(deleteIds as string[], {
        onSuccess: () => {
          message.success('删除成功')
          setSelectedRowKeys([])
        },
        onError: (error) => {
          if (error instanceof Error) {
            message.error(error.message)
          } else {
            message.error('删除失败，请稍后重试')
          }
        },
      })
    },
    [deleteMutation, message, selectedRowKeys],
  )

  const handleExport = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要导出的工单')
      return
    }

    try {
      setIsExporting(true)
      const exportOrders = await getProductionOrdersForExport(
        selectedRowKeys.map((key) => String(key)),
      )

      exportProductionOrdersToExcel(exportOrders)
      message.success(`已导出 ${exportOrders.length} 张工单`)
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('导出失败，请稍后重试')
      }
    } finally {
      setIsExporting(false)
    }
  }, [message, selectedRowKeys])

  const handleBatchAudit = useCallback(
    (isAudited: boolean) => {
      if (selectedRowKeys.length === 0) {
        message.warning(`请选择要${isAudited ? '审核' : '反审核'}的工单`)
        return
      }

      modal.confirm({
        title: `批量${isAudited ? '审核' : '反审核'}工单`,
        content: `确定要将选中的 ${selectedRowKeys.length} 张工单标记为${isAudited ? '已审核' : '待审核'}吗？`,
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          try {
            await batchUpdateMutation.mutateAsync({
              ids: selectedRowKeys as string[],
              values: {
                is_audited: isAudited,
                audited_at: isAudited ? undefined : null,
              },
            })
            message.success(`批量${isAudited ? '审核' : '反审核'}成功`)
            setSelectedRowKeys([])
          } catch (error) {
            if (error instanceof Error) {
              message.error(error.message)
            } else {
              message.error(
                `批量${isAudited ? '审核' : '反审核'}失败，请稍后重试`,
              )
            }
          }
        },
      })
    },
    [batchUpdateMutation, message, modal, selectedRowKeys],
  )

  const handleFinish = useCallback(
    async (values: {
      order: Partial<ProductionOrder>
      items: {
        id?: string
        project_no: string
        product_model: string | null
        length_mm: number | null
        customer_model: string | null
        operation: string
        standard_seconds: number
        incoming_qualified_quantity: number
        qualified_quantity: number
        defect_reason_1: string | null
        defect_quantity_1: number
        defect_reason_2: string | null
        defect_quantity_2: number
      }[]
    }) => {
      try {
        let orderId: string

        if (
          isEmployeeView &&
          isAuditedRecord(detailData || editingRecord || undefined)
        ) {
          message.warning('已审核工单员工无法编辑')
          return
        }

        if (isEdit && editingRecord) {
          await updateMutation.mutateAsync({
            id: editingRecord.id,
            values: values.order,
          })
          orderId = editingRecord.id

          const existingItems = detailData?.items || []
          const currentItems = values.items
          const currentItemIds = new Set(
            currentItems
              .map((item) => item.id)
              .filter((id): id is string => Boolean(id)),
          )
          const deletedIds = existingItems
            .filter((item) => !currentItemIds.has(item.id))
            .map((item) => item.id)

          if (deletedIds.length > 0) {
            await deleteItemMutation.mutateAsync(deletedIds)
          }

          await syncOrderItemsSequentially({
            items: currentItems,
            orderId,
            addItem: addItemMutation.mutateAsync,
            updateItem: updateItemMutation.mutateAsync,
          })
          message.success('工单更新成功')
        } else {
          const newOrder = await createMutation.mutateAsync(
            values.order as Parameters<typeof createMutation.mutateAsync>[0],
          )
          orderId = newOrder.id

          if (values.items.length > 0) {
            await syncOrderItemsSequentially({
              items: values.items,
              orderId,
              addItem: addItemMutation.mutateAsync,
              updateItem: updateItemMutation.mutateAsync,
            })
          }

          message.success('工单创建成功')
        }

        resetFormState()
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('操作失败，请稍后重试')
        }
      }
    },
    [
      createMutation,
      isEdit,
      editingRecord,
      message,
      resetFormState,
      updateMutation,
      addItemMutation,
      updateItemMutation,
      deleteItemMutation,
      detailData,
    ],
  )

  const handleSearch = useCallback(
    (params: typeof filters) => {
      setFilters(
        fixedEmployee?.id
          ? { ...params, employeeId: fixedEmployee.id }
          : params,
      )
      setSelectedRowKeys([])
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [fixedEmployee?.id, searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setFilters(fixedEmployee?.id ? { employeeId: fixedEmployee.id } : {})
    setSelectedRowKeys([])
    searchParamsURL.set('page', '1')
    setSearchParamsURL(searchParamsURL)
  }, [fixedEmployee?.id, searchParamsURL, setSearchParamsURL])

  useEffect(() => {
    if (fixedEmployee?.id) {
      setFilters((prev) => ({ ...prev, employeeId: fixedEmployee.id }))
    }
  }, [fixedEmployee?.id])

  useEffect(() => {
    if (isEmployeeView) {
      setIsManagementUnlocked(true)
      return
    }

    setIsManagementUnlocked(false)
    setIsManagementPasswordModalOpen(false)
    unlockForm.resetFields()
    changePasswordForm.resetFields()
    resetFormState()
  }, [changePasswordForm, isEmployeeView, resetFormState, unlockForm])

  useEffect(() => {
    if (page > 1 && orderData && orderData.items.length === 0) {
      searchParamsURL.set('page', Math.max(page - 1, 1).toString())
      setSearchParamsURL(searchParamsURL)
    }
  }, [orderData, page, searchParamsURL, setSearchParamsURL])

  const detailOrder = (detailData || editingRecord) as
    | (ProductionOrder & {
        items?: ProductionOrderItem[]
        employee?: { name: string }
      })
    | null

  if (isManagementLocked) {
    return (
      <>
        <div className="flex h-full items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md shadow-sm">
            <Space direction="vertical" size={16} className="w-full">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <LockClosedIcon className="size-5" />
                </div>
                <div>
                  <Title level={4} style={{ marginBottom: 0 }}>
                    生产工单管理已锁定
                  </Title>
                  <Text type="secondary">管理员进入页面后需先输入管理密码</Text>
                </div>
              </div>

              <Paragraph style={{ marginBottom: 0 }}>
                首次默认管理密码为 123456。密码正确后才会加载工单管理界面。
              </Paragraph>

              <Form
                form={unlockForm}
                layout="vertical"
                onFinish={handleUnlockManagement}
              >
                <Form.Item
                  name="password"
                  label="管理密码"
                  rules={[{ required: true, message: '请输入管理密码' }]}
                >
                  <Input.Password
                    autoFocus
                    placeholder="请输入管理密码"
                    autoComplete="current-password"
                  />
                </Form.Item>

                <div className="flex gap-3">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isUnlockingManagement}
                    icon={<LockOpenIcon className="size-4" />}
                    className="flex-1"
                  >
                    解锁管理
                  </Button>
                  <Button
                    icon={<KeyIcon className="size-4" />}
                    className="flex-1"
                    onClick={() => setIsManagementPasswordModalOpen(true)}
                  >
                    修改我的密码
                  </Button>
                </div>
              </Form>
            </Space>
          </Card>
        </div>

        <Modal
          title="修改我的管理密码"
          open={isManagementPasswordModalOpen}
          destroyOnClose
          confirmLoading={isUpdatingManagementPassword}
          onOk={() => changePasswordForm.submit()}
          onCancel={() => {
            setIsManagementPasswordModalOpen(false)
            changePasswordForm.resetFields()
          }}
        >
          <Form
            form={changePasswordForm}
            layout="vertical"
            onFinish={handleChangeManagementPassword}
          >
            <Form.Item
              name="currentPassword"
              label="当前管理密码"
              rules={[{ required: true, message: '请输入当前管理密码' }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>

            <Form.Item
              name="nextPassword"
              label="新管理密码"
              rules={[
                { required: true, message: '请输入新管理密码' },
                { min: 6, message: '新管理密码至少需要 6 位' },
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认新管理密码"
              dependencies={['nextPassword']}
              rules={[
                { required: true, message: '请再次输入新管理密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('nextPassword') === value) {
                      return Promise.resolve()
                    }

                    return Promise.reject(
                      new Error('两次输入的新管理密码不一致'),
                    )
                  },
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          </Form>
        </Modal>
      </>
    )
  }

  return (
    <div
      className={
        isEmployeeView
          ? 'grid h-full grid-rows-[auto_auto_1fr] gap-3 p-3'
          : 'grid h-full grid-rows-[auto_auto_1fr] gap-4'
      }
    >
      <div
        className={
          isEmployeeView ? 'w-full' : 'flex flex-wrap items-center gap-2'
        }
      >
        {isEmployeeView ? (
          <Button
            type="primary"
            block
            size="large"
            icon={<PlusCircleIcon className="size-4" />}
            onClick={handleCreate}
            className="h-11 rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
          >
            添加
          </Button>
        ) : (
          <>
            <AddButton handleCreate={handleCreate} />
            <Button
              type="text"
              icon={<KeyIcon className="size-4 text-sky-500" />}
              onClick={() => setIsManagementPasswordModalOpen(true)}
            >
              修改管理密码
            </Button>
            <Button
              type="text"
              icon={<LockClosedIcon className="size-4 text-rose-500" />}
              onClick={handleLockManagement}
            >
              锁定
            </Button>
            <Button
              type="text"
              icon={<ShieldCheckIcon className="size-4 text-green-500/80!" />}
              onClick={() => handleBatchAudit(true)}
              loading={batchUpdateMutation.isPending}
            >
              批量审核
            </Button>
            <Button
              type="text"
              icon={<ArrowPathIcon className="size-4 text-amber-500/80!" />}
              onClick={() => handleBatchAudit(false)}
              loading={batchUpdateMutation.isPending}
            >
              批量反审核
            </Button>
            <EditButton title="编辑" handleEdit={() => handleEdit()} />
          </>
        )}
        {isEmployeeView ? null : (
          <>
            <ExportButton
              handleExport={handleExport}
              loading={isExporting}
              count={selectedRowKeys.length}
            >
              导出工单
            </ExportButton>
            <DeleteButton
              onConfirm={handleDelete}
              isDeleting={deleteMutation.isPending}
              count={selectedRowKeys.length}
              itemName="工单"
            />
          </>
        )}
      </div>

      <div
        className={
          isEmployeeView
            ? 'rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]'
            : 'flex items-center gap-2'
        }
      >
        {isEmployeeView ? null : (
          <span className="whitespace-nowrap text-gray-600">搜索：</span>
        )}
        <ProductionOrderSearch
          onSearch={handleSearch}
          onReset={handleResetSearch}
          employees={employees}
          initialValues={filters}
          fixedEmployee={fixedEmployee}
          mobile={isEmployeeView}
        />
      </div>

      <div
        ref={tableContainerRef}
        className={
          isEmployeeView
            ? 'flex min-h-0 flex-1 flex-col gap-3 overflow-hidden'
            : 'flex min-h-0 flex-1 flex-col gap-4 overflow-hidden'
        }
      >
        <div
          className={
            isEmployeeView
              ? 'no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain'
              : 'min-h-0 flex-1 overflow-x-auto'
          }
        >
          {isEmployeeView ? (
            <ProductionOrderMobileList
              loading={isLoading}
              data={orderData?.items || []}
              selectedRowKeys={selectedRowKeys}
              onSelect={setSelectedRowKeys}
              onView={handleView}
            />
          ) : (
            <ProductionOrderList
              loading={isLoading}
              data={orderData?.items || []}
              page={page}
              pageSize={pageSize}
              selectedRowKeys={selectedRowKeys}
              onSelect={setSelectedRowKeys}
              onView={handleView}
              scrollY={scrollY}
            />
          )}
        </div>

        <div
          ref={paginationRef}
          className={
            isEmployeeView
              ? 'flex shrink-0 justify-center pb-1'
              : 'flex shrink-0 justify-end'
          }
        >
          <AppPagination total={orderData?.total || 0} />
        </div>
      </div>

      <ProductionOrderForm
        open={isModalOpen && !isView}
        onCancel={resetFormState}
        onSubmit={handleFinish}
        initialValues={detailData || editingRecord || undefined}
        employees={employees}
        fixedEmployee={fixedEmployee}
        loading={isLoadingDetail && !!editingRecord?.id}
        compact={isEmployeeView}
        showAuditField={!isEmployeeView}
      />

      <Modal
        title={modalTitle}
        open={isModalOpen && isView}
        onCancel={resetFormState}
        footer={[]}
        width={isEmployeeView ? 'calc(100vw - 20px)' : 900}
        style={isEmployeeView ? { top: 12, maxWidth: 560 } : undefined}
        destroyOnClose
      >
        {detailOrder ? (
          <ProductionOrderDetail
            order={detailOrder}
            compact={isEmployeeView}
            canEdit={!(isEmployeeView && isAuditedRecord(detailOrder))}
            onEdit={() => {
              if (isEmployeeView && isAuditedRecord(detailOrder)) {
                message.warning('已审核工单员工无法编辑')
                return
              }

              setIsView(false)
              setIsEdit(true)
              setModalTitle('编辑工单')
            }}
          />
        ) : null}
      </Modal>

      <Modal
        title="修改我的管理密码"
        open={isManagementPasswordModalOpen}
        destroyOnClose
        confirmLoading={isUpdatingManagementPassword}
        onOk={() => changePasswordForm.submit()}
        onCancel={() => {
          setIsManagementPasswordModalOpen(false)
          changePasswordForm.resetFields()
        }}
      >
        <Form
          form={changePasswordForm}
          layout="vertical"
          onFinish={handleChangeManagementPassword}
        >
          <Form.Item
            name="currentPassword"
            label="当前管理密码"
            rules={[{ required: true, message: '请输入当前管理密码' }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>

          <Form.Item
            name="nextPassword"
            label="新管理密码"
            rules={[
              { required: true, message: '请输入新管理密码' },
              { min: 6, message: '新管理密码至少需要 6 位' },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新管理密码"
            dependencies={['nextPassword']}
            rules={[
              { required: true, message: '请再次输入新管理密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('nextPassword') === value) {
                    return Promise.resolve()
                  }

                  return Promise.reject(new Error('两次输入的新管理密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
