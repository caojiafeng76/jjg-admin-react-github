import type { FormInstance } from 'antd'
import type { SchedulingFormValues } from './productionSchedulingUtils'
import type { ProductionSchedulingOrder } from '@/services/apiProductionScheduling'

import { TableCellsIcon } from '@heroicons/react/16/solid'
import {
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  theme,
} from 'antd'
import {
  getProductSpec,
  PROGRESS_STATUS_OPTIONS,

} from './productionSchedulingUtils'

export interface ProductionSchedulingEditModalProps {
  open: boolean
  form: FormInstance<SchedulingFormValues>
  editingOrder: ProductionSchedulingOrder | null
  confirmLoading: boolean
  employees: { id: string, name: string }[]
  machineSelectOptions: { value: string, label: string }[]
  onCancel: () => void
  onOk: () => void
}

export default function ProductionSchedulingEditModal({
  open,
  form,
  editingOrder,
  confirmLoading,
  employees,
  machineSelectOptions,
  onCancel,
  onOk,
}: ProductionSchedulingEditModalProps) {
  const { token } = theme.useToken()

  return (
    <Modal
      title={(
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-400" />
          <span className="font-semibold">
            {editingOrder?.project_no || '编辑订单排产'}
          </span>
        </div>
      )}
      open={open}
      width={860}
      okText="保存"
      cancelText="取消"
      confirmLoading={confirmLoading}
      destroyOnHidden
      classNames={{
        container: 'rounded-xl',
        mask: 'backdrop-blur-sm',
      }}
      styles={{
        header: {
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          paddingBottom: 12,
          marginBottom: 16,
          background: `linear-gradient(to bottom, ${token.colorFillQuaternary}, ${token.colorBgElevated})`,
        },
        body: {
          padding: '0 4px 4px',
        },
      }}
      onCancel={onCancel}
      onOk={onOk}
    >
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-100/50 bg-gradient-to-r from-blue-50/50 to-white px-4 py-2.5 shadow-sm dark:border-blue-900/50 dark:from-blue-950/40 dark:to-slate-800">
        <TableCellsIcon className="size-4 text-blue-500 dark:text-blue-400" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {getProductSpec(editingOrder)}
        </span>
      </div>
      <Form<SchedulingFormValues> form={form} layout="vertical">
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-3">
          <Form.Item
            name="planned_start_date"
            label={(
              <span className="!text-xs !font-medium !text-slate-500 dark:!text-slate-400">
                计划开工时间
              </span>
            )}
          >
            <DatePicker className="!w-full" />
          </Form.Item>
          <Form.Item
            name="planned_finish_date"
            label={(
              <span className="!text-xs !font-medium !text-slate-500 dark:!text-slate-400">
                计划完工时间
              </span>
            )}
          >
            <DatePicker className="!w-full" />
          </Form.Item>
          <Form.Item
            name="product_delivery_date"
            label={(
              <span className="!text-xs !font-medium !text-slate-500 dark:!text-slate-400">
                交付日期
              </span>
            )}
          >
            <DatePicker className="!w-full" />
          </Form.Item>
          <Form.Item
            name="tooling_status"
            label={(
              <span className="!text-xs !font-medium !text-slate-500 dark:!text-slate-400">
                分配设备(ERP编号)
              </span>
            )}
            className="md:col-span-2"
          >
            <Select
              allowClear
              showSearch={{
                filterOption: (input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase()),
              }}
              placeholder="选择机器编号"
              options={machineSelectOptions}
            />
          </Form.Item>
          <Form.Item
            name="responsible_person_ids"
            label={(
              <span className="!text-xs !font-medium !text-slate-500 dark:!text-slate-400">
                负责班组/人员
              </span>
            )}
          >
            <Select
              mode="multiple"
              allowClear
              showSearch={{ optionFilterProp: 'label' }}
              placeholder="选择负责该订单的员工"
              options={employees.map(e => ({
                label: e.name,
                value: e.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="progress_status"
            label={(
              <span className="!text-xs !font-medium !text-slate-500 dark:!text-slate-400">
                当前进度
              </span>
            )}
            extra={(
              <span className="!text-xs text-slate-400 dark:!text-slate-500">
                有转移记录时按转移数量自动计算；选择"延期"可覆盖自动进度。
              </span>
            )}
          >
            <Select allowClear options={PROGRESS_STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item
            label={(
              <span className="!text-xs !font-medium !text-slate-500 dark:!text-slate-400">
                进度百分比
              </span>
            )}
          >
            <Space.Compact block>
              <Form.Item name="progress_percent" noStyle>
                <InputNumber
                  disabled={Number(editingOrder?.transfer_rate || 0) > 0}
                  min={0}
                  max={100}
                  className="!w-full"
                />
              </Form.Item>
              <Space.Addon>%</Space.Addon>
            </Space.Compact>
          </Form.Item>
          <Form.Item
            name="process_requirement"
            label={(
              <span className="!text-xs !font-medium !text-slate-500 dark:!text-slate-400">
                合格标准
              </span>
            )}
            className="md:col-span-3"
          >
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item
            name="scheduling_remark"
            label={(
              <span className="!text-xs !font-medium !text-slate-500 dark:!text-slate-400">
                备注
              </span>
            )}
            className="md:col-span-3"
          >
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}
