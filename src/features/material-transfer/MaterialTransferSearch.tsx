import { useEffect } from 'react'
import { Button, Form, Input, Select, Space } from 'antd'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/16/solid'

import {
  MATERIAL_TRANSFER_AUDIT_OPTIONS,
  MATERIAL_TRANSFER_WORKSHOPS,
} from '@/services/apiMaterialTransfers'

interface MaterialTransferSearchValues {
  projectNo?: string
  employeeId?: string
  targetWorkshop?: string
  recipientName?: string
  isAudited?: boolean
}

interface Props {
  onSearch: (values: MaterialTransferSearchValues) => void
  onReset: () => void
  employees: { id: string; name: string }[]
  initialValues?: MaterialTransferSearchValues
}

export default function MaterialTransferSearch({
  onSearch,
  onReset,
  employees,
  initialValues,
}: Props) {
  const [form] = Form.useForm()

  useEffect(() => {
    form.setFieldsValue(initialValues)
  }, [form, initialValues])

  function handleFinish(values: MaterialTransferSearchValues) {
    onSearch({
      projectNo: values.projectNo?.trim() || undefined,
      employeeId: values.employeeId || undefined,
      targetWorkshop: values.targetWorkshop || undefined,
      recipientName: values.recipientName?.trim() || undefined,
      isAudited:
        typeof values.isAudited === 'boolean' ? values.isAudited : undefined,
    })
  }

  function handleReset() {
    form.resetFields()
    onReset()
  }

  return (
    <Form
      form={form}
      onFinish={handleFinish}
      layout="inline"
      className="flex flex-wrap items-center gap-2"
    >
      <Form.Item name="projectNo" className="mb-0">
        <Input placeholder="项目号" allowClear style={{ width: 180 }} />
      </Form.Item>

      <Form.Item name="employeeId" className="mb-0">
        <Select
          placeholder="操作人"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 180 }}
          options={employees.map((employee) => ({
            label: employee.name,
            value: employee.id,
          }))}
        />
      </Form.Item>

      <Form.Item name="targetWorkshop" className="mb-0">
        <Select
          placeholder="接收车间"
          allowClear
          style={{ width: 180 }}
          options={MATERIAL_TRANSFER_WORKSHOPS.map((workshop) => ({
            label: workshop,
            value: workshop,
          }))}
        />
      </Form.Item>

      <Form.Item name="recipientName" className="mb-0">
        <Input placeholder="接收人" allowClear style={{ width: 160 }} />
      </Form.Item>

      <Form.Item name="isAudited" className="mb-0">
        <Select
          placeholder="审核状态"
          allowClear
          style={{ width: 140 }}
          options={[...MATERIAL_TRANSFER_AUDIT_OPTIONS]}
        />
      </Form.Item>

      <Form.Item className="mb-0">
        <Space>
          <Button
            type="primary"
            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
            htmlType="submit"
          >
            搜索
          </Button>
          <Button
            icon={<XMarkIcon className="h-4 w-4" />}
            onClick={handleReset}
          >
            重置
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
