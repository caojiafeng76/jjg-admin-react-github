import { useState, useCallback, useEffect } from 'react'
import { App, Button, FormInstance, Modal } from 'antd'
import {
  ArrowPathIcon,
  KeyIcon,
  LinkSlashIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import EditButton from '@/ui/EditButton'
import DeleteButton from '@/ui/DeleteButton'
import AppPagination from '@/ui/AppPagination'
import { useTableHeight } from '@/hooks/useTableHeight'
import {
  getEmployeeDeleteBlockers,
  type Employee,
} from '@/services/apiEmployees'
import {
  useEmployeesList,
  useCreateEmployee,
  useCreateEmployeeAuthAccount,
  useResetEmployeeAuthPassword,
  useUnbindEmployeeAuthAccount,
  useRebindEmployeeAuthAccount,
  useUpdateEmployee,
  useDeleteEmployees,
} from './useEmployees'
import EmployeeAuthAccountForm, {
  type EmployeeAuthAccountValues,
} from './EmployeeAuthAccountForm'
import EmployeeForm, {
  type EmployeeFormValues,
} from './EmployeeForm'
import EmployeeRebindAccountForm, {
  type EmployeeRebindAccountValues,
} from './EmployeeRebindAccountForm'
import EmployeeResetPasswordForm, {
  type EmployeeResetPasswordValues,
} from './EmployeeResetPasswordForm'
import EmployeeTable from './EmployeeTable'
import EmployeeSearch from './EmployeeSearch'

export default function EmployeeList() {
  const { message, modal } = App.useApp()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建员工')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [formRef, setFormRef] =
    useState<FormInstance<EmployeeFormValues> | null>(null)
  const [authFormRef, setAuthFormRef] =
    useState<FormInstance<EmployeeAuthAccountValues> | null>(null)
  const [resetPasswordFormRef, setResetPasswordFormRef] =
    useState<FormInstance<EmployeeResetPasswordValues> | null>(null)
  const [rebindFormRef, setRebindFormRef] =
    useState<FormInstance<EmployeeRebindAccountValues> | null>(null)
  const [searchParams, setSearchParams] = useState<{
    name?: string
    role?: 'admin' | 'employee'
    is_active?: boolean
  }>({})
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authTargetEmployee, setAuthTargetEmployee] = useState<Employee | null>(
    null,
  )
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] =
    useState(false)
  const [isRebindModalOpen, setIsRebindModalOpen] = useState(false)

  const { data, isLoading } = useEmployeesList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateEmployee()
  const createEmployeeAuthMutation = useCreateEmployeeAuthAccount()
  const resetEmployeeAuthPasswordMutation = useResetEmployeeAuthPassword()
  const unbindEmployeeAuthAccountMutation = useUnbindEmployeeAuthAccount()
  const rebindEmployeeAuthAccountMutation = useRebindEmployeeAuthAccount()

  const updateMutation = useUpdateEmployee()

  const deleteMutation = useDeleteEmployees()

  // 动态计算表格高度（目标10条数据撑满）
  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({
      targetRowCount: 10,
    })

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setModalTitle('创建员工')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef])

  const [editingRecord, setEditingRecord] = useState<Employee | null>(null)

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

    setEditingRecord(record)
    setIsEdit(true)
    setModalTitle('编辑员工')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleOpenCreateAuthModal = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条现有员工数据进行账号开通')
      return
    }

    const record = data?.items.find((item) => item.id === selectedRowKeys[0])

    if (!record) {
      return
    }

    if (record.auth_user_id) {
      message.warning('该员工已绑定账号，如需更换请使用重新绑定或先解绑')
      return
    }

    setAuthTargetEmployee(record)
    setIsAuthModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const getSingleSelectedEmployee = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条员工数据进行操作')
      return null
    }

    const record = data?.items.find((item) => item.id === selectedRowKeys[0])

    if (!record) {
      message.warning('未找到所选员工')
      return null
    }

    return record
  }, [data?.items, message, selectedRowKeys])

  const handleOpenResetPasswordModal = useCallback(() => {
    const record = getSingleSelectedEmployee()

    if (!record) return

    if (!record.auth_user_id) {
      message.warning('该员工尚未绑定账号，无法重置密码')
      return
    }

    setAuthTargetEmployee(record)
    setIsResetPasswordModalOpen(true)
  }, [getSingleSelectedEmployee, message])

  const handleUnbindAuthAccount = useCallback(() => {
    const record = getSingleSelectedEmployee()

    if (!record) return

    if (!record.auth_user_id) {
      message.warning('该员工当前没有绑定账号')
      return
    }

    modal.confirm({
      title: '解绑员工账号',
      okText: '确认解绑',
      cancelText: '取消',
      okButtonProps: { danger: true },
      content: `确定解绑员工“${record.name}”当前账号吗？解绑后该员工将无法再通过当前账号访问系统。`,
      onOk: async () => {
        try {
          const result = await unbindEmployeeAuthAccountMutation.mutateAsync(
            record.id as string,
          )
          message.success(`已解绑员工 ${result.employeeName} 的登录账号`)
          setSelectedRowKeys([])
        } catch (error) {
          if (error instanceof Error) {
            message.error(error.message)
          } else {
            message.error('解绑员工账号失败')
          }

          throw error
        }
      },
    })
  }, [getSingleSelectedEmployee, message, modal, unbindEmployeeAuthAccountMutation])

  const handleOpenRebindModal = useCallback(() => {
    const record = getSingleSelectedEmployee()

    if (!record) return

    setAuthTargetEmployee(record)
    setIsRebindModalOpen(true)
  }, [getSingleSelectedEmployee])

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    const ids = selectedRowKeys as string[]

    try {
      const blockers = await getEmployeeDeleteBlockers(ids)

      if (blockers.length > 0) {
        modal.warning({
          title: '无法删除员工',
          okText: '知道了',
          width: 560,
          content: (
            <div className="space-y-3">
              <p>以下员工已被生产工单引用，请先处理关联数据：</p>
              <ul className="list-disc space-y-2 pl-5">
                {blockers.map((item) => (
                  <li key={item.employeeId}>
                    <div className="font-medium text-gray-800">
                      {item.employeeName}
                    </div>
                    <div className="text-sm text-gray-500">
                      已关联 {item.productionOrderCount} 张生产工单
                      {item.orderDates.length > 0
                        ? `，日期：${item.orderDates.slice(0, 3).join('、')}`
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
        title: '删除员工',
        okText: '确认删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        content: (
          <div>
            <p>
              确定删除选中的 <strong>{ids.length}</strong> 个员工吗？
            </p>
            <p className="mt-2 text-xs text-red-500">此操作不可撤销。</p>
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
    async (values: EmployeeFormValues) => {
      try {
        if (isEdit && selectedRowKeys[0]) {
          await updateMutation.mutateAsync({
            id: selectedRowKeys[0] as string,
            values,
          })
          message.success('员工更新成功')
        } else {
          const createdEmployee = await createMutation.mutateAsync(values)

          if (
            values.createAuthAccount &&
            createdEmployee.id &&
            values.authEmail &&
            values.authPassword
          ) {
            try {
              await createEmployeeAuthMutation.mutateAsync({
                employeeId: createdEmployee.id,
                email: values.authEmail,
                password: values.authPassword,
              })
              message.success('员工和登录账号创建成功')
            } catch (authError) {
              if (authError instanceof Error) {
                message.warning(
                  `员工已创建，但登录账号创建失败：${authError.message}`,
                )
              } else {
                message.warning('员工已创建，但登录账号创建失败')
              }
            }
          } else {
            message.success('员工创建成功')
          }
        }

        // 成功后关闭模态框并清理状态
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
      createEmployeeAuthMutation,
      isEdit,
      message,
      resetFormState,
      selectedRowKeys,
      updateMutation,
    ],
  )

  const handleCreateAuthAccount = useCallback(
    async (values: EmployeeAuthAccountValues) => {
      if (!authTargetEmployee?.id) {
        message.error('未找到要绑定账号的员工')
        return
      }

      try {
        const result = await createEmployeeAuthMutation.mutateAsync({
          employeeId: authTargetEmployee.id,
          email: values.email,
          password: values.password,
        })

        message.success(
          `已为现有员工 ${result.employeeName} 开通账号并绑定到 ${result.email}`,
        )
        setIsAuthModalOpen(false)
        setAuthTargetEmployee(null)
        authFormRef?.resetFields()
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('创建员工登录账号失败')
        }
      }
    },
    [authFormRef, authTargetEmployee, createEmployeeAuthMutation, message],
  )

  const handleResetPassword = useCallback(
    async (values: EmployeeResetPasswordValues) => {
      if (!authTargetEmployee?.id) {
        message.error('未找到目标员工')
        return
      }

      try {
        const result = await resetEmployeeAuthPasswordMutation.mutateAsync({
          employeeId: authTargetEmployee.id,
          password: values.password,
        })

        message.success(`已重置员工 ${result.employeeName} 的登录密码`)
        setIsResetPasswordModalOpen(false)
        resetPasswordFormRef?.resetFields()
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('重置员工登录密码失败')
        }
      }
    },
    [authTargetEmployee, message, resetEmployeeAuthPasswordMutation, resetPasswordFormRef],
  )

  const handleRebindAccount = useCallback(
    async (values: EmployeeRebindAccountValues) => {
      if (!authTargetEmployee?.id) {
        message.error('未找到目标员工')
        return
      }

      try {
        const result = await rebindEmployeeAuthAccountMutation.mutateAsync({
          employeeId: authTargetEmployee.id,
          email: values.email,
        })

        message.success(
          `已将 ${result.employeeName} 重新绑定到账号 ${result.email}`,
        )
        setIsRebindModalOpen(false)
        rebindFormRef?.resetFields()
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('重新绑定员工账号失败')
        }
      }
    },
    [authTargetEmployee, message, rebindEmployeeAuthAccountMutation, rebindFormRef],
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

  return (
    <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={handleCreate} />
        <Button
          type="text"
          icon={<KeyIcon className="size-4 text-sky-500" />}
          onClick={handleOpenCreateAuthModal}
        >
          为现有员工开通账号
        </Button>
        <Button
          type="text"
          icon={<ShieldCheckIcon className="size-4 text-amber-500" />}
          onClick={handleOpenResetPasswordModal}
        >
          重置密码
        </Button>
        <Button
          type="text"
          icon={<LinkSlashIcon className="size-4 text-rose-500" />}
          onClick={handleUnbindAuthAccount}
        >
          解绑账号
        </Button>
        <Button
          type="text"
          icon={<ArrowPathIcon className="size-4 text-violet-500" />}
          onClick={handleOpenRebindModal}
        >
          重新绑定
        </Button>
        <EditButton title="编辑" handleEdit={handleEdit} />
        <DeleteButton
          onClick={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除员工"
          itemName="员工"
        />
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-gray-600">搜索：</span>
        <EmployeeSearch onSearch={handleSearch} onReset={handleResetSearch} />
      </div>

      {/* 表格和分页 */}
      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-x-auto">
          <EmployeeTable
            loading={isLoading}
            data={data?.items || []}
            selectedRowKeys={selectedRowKeys}
            onSelect={setSelectedRowKeys}
            page={page}
            pageSize={pageSize}
            scrollY={scrollY}
            rowHeight={rowHeight}
          />
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={data?.total || 0} />
        </div>
      </div>

      <Modal
        title={modalTitle}
        open={isModalOpen}
        width={640}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
        onOk={() => formRef?.submit()}
        onCancel={() => {
          resetFormState()
        }}
      >
        <EmployeeForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isCreating={createMutation.isPending}
          isEdit={isEdit}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
        />
      </Modal>

      <Modal
        title="为现有员工开通账号"
        open={isAuthModalOpen}
        width={560}
        destroyOnClose
        confirmLoading={createEmployeeAuthMutation.isPending}
        onOk={() => authFormRef?.submit()}
        onCancel={() => {
          setIsAuthModalOpen(false)
          setAuthTargetEmployee(null)
          authFormRef?.resetFields()
        }}
      >
        {authTargetEmployee ? (
          <EmployeeAuthAccountForm
            employee={authTargetEmployee}
            setFormRef={setAuthFormRef}
            onFinish={handleCreateAuthAccount}
            isSubmitting={createEmployeeAuthMutation.isPending}
          />
        ) : null}
      </Modal>

      <Modal
        title="重置员工登录密码"
        open={isResetPasswordModalOpen}
        width={520}
        destroyOnClose
        confirmLoading={resetEmployeeAuthPasswordMutation.isPending}
        onOk={() => resetPasswordFormRef?.submit()}
        onCancel={() => {
          setIsResetPasswordModalOpen(false)
          resetPasswordFormRef?.resetFields()
        }}
      >
        {authTargetEmployee ? (
          <EmployeeResetPasswordForm
            employee={authTargetEmployee}
            setFormRef={setResetPasswordFormRef}
            onFinish={handleResetPassword}
            isSubmitting={resetEmployeeAuthPasswordMutation.isPending}
          />
        ) : null}
      </Modal>

      <Modal
        title="重新绑定员工账号"
        open={isRebindModalOpen}
        width={520}
        destroyOnClose
        confirmLoading={rebindEmployeeAuthAccountMutation.isPending}
        onOk={() => rebindFormRef?.submit()}
        onCancel={() => {
          setIsRebindModalOpen(false)
          rebindFormRef?.resetFields()
        }}
      >
        {authTargetEmployee ? (
          <EmployeeRebindAccountForm
            employee={authTargetEmployee}
            setFormRef={setRebindFormRef}
            onFinish={handleRebindAccount}
            isSubmitting={rebindEmployeeAuthAccountMutation.isPending}
          />
        ) : null}
      </Modal>
    </div>
  )
}
