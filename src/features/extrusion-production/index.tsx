import { useCallback, useMemo, useState } from 'react'
import { App, Button, Splitter } from 'antd'
import { ShieldCheckIcon } from '@heroicons/react/16/solid'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import { useAuth } from '@/contexts/useAuth'
import { useFeaturePermission } from '@/hooks/usePermission'
import type {
  ExtrusionProduction,
  ExtrusionProductionFilters,
  UpsertExtrusionProductionPayload,
} from '@/services/apiExtrusionProductions'
import ExtrusionProductionDetail from './ExtrusionProductionDetail'
import ExtrusionProductionForm from './ExtrusionProductionForm'
import ExtrusionProductionSearch from './ExtrusionProductionSearch'
import ExtrusionProductionTable from './ExtrusionProductionTable'
import {
  useCreateExtrusionProduction,
  useDeleteExtrusionProductions,
  useExtrusionProduction,
  useExtrusionProductions,
  useUpdateExtrusionProduction,
} from './useExtrusionProductions'

export default function ExtrusionProductionPage() {
  const { message, modal } = App.useApp()
  const { user } = useAuth()
  const currentUploader = user?.email || null
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const canAudit = useFeaturePermission('extrusion-production', 'audit')

  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchFilters, setSearchFilters] =
    useState<ExtrusionProductionFilters>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] =
    useState<ExtrusionProduction | null>(null)
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null)

  const { data, isLoading } = useExtrusionProductions({
    page,
    pageSize,
    filters: searchFilters,
  })
  const activeDetailQuery = useExtrusionProduction(activeRecordId || undefined)
  const createMutation = useCreateExtrusionProduction()
  const updateMutation = useUpdateExtrusionProduction()
  const deleteMutation = useDeleteExtrusionProductions()

  const { tableContainerRef, paginationRef, scrollY, rowHeight } = useTableHeight({
    targetRowCount: 10,
  })

  const records = useMemo(() => data?.items || [], [data?.items])
  const activeRecord = activeDetailQuery.data || null
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const openCreateModal = useCallback(() => {
    setEditingRecord(null)
    setIsModalOpen(true)
  }, [])

  const openEditModal = useCallback(
    (record?: ExtrusionProduction) => {
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
    (filters: ExtrusionProductionFilters) => {
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
      const deleteIds = (ids || selectedRowKeys) as string[]

      if (deleteIds.length === 0) {
        message.warning('请选择至少一条数据')
        return
      }

      deleteMutation.mutate(deleteIds, {
        onSuccess: () => {
          message.success('删除成功')
          setSelectedRowKeys([])
          setActiveRecordId((prev) =>
            prev && deleteIds.includes(prev) ? null : prev,
          )
        },
        onError: (error) => {
          message.error(error instanceof Error ? error.message : '删除失败')
        },
      })
    },
    [deleteMutation, message, selectedRowKeys],
  )

  const handleSubmit = useCallback(
    async (values: UpsertExtrusionProductionPayload) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      try {
        if (editingRecord) {
          await updateMutation.mutateAsync({
            id: editingRecord.id,
            payload: values,
          })
          message.success('更新成功')
        } else {
          await createMutation.mutateAsync(values)
          message.success('创建成功')
        }

        handleCloseModal()
      } catch (error) {
        message.error(error instanceof Error ? error.message : '保存失败')
      }
    },
    [
      createMutation,
      editingRecord,
      handleCloseModal,
      message,
      updateMutation,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const handleAudit = useCallback(
    (record?: ExtrusionProduction) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      if (!canAudit) {
        message.warning('无审核权限')
        return
      }

      const targetRecord =
        record || records.find((item) => item.id === selectedRowKeys[0])

      if (!targetRecord) {
        message.warning('请选择一条数据进行审核')
        return
      }

      const nextAuditValue = !targetRecord.is_audited
      modal.confirm({
        title: `${nextAuditValue ? '审核' : '反审核'}挤压生产单`,
        content: `确定要将当前生产单标记为${nextAuditValue ? '已审核' : '待审核'}吗？`,
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          try {
            await updateMutation.mutateAsync({
              id: targetRecord.id,
              payload: {
                header: {
                  production_date: targetRecord.production_date,
                  machine_id: targetRecord.machine_id,
                  shift: targetRecord.shift,
                  shift_leader_name: targetRecord.shift_leader_name,
                  uploaded_by_name: targetRecord.uploaded_by_name,
                  remark: targetRecord.remark,
                  is_audited: nextAuditValue,
                },
                items: targetRecord.extrusion_production_items || [],
              },
            })
            message.success(`${nextAuditValue ? '审核' : '反审核'}成功`)
          } catch (error) {
            message.error(
              error instanceof Error ? error.message : `${nextAuditValue ? '审核' : '反审核'}失败`,
            )
          }
        },
      })
    },
    [
      canAudit,
      message,
      modal,
      records,
      selectedRowKeys,
      updateMutation,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ExtrusionProductionSearch
        onSearch={handleSearch}
        onReset={handleResetSearch}
      />

      <div className="flex flex-wrap items-center gap-2">
        <AddButton
          handleCreate={openCreateModal}
          permissionKey="feature:extrusion-production.create"
        />
        <EditButton
          title="编辑挤压生产单"
          handleEdit={() => openEditModal()}
        />
        <DeleteButton
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          itemName="挤压生产单"
          title="删除挤压生产单"
          permissionKey="feature:extrusion-production.delete"
          onConfirm={() => handleDelete()}
        />
        <Button
          type="text"
          icon={<ShieldCheckIcon className="size-4 text-sky-500/80!" />}
          onClick={() => handleAudit()}
          disabled={viewerDenied || !canAudit}
        >
          审核
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden" ref={tableContainerRef}>
        <Splitter>
          <Splitter.Panel defaultSize="65%" min="45%">
            <div className="flex h-full min-h-0 flex-col gap-4 pr-2">
              <div className="min-h-0 flex-1 overflow-hidden">
                <ExtrusionProductionTable
                  loading={isLoading}
                  data={records}
                  page={page}
                  pageSize={pageSize}
                  selectedRowKeys={selectedRowKeys}
                  onSelect={setSelectedRowKeys}
                  scrollY={scrollY}
                  rowHeight={rowHeight}
                  activeRowId={activeRecordId}
                  onRowClick={(record) => setActiveRecordId(record.id)}
                />
              </div>
              <div ref={paginationRef}>
                <AppPagination total={data?.total || 0} />
              </div>
            </div>
          </Splitter.Panel>
          <Splitter.Panel>
            <div className="h-full min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <ExtrusionProductionDetail selectedRecord={activeRecord} />
            </div>
          </Splitter.Panel>
        </Splitter>
      </div>

      <ExtrusionProductionForm
        open={isModalOpen}
        onCancel={handleCloseModal}
        onSubmit={handleSubmit}
        initialValues={editingRecord}
        loading={isSubmitting}
        currentUploader={currentUploader}
        canAudit={canAudit}
      />
    </div>
  )
}
