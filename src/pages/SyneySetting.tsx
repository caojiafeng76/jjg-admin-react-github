import { App, Button, Form, Input, Spin } from 'antd'
import { useEffect } from 'react'

import { useSerialNo } from '@/features/syney/PoList/useSerialNo'
import { useUpdateSerialNo } from '@/features/syney/PoList/useUpdateSerialNo'
import { feedbackText } from '@/utils/feedbackText'

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
      onSuccess: () => message.success(feedbackText.saved('编号')),
    })
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {isLoading
        ? (
            <div className="flex justify-center py-12">
              <Spin />
            </div>
          )
        : (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              className="max-w-xs"
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
                  placeholder="请输入编号"
                />
              </Form.Item>
              <Form.Item className="mb-0!">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isUpdating}
                >
                  保存
                </Button>
              </Form.Item>
            </Form>
          )}
    </div>
  )
}
