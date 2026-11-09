import type { ReactNode } from 'react'
import type { JintanItemType } from '@/services/jintanItemType'
import type {
  JintanSearchField,
  JintanSearchFilters,
} from '@/services/jintanSearchFields'
import { Button, Form, Input, Space } from 'antd'
import { useEffect } from 'react'
import JintanItemTypeFilterItem from './JintanItemTypeFilterItem'

export interface JintanFieldSearchValues extends JintanSearchFilters {
  itemType?: JintanItemType
}

export interface JintanFieldSearchProps<T extends JintanFieldSearchValues> {
  fields: readonly JintanSearchField[]
  onSearch: (values: T) => void
  onReset: () => void
  /** 当前生效的筛选（通常来自 URL），变化时回填到表单 */
  values?: T
  /** 追加在类型筛选之后的额外筛选项（需自带 Form.Item name） */
  children?: ReactNode
}

/** 金檀木业列表页通用筛选栏：每个字段一个输入框，条件之间为 AND */
export default function JintanFieldSearch<T extends JintanFieldSearchValues>({
  fields,
  onSearch,
  onReset,
  values,
  children,
}: JintanFieldSearchProps<T>) {
  const [form] = Form.useForm<T>()

  useEffect(() => {
    const next: Record<string, unknown> = { ...values }
    for (const field of fields)
      next[field.key] = values?.[field.key]
    next.itemType = values?.itemType
    form.setFieldsValue(next as Parameters<typeof form.setFieldsValue>[0])
  }, [fields, form, values])

  const handleFinish = (formValues: T) => {
    const next: Record<string, unknown> = Object.fromEntries(
      Object.entries(formValues),
    )
    for (const field of fields)
      next[field.key] = formValues[field.key]?.trim() || undefined
    onSearch(next as T)
  }

  const handleReset = () => {
    form.resetFields()
    onReset()
  }

  return (
    <Form
      form={form}
      onFinish={handleFinish}
      className="flex flex-1 flex-wrap items-center gap-3"
    >
      {fields.map(field => (
        <Form.Item
          key={field.key}
          name={field.key}
          className="mb-0"
          style={{ width: 150 }}
        >
          <Input
            placeholder={field.label}
            aria-label={field.label}
            allowClear
            onPressEnter={() => form.submit()}
            className="rounded-lg"
          />
        </Form.Item>
      ))}
      <JintanItemTypeFilterItem />
      {children}
      <Form.Item className="mb-0">
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            className="rounded-lg font-medium shadow-sm"
          >
            搜索
          </Button>
          <Button onClick={handleReset} className="rounded-lg">
            重置
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
