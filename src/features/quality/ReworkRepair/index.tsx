import { type Key, useCallback, useEffect, useMemo, useState } from 'react'
import { PencilSquareIcon, PlusCircleIcon } from '@heroicons/react/16/solid'
import dayjs, { type Dayjs } from 'dayjs'
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Tabs,
} from 'antd'
import { useSearchParams } from 'react-router-dom'

import {
  buildProjectNoSelectOptions,
  filterProjectNoOption,
  renderProjectNoOption,
} from '@/features/production-order/projectNoSelect'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import {
  QUALITY_REWORK_REPAIR_CATEGORIES,
  QUALITY_REWORK_REPAIR_WORKFLOW_STATUSES,
  type QualityReworkRepair,
  type QualityReworkRepairCategory,
  type QualityReworkRepairFormValues,
  type QualityReworkRepairOrderOption,
  type QualityReworkRepairSearchParams,
  type QualityReworkRepairWorkflowStatus,
} from '@/services/apiQualityReworkRepair'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import ReworkRepairSearch from './ReworkRepairSearch'
import ReworkRepairTable from './ReworkRepairTable'
import {
  useCreateQualityReworkRepair,
  useDeleteQualityReworkRepair,
  useNextQualityReworkRepairDocumentNo,
  useQualityReworkRepairList,
  useQualityReworkRepairOrderOptions,
  useUpdateQualityReworkRepair,
} from './useQualityReworkRepair'

type WorkflowStageKey =
  | 'workshop'
  | 'production'
  | 'technical'
  | 'quality'
  | 'completed'

interface WorkflowStageConfig {
  key: WorkflowStageKey
  status: QualityReworkRepairWorkflowStatus
  label: string
  actionLabel: string
  modalTitle: string
  okText: string
  submitStatus: QualityReworkRepairWorkflowStatus
}

interface QualityReworkRepairFormFields {
  document_no?: string
  project_no?: string
  rework_category?: QualityReworkRepairCategory
  product_name?: string
  specification_model?: string
  responsible_unit?: string
  quantity?: number | null
  planned_rework_date?: Dayjs | null
  actual_rework_date?: Dayjs | null
  defect_description?: string
  application_reason?: string
  workshop_applicant?: string
  application_date?: Dayjs | null
  production_review_opinion?: string
  production_reviewer?: string
  production_review_date?: Dayjs | null
  technical_review_opinion?: string
  technical_reviewer?: string
  technical_review_date?: Dayjs | null
  improvement_actions?: string
  improvement_owner?: string
  improvement_date?: Dayjs | null
  verification_result?: string
  quality_verifier?: string
  verification_date?: Dayjs | null
}

const DEFAULT_WORKFLOW_STATUS: QualityReworkRepairWorkflowStatus =
  'workshop_pending'

const WORKFLOW_STAGES: WorkflowStageConfig[] = [
  {
    key: 'workshop',
    status: 'workshop_pending',
    label: '车间发起',
    actionLabel: '提交生产部',
    modalTitle: '车间发起返工返修',
    okText: '提交生产部',
    submitStatus: 'production_pending',
  },
  {
    key: 'production',
    status: 'production_pending',
    label: '生产部确认',
    actionLabel: '生产部确认',
    modalTitle: '生产部确认返工返修',
    okText: '确认并提交技术部',
    submitStatus: 'technical_pending',
  },
  {
    key: 'technical',
    status: 'technical_pending',
    label: '技术部确认',
    actionLabel: '技术部确认',
    modalTitle: '技术部确认返工返修',
    okText: '确认并提交质量部',
    submitStatus: 'quality_pending',
  },
  {
    key: 'quality',
    status: 'quality_pending',
    label: '质量部最终确认',
    actionLabel: '质量部最终确认',
    modalTitle: '质量部最终确认返工返修',
    okText: '最终确认完成',
    submitStatus: 'completed',
  },
  {
    key: 'completed',
    status: 'completed',
    label: '已完成',
    actionLabel: '查看/维护',
    modalTitle: '查看/维护返工返修记录',
    okText: '保存',
    submitStatus: 'completed',
  },
]

const WORKFLOW_STAGE_BY_KEY = WORKFLOW_STAGES.reduce(
  (result, stage) => {
    result[stage.key] = stage
    return result
  },
  {} as Record<WorkflowStageKey, WorkflowStageConfig>,
)

const WORKFLOW_STAGE_BY_STATUS = WORKFLOW_STAGES.reduce(
  (result, stage) => {
    result[stage.status] = stage
    return result
  },
  {} as Record<QualityReworkRepairWorkflowStatus, WorkflowStageConfig>,
)

