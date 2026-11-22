import { Form, Input } from 'antd'
import { useEffect } from 'react'
import { FilterBarActions } from '@/ui/FilterBar'

interface SearchValues {
  keyword?: string
}

interface Props {
  onSearch: (params: { keyword?: string }) => void
  onReset: () => void
  initialValues?: { keyword?: string }
}

export default function EmployeeSearch({
  onSearch,
  onReset,
  initialValues,
}: Props) {
  const [form] = Form.useForm<SearchValues>()

  useEffect(() => {
    form.setFieldsValue({
      keyword: initialValues?.keyword,
    })
  }, [form, initialValues])

  const handleSearch = (values: SearchValues) => {
    onSearch({
      keyword: values.keyword?.trim() || undefined,
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
      <Form.Item name="keyword" className="mb-0" style={{ width: 360 }}>
        <Input
          placeholder="请输入用户名或姓名"
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
