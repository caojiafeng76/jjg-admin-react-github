import { memo } from 'react'
import { DatePicker, Form, Input, InputNumber, Select } from 'antd'

import {
  filterProjectNoOption,
  renderProjectNoOption,
  type ProjectNoSelectOption,
} from '@/features/production-order/projectNoSelect'
import { QUALITY_REWORK_REPAIR_CATEGORIES } from '@/services/apiQualityReworkRepair'

export const WorkshopFields = memo(function WorkshopFields({
  isFetchingDocumentNo,
  isLoadingOrderOptions,
  projectNoOptions,
  onProjectNoChange,
}: {
  isFetchingDocumentNo: boolean
  isLoadingOrderOptions: boolean
  projectNoOptions: ProjectNoSelectOption[]
  onProjectNoChange: (projectNo: string) => void
}) {
  return (
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
            onChange={onProjectNoChange}
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
})

export const ProductionFields = memo(function ProductionFields() {
  return (
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
})

export const TechnicalFields = memo(function TechnicalFields() {
  return (
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
})

export const QualityFields = memo(function QualityFields() {
  return (
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
})