const DEFAULT_FORM_VALUES: QualityReworkRepairFormFields = {
  document_no: '',
  project_no: '',
  rework_category: '进货检验不合格',
  product_name: '',
  specification_model: '',
  responsible_unit: '',
  quantity: null,
  planned_rework_date: dayjs(),
  actual_rework_date: dayjs(),
  defect_description: '',
  application_reason: '',
  workshop_applicant: '',
  application_date: null,
  production_review_opinion: '',
  production_reviewer: '',
  production_review_date: null,
  technical_review_opinion: '',
  technical_reviewer: '',
  technical_review_date: null,
  improvement_actions: '',
  improvement_owner: '',
  improvement_date: null,
  verification_result: '',
  quality_verifier: '',
  verification_date: null,
}

function parseCategory(
  value: string | null,
): QualityReworkRepairCategory | undefined {
  if (
    QUALITY_REWORK_REPAIR_CATEGORIES.includes(
      value as QualityReworkRepairCategory,
    )
  ) {
    return value as QualityReworkRepairCategory
  }

  return undefined
}

function parseWorkflowStatus(
  value: string | null,
): QualityReworkRepairWorkflowStatus | undefined {
  if (
    QUALITY_REWORK_REPAIR_WORKFLOW_STATUSES.includes(
      value as QualityReworkRepairWorkflowStatus,
    )
  ) {
    return value as QualityReworkRepairWorkflowStatus
  }

  return undefined
}

function formatOrderText(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  return String(value)
}

function buildSpecificationModel(order: QualityReworkRepairOrderOption) {
  const parts = [
    formatOrderText(order.customer_model),
    order.length_mm ? `${order.length_mm}mm` : '',
  ].filter(Boolean)

  return parts.join(' / ') || formatOrderText(order.product_model)
}

function toDayjs(value: string | null | undefined) {
  return value ? dayjs(value) : null
}

function formatDate(value: Dayjs | null | undefined) {
  return value?.format('YYYY-MM-DD') || ''
}

function toFormValues(record: QualityReworkRepair) {
  return {
    ...DEFAULT_FORM_VALUES,
    document_no: record.document_no || '',
    project_no: record.project_no || '',
    rework_category: record.rework_category,
    product_name: record.product_name || '',
    specification_model: record.specification_model || '',
    responsible_unit: record.responsible_unit || '',
    quantity: Number(record.quantity),
    planned_rework_date: toDayjs(record.planned_rework_date),
    actual_rework_date: toDayjs(record.actual_rework_date),
    defect_description: record.defect_description || '',
    application_reason: record.application_reason || '',
    workshop_applicant: record.workshop_applicant || '',
    application_date: toDayjs(record.application_date),
    production_review_opinion: record.production_review_opinion || '',
    production_reviewer: record.production_reviewer || '',
    production_review_date: toDayjs(record.production_review_date),
    technical_review_opinion: record.technical_review_opinion || '',
    technical_reviewer: record.technical_reviewer || '',
    technical_review_date: toDayjs(record.technical_review_date),
    improvement_actions: record.improvement_actions || '',
    improvement_owner: record.improvement_owner || '',
    improvement_date: toDayjs(record.improvement_date),
    verification_result: record.verification_result || '',
    quality_verifier: record.quality_verifier || '',
    verification_date: toDayjs(record.verification_date),
  }
}

