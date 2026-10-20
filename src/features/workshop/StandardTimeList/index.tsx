import type { StandardTime } from '@/services/apiStandardTimes'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/16/solid'
import { Button, Modal, Splitter } from 'antd'
import { useCallback, useEffect, useState } from 'react'

import { isTeamLeaderOnly } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import { useTableHeight } from '@/hooks/useTableHeight'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import ExportButton from '@/ui/ExportButton'
import PermissionButton from '@/ui/PermissionButton'
import PermissionGate from '@/ui/PermissionGate'
import StandardTimeCostDetail from './StandardTimeCostDetail'
import StandardTimeForm from './StandardTimeForm'
import StandardTimeMobileList from './StandardTimeMobileList'
import StandardTimeSearch from './StandardTimeSearch'
import StandardTimeTable from './StandardTimeTable'
import { useStandardTimeBatchActions } from './useStandardTimeBatchActions'
import {
  preloadCostAccountingExcel,
  preloadPrecisionFinishingProcessExcel,
  useStandardTimeExport,
} from './useStandardTimeExport'
import { useStandardTimeFormActions } from './useStandardTimeFormActions'
import { useStandardTimesList } from './useStandardTimes'
import { useStandardTimeSearchParams } from './useStandardTimeSearchParams'

export default function StandardTimeList() {
  const { role, employeeProfile } = useAuth()
  const isTeamLeaderMode = isTeamLeaderOnly(role)
  const currentUploader = employeeProfile?.name || null

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [activeRecord, setActiveRecord] = useState<StandardTime | null>(null)
  const {
    page,
    pageSize,
    searchParams,
    searchParamsURL,
    setSearchParamsURL,
    applySearch,
    resetSearch,
  } = useStandardTimeSearchParams()

  const { data, isLoading } = useStandardTimesList({
    page,
    pageSize,
    searchParams,
  })

  const {
    isModalOpen,
    modalTitle,
    isEdit,
    editingRecord,
    isSubmitting,
    isCreating,
    uploadingImageId,
    formRef,
    setFormRef,
    handleCreate,
    handleEdit,
    handleFinish,
    handleUploadProcessImage,
    resetFormState,
  } = useStandardTimeFormActions({
    items: data?.items,
    isTeamLeaderMode,
    currentUploader,
    selectedRowKeys,
    setSelectedRowKeys,
  })

  const {
    handleDelete,
    handleBatchLastProcess,
    isDeleting,
    isUpdatingLastProcess,
  } = useStandardTimeBatchActions({
    isTeamLeaderMode,
    selectedRowKeys,
    setSelectedRowKeys,
    setActiveRecord,
  })

  const {
    handleExport,
    handleFilterExport,
    handleProcessExport,
    handleProcessFilterExport,
    isExporting,
    isFilterExporting,
    isProcessExporting,
    isProcessFilterExporting,
  } = useStandardTimeExport({
    items: data?.items,
    selectedRowKeys,
    searchParams,
  })

  const { tableContainerRef, paginationRef, scrollY, rowHeight }
    = useTableHeight({
      targetRowCount: 10,
    })

  const handleSearch = useCallback(
    (params: typeof searchParams) => {
      setSelectedRowKeys([])
      applySearch(params)
    },
    [applySearch],
  )

  const handleResetSearch = useCallback(() => {
    setSelectedRowKeys([])
    resetSearch()
  }, [resetSearch])

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      searchParamsURL.set('page', Math.max(page - 1, 1).toString())
      setSearchParamsURL(searchParamsURL)
    }
  }, [data, page, searchParamsURL, setSearchParamsURL])

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Action Bar */}
      {isTeamLeaderMode
        ? (
            <Button
              block
              type="primary"
              className="h-11 rounded-xl font-medium shadow-md transition-all hover:shadow-lg"
              onClick={handleCreate}
            >
              新建理论工时
            </Button>
          )
        : (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/80 bg-white/60 p-3 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800/60">
              <AddButton
                handleCreate={handleCreate}
                permissionKey="feature:standard-time-list.create"
              />
              <EditButton
                title="编辑"
                handleEdit={() => handleEdit()}
                permissionKey="feature:standard-time-list.edit"
              />
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
              <PermissionButton
                type="text"
                icon={<CheckCircleIcon className="size-4 text-emerald-500" />}
                loading={isUpdatingLastProcess}
                permissionKey="feature:standard-time-list.edit"
                noPermissionTip="无编辑权限"
                onClick={() => handleBatchLastProcess(true)}
              >
                设为末道
              </PermissionButton>
              <PermissionButton
                type="text"
                icon={<XCircleIcon className="size-4 text-red-400" />}
                loading={isUpdatingLastProcess}
                permissionKey="feature:standard-time-list.edit"
                noPermissionTip="无编辑权限"
                onClick={() => handleBatchLastProcess(false)}
              >
                取消末道
              </PermissionButton>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
              <ExportButton
                handleExport={handleExport}
                loading={isExporting}
                count={selectedRowKeys.length}
                permissionKey="feature:standard-time-list.export-cost"
                onPreload={preloadCostAccountingExcel}
              >
                导出已选
              </ExportButton>
              <ExportButton
                handleExport={handleFilterExport}
                loading={isFilterExporting}
                permissionKey="feature:standard-time-list.export-cost"
                onPreload={preloadCostAccountingExcel}
              >
                按筛选条件导出
              </ExportButton>
              <ExportButton
                handleExport={handleProcessExport}
                loading={isProcessExporting}
                count={selectedRowKeys.length}
                permissionKey="feature:standard-time-list.export-cost"
                onPreload={preloadPrecisionFinishingProcessExcel}
              >
                导出工艺表（已选）
              </ExportButton>
              <ExportButton
                handleExport={handleProcessFilterExport}
                loading={isProcessFilterExporting}
                permissionKey="feature:standard-time-list.export-cost"
                onPreload={preloadPrecisionFinishingProcessExcel}
              >
                按筛选条件导出工艺表
              </ExportButton>
              <DeleteButton
                onConfirm={handleDelete}
                isDeleting={isDeleting}
                count={selectedRowKeys.length}
                title="删除成本核算"
                itemName="成本核算"
                permissionKey="feature:standard-time-list.delete"
              />
            </div>
          )}

      {/* Search Bar */}
      <div
        className={
          isTeamLeaderMode
            ? 'rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-800'
            : 'flex items-center gap-2'
        }
      >
        {isTeamLeaderMode
          ? null
          : (
              <span className="text-sm font-medium whitespace-nowrap text-slate-500 dark:text-slate-300">
                搜索：
              </span>
            )}
        <StandardTimeSearch
          onSearch={handleSearch}
          onReset={handleResetSearch}
          mobile={isTeamLeaderMode}
          initialValues={searchParams}
        />
      </div>

      {/* Content Area */}
      {isTeamLeaderMode
        ? (
            <div
              ref={tableContainerRef}
              className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
            >
              <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <StandardTimeMobileList
                  loading={isLoading}
                  data={data?.items || []}
                  onEdit={handleEdit}
                />
              </div>
              <div ref={paginationRef} className="flex shrink-0 justify-end">
                <AppPagination
                  total={data?.total || 0}
                  pageSizeOptions={['10', '20', '50', '100', '500', '1000']}
                />
              </div>
            </div>
          )
        : (
            <Splitter orientation="vertical" style={{ flex: 1, minHeight: 0 }}>
              <Splitter.Panel defaultSize="65%" min="30%">
                <div
                  ref={tableContainerRef}
                  className="flex h-full flex-col gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="min-h-0 flex-1 overflow-x-auto">
                    <StandardTimeTable
                      loading={isLoading}
                      data={data?.items || []}
                      selectedRowKeys={selectedRowKeys}
                      onSelect={setSelectedRowKeys}
                      page={page}
                      pageSize={pageSize}
                      scrollY={scrollY}
                      rowHeight={rowHeight}
                      activeRowId={activeRecord?.id ?? null}
                      onRowClick={setActiveRecord}
                      onUploadImage={handleUploadProcessImage}
                      uploadingImageId={uploadingImageId}
                    />
                  </div>
                  <div
                    ref={paginationRef}
                    className="flex shrink-0 justify-end border-t border-slate-100 pt-3 dark:border-slate-700"
                  >
                    <AppPagination
                      total={data?.total || 0}
                      pageSizeOptions={['10', '20', '50', '100', '500', '1000']}
                    />
                  </div>
                </div>
              </Splitter.Panel>
              <Splitter.Panel min="20%">
                <div className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <PermissionGate permissionKey="field:standard-time-list.cost-detail.view">
                    <StandardTimeCostDetail selectedRecord={activeRecord} />
                  </PermissionGate>
                </div>
              </Splitter.Panel>
            </Splitter>
          )}

      <Modal
        title={modalTitle}
        open={isModalOpen}
        confirmLoading={isSubmitting}
        destroyOnHidden
        width={isTeamLeaderMode ? 'calc(100vw - 24px)' : 900}
        style={isTeamLeaderMode ? { top: 16, maxWidth: 520 } : undefined}
        onOk={() => formRef.current?.submit()}
        onCancel={resetFormState}
      >
        <StandardTimeForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isCreating={isCreating}
          isEdit={isEdit}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
          mode={isTeamLeaderMode ? 'team_leader' : 'admin'}
          currentUploader={currentUploader}
        />
      </Modal>
    </div>
  )
}
