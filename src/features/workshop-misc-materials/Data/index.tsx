import type { FormInstance, TableColumnsType } from 'antd'
import type {
  WorkshopMiscMaterialsData,
  WorkshopMiscMaterialsDataFormValues,
} from '@/services/apiWorkshopMiscMaterialsData'
import type { WorkshopMiscMaterialsSearchFilters } from '@/services/workshopMiscMaterialsSearchFields'
import { DocumentDuplicateIcon } from '@heroicons/react/16/solid'
import { App, Button, Modal, Tooltip } from 'antd'
import { useCallback, useEffect, useState } from 'react'

import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import { getWorkshopMiscMaterialsDataForExport } from '@/services/apiWorkshopMiscMaterialsData'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import ExcelImportModal from '@/ui/ExcelImportModal'
import ExportButton from '@/ui/ExportButton'
import FormErrorAlert from '@/ui/FormErrorAlert'
import { TableState } from '@/ui/TableState'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import {
  loadWorkshopMiscMaterialsExcel,
  preloadWorkshopMiscMaterialsExcel,
} from '../loadWorkshopMiscMaterialsExcel'
import {
  WORKSHOP_MISC_MATERIALS_DATA_PERMISSION_KEY,
  WORKSHOP_MISC_MATERIALS_INVENTORY_PERMISSION_KEY,
  WORKSHOP_MISC_MATERIALS_STOCK_IN_PERMISSION_KEY,
  WORKSHOP_MISC_MATERIALS_STOCK_OUT_PERMISSION_KEY,
} from '../permissions'
import { useWorkshopMiscMaterialsListParams } from '../useWorkshopMiscMaterialsListParams'
import WorkshopMiscMaterialsSearch from '../WorkshopMiscMaterialsSearch'
import {
  useCreateWorkshopMiscMaterialsData,
  useDeleteWorkshopMiscMaterialsData,
  useImportWorkshopMiscMaterialsData,
  useUpdateWorkshopMiscMaterialsData,
  useWorkshopMiscMaterialsDataList,
} from './useWorkshopMiscMaterialsData'
import WorkshopMiscMaterialsDataDetailDrawer from './WorkshopMiscMaterialsDataDetailDrawer'
import WorkshopMiscMaterialsDataForm from './WorkshopMiscMaterialsDataForm'
import WorkshopMiscMaterialsDataTable from './WorkshopMiscMaterialsDataTable'

const ENTITY = '材料资料'

type FormMode = 'create' | 'edit' | 'copy'

const MODAL_TITLES: Record<FormMode, string> = {
  create: '新建材料资料',
  edit: '编辑材料资料',
  copy: '复制新增材料资料',
}

const IMPORT_COLUMNS: TableColumnsType<
  WorkshopMiscMaterialsDataFormValues & { _idx: number }
> = [
  { title: '#', dataIndex: '_idx', width: 60, render: (value: number) => value + 1 },
  { title: '型号', dataIndex: 'model', width: 160 },
  { title: '客户型号', dataIndex: 'customer_model', width: 160 },
  { title: '规格', dataIndex: 'specification', width: 160 },
  { title: '类别', dataIndex: 'category', width: 120 },
  { title: '备注', dataIndex: 'remarks' },
]

