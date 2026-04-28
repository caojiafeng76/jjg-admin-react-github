import { useEffect } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import {
  DatePicker,
  Form,
  type FormInstance,
  Input,
  InputNumber,
  Select,
} from 'antd'

import {
  QUALITY_REWORK_REPAIR_CATEGORIES,
  type QualityReworkRepair,
  type QualityReworkRepairFormValues,
} from '@/services/apiQualityReworkRepair'

export interface QualityReworkRepairFormFields {
  document_no?: string
  rework_category: QualityReworkRepairFormValues['rework_category']
  product_name: string
  specification_model: string
  responsible_unit: string
  quantity: number
  planned_rework_date: Dayjs | null
  actual_rework_date: Dayjs | null
  defect_description: string
  application_reason: string
  workshop_applicant: string
  application_date: Dayjs | null
  production_reviewer: string
  production_review_date: Dayjs | null
  technical_review_opinion: string
  technical_reviewer: string
  technical_review_date: Dayjs | null
  improvement_actions: string
  improvement_owner: string
  improvement_date: Dayjs | null
  verification_result: string
  quality_verifier: string
  verification_date: Dayjs | null
}

interface Props {
  onFinish: (values: QualityReworkRepairFormValues) => void
  setFormRef: (form: FormInstance<QualityReworkRepairFormFields>) => void
  isSubmitting: boolean
  initialValues?: QualityReworkRepair | QualityReworkRepairFormValues
}

const DEFAULT_VALUES: QualityReworkRepairFormFields = {
  document_no: '',
  rework_category: '进货检验不合格',
  product_name: '',
  specification_model: '',
  responsible_unit: '',
  quantity: 1,
  planned_rework_date: null,
  actual_rework_date: null,
  defect_description: '',
  application_reason: '',
  workshop_applicant: '',
  application_date: null,
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

function toDayjs(value: string | null | undefined) {
  return value ? dayjs(value) : null
}

function formatDate(value: Dayjs | null | undefined) {
  return value?.format('YYYY-MM-DD') || ''
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="mt-1 mb-3 border-b border-slate-200 pb-2 text-sm font-medium text-slate-700">
      {children}
    </div>
  )
}

export default function ReworkRepairForm({
  onFinish,
  setFormRef,
  isSubmitting,
  initialValues,
}: Props) {
  const [form] = Form.useForm<QualityReworkRepairFormFields>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        document_no: initialValues.document_no || '',
        rework_category: initialValues.rework_category,
        product_name: initialValues.product_name,
        specification_model: initialValues.specification_model,
        responsible_unit: initialValues.responsible_unit,
        quantity: Number(initialValues.quantity || 1),
        planned_rework_date: toDayjs(initialValues.planned_rework_date),
        actual_rework_date: toDayjs(initialValues.actual_rework_date),
        defect_description: initialValues.defect_description,
        application_reason: initialValues.application_reason,
        workshop_applicant: initialValues.workshop_applicant,
        application_date: toDayjs(initialValues.application_date),
        production_reviewer: initialValues.production_reviewer,
        production_review_date: toDayjs(initialValues.production_review_date),
        technical_review_opinion: initialValues.technical_review_opinion,
        technical_reviewer: initialValues.technical_reviewer,
        technical_review_date: toDayjs(initialValues.technical_review_date),
        improvement_actions: initialValues.improvement_actions,
        improvement_owner: initialValues.improvement_owner,
        improvement_date: toDayjs(initialValues.improvement_date),
        verification_result: initialValues.verification_result,
        quality_verifier: initialValues.quality_verifier,
        verification_date: toDayjs(initialValues.verification_date),
      })
      return
    }

    form.resetFields()
    form.setFieldsValue(DEFAULT_VALUES)
  }, [form, initialValues])

  const handleFinish = (values: QualityReworkRepairFormFields) => {
    onFinish({
      document_no: values.document_no?.trim() || undefined,
      rework_category: values.rework_category,
      product_name: values.product_name.trim(),
      specification_model: values.specification_model.trim(),
      responsible_unit: values.responsible_unit.trim(),
      quantity: Number(values.quantity || 0),
      planned_rework_date: formatDate(values.planned_rework_date),
      actual_rework_date: formatDate(values.actual_rework_date),
      defect_description: values.defect_description.trim(),
      application_reason: values.application_reason.trim(),
      workshop_applicant: values.workshop_applicant.trim(),
      application_date: formatDate(values.application_date),
      production_reviewer: values.production_reviewer.trim(),
      production_review_date: formatDate(values.production_review_date),
      technical_review_opinion: values.technical_review_opinion.trim(),
      technical_reviewer: values.technical_reviewer.trim(),
      technical_review_date: formatDate(values.technical_review_date),
      improvement_actions: values.improvement_actions.trim(),
      improvement_owner: values.improvement_owner.trim(),
      improvement_date: formatDate(values.improvement_date),
      verification_result: values.verification_result.trim(),
      quality_verifier: values.quality_verifier.trim(),
      verification_date: formatDate(values.verification_date),
    })
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      disabled={isSubmitting}
    >
      <SectionTitle>基础信息</SectionTitle>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Item
          name="document_no"
          label="编号"
          rules={[{ max: 50, message: '编号不能超过 50 个字符' }]}
        >
          <Input placeholder="请输入编号" maxLength={50} />
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

      <SectionTitle>申请与审核</SectionTitle>
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

        <Form.Item
          name="production_reviewer"
          label="审核人（生产部）"
          rules={[{ max: 50, message: '审核人不能超过 50 个字符' }]}
        >
          <Input placeholder="请输入生产部审核人" maxLength={50} />
        </Form.Item>

        <Form.Item name="production_review_date" label="生产部审核日期">
          <DatePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>
      </div>

      <SectionTitle>技术审核、改进与验证</SectionTitle>
      <Form.Item name="technical_review_opinion" label="技术部审核意见">
        <Input.TextArea
          placeholder="请输入技术部审核意见"
          autoSize={{ minRows: 3, maxRows: 6 }}
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Item
          name="technical_reviewer"
          label="技术部审核人"
          rules={[{ max: 50, message: '审核人不能超过 50 个字符' }]}
        >
          <Input placeholder="请输入技术部审核人" maxLength={50} />
        </Form.Item>

        <Form.Item name="technical_review_date" label="技术部审核日期">
          <DatePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>
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
          label="验证人（质量部）"
          rules={[{ max: 50, message: '验证人不能超过 50 个字符' }]}
        >
          <Input placeholder="请输入质量部验证人" maxLength={50} />
        </Form.Item>

        <Form.Item name="verification_date" label="验证日期">
          <DatePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>
      </div>
    </Form>
  )
}
