import { Form, FormInstance, Input } from 'antd'
import { useEffect } from 'react'
import type { WorkshopProcess } from '@/services/apiWorkshopProcesses'

interface Props {
  onFinish: (values: WorkshopProcess) => void
  setFormRef: (form: FormInstance<WorkshopProcess>) => void
  isCreating: boolean
  isEdit: boolean
  initialValues?: WorkshopProcess
}

export default function ProcessForm({
  onFinish,
  setFormRef,
  isCreating,
  isEdit: _isEdit,
  initialValues,
}: Props) {
  const [form] = Form.useForm<WorkshopProcess>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues)
    } else {
      form.resetFields()
    }
  }, [form, initialValues])

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isCreating}
    >
      <Form.Item
        name="process_name"
        label="工序名称"
        rules={[
          { required: true, message: '请输入工序名称' },
          { max: 100, message: '工序名称不能超过100个字符' },
        ]}
      >
        <Input placeholder="请输入工序名称" disabled={isCreating} />
      </Form.Item>
    </Form>
  )
}