function buildPayload(
  values: QualityReworkRepairFormFields,
  workflowStatus: QualityReworkRepairWorkflowStatus,
): QualityReworkRepairFormValues {
  return {
    document_no: values.document_no?.trim() || undefined,
    project_no: values.project_no?.trim() || '',
    rework_category: values.rework_category || '进货检验不合格',
    product_name: values.product_name?.trim() || '',
    specification_model: values.specification_model?.trim() || '',
    responsible_unit: values.responsible_unit?.trim() || '',
    quantity: Number(values.quantity || 0),
    planned_rework_date: formatDate(values.planned_rework_date),
    actual_rework_date: formatDate(values.actual_rework_date),
    defect_description: values.defect_description?.trim() || '',
    application_reason: values.application_reason?.trim() || '',
    workshop_applicant: values.workshop_applicant?.trim() || '',
    application_date: formatDate(values.application_date),
    production_review_opinion: values.production_review_opinion?.trim() || '',
    production_reviewer: values.production_reviewer?.trim() || '',
    production_review_date: formatDate(values.production_review_date),
    technical_review_opinion: values.technical_review_opinion?.trim() || '',
    technical_reviewer: values.technical_reviewer?.trim() || '',
    technical_review_date: formatDate(values.technical_review_date),
    improvement_actions: values.improvement_actions?.trim() || '',
    improvement_owner: values.improvement_owner?.trim() || '',
    improvement_date: formatDate(values.improvement_date),
    verification_result: values.verification_result?.trim() || '',
    quality_verifier: values.quality_verifier?.trim() || '',
    verification_date: formatDate(values.verification_date),
    workflow_status: workflowStatus,
  }
}

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

  const renderWorkshopFields = () => (
    <>
      <div className="mt-1 mb-3 border-b border-slate-200 pb-2 text-sm font-medium text-slate-700">
        基础信息
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Item
          name="document_no"
          label="编号"
          rules={[{ max: 50, message: '编号不能超过 50 个字符' }]}
        >
          <Input
            disabled
            placeholder={isFetchingDocumentNo ? '正在生成编号' : '自动生成编号'}
            maxLength={50}
          />
        </Form.Item>

        <Form.Item
          name="project_no"
          label="项目号"
          rules={[{ required: true, message: '请选择项目号' }]}
        >
          <Select
            showSearch
            placeholder="请选择订单项目号"
            loading={isLoadingOrderOptions}
            options={projectNoOptions}
            filterOption={filterProjectNoOption}
            optionRender={renderProjectNoOption}
            listHeight={320}
            onChange={handleProjectNoChange}
          />
        </Form.Item>

        <Form.Item
          name="rework_category"
          label="返工返修类别"
          rules={[{ required: true, message: '请选择返工返修类别' }]}
        >
          <Select
            placeholder="请选择返工返修类别"
            options={QUALITY_REWORK_REPAIR_CATEGORIES.map((item) => ({
              value: item,
              label: item,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="product_name"
          label="产品名称"
          rules={[
            { required: true, message: '请输入产品名称' },
            { max: 100, message: '产品名称不能超过 100 个字符' },
          ]}
        >
          <Input placeholder="请输入产品名称" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="specification_model"
          label="规格型号"
          rules={[
            { required: true, message: '请输入规格型号' },
            { max: 100, message: '规格型号不能超过 100 个字符' },
          ]}
        >
          <Input placeholder="请输入规格型号" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="responsible_unit"
          label="责任单位"
          rules={[
            { required: true, message: '请输入责任单位' },
            { max: 100, message: '责任单位不能超过 100 个字符' },
          ]}
        >
          <Input placeholder="请输入责任单位" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="返工返修数量"
          rules={[{ required: true, message: '请输入返工返修数量' }]}
        >
          <InputNumber
            min={1}
            step={1}
            precision={0}
            style={{ width: '100%' }}
            placeholder="请输入返工返修数量"
          />
        </Form.Item>

        <Form.Item name="planned_rework_date" label="计划返工时间">
          <DatePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item name="actual_rework_date" label="实际返工时间">
          <DatePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>
      </div>

      <div className="mt-1 mb-3 border-b border-slate-200 pb-2 text-sm font-medium text-slate-700">
        申请信息
      </div>
      <Form.Item
        name="defect_description"
        label="不合格描述"
        rules={[{ required: true, message: '请输入不合格描述' }]}
      >
        <Input.TextArea
          placeholder="请输入不合格描述"
          autoSize={{ minRows: 3, maxRows: 6 }}
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <Form.Item
        name="application_reason"
        label="返工返修申请理由"
        rules={[{ required: true, message: '请输入返工返修申请理由' }]}
      >
        <Input.TextArea
          placeholder="请输入返工返修申请理由"
          autoSize={{ minRows: 3, maxRows: 6 }}
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Item
          name="workshop_applicant"
          label="申请人（车间）"
          rules={[{ max: 50, message: '申请人不能超过 50 个字符' }]}
        >
          <Input placeholder="请输入申请人" maxLength={50} />
        </Form.Item>

        <Form.Item name="application_date" label="申请日期">
          <DatePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>
      </div>
    </>
  )

  const renderProductionFields = () => (
    <>
      <div className="mt-1 mb-3 border-b border-slate-200 pb-2 text-sm font-medium text-slate-700">
        生产部确认
      </div>
      <Form.Item
        name="production_review_opinion"
        label="审核意见"
        rules={[{ required: true, message: '请输入审核意见' }]}
      >
        <Input.TextArea
          placeholder="请输入生产部审核意见"
          autoSize={{ minRows: 3, maxRows: 6 }}
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Item
          name="production_reviewer"
          label="确认人（生产部）"
          rules={[{ max: 50, message: '确认人不能超过 50 个字符' }]}
        >
          <Input placeholder="请输入生产部确认人" maxLength={50} />
        </Form.Item>

        <Form.Item name="production_review_date" label="生产部确认日期">
          <DatePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>
      </div>
    </>
  )

  const renderTechnicalFields = () => (
    <>
      <div className="mt-1 mb-3 border-b border-slate-200 pb-2 text-sm font-medium text-slate-700">
        技术部确认
      </div>
      <Form.Item name="technical_review_opinion" label="技术部确认意见">
        <Input.TextArea
          placeholder="请输入技术部确认意见"
          autoSize={{ minRows: 3, maxRows: 6 }}
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Item
          name="technical_reviewer"
          label="确认人（技术部）"
          rules={[{ max: 50, message: '确认人不能超过 50 个字符' }]}
        >
          <Input placeholder="请输入技术部确认人" maxLength={50} />
        </Form.Item>

        <Form.Item name="technical_review_date" label="技术部确认日期">
          <DatePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>
      </div>

      <div className="mt-1 mb-3 border-b border-slate-200 pb-2 text-sm font-medium text-slate-700">
        改进措施
      </div>
      <Form.Item name="improvement_actions" label="改进措施">
        <Input.TextArea
          placeholder="请输入改进措施"
          autoSize={{ minRows: 3, maxRows: 6 }}
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Item
          name="improvement_owner"
          label="责任人"
          rules={[{ max: 50, message: '责任人不能超过 50 个字符' }]}
        >
          <Input placeholder="请输入改进措施责任人" maxLength={50} />
        </Form.Item>

        <Form.Item name="improvement_date" label="改进措施日期">
          <DatePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>
      </div>
    </>
  )

  const renderQualityFields = () => (
    <>
      <div className="mt-1 mb-3 border-b border-slate-200 pb-2 text-sm font-medium text-slate-700">
        质量部最终确认
      </div>
      <Form.Item name="verification_result" label="返工返修验证结果">
        <Input.TextArea
          placeholder="请输入返工返修验证结果"
          autoSize={{ minRows: 3, maxRows: 6 }}
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Item
          name="quality_verifier"
          label="最终确认人（质量部）"
          rules={[{ max: 50, message: '确认人不能超过 50 个字符' }]}
        >
          <Input placeholder="请输入质量部最终确认人" maxLength={50} />
        </Form.Item>

        <Form.Item name="verification_date" label="最终确认日期">
          <DatePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>
      </div>
    </>
  )

  const renderModalFields = () => {
    if (processingStageKey === 'production') {
      return renderProductionFields()
    }

    if (processingStageKey === 'technical') {
      return renderTechnicalFields()
    }

    if (processingStageKey === 'quality') {
      return renderQualityFields()
    }

    if (processingStageKey === 'completed') {
      return (
        <>
          {renderWorkshopFields()}
          {renderProductionFields()}
          {renderTechnicalFields()}
          {renderQualityFields()}
        </>
      )
    }

    return renderWorkshopFields()
  }

  return (
    <div className="grid h-full grid-rows-[auto_auto_auto_1fr] gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {activeStage.key === 'workshop' ? (
          <Button
            type="text"
            icon={<PlusCircleIcon className="size-4 text-green-500/80!" />}
            onClick={handleCreate}
            disabled={viewerDenied}
          >
            新建返工返修记录
          </Button>
        ) : null}
        <Button
          type="text"
          icon={<PencilSquareIcon className="size-4 text-yellow-500/80!" />}
          onClick={handleProcess}
          disabled={viewerDenied}
        >
          {activeStage.actionLabel}
        </Button>
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除返工返修记录"
          itemName="返工返修记录"
        />
      </div>

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

      <Modal
        title={isEdit ? processingStage.modalTitle : '新建返工返修记录'}
        open={isModalOpen}
        width={980}
        destroyOnHidden
        okText={isEdit ? processingStage.okText : '保存车间发起'}
        cancelText="取消"
        confirmLoading={isSubmitting}
        onOk={() => form.submit()}
        onCancel={resetFormState}
        okButtonProps={{ disabled: viewerDenied }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          disabled={isSubmitting || viewerDenied}
        >
          {renderModalFields()}
        </Form>
      </Modal>
    </div>
  )
}