export default function WorkshopMiscMaterialsDataPage() {
  const { message } = App.useApp()
  const canManage = usePermission(WORKSHOP_MISC_MATERIALS_DATA_PERMISSION_KEY)
  const canViewInventory = usePermission(
    WORKSHOP_MISC_MATERIALS_INVENTORY_PERMISSION_KEY,
  )
  const canStockIn = usePermission(WORKSHOP_MISC_MATERIALS_STOCK_IN_PERMISSION_KEY)
  const canStockOut = usePermission(
    WORKSHOP_MISC_MATERIALS_STOCK_OUT_PERMISSION_KEY,
  )
  const canOpenDetail = canViewInventory || canStockIn || canStockOut
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const { page, pageSize, filters, setFilters, stepBackIfEmpty }
    = useWorkshopMiscMaterialsListParams()

  const [detailRecord, setDetailRecord]
    = useState<WorkshopMiscMaterialsData | null>(null)
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [editingRecord, setEditingRecord]
    = useState<WorkshopMiscMaterialsData | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [formRef, setFormRef]
    = useState<FormInstance<WorkshopMiscMaterialsDataFormValues> | null>(null)
  const [formError, setFormError] = useState<unknown>(null)

  const { data, isLoading, error, refetch } = useWorkshopMiscMaterialsDataList({
    page,
    pageSize,
    filters,
  })
  const createMutation = useCreateWorkshopMiscMaterialsData()
  const updateMutation = useUpdateWorkshopMiscMaterialsData()
  const importMutation = useImportWorkshopMiscMaterialsData()
  const deleteMutation = useDeleteWorkshopMiscMaterialsData()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const { tableContainerRef, paginationRef, scrollY, rowHeight }
    = useTableHeight({ targetRowCount: 10 })

  useEffect(() => {
    stepBackIfEmpty(data?.items.length)
  }, [data, stepBackIfEmpty])

  const guard = useCallback(() => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return false
    }
    if (!canManage) {
      message.warning('无材料资料操作权限')
      return false
    }
    return true
  }, [canManage, message, viewerDenied, viewerOperationTip])

  const closeModal = useCallback(() => {
    setFormMode(null)
    setEditingRecord(null)
    setSelectedRowKeys([])
    setFormError(null)
    formRef?.resetFields()
  }, [formRef])

  const handleCreate = useCallback(() => {
    setEditingRecord(null)
    setSelectedRowKeys([])
    setFormError(null)
    setFormMode('create')
  }, [])

  const openWithSelected = useCallback(
    (mode: Exclude<FormMode, 'create'>) => {
      const record = selectedRowKeys.length === 1
        ? data?.items.find(item => item.id === selectedRowKeys[0])
        : undefined
      if (!record) {
        message.warning(
          mode === 'edit' ? '请选择一条数据进行编辑' : '请选择一条数据进行复制新增',
        )
        return
      }
      setEditingRecord(record)
      setFormError(null)
      setFormMode(mode)
    },
    [data?.items, message, selectedRowKeys],
  )

  const handleDelete = useCallback(async () => {
    if (!guard())
      return
    if (selectedRowKeys.length === 0) {
      message.warning(feedbackText.selectRequired('删除'))
      return
    }
    try {
      await deleteMutation.mutateAsync(selectedRowKeys as string[])
      message.success(feedbackText.deleted(ENTITY, selectedRowKeys.length))
      setSelectedRowKeys([])
    }
    catch (deleteError) {
      message.error(
        getUserErrorMessage(
          deleteError,
          feedbackText.failed('删除', ENTITY, '已有出入库记录的材料不能删除'),
        ),
      )
    }
  }, [deleteMutation, guard, message, selectedRowKeys])

  const handleImport = useCallback(
    async (rows: WorkshopMiscMaterialsDataFormValues[]) => {
      if (viewerDenied) {
        throw new Error(viewerOperationTip)
      }
      if (!canManage) {
        throw new Error('无材料资料操作权限')
      }
      await importMutation.mutateAsync(rows)
      message.success(feedbackText.imported(ENTITY, rows.length))
      setSelectedRowKeys([])
    },
    [canManage, importMutation, message, viewerDenied, viewerOperationTip],
  )

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const [rows, { exportWorkshopMiscMaterialsDataToExcel }] = await Promise.all([
        getWorkshopMiscMaterialsDataForExport(filters),
        loadWorkshopMiscMaterialsExcel(),
      ])
      if (rows.length === 0) {
        message.warning('当前没有可导出的材料资料')
        return
      }
      exportWorkshopMiscMaterialsDataToExcel(rows)
      message.success(feedbackText.exported(ENTITY, rows.length))
    }
    catch (exportError) {
      message.error(
        getUserErrorMessage(exportError, feedbackText.failed('导出', ENTITY)),
      )
    }
    finally {
      setIsExporting(false)
    }
  }, [filters, message])

  const handleFinish = useCallback(
    async (values: WorkshopMiscMaterialsDataFormValues) => {
      if (!guard())
        return
      try {
        if (formMode === 'edit' && editingRecord) {
          await updateMutation.mutateAsync({ id: editingRecord.id, values })
          message.success(feedbackText.updated(ENTITY))
        }
        else {
          await createMutation.mutateAsync(values)
          message.success(feedbackText.created(ENTITY))
        }
        closeModal()
      }
      catch (submitError) {
        setFormError(submitError)
      }
    },
    [
      closeModal,
      createMutation,
      editingRecord,
      formMode,
      guard,
      message,
      updateMutation,
    ],
  )

  const handleSearch = useCallback(
    (next?: WorkshopMiscMaterialsSearchFilters) => {
      setSelectedRowKeys([])
      setFilters(next)
    },
    [setFilters],
  )

  const addButton = (
    <AddButton
      handleCreate={handleCreate}
      permissionKey={WORKSHOP_MISC_MATERIALS_DATA_PERMISSION_KEY}
    />
  )

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2">
        {addButton}
        <EditButton
          title="编辑材料资料"
          handleEdit={() => openWithSelected('edit')}
          permissionKey={WORKSHOP_MISC_MATERIALS_DATA_PERMISSION_KEY}
        />
        <Tooltip title={viewerDenied ? viewerOperationTip : '复制新增材料资料'}>
          <Button
            type="text"
            icon={<DocumentDuplicateIcon className="size-4" />}
            disabled={viewerDenied || !canManage}
            onClick={() => openWithSelected('copy')}
          >
            复制新增
          </Button>
        </Tooltip>
        <ExportButton
          handleExport={handleExport}
          loading={isExporting}
          permissionKey={WORKSHOP_MISC_MATERIALS_DATA_PERMISSION_KEY}
          onPreload={preloadWorkshopMiscMaterialsExcel}
        >
          导出 Excel
        </ExportButton>
        <ExcelImportModal<WorkshopMiscMaterialsDataFormValues>
          title="批量导入材料资料"
          tip="请先下载模板，按模板列顺序填写；表头需保持不变；空白行会自动跳过；型号必填；型号、客户型号、规格、类别四项都相同的行视为重复，导入会失败。"
          columns={IMPORT_COLUMNS}
          parseFile={async (file) => {
            const excel = await loadWorkshopMiscMaterialsExcel()
            return excel.parseWorkshopMiscMaterialsDataExcel(file)
          }}
          onDownloadTemplate={async () => {
            const excel = await loadWorkshopMiscMaterialsExcel()
            excel.downloadWorkshopMiscMaterialsDataTemplate()
          }}
          onPreload={preloadWorkshopMiscMaterialsExcel}
          onImport={handleImport}
          isImporting={importMutation.isPending}
          permissionKey={WORKSHOP_MISC_MATERIALS_DATA_PERMISSION_KEY}
        />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除材料资料"
          itemName={ENTITY}
          permissionKey={WORKSHOP_MISC_MATERIALS_DATA_PERMISSION_KEY}
        />
      </div>

      <WorkshopMiscMaterialsSearch
        values={filters}
        onSearch={handleSearch}
        onReset={() => handleSearch(undefined)}
      />

      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-hidden">
          <TableState loading={isLoading && !data} error={error} onRetry={refetch}>
            <WorkshopMiscMaterialsDataTable
              loading={isLoading}
              data={data?.items || []}
              selectedRowKeys={selectedRowKeys}
              onSelect={setSelectedRowKeys}
              page={page}
              pageSize={pageSize}
              scrollY={scrollY}
              rowHeight={rowHeight}
              onOpenDetail={canOpenDetail ? setDetailRecord : undefined}
              emptyAction={addButton}
            />
          </TableState>
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={data?.total || 0} />
        </div>
      </div>

      <Modal
        title={formMode ? MODAL_TITLES[formMode] : ''}
        width={520}
        open={formMode !== null}
        destroyOnHidden
        confirmLoading={isSubmitting}
        okButtonProps={{ disabled: viewerDenied || !canManage }}
        onOk={() => formRef?.submit()}
        onCancel={closeModal}
      >
        <div className="space-y-4">
          <FormErrorAlert error={formError} />
          <WorkshopMiscMaterialsDataForm
            onFinish={handleFinish}
            setFormRef={setFormRef}
            isSubmitting={isSubmitting}
            initialValues={
              formMode !== 'create' && editingRecord ? editingRecord : undefined
            }
          />
        </div>
      </Modal>

      {detailRecord
        ? (
            <WorkshopMiscMaterialsDataDetailDrawer
              open
              record={detailRecord}
              onClose={() => setDetailRecord(null)}
            />
          )
        : null}
    </div>
  )
}
