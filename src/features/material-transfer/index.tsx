import { useCallback, useMemo, useState } from 'react'
import { App, Button, Card, Statistic } from 'antd'
import { ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/16/solid'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import ExportButton from '@/ui/ExportButton'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useAllEmployees } from '@/features/workshop/EmployeeList/useEmployees'
import {
  getMaterialTransfersForExport,
  type MaterialTransferInsert,
  type MaterialTransferUpdate,
  type MaterialTransferWithEmployee,
} from '@/services/apiMaterialTransfers'
import { exportMaterialTransfersToExcel } from '@/utils/materialTransferExcel'
import {
  useCreateMaterialTransfer,
  useBatchUpdateMaterialTransfers,
  useDeleteMaterialTransfers,
  useMaterialTransferQuantityStats,
  useMaterialTransfers,
  useUpdateMaterialTransfer,
} from './useMaterialTransfers'
import MaterialTransferForm from './MaterialTransferForm'
import MaterialTransferSearch from './MaterialTransferSearch'
import MaterialTransferTable from './MaterialTransferTable'

export default function MaterialTransferPage() {
  const { message, modal } = App.useApp()
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchFilters, setSearchFilters] = useState<{
    projectNo?: string
    employeeId?: string
    targetWorkshop?: string
    recipientName?: string
    isAudited?: boolean
  }>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] =
    useState<MaterialTransferWithEmployee | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const { data: employeeOptions = [] } = useAllEmployees()
  const { data, isLoading } = useMaterialTransfers({
    page,
    pageSize,
    filters: searchFilters,
  })
  const createMutation = useCreateMaterialTransfer()
  const updateMutation = useUpdateMaterialTransfer()
  const deleteMutation = useDeleteMaterialTransfers()
  const batchUpdateMutation = useBatchUpdateMaterialTransfers()

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 10,
  })

  const selectedCount = selectedRowKeys.length
  const selectedIds = useMemo(
    () => selectedRowKeys.map((key) => String(key)),
    [selectedRowKeys],
  )
  const records = useMemo(() => data?.items || [], [data?.items])

  const { data: filteredQuantityStats } = useMaterialTransferQuantityStats({
    filters: searchFilters,
  })
  const { data: selectedQuantityStats } = useMaterialTransferQuantityStats({
    ids: selectedIds,
    enabled: selectedIds.length > 0,
  })

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const initialFormValues = useMemo(() => editingRecord, [editingRecord])

  const openCreateModal = useCallback(() => {
    setEditingRecord(null)
    setIsModalOpen(true)
  }, [])

  const openEditModal = useCallback(
    (record?: MaterialTransferWithEmployee) => {
      const targetRecord =
        record || records.find((item) => item.id === selectedRowKeys[0])

      if (!targetRecord) {
        message.warning('请选择一条数据进行编辑')
        return
      }

      if (!record && selectedRowKeys.length !== 1) {
        message.warning('请选择一条数据进行编辑')
        return
      }

      setEditingRecord(targetRecord)
      setIsModalOpen(true)
    },
    [message, records, selectedRowKeys],
  )

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingRecord(null)
  }, [])

  const handleSearch = useCallback(
    (filters: {
      projectNo?: string
      employeeId?: string
      targetWorkshop?: string
      recipientName?: string
      isAudited?: boolean
    }) => {
      setSearchFilters(filters)
      setSelectedRowKeys([])
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setSearchFilters({})
    setSelectedRowKeys([])
    searchParamsURL.set('page', '1')
    searchParamsURL.delete('pageSize')
    setSearchParamsURL(searchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

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
          message.error(error instanceof Error ? error.message : '删除失败')
        },
      })
    },
    [deleteMutation, message, selectedRowKeys],
  )

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true)
      const selectedIds = selectedRowKeys.map((key) => String(key))
      const exportRows = await getMaterialTransfersForExport(
        selectedIds.length > 0
          ? { ids: selectedIds }
          : { filters: searchFilters },
      )

      if (exportRows.length === 0) {
        message.warning('当前没有可导出的物料转移单')
        return
      }

      exportMaterialTransfersToExcel(exportRows)
      message.success(`已导出 ${exportRows.length} 条物料转移单`)
      setSelectedRowKeys([])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出失败')
    } finally {
      setIsExporting(false)
    }
  }, [message, searchFilters, selectedRowKeys])

  const handleBatchAudit = useCallback(
    (isAudited: boolean) => {
      if (selectedRowKeys.length === 0) {
        message.warning(`请选择要${isAudited ? '审核' : '反审核'}的物料转移单`)
        return
      }

      modal.confirm({
        title: `批量${isAudited ? '审核' : '反审核'}物料转移单`,
        content: `确定要将选中的 ${selectedRowKeys.length} 条物料转移单标记为${isAudited ? '已审核' : '待审核'}吗？`,
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
            message.error(
              error instanceof Error
                ? error.message
                : `批量${isAudited ? '审核' : '反审核'}失败`,
            )
          }
        },
      })
    },
    [batchUpdateMutation, message, modal, selectedRowKeys],
  )

  const handleSubmit = useCallback(
    async (values: MaterialTransferInsert | MaterialTransferUpdate) => {
      if (editingRecord) {
        await updateMutation.mutateAsync({
          id: editingRecord.id,
          values: values as MaterialTransferUpdate,
        })
        message.success('更新成功')
      } else {
        await createMutation.mutateAsync(values as MaterialTransferInsert)
        message.success('创建成功')
      }

      handleCloseModal()
      setSelectedRowKeys([])
    },
    [createMutation, editingRecord, handleCloseModal, message, updateMutation],
  )

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={openCreateModal} />
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
        <EditButton title="编辑物料转移单" handleEdit={() => openEditModal()} />
        <ExportButton handleExport={handleExport} loading={isExporting}>
          {selectedCount > 0 ? '导出选中项' : '导出当前筛选结果'}
        </ExportButton>
        <DeleteButton
          onConfirm={() => handleDelete()}
          isDeleting={deleteMutation.isPending}
          count={selectedCount}
          title="删除物料转移单"
          itemName="转移单"
        />
      </div>

      <MaterialTransferSearch
        employees={employeeOptions}
        initialValues={searchFilters}
        onSearch={handleSearch}
        onReset={handleResetSearch}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card size="small">
          <Statistic
            title={`当前筛选总数量${filteredQuantityStats ? ` / ${filteredQuantityStats.totalRecords} 条` : ''}`}
            value={filteredQuantityStats?.totalQuantity || 0}
          />
        </Card>
        <Card size="small">
          <Statistic
            title={
              selectedCount > 0
                ? `当前勾选总数量 / ${selectedCount} 条`
                : '当前勾选总数量'
            }
            value={selectedQuantityStats?.totalQuantity || 0}
          />
        </Card>
      </div>

      <div ref={tableContainerRef} className="min-h-0 flex-1 overflow-hidden">
        <MaterialTransferTable
          loading={isLoading}
          data={records}
          page={page}
          pageSize={pageSize}
          selectedRowKeys={selectedRowKeys}
          onSelect={setSelectedRowKeys}
          onEdit={openEditModal}
          scrollY={scrollY}
        />
      </div>

      <div ref={paginationRef}>
        <AppPagination total={data?.total || 0} />
      </div>

      <MaterialTransferForm
        open={isModalOpen}
        onCancel={handleCloseModal}
        onSubmit={handleSubmit}
        initialValues={initialFormValues}
        employees={employeeOptions}
        loading={isSubmitting}
      />
    </div>
  )
}
