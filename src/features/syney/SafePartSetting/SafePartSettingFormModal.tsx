import type {
  SyneySafePartSetting,
  upsertSyneySafePartSetting,
} from '@services/apiSyneySafePartSettings'
import type { FormInstance } from 'antd'
import { Divider, Form, Input, Modal, Select, Switch } from 'antd'
import { DECOMPOSITION_ROLE_OPTIONS } from './constants'

export type SafePartSettingFormValues = Parameters<
  typeof upsertSyneySafePartSetting
>[0]

export interface SafePartSettingFormModalProps {
  open: boolean
  editing: SyneySafePartSetting | null
  form: FormInstance<SafePartSettingFormValues>
  confirmLoading: boolean
  onCancel: () => void
  onFinish: (values: SafePartSettingFormValues) => void
}

export default function SafePartSettingFormModal({
  open,
  editing,
  form,
  confirmLoading,
  onCancel,
  onFinish,
}: SafePartSettingFormModalProps) {
  return (
    <Modal
      title={editing ? '编辑件号配置' : '新增件号配置'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={editing ? '保存修改' : '新增'}
      cancelText="取消"
      confirmLoading={confirmLoading}
      width={640}
      destroyOnHidden
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={onFinish}
        className="pt-2"
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
            options={[
              { label: '梳齿支撑板', value: '梳齿支撑板' },
              { label: '楼层板', value: '楼层板' },
              { label: '横框', value: '横框' },
              { label: '侧框', value: '侧框' },
            ]}
          />
        </Form.Item>
        <Form.Item label="产品型号" name="part_model">
          <Input
            allowClear
            placeholder="如 YD1001XN"
            className="rounded-lg"
          />
        </Form.Item>
        <Form.Item label="编号前缀" name="part_code_prefix">
          <Input allowClear placeholder="如 ZC00" className="rounded-lg" />
        </Form.Item>
        <Form.Item label="英文名称" name="english_name">
          <Input
            allowClear
            placeholder="如 COMB PLATE"
            className="rounded-lg"
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
    </Modal>
  )
}
