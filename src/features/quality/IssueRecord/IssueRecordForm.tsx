import { useEffect, useMemo } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
} from 'antd'

import {
  calculateQualityIssueDefectRate,
  QUALITY_ISSUE_AUDIT_STATUSES,
  QUALITY_ISSUE_TYPES,
  type QualityIssueAuditStatus,
  type QualityIssueOrderOption,
  type QualityIssueRecord,
  type QualityIssueRecordFormValues,
  type QualityIssueType,
} from '@/services/apiQualityIssueRecords'
import { AUDIT_STATUS_LABELS } from './IssueRecordSearch'

interface QualityIssueRecordFormFields {
  audit_status?: QualityIssueAuditStatus
  cause?: string
  customer?: string
  customer_model?: string
  defective_handling_result?: string
  defective_quantity?: number
  inspector_name?: string
  issue_type?: QualityIssueType | ''
  length_mm?: number
  operator_employee_id?: string
  operator_name?: string
  order_quantity?: number
  processed_quantity?: number
  product_model?: string
  production_date?: Dayjs
  project_no?: string
  qualified_quantity?: number
  quality_issue?: string
  remark?: string
  reporter_employee_id?: string
  responsibility_handling_result?: string
  shift_leader_name?: string
}

interface ProjectSelectOption {
  customer: string
  customerModel: string
  label: string
  lengthText: string
  orderQuantityText: string
  productModel: string
  searchText: string
  value: string
}

interface Props {
  employees: Array<{ id: string; name: string }>
  initialValues?: QualityIssueRecord | null
  loadingOrders?: boolean
  onCancel: () => void
  onSubmit: (values: QualityIssueRecordFormValues) => Promise<void>
  open: boolean
  orderOptions: QualityIssueOrderOption[]
  submitting?: boolean
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-3.5 w-1 rounded-full bg-blue-500" />
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {title}
      </span>
    </div>
  )
}

function formatOptionText(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return String(value)
}

function toProjectSelectOption(order: QualityIssueOrderOption) {
  const customer = formatOptionText(order.customer)
  const productModel = formatOptionText(order.product_model)
  const lengthText = formatOptionText(order.length_mm)
  const customerModel = formatOptionText(order.customer_model)
  const orderQuantityText = formatOptionText(order.order_quantity)

  return {
    customer,
    customerModel,
    label: order.project_no,
    lengthText,
    orderQuantityText,
    productModel,
    searchText: [
      order.project_no,
      customer,
      productModel,
      lengthText,
      customerModel,
      orderQuantityText,
    ]
      .join(' ')
      .toLowerCase(),
    value: order.project_no,
  } satisfies ProjectSelectOption
}

function buildOrderSnapshot(
  record: QualityIssueRecord,
): QualityIssueOrderOption {
  return {
    customer: record.customer,
    customer_model: record.customer_model,
    length_mm: record.length_mm,
    order_quantity: record.order_quantity,
    product_model: record.product_model,
    project_no: record.project_no,
  }
}

function toFormFields(
  record?: QualityIssueRecord | null,
): QualityIssueRecordFormFields {
  if (!record) {
    return {
      audit_status: 'pending',
      defective_quantity: 0,
      processed_quantity: 0,
      production_date: dayjs(),
      qualified_quantity: 0,
    }
  }

  return {
    audit_status: record.audit_status,
    cause: record.cause,
    customer: record.customer || undefined,
    customer_model: record.customer_model || undefined,
    defective_handling_result: record.defective_handling_result,
    defective_quantity: record.defective_quantity,
    inspector_name: record.inspector_name,
    issue_type: record.issue_type,
    length_mm: record.length_mm ?? undefined,
    operator_employee_id: record.operator_employee_id ?? undefined,
    operator_name: record.operator_name,
    order_quantity: record.order_quantity ?? undefined,
    processed_quantity: record.processed_quantity,
    product_model: record.product_model || undefined,
    production_date: record.production_date
      ? dayjs(record.production_date)
      : undefined,
    project_no: record.project_no,
    qualified_quantity: record.qualified_quantity,
    quality_issue: record.quality_issue,
    remark: record.remark || undefined,
    reporter_employee_id: record.reporter_employee_id,
    responsibility_handling_result: record.responsibility_handling_result,
    shift_leader_name: record.shift_leader_name,
  }
}

