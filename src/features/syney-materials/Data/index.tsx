import type { FormInstance, TableColumnsType } from 'antd'
import type {
  SyneyMaterialsData,
  SyneyMaterialsDataFormValues,
} from '@/services/apiSyneyMaterialsData'
import type { SyneyMaterialsSearchFilters } from '@/services/syneyMaterialsSearchFields'
import { DocumentDuplicateIcon } from '@heroicons/react/16/solid'
import { App, Button, Modal, Tooltip } from 'antd'
import { useCallback, useEffect, useState } from 'react'

import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import { getSyneyMaterialsDataForExport } from '@/services/apiSyneyMaterialsData'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import ExportButton from '@/ui/ExportButton'
import FormErrorAlert from '@/ui/FormErrorAlert'
import { TableState } from '@/ui/TableState'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { loadSyneyMaterialsExcel, preloadSyneyMaterialsExcel } from '../loadSyneyMaterialsExcel'
import {
  SYNEY_MATERIALS_DATA_PERMISSION_KEY,
  SYNEY_MATERIALS_INVENTORY_PERMISSION_KEY,
  SYNEY_MATERIALS_STOCK_IN_PERMISSION_KEY,
  SYNEY_MATERIALS_STOCK_OUT_PERMISSION_KEY,
} from '../permissions'
import SyneyMaterialsExcelImport from '../SyneyMaterialsExcelImport'
import SyneyMaterialsSearch from '../SyneyMaterialsSearch'
import { useSyneyMaterialsListParams } from '../useSyneyMaterialsListParams'
import SyneyMaterialsDataDetailDrawer from './SyneyMaterialsDataDetailDrawer'
import SyneyMaterialsDataForm from './SyneyMaterialsDataForm'
import SyneyMaterialsDataTable from './SyneyMaterialsDataTable'
import {
  useCreateSyneyMaterialsData,
  useDeleteSyneyMaterialsData,
  useImportSyneyMaterialsData,
  useSyneyMaterialsDataList,
  useUpdateSyneyMaterialsData,
} from './useSyneyMaterialsData'

const ENTITY = '材料资料'

type FormMode = 'create' | 'edit' | 'copy'

const MODAL_TITLES: Record<FormMode, string> = {
  create: '新建材料资料',
  edit: '编辑材料资料',
  copy: '复制新增材料资料',
}

const IMPORT_COLUMNS: TableColumnsType<SyneyMaterialsDataFormValues & { _idx: number }> = [
  { title: '#', dataIndex: '_idx', width: 60, render: (value: number) => value + 1 },
  { title: '品名', dataIndex: 'material_name', width: 200 },
  { title: '规格', dataIndex: 'specification', width: 160 },
  { title: '单位', dataIndex: 'unit', width: 80 },
  { title: '备注', dataIndex: 'remarks' },
]

