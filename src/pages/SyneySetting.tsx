import { App, Button, Form, Input, Spin } from 'antd'
import { useEffect } from 'react'

import { useSerialNo } from '@/features/syney/PoList/useSerialNo'
import { useUpdateSerialNo } from '@/features/syney/PoList/useUpdateSerialNo'

interface SyneySettingFormValues {
  SyneySerialNo: string
}

export default function SyneySetting() {
  const { message } = App.useApp()
  const { serialNo, isLoading } = useSerialNo()
  const { updateSerialNo, isUpdating } = useUpdateSerialNo()
  const [form] = Form.useForm<SyneySettingFormValues>()

  useEffect(() => {
    if (!isLoading && serialNo?.SyneySerialNo !== undefined) {
      form.setFieldsValue({ SyneySerialNo: String(serialNo.SyneySerialNo) })
    }
  }, [isLoading, serialNo?.SyneySerialNo, form])

  function handleSave(values: SyneySettingFormValues) {
    updateSerialNo(Number(values.SyneySerialNo), {
      onSuccess: () => message.success('保存成功'),
    })
  }

  return (
    <div className="app-card p-6">
      <div className="mb-4 text-base font-semibold text-slate-700 dark:text-slate-200">
        西尼相关设置
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spin />
        </div>
      ) : (
        <Form
          form={form}
          layout="inline"
          onFinish={handleSave}
          className="flex flex-wrap items-end gap-4"
        >
          <Form.Item
            label="编号"
            name="SyneySerialNo"
            rules={[
              { required: true, whitespace: true, message: '请输入编号' },
              { pattern: /^\d+$/, message: '编号必须为非负整数' },
            ]}
          >
            <Input
              allowClear
              className="w-48 rounded-lg"
              placeholder="请输入编号"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isUpdating}
              className="rounded-lg"
            >
              保存
            </Button>
          </Form.Item>
        </Form>
      )}
    </div>
  )
}
