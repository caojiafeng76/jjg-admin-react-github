import type { FormInstance } from 'antd'
import type { EmployeeFormValues } from './EmployeeForm'
import type { Employee } from '@/services/apiEmployees'
import { App, Modal } from 'antd'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTableHeight } from '@/hooks/useTableHeight'
import AppPagination from '@/ui/AppPagination'
import { DEFAULT_EMPLOYEE_AUTH_PASSWORD } from './constants'
import EmployeeAccountModals from './EmployeeAccountModals'
import EmployeeForm from './EmployeeForm'
import EmployeeTable from './EmployeeTable'
import EmployeeToolbar from './EmployeeToolbar'
import { useEmployeeAuthAccountActions } from './useEmployeeAuthAccountActions'
import { useEmployeeBatchAuthAccounts } from './useEmployeeBatchAuthAccounts'
import { useEmployeeDelete } from './useEmployeeDelete'
import {
  useCreateEmployee,
  useEmployeesList,
  useUpdateEmployee,
} from './useEmployees'

export default function EmployeeList() {
  const { message } = App.useApp()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建员工')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const formRef = useRef<FormInstance<EmployeeFormValues> | null>(null)
  const setFormRef = useCallback((form: FormInstance<EmployeeFormValues>) => {
    formRef.current = form
  }, [])
  const [searchParams, setSearchParams] = useState<{
    name?: string
    role?: string
    is_active?: boolean
  }>({})

  const { data, isFetching } = useEmployeesList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateEmployee()
  const updateMutation = useUpdateEmployee()

  // 动态计算表格高度（目标10条数据撑满）
  const { tableContainerRef, paginationRef, scrollY, rowHeight }
    = useTableHeight({
      targetRowCount: 10,
    })

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setModalTitle('创建员工')
    setIsModalOpen(true)
    formRef.current?.resetFields()
  }, [])

  const [editingRecord, setEditingRecord] = useState<Employee | null>(null)

  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    formRef.current?.resetFields()
  }, [])

  const handleEdit = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    const record = data?.items.find(item => item.id === selectedRowKeys[0])
    if (!record)
      return

    setEditingRecord(record)
    setIsEdit(true)
    setModalTitle('编辑员工')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const authAccountActions = useEmployeeAuthAccountActions({
    data,
    selectedRowKeys,
    setSelectedRowKeys,
  })
  const { createEmployeeAuthMutation } = authAccountActions
  const { handleBatchCreateAuthAccounts, isBatchCreatingAuth }
    = useEmployeeBatchAuthAccounts({
      data,
      selectedRowKeys,
      setSelectedRowKeys,
    })
  const { handleDelete, isDeleting } = useEmployeeDelete({
    selectedRowKeys,
    setSelectedRowKeys,
  })

  const handleFinish = useCallback(
    async (values: EmployeeFormValues) => {
      try {
        if (isEdit && selectedRowKeys[0]) {
          await updateMutation.mutateAsync({
            id: selectedRowKeys[0] as string,
            values,
          })
          message.success('员工更新成功')
        }
        else {
          const createdEmployee = await createMutation.mutateAsync(values)

          if (
            values.createAuthAccount
            && createdEmployee.id
            && values.authEmail
          ) {
            try {
              await createEmployeeAuthMutation.mutateAsync({
                employeeId: createdEmployee.id,
                email: values.authEmail,
                password: DEFAULT_EMPLOYEE_AUTH_PASSWORD,
              })
              message.success('员工和登录账号创建成功')
            }
            catch (authError) {
              if (authError instanceof Error) {
                message.warning(
                  `员工已创建，但登录账号创建失败：${authError.message}`,
                )
              }
              else {
                message.warning('员工已创建，但登录账号创建失败')
              }
            }
          }
          else {
            message.success('员工创建成功')
          }
        }

        // 成功后关闭模态框并清理状态
        resetFormState()
      }
      catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        }
        else {
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

  const handleSearch = useCallback(
    (params: typeof searchParams) => {
      setSearchParams(params)
      setSelectedRowKeys([])
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

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
    <div className="grid h-full grid-rows-[auto_1fr] gap-2">
      {/* 工具栏 + 搜索栏（合并一行，宽屏单行、窄屏自动换行） */}
      <EmployeeToolbar
        selectedCount={selectedRowKeys.length}
        isDeleting={isDeleting}
        isBatchCreatingAuth={isBatchCreatingAuth}
        handleCreate={handleCreate}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleOpenCreateAuthModal={authAccountActions.handleOpenCreateAuthModal}
        handleBatchCreateAuthAccounts={handleBatchCreateAuthAccounts}
        handleOpenResetPasswordModal={
          authAccountActions.handleOpenResetPasswordModal
        }
        handleUnbindAuthAccount={authAccountActions.handleUnbindAuthAccount}
        handleOpenRebindModal={authAccountActions.handleOpenRebindModal}
        handleSearch={handleSearch}
        handleResetSearch={handleResetSearch}
      />

      {/* 表格和分页 */}
      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-x-auto">
          <EmployeeTable
            loading={isFetching}
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
        onOk={() => formRef.current?.submit()}
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

      <EmployeeAccountModals actions={authAccountActions} />
    </div>
  )
}
