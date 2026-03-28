import { useCallback, useEffect, useState } from 'react'
import { App, FormInstance, Modal } from 'antd'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import { useTableHeight } from '@/hooks/useTableHeight'
import type {
  MachineEquipmentMaintenance,
  MachineEquipmentMaintenanceFormValues,
} from '@/services/apiMachineEquipmentMaintenances'
import MachineEquipmentMaintenanceForm from './MachineEquipmentMaintenanceForm'
import MachineEquipmentMaintenanceSearch from './MachineEquipmentMaintenanceSearch'
import MachineEquipmentMaintenanceTable from './MachineEquipmentMaintenanceTable'
import {
  useCreateMachineEquipmentMaintenance,
  useDeleteMachineEquipmentMaintenances,
  useMachineEquipmentMaintenancesList,
  useUpdateMachineEquipmentMaintenance,
} from './useMachineEquipmentMaintenances'

export default function MachineEquipmentMaintenancePage() {
  const { message } = App.useApp()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建机器设备维护')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingRecord, setEditingRecord] =
    useState<MachineEquipmentMaintenance | null>(null)
  const [formRef, setFormRef] =
    useState<FormInstance<MachineEquipmentMaintenanceFormValues> | null>(null)

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [searchParams, setSearchParams] = useState<{
    unifiedDeviceNo?: string
    operation?: string
    machineName?: string
  }>({
    unifiedDeviceNo: searchParamsURL.get('unifiedDeviceNo') || undefined,
    operation: searchParamsURL.get('operation') || undefined,
    machineName: searchParamsURL.get('machineName') || undefined,
  })

  const { data, isLoading } = useMachineEquipmentMaintenancesList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateMachineEquipmentMaintenance()
  const updateMutation = useUpdateMachineEquipmentMaintenance()
  const deleteMutation = useDeleteMachineEquipmentMaintenances()

  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({
      targetRowCount: 10,
    })

  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    formRef?.resetFields()
  }, [formRef])

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    setModalTitle('新建机器设备维护')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef])

  const handleEdit = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条数据进行编辑')
      return
    }

    const record = data?.items.find((item) => item.id === selectedRowKeys[0])
    if (!record) {
      message.warning('请选择一条数据进行编辑')
      return
    }

    setEditingRecord(record)
    setIsEdit(true)
    setModalTitle('编辑机器设备维护')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedRowKeys as string[])
      message.success('机器设备维护删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除机器设备维护失败，请稍后重试')
      }
    }
  }, [deleteMutation, message, selectedRowKeys])

  const handleFinish = useCallback(
    async (values: MachineEquipmentMaintenanceFormValues) => {
      try {
        if (isEdit && selectedRowKeys[0]) {
          await updateMutation.mutateAsync({
            id: selectedRowKeys[0] as string,
            values,
          })
          message.success('机器设备维护更新成功')
        } else {
          await createMutation.mutateAsync(values)
          message.success('机器设备维护创建成功')
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

      const nextSearchParamsURL = new URLSearchParams(searchParamsURL)
      nextSearchParamsURL.set('page', '1')

      if (params.unifiedDeviceNo) {
        nextSearchParamsURL.set('unifiedDeviceNo', params.unifiedDeviceNo)
      } else {
        nextSearchParamsURL.delete('unifiedDeviceNo')
      }

      if (params.operation) {
        nextSearchParamsURL.set('operation', params.operation)
      } else {
        nextSearchParamsURL.delete('operation')
      }

      if (params.machineName) {
        nextSearchParamsURL.set('machineName', params.machineName)
      } else {
        nextSearchParamsURL.delete('machineName')
      }

      setSearchParamsURL(nextSearchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setSearchParams({})
    setSelectedRowKeys([])

    const nextSearchParamsURL = new URLSearchParams(searchParamsURL)
    nextSearchParamsURL.set('page', '1')
    nextSearchParamsURL.delete('unifiedDeviceNo')
    nextSearchParamsURL.delete('operation')
    nextSearchParamsURL.delete('machineName')
    setSearchParamsURL(nextSearchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      const nextSearchParamsURL = new URLSearchParams(searchParamsURL)
      nextSearchParamsURL.set('page', Math.max(page - 1, 1).toString())
      setSearchParamsURL(nextSearchParamsURL)
    }
  }, [data, page, searchParamsURL, setSearchParamsURL])

  return (
    <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={handleCreate} />
        <EditButton title="编辑机器设备维护" handleEdit={handleEdit} />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除机器设备维护"
          itemName="机器设备"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-gray-600">搜索：</span>
        <MachineEquipmentMaintenanceSearch
          onSearch={handleSearch}
          onReset={handleResetSearch}
          initialValues={searchParams}
        />
      </div>

      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-x-auto">
          <MachineEquipmentMaintenanceTable
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
        destroyOnClose
        width={960}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        onOk={() => formRef?.submit()}
        onCancel={resetFormState}
      >
        <MachineEquipmentMaintenanceForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isCreating={createMutation.isPending || updateMutation.isPending}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
        />
      </Modal>
    </div>
  )
}