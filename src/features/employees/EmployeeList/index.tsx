import { useState, useCallback, useEffect } from 'react'
import { App, Modal, FormInstance } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import AddButton from '@/ui/AddButton'
import EditButton from '@/ui/EditButton'
import DeleteButton from '@/ui/DeleteButton'
import AppPagination from '@/ui/AppPagination'
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployees,
  type Employee,
} from '@/services/apiEmployees'
import EmployeeTable from './EmployeeTable'
import EmployeeForm from './EmployeeForm'
import EmployeeSearch from './EmployeeSearch'

export default function EmployeeList() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建员工')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [formRef, setFormRef] = useState<FormInstance<Employee> | null>(null)
  const [searchParams, setSearchParams] = useState<{
    name?: string
  }>({})

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, pageSize, searchParams],
    queryFn: () => getEmployees({ page, pageSize, ...searchParams }),
    placeholderData: (previousData) => previousData,
  })

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
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
    mutationFn: updateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      message.success('更新成功')
      setIsModalOpen(false)
      setIsEdit(false)
      setSelectedRowKeys([])
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEmployees,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setSelectedRowKeys([])
      message.success('删除成功')
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '删除失败')
    },
  })

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setModalTitle('创建员工')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef])

  const [editingRecord, setEditingRecord] = useState<Employee | null>(null)

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

  const handleDelete = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }
    deleteMutation.mutate(selectedRowKeys as string[])
  }, [deleteMutation, message, selectedRowKeys])

  const handleFinish = useCallback(
    (values: Employee) => {
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
          title="删除员工"
          itemName="员工"
        />
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center gap-2">
        <span className="text-gray-600 whitespace-nowrap">搜索：</span>
        <EmployeeSearch onSearch={handleSearch} onReset={handleResetSearch} />
      </div>

      {/* 表格和分页 */}
      <div className="flex flex-col gap-4 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <EmployeeTable
            loading={isLoading}
            data={data?.items || []}
            selectedRowKeys={selectedRowKeys}
            onSelect={setSelectedRowKeys}
            page={page}
            pageSize={pageSize}
          />
        </div>
        <div className="flex justify-end flex-shrink-0">
          <AppPagination total={data?.total || 0} />
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
      >
        <EmployeeForm
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



