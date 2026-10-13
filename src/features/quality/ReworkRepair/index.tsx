import { type Key, useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { App, Form, Tabs } from 'antd'
import { useSearchParams } from 'react-router-dom'

import { buildProjectNoSelectOptions } from '@/features/production-order/projectNoSelect'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import type {
  QualityReworkRepairOrderOption,
  QualityReworkRepairSearchParams,
} from '@/services/apiQualityReworkRepair'
import AppPagination from '@/ui/AppPagination'
import ReworkRepairFormModal from './ReworkRepairFormModal'
import ReworkRepairSearch from './ReworkRepairSearch'
import ReworkRepairTable from './ReworkRepairTable'
import ReworkRepairToolbar from './ReworkRepairToolbar'
import {
  buildPayload,
  buildSpecificationModel,
  DEFAULT_FORM_VALUES,
  DEFAULT_WORKFLOW_STATUS,
  formatOrderText,
  parseCategory,
  parseWorkflowStatus,
  toFormValues,
  WORKFLOW_STAGE_BY_KEY,
  WORKFLOW_STAGE_BY_STATUS,
  WORKFLOW_STAGES,
  type QualityReworkRepairFormFields,
  type WorkflowStageKey,
} from './reworkRepairFormUtils'
import {
  useCreateQualityReworkRepair,
  useDeleteQualityReworkRepair,
  useNextQualityReworkRepairDocumentNo,
  useQualityReworkRepairList,
  useQualityReworkRepairOrderOptions,
  useUpdateQualityReworkRepair,
} from './useQualityReworkRepair'

export default function QualityReworkRepairPage() {
  const { message } = App.useApp()
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const [form] = Form.useForm<QualityReworkRepairFormFields>()

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const activeWorkflowStatus =
    parseWorkflowStatus(searchParamsURL.get('workflowStatus')) ||
    DEFAULT_WORKFLOW_STATUS
  const activeStage = WORKFLOW_STAGE_BY_STATUS[activeWorkflowStatus]

  const searchParams = useMemo<QualityReworkRepairSearchParams>(
    () => ({
      keyword: searchParamsURL.get('keyword') || undefined,
      reworkCategory: parseCategory(searchParamsURL.get('reworkCategory')),
    }),
    [searchParamsURL],
  )
  const listSearchParams = useMemo<QualityReworkRepairSearchParams>(
    () => ({
      ...searchParams,
      workflowStatus: activeWorkflowStatus,
    }),
    [activeWorkflowStatus, searchParams],
  )

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [processingStageKey, setProcessingStageKey] =
    useState<WorkflowStageKey>('workshop')
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

  const { data, isLoading } = useQualityReworkRepairList({
    page,
    pageSize,
    searchParams: listSearchParams,
  })

  const { data: orderOptions = [], isLoading: isLoadingOrderOptions } =
    useQualityReworkRepairOrderOptions()
  const { data: nextDocumentNo, isFetching: isFetchingDocumentNo } =
    useNextQualityReworkRepairDocumentNo(isModalOpen && !isEdit)

  const createMutation = useCreateQualityReworkRepair()
  const updateMutation = useUpdateQualityReworkRepair()
  const deleteMutation = useDeleteQualityReworkRepair()

  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({
      targetRowCount: 10,
    })

  const processingStage = WORKFLOW_STAGE_BY_KEY[processingStageKey]
  const projectNoOptions = useMemo(
    () => buildProjectNoSelectOptions(orderOptions),
    [orderOptions],
  )
  const orderInfoMap = useMemo(() => {
    const map = new Map<string, QualityReworkRepairOrderOption>()

    orderOptions.forEach((item) => {
      map.set(item.project_no, item)
    })

    return map
  }, [orderOptions])
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setProcessingStageKey('workshop')
    setSelectedRowKeys([])
    form.resetFields()
  }, [form])

  const handleCreate = useCallback(() => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    setIsEdit(false)
    setProcessingStageKey('workshop')
    setSelectedRowKeys([])
    form.resetFields()
    form.setFieldsValue(DEFAULT_FORM_VALUES)
    setIsModalOpen(true)
  }, [form, message, viewerDenied, viewerOperationTip])

  const handleProcess = useCallback(() => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条返工返修记录进行处理')
      return
    }

    const record = data?.items.find((item) => item.id === selectedRowKeys[0])
    if (!record) {
      message.warning('请选择一条返工返修记录进行处理')
      return
    }

    if (record.workflow_status !== activeWorkflowStatus) {
      message.warning('请选择当前流程页签下的返工返修记录')
      return
    }

    setIsEdit(true)
    setProcessingStageKey(activeStage.key)
    form.resetFields()
    form.setFieldsValue(toFormValues(record))
    setIsModalOpen(true)
  }, [
    activeStage.key,
    activeWorkflowStatus,
    data?.items,
    form,
    message,
    selectedRowKeys,
    viewerDenied,
    viewerOperationTip,
  ])

  const handleDelete = useCallback(async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条返工返修记录')
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedRowKeys as string[])
      message.success('返工返修记录删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除返工返修记录失败，请稍后重试')
      }
    }
  }, [
    deleteMutation,
    message,
    selectedRowKeys,
    viewerDenied,
    viewerOperationTip,
  ])

  const handleFinish = useCallback(async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    const values = form.getFieldsValue(true)
    const workflowStatus = isEdit
      ? processingStage.submitStatus
      : DEFAULT_WORKFLOW_STATUS
    const payload = buildPayload(values, workflowStatus)

    try {
      if (isEdit && selectedRowKeys[0]) {
        await updateMutation.mutateAsync({
          id: selectedRowKeys[0] as string,
          values: payload,
        })
        message.success(`${processingStage.label}处理成功`)
      } else {
        await createMutation.mutateAsync(payload)
        message.success('返工返修记录已保存到车间发起')
      }

      resetFormState()
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('操作失败，请稍后重试')
      }
    }
  }, [
    createMutation,
    form,
    isEdit,
    message,
    processingStage,
    resetFormState,
    selectedRowKeys,
    updateMutation,
    viewerDenied,
    viewerOperationTip,
  ])

  const handleWorkflowTabChange = useCallback(
    (key: string) => {
      const nextStage = WORKFLOW_STAGE_BY_KEY[key as WorkflowStageKey]
      if (!nextStage) {
        return
      }

      const nextSearchParamsURL = new URLSearchParams(searchParamsURL)
      nextSearchParamsURL.set('workflowStatus', nextStage.status)
      nextSearchParamsURL.set('page', '1')
      setSelectedRowKeys([])
      setSearchParamsURL(nextSearchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleSearch = useCallback(
    (params: QualityReworkRepairSearchParams) => {
      const nextSearchParamsURL = new URLSearchParams(searchParamsURL)
      nextSearchParamsURL.set('workflowStatus', activeWorkflowStatus)
      nextSearchParamsURL.set('page', '1')

      if (params.keyword) {
        nextSearchParamsURL.set('keyword', params.keyword)
      } else {
        nextSearchParamsURL.delete('keyword')
      }

      if (params.reworkCategory) {
        nextSearchParamsURL.set('reworkCategory', params.reworkCategory)
      } else {
        nextSearchParamsURL.delete('reworkCategory')
      }

      setSelectedRowKeys([])
      setSearchParamsURL(nextSearchParamsURL)
    },
    [activeWorkflowStatus, searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    const nextSearchParamsURL = new URLSearchParams(searchParamsURL)
    nextSearchParamsURL.set('workflowStatus', activeWorkflowStatus)
    nextSearchParamsURL.set('page', '1')
    nextSearchParamsURL.delete('keyword')
    nextSearchParamsURL.delete('reworkCategory')
    setSelectedRowKeys([])
    setSearchParamsURL(nextSearchParamsURL)
  }, [activeWorkflowStatus, searchParamsURL, setSearchParamsURL])

  const handleProjectNoChange = useCallback(
    (projectNo: string) => {
      const selectedOrder = orderInfoMap.get(projectNo)
      if (!selectedOrder) {
        return
      }

      form.setFieldsValue({
        product_name: formatOrderText(selectedOrder.product_model),
        specification_model: buildSpecificationModel(selectedOrder),
        planned_rework_date: dayjs(),
        actual_rework_date: dayjs(),
      })
    },
    [form, orderInfoMap],
  )

  useEffect(() => {
    if (!isEdit && isModalOpen && nextDocumentNo) {
      form.setFieldsValue({ document_no: nextDocumentNo })
    }
  }, [form, isEdit, isModalOpen, nextDocumentNo])

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      const nextSearchParamsURL = new URLSearchParams(searchParamsURL)
      nextSearchParamsURL.set('page', Math.max(page - 1, 1).toString())
      setSearchParamsURL(nextSearchParamsURL)
    }
  }, [data, page, searchParamsURL, setSearchParamsURL])

  return (
    <div className="grid h-full grid-rows-[auto_auto_auto_1fr] gap-4">
      <ReworkRepairToolbar
        activeStage={activeStage}
        viewerDenied={viewerDenied}
        isDeleting={deleteMutation.isPending}
        selectedCount={selectedRowKeys.length}
        onCreate={handleCreate}
        onProcess={handleProcess}
        onDelete={handleDelete}
      />

      <Tabs
        activeKey={activeStage.key}
        items={WORKFLOW_STAGES.map((stage) => ({
          key: stage.key,
          label: stage.label,
        }))}
        onChange={handleWorkflowTabChange}
      />

      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-slate-600">搜索：</span>
        <ReworkRepairSearch
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
          <ReworkRepairTable
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

      <ReworkRepairFormModal
        form={form}
        open={isModalOpen}
        isEdit={isEdit}
        isSubmitting={isSubmitting}
        viewerDenied={viewerDenied}
        processingStage={processingStage}
        processingStageKey={processingStageKey}
        isFetchingDocumentNo={isFetchingDocumentNo}
        isLoadingOrderOptions={isLoadingOrderOptions}
        projectNoOptions={projectNoOptions}
        onProjectNoChange={handleProjectNoChange}
        onFinish={handleFinish}
        onCancel={resetFormState}
      />
    </div>
  )
}
