import { Form, Input } from 'antd'
import { useEffect } from 'react'
import { FilterBarActions } from '@/ui/FilterBar'

interface SearchValues {
  jobName?: string
}

interface Props {
  onSearch: (params: { jobName?: string }) => void
  onReset: () => void
  initialValues?: { jobName?: string }
}

export default function JobBaseSettingSearch({
  onSearch,
  onReset,
  initialValues,
}: Props) {
  const [form] = Form.useForm<SearchValues>()

  useEffect(() => {
    form.setFieldsValue({
      jobName: initialValues?.jobName,
    })
  }, [form, initialValues])

  const handleSearch = (values: SearchValues) => {
    onSearch({
      jobName: values.jobName?.trim() || undefined,
    })
  }

  const handleReset = () => {
    form.resetFields()
    onReset()
  }

  return (
    <Form
      form={form}
      onFinish={handleSearch}
      className="flex flex-1 flex-wrap gap-2"
    >
      <Form.Item name="jobName" className="mb-0" style={{ width: 260 }}>
        <Input
          placeholder="请输入工种名称"
          allowClear
          onPressEnter={() => form.submit()}
        />
      </Form.Item>
      <Form.Item className="mb-0">
        <FilterBarActions onReset={handleReset} />
      </Form.Item>
    </Form>
  )
}