export default function SyneyMaterialsDataPage() {
  const { message } = App.useApp()
  const canManage = usePermission(SYNEY_MATERIALS_DATA_PERMISSION_KEY)
  const canViewInventory = usePermission(SYNEY_MATERIALS_INVENTORY_PERMISSION_KEY)
  const canStockIn = usePermission(SYNEY_MATERIALS_STOCK_IN_PERMISSION_KEY)
  const canStockOut = usePermission(SYNEY_MATERIALS_STOCK_OUT_PERMISSION_KEY)
  const canOpenDetail = canViewInventory || canStockIn || canStockOut
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const { page, pageSize, filters, setFilters, stepBackIfEmpty }
    = useSyneyMaterialsListParams()

  const [detailRecord, setDetailRecord] = useState<SyneyMaterialsData | null>(null)
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [editingRecord, setEditingRecord] = useState<SyneyMaterialsData | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [formRef, setFormRef]
    = useState<FormInstance<SyneyMaterialsDataFormValues> | null>(null)
  const [formError, setFormError] = useState<unknown>(null)

  const { data, isLoading, error, refetch } = useSyneyMaterialsDataList({
    page,
    pageSize,
    filters,
  })
  const createMutation = useCreateSyneyMaterialsData()
  const updateMutation = useUpdateSyneyMaterialsData()
  const importMutation = useImportSyneyMaterialsData()
  const deleteMutation = useDeleteSyneyMaterialsData()
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
        message.warning(mode === 'edit' ? '请选择一条数据进行编辑' : '请选择一条数据进行复制新增')
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
    async (rows: SyneyMaterialsDataFormValues[]) => {
      if (!guard())
        return
      try {
        await importMutation.mutateAsync(rows)
        message.success(feedbackText.imported(ENTITY, rows.length))
        setSelectedRowKeys([])
      }
      catch (importError) {
        message.error(getUserErrorMessage(importError, feedbackText.failed('导入', ENTITY)))
      }
    },
    [guard, importMutation, message],
  )

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const [rows, { exportSyneyMaterialsDataToExcel }] = await Promise.all([
        getSyneyMaterialsDataForExport(filters),
        loadSyneyMaterialsExcel(),
      ])
      if (rows.length === 0) {
        message.warning('当前没有可导出的材料资料')
        return
      }
      exportSyneyMaterialsDataToExcel(rows)
      message.success(feedbackText.exported(ENTITY, rows.length))
    }
    catch (exportError) {
      message.error(getUserErrorMessage(exportError, feedbackText.failed('导出', ENTITY)))
    }
    finally {
      setIsExporting(false)
    }
  }, [filters, message])

  const handleFinish = useCallback(
    async (values: SyneyMaterialsDataFormValues) => {
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
    [closeModal, createMutation, editingRecord, formMode, guard, message, updateMutation],
  )

  const handleSearch = useCallback(
    (next?: SyneyMaterialsSearchFilters) => {
      setSelectedRowKeys([])
      setFilters(next)
    },
    [setFilters],
  )

  const addButton = (
    <AddButton
      handleCreate={handleCreate}
      permissionKey={SYNEY_MATERIALS_DATA_PERMISSION_KEY}
    />
  )

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2">
        {addButton}
        <EditButton
          title="编辑材料资料"
          handleEdit={() => openWithSelected('edit')}
          permissionKey={SYNEY_MATERIALS_DATA_PERMISSION_KEY}
        />
        <Tooltip title={viewerDenied ? viewerOperationTip : '复制新增材料资料'}>
          <Button
            type="text"
            icon={<DocumentDuplicateIcon className="size-4 text-indigo-500/80!" />}
            disabled={viewerDenied || !canManage}
            onClick={() => openWithSelected('copy')}
          >
            复制新增
          </Button>
        </Tooltip>
        <ExportButton
          handleExport={handleExport}
          loading={isExporting}
          permissionKey={SYNEY_MATERIALS_DATA_PERMISSION_KEY}
          onPreload={preloadSyneyMaterialsExcel}
        >
          导出 Excel
        </ExportButton>
        <SyneyMaterialsExcelImport<SyneyMaterialsDataFormValues>
          title="批量导入材料资料"
          tip="请先下载模板，按模板列顺序填写；表头需保持不变；空白行会自动跳过；品名、单位必填；品名与规格都相同的行视为重复，导入会失败。"
          columns={IMPORT_COLUMNS}
          parse={(excel, file) => excel.parseSyneyMaterialsDataExcel(file)}
          downloadTemplate={excel => excel.downloadSyneyMaterialsDataTemplate()}
          onImport={handleImport}
          isImporting={importMutation.isPending}
          permissionKey={SYNEY_MATERIALS_DATA_PERMISSION_KEY}
        />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除材料资料"
          itemName={ENTITY}
          permissionKey={SYNEY_MATERIALS_DATA_PERMISSION_KEY}
        />
      </div>

      <SyneyMaterialsSearch
        values={filters}
        onSearch={handleSearch}
        onReset={() => handleSearch(undefined)}
      />

      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <TableState loading={isLoading && !data} error={error} onRetry={refetch}>
            <SyneyMaterialsDataTable
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
        open={formMode !== null}
        destroyOnHidden
        confirmLoading={isSubmitting}
        okButtonProps={{ disabled: viewerDenied || !canManage }}
        onOk={() => formRef?.submit()}
        onCancel={closeModal}
      >
        <div className="space-y-4">
          <FormErrorAlert error={formError} />
          <SyneyMaterialsDataForm
            onFinish={handleFinish}
            setFormRef={setFormRef}
            isSubmitting={isSubmitting}
            initialValues={formMode !== 'create' && editingRecord ? editingRecord : undefined}
          />
        </div>
      </Modal>

      {detailRecord
        ? (
            <SyneyMaterialsDataDetailDrawer
              open
              record={detailRecord}
              onClose={() => setDetailRecord(null)}
            />
          )
        : null}
    </div>
  )
}
