import type {
  SyneySafePartSetting,
  upsertSyneySafePartSetting,
} from '@services/apiSyneySafePartSettings'
import { Divider, Form, Input, Modal, Select, Switch } from 'antd'
import { useEffect } from 'react'
import FormErrorAlert from '@/ui/FormErrorAlert'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import {
  DECOMPOSITION_ROLE_OPTIONS,
  ENGLISH_NAME_OPTIONS,
  PART_CODE_PREFIX_OPTIONS,
  PART_MODEL_OPTIONS,
  SAFE_PART_LABEL_PRESETS,
} from './constants'

export type SafePartSettingFormValues = Parameters<
  typeof upsertSyneySafePartSetting
>[0]

export interface SafePartSettingFormModalProps {
  open: boolean
  editing: SyneySafePartSetting | null
  confirmLoading: boolean
  error?: unknown
  onCancel: () => void
  onFinish: (values: SafePartSettingFormValues) => void
}

export default function SafePartSettingFormModal({
  open,
  editing,
  confirmLoading,
  error,
  onCancel,
  onFinish,
}: SafePartSettingFormModalProps) {
  const [form] = Form.useForm<SafePartSettingFormValues>()

  useEffect(() => {
    if (!open) {
      return
    }
    if (editing) {
      form.setFieldsValue({
        part_no: editing.part_no,
        name: editing.name ?? undefined,
        part_model: editing.part_model ?? undefined,
        part_code_prefix: editing.part_code_prefix ?? undefined,
        english_name: editing.english_name ?? undefined,
        need_print_label: editing.need_print_label,
        is_safe_part: editing.is_safe_part,
        decomposition_role: editing.decomposition_role ?? undefined,
        remark: editing.remark ?? '',
        id: editing.id,
      })
      return
    }
    form.resetFields()
    form.setFieldsValue({ need_print_label: true, is_safe_part: true })
  }, [editing, form, open])

  return (
    <Modal
      title={editing ? '编辑件号配置' : '新增件号配置'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={editing ? '保存修改' : '新增'}
      cancelText="取消"
      confirmLoading={confirmLoading}
      width={720}
      destroyOnHidden
    >
      <div className="space-y-4 pt-2">
        <FormErrorAlert
          error={error}
          reason={
            error
              ? getUserErrorMessage(
                  error,
                  feedbackText.failed(editing ? '更新' : '保存', '件号配置'),
                )
              : undefined
          }
        />
        <Form
          layout="vertical"
          form={form}
          disabled={confirmLoading}
          onFinish={onFinish}
        >
          <Divider titlePlacement="left">基本信息</Divider>
          <Form.Item
            label="件号(包含)"
            name="part_no"
            rules={[
              { required: true, whitespace: true, message: '请输入件号' },
            ]}
          >
            <Input
              allowClear
              disabled={Boolean(editing)}
              placeholder="如 XN2808EB"
              className="rounded-lg"
            />
          </Form.Item>
          <Form.Item label="名称" name="name">
            <Select
              allowClear
              getPopupContainer={() => document.body}
              className="rounded-lg"
              onChange={(value?: string) => {
                const preset = value ? SAFE_PART_LABEL_PRESETS[value] : undefined
                if (preset)
                  form.setFieldsValue(preset)
              }}
              options={[
                { label: '梳齿支撑板', value: '梳齿支撑板' },
                { label: '楼层板', value: '楼层板' },
                { label: '横框', value: '横框' },
                { label: '侧框', value: '侧框' },
              ]}
            />
          </Form.Item>
          <Form.Item label="产品型号" name="part_model">
            <Select
              allowClear
              placeholder="请选择产品型号"
              getPopupContainer={() => document.body}
              className="rounded-lg"
              options={PART_MODEL_OPTIONS}
            />
          </Form.Item>
          <Form.Item label="编号前缀" name="part_code_prefix">
            <Select
              allowClear
              placeholder="请选择编号前缀"
              getPopupContainer={() => document.body}
              className="rounded-lg"
              options={PART_CODE_PREFIX_OPTIONS}
            />
          </Form.Item>
          <Form.Item label="英文名称" name="english_name">
            <Select
              allowClear
              placeholder="请选择英文名称"
              getPopupContainer={() => document.body}
              className="rounded-lg"
              options={ENGLISH_NAME_OPTIONS}
            />
          </Form.Item>
          <Divider titlePlacement="left">配置说明</Divider>
          <div className="flex gap-8">
            <Form.Item
              label="需打印标签"
              name="need_print_label"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label="为安全部件"
              name="is_safe_part"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
          <Form.Item label="分解单列" name="decomposition_role">
            <Select
              allowClear
              placeholder="非分解单件号可不选"
              getPopupContainer={() => document.body}
              className="rounded-lg"
              options={DECOMPOSITION_ROLE_OPTIONS}
            />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input allowClear className="rounded-lg" />
          </Form.Item>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