function toSubmitValues(
  values: QualityIssueRecordFormFields,
  employeeNameMap: Map<string, string>,
): QualityIssueRecordFormValues {
  return {
    audit_status: values.audit_status || 'pending',
    cause: values.cause,
    customer: values.customer,
    customer_model: values.customer_model,
    defective_handling_result: values.defective_handling_result,
    defective_quantity: Number(values.defective_quantity || 0),
    inspector_name: values.inspector_name,
    issue_type: values.issue_type || '',
    length_mm: values.length_mm ?? null,
    operator_employee_id: values.operator_employee_id || '',
    operator_name: values.operator_employee_id
      ? employeeNameMap.get(values.operator_employee_id)
      : values.operator_name,
    order_quantity: values.order_quantity ?? null,
    processed_quantity: Number(values.processed_quantity || 0),
    product_model: values.product_model,
    production_date: values.production_date?.format('YYYY-MM-DD') || '',
    project_no: values.project_no || '',
    qualified_quantity: Number(values.qualified_quantity || 0),
    quality_issue: values.quality_issue || '',
    remark: values.remark,
    reporter_employee_id: values.reporter_employee_id || '',
    responsibility_handling_result: values.responsibility_handling_result,
    shift_leader_name: values.shift_leader_name,
  }
}

export default function IssueRecordForm({
  employees,
  initialValues,
  loadingOrders,
  onCancel,
  onSubmit,
  open,
  orderOptions,
  submitting,
}: Props) {
  const [form] = Form.useForm<QualityIssueRecordFormFields>()
  const processedQuantity = Form.useWatch('processed_quantity', form)
  const defectiveQuantity = Form.useWatch('defective_quantity', form)
  const employeeNameMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee.name])),
    [employees],
  )

  const mergedOrderOptions = useMemo(() => {
    const map = new Map<string, QualityIssueOrderOption>()

    if (initialValues?.project_no) {
      map.set(initialValues.project_no, buildOrderSnapshot(initialValues))
    }

    orderOptions.forEach((order) => {
      if (!map.has(order.project_no)) {
        map.set(order.project_no, order)
      }
    })

    return Array.from(map.values())
  }, [initialValues, orderOptions])

  const projectOptions = useMemo(
    () => mergedOrderOptions.map(toProjectSelectOption),
    [mergedOrderOptions],
  )

  const orderMap = useMemo(
    () => new Map(mergedOrderOptions.map((order) => [order.project_no, order])),
    [mergedOrderOptions],
  )

  const defectRate = calculateQualityIssueDefectRate({
    defectiveQuantity,
    processedQuantity,
  })

  useEffect(() => {
    if (open) {
      form.setFieldsValue(toFormFields(initialValues))
    } else {
      form.resetFields()
    }
  }, [form, initialValues, open])

  const handleProjectChange = (projectNo: string) => {
    const order = orderMap.get(projectNo)

    form.setFieldsValue({
      customer: order?.customer || undefined,
      customer_model: order?.customer_model || undefined,
      length_mm: order?.length_mm ?? undefined,
      order_quantity: order?.order_quantity ?? undefined,
      product_model: order?.product_model || undefined,
    })
  }

  const handleFinish = async (values: QualityIssueRecordFormFields) => {
    await onSubmit(toSubmitValues(values, employeeNameMap))
  }

  const getPopupContainer = (triggerNode: HTMLElement) =>
    triggerNode.parentElement || document.body

  return (
    <Modal
      title={initialValues ? '编辑质量问题记录' : '新增质量问题记录'}
      open={open}
      onCancel={onCancel}
      width={980}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <SectionTitle title="基本信息" />
        <div className="grid grid-cols-3 gap-3">
          <Form.Item
            name="production_date"
            label="生产日期"
            rules={[{ required: true, message: '请选择生产日期' }]}
          >
            <DatePicker className="w-full" format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            name="reporter_employee_id"
            label="上报人"
            rules={[{ required: true, message: '请选择上报人' }]}
          >
            <Select
              showSearch
              placeholder="请选择上报人"
              optionFilterProp="label"
              getPopupContainer={getPopupContainer}
              options={employees.map((employee) => ({
                label: employee.name,
                value: employee.id,
              }))}
            />
          </Form.Item>

          <Form.Item name="audit_status" label="审核状态">
            <Select
              getPopupContainer={getPopupContainer}
              options={QUALITY_ISSUE_AUDIT_STATUSES.map((status) => ({
                label: AUDIT_STATUS_LABELS[status],
                value: status,
              }))}
            />
          </Form.Item>
        </div>

        <SectionTitle title="订单信息" />
        <div className="grid grid-cols-1 gap-3">
          <Form.Item
            name="project_no"
            label="项目号"
            rules={[{ required: true, message: '请选择项目号' }]}
          >
            <Select
              showSearch
              placeholder="输入或选择项目号"
              loading={loadingOrders}
              getPopupContainer={getPopupContainer}
              options={projectOptions}
              filterOption={(input, option) =>
                String(option?.searchText || '').includes(
                  input.trim().toLowerCase(),
                )
              }
              optionRender={(option) => {
                const data = option.data as ProjectSelectOption

                return (
                  <div className="py-1">
                    <div className="font-medium text-slate-800">
                      {data.label}
                    </div>
                    <div className="mt-1 grid grid-cols-4 gap-3 text-xs text-slate-500">
                      <span className="truncate">客户: {data.customer}</span>
                      <span className="truncate">
                        型号: {data.productModel}
                      </span>
                      <span className="truncate">长度: {data.lengthText}</span>
                      <span className="truncate">
                        数量: {data.orderQuantityText}
                      </span>
                    </div>
                  </div>
                )
              }}
              onChange={handleProjectChange}
            />
          </Form.Item>
        </div>

        <div className="mb-4 grid grid-cols-5 gap-3 rounded-lg bg-slate-50 px-3 pt-3 dark:bg-slate-800/50">
          <Form.Item name="customer" label="客户" className="mb-3">
            <Input disabled placeholder="自动带出" />
          </Form.Item>

          <Form.Item name="product_model" label="型号" className="mb-3">
            <Input disabled placeholder="自动带出" />
          </Form.Item>

          <Form.Item name="length_mm" label="长度(mm)" className="mb-3">
            <InputNumber disabled className="w-full" placeholder="自动带出" />
          </Form.Item>

          <Form.Item name="customer_model" label="客户型号" className="mb-3">
            <Input disabled placeholder="自动带出" />
          </Form.Item>

          <Form.Item name="order_quantity" label="订单数量" className="mb-3">
            <InputNumber disabled className="w-full" placeholder="自动带出" />
          </Form.Item>
        </div>

        <SectionTitle title="数量统计" />
        <div className="grid grid-cols-4 gap-3">
          <Form.Item
            name="processed_quantity"
            label="加工数量"
            rules={[{ required: true, message: '请输入加工数量' }]}
          >
            <InputNumber min={0} precision={0} className="w-full" />
          </Form.Item>

          <Form.Item
            name="qualified_quantity"
            label="合格数量"
            rules={[{ required: true, message: '请输入合格数量' }]}
          >
            <InputNumber min={0} precision={0} className="w-full" />
          </Form.Item>

          <Form.Item
            name="defective_quantity"
            label="不良数量"
            rules={[{ required: true, message: '请输入不良数量' }]}
          >
            <InputNumber min={0} precision={0} className="w-full" />
          </Form.Item>

          <Form.Item label="不良率（%）">
            <InputNumber value={defectRate} disabled className="w-full" />
          </Form.Item>
        </div>

        <SectionTitle title="相关人员" />
        <div className="grid grid-cols-3 gap-3">
          <Form.Item
            name="operator_employee_id"
            label="操作人"
            rules={[{ required: true, message: '请选择操作人' }]}
          >
            <Select
              showSearch
              placeholder="请选择操作人"
              optionFilterProp="label"
              getPopupContainer={getPopupContainer}
              options={employees.map((employee) => ({
                label: employee.name,
                value: employee.id,
              }))}
            />
          </Form.Item>

          <Form.Item name="shift_leader_name" label="当班负责人">
            <Input placeholder="请输入当班负责人" maxLength={50} />
          </Form.Item>

          <Form.Item name="inspector_name" label="检验人">
            <Input placeholder="请输入检验人" maxLength={50} />
          </Form.Item>
        </div>

        <SectionTitle title="问题与处理" />
        <div className="grid grid-cols-3 gap-3">
          <Form.Item name="issue_type" label="问题类型">
            <Select
              allowClear
              placeholder="请选择问题类型"
              getPopupContainer={getPopupContainer}
              options={QUALITY_ISSUE_TYPES.map((type) => ({
                label: type,
                value: type,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="quality_issue"
            label="质量问题"
            className="col-span-2"
            rules={[{ required: true, message: '请输入质量问题' }]}
          >
            <Input.TextArea
              rows={2}
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder="请输入质量问题"
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Form.Item name="cause" label="造成原因">
            <Input.TextArea rows={3} placeholder="请输入造成原因" />
          </Form.Item>

          <Form.Item name="defective_handling_result" label="不良品处理结果">
            <Input.TextArea rows={3} placeholder="请输入处理结果" />
          </Form.Item>

          <Form.Item name="responsibility_handling_result" label="责任处理结果">
            <Input.TextArea rows={3} placeholder="请输入责任处理结果" />
          </Form.Item>
        </div>

        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} placeholder="可填写补充说明" />
        </Form.Item>

        <Form.Item className="mb-0">
          <Space className="flex justify-end">
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              保存
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
