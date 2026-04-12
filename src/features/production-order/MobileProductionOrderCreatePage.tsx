import { useState } from 'react'
import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

import { isEmployeeSideRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import {
  checkEmployeeOrderExistsOnDate,
  type ProductionOrderShift,
} from '@/services/apiProductionOrders'
import MobileBottomSelectSheet, {
  type MobileBottomSelectOption,
} from '@/ui/mobile/MobileBottomSelectSheet'
import { useCreateProductionOrder } from './useProductionOrders'

const { Paragraph, Title } = Typography

interface OrderFormValues {
  order_date: dayjs.Dayjs
  shift: ProductionOrderShift
  work_hours: number
  extra_qualified_hours?: number
  remark?: string
}

const SHIFT_OPTIONS: MobileBottomSelectOption[] = [
  { value: '白班', label: '白班' },
  { value: '夜班', label: '夜班' },
]

export default function MobileProductionOrderCreatePage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { role, employeeProfile } = useAuth()
  const isEmployeeView = isEmployeeSideRole(role)
  const createMutation = useCreateProductionOrder()
  const [form] = Form.useForm<OrderFormValues>()
  const [isShiftSheetOpen, setIsShiftSheetOpen] = useState(false)

  const currentShift = Form.useWatch('shift', form)

  if (!isEmployeeView || !employeeProfile?.id) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-3xl text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <Title level={4}>当前账号不可手动创建工单</Title>
          <Paragraph type="secondary">
            请使用员工端账号进入后再尝试新增工单。
          </Paragraph>
          <Button type="primary" onClick={() => navigate('/production-order')}>
            返回我的工单
          </Button>
        </Card>
      </div>
    )
  }

  const employeeId = employeeProfile.id

  const handleSubmit = async (values: OrderFormValues) => {
    try {
      const orderDate = values.order_date.format('YYYY-MM-DD')
      const exists = await checkEmployeeOrderExistsOnDate(employeeId, orderDate)

      if (exists) {
        message.error('该日期已存在工单，一天只能创建一张工单')
        return
      }

      const created = await createMutation.mutateAsync({
        employee_id: employeeId,
        order_date: orderDate,
        shift: values.shift,
        work_hours: values.work_hours,
        extra_qualified_hours: values.extra_qualified_hours ?? 0,
        remark: values.remark?.trim() || null,
      })

      message.success('工单创建成功，请继续维护工序明细')
      navigate(`/production-order/${created.id}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '工单创建失败')
    }
  }

  return (
    <>
      <div className="h-full overflow-y-auto px-4 pt-4 pb-52">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <div className="text-[11px] font-semibold tracking-[0.28em] text-slate-400 uppercase">
              Manual Create
            </div>
            <Title level={3} style={{ marginTop: 12, marginBottom: 8 }}>
              手动新建工单
            </Title>
            <Paragraph className="mb-0 text-slate-500">
              先创建工单主信息，保存后再进入详情页维护工序明细。同一日期只能创建一张工单。
            </Paragraph>
          </section>

          <Card className="rounded-4xl border-slate-200 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                order_date: dayjs(),
                shift: '白班',
                work_hours: 0,
                extra_qualified_hours: 0,
              }}
              onFinish={handleSubmit}
            >
              <Form.Item
                name="order_date"
                label="日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker className="w-full" format="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item label="操作人">
                <Input value={employeeProfile.name || '-'} disabled />
              </Form.Item>

              <Form.Item
                name="shift"
                label="班别"
                rules={[{ required: true, message: '请选择班别' }]}
              >
                <button
                  type="button"
                  onClick={() => setIsShiftSheetOpen(true)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-900"
                >
                  {currentShift || '请选择班别'}
                </button>
              </Form.Item>

              <Form.Item
                name="work_hours"
                label="出勤工时(小时)"
                rules={[{ required: true, message: '请输入出勤工时' }]}
              >
                <InputNumber min={0} step={0.5} className="w-full" />
              </Form.Item>

              <Form.Item name="extra_qualified_hours" label="零工工时(小时)">
                <InputNumber
                  min={0}
                  step={0.5}
                  precision={2}
                  className="w-full"
                />
              </Form.Item>

              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder="请输入备注" />
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>

      <div
        className="fixed inset-x-0 z-40 border-t border-white/70 bg-white/92 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-xl"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 82px)' }}
      >
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3">
          <Button
            className="h-11 rounded-2xl"
            onClick={() => navigate('/production-order')}
          >
            返回列表
          </Button>
          <Button
            type="primary"
            className="h-11 rounded-2xl"
            loading={createMutation.isPending}
            onClick={() => form.submit()}
          >
            创建工单
          </Button>
        </div>
      </div>

      <MobileBottomSelectSheet
        open={isShiftSheetOpen}
        title="选择班别"
        options={SHIFT_OPTIONS}
        value={currentShift}
        onClose={() => setIsShiftSheetOpen(false)}
        onSelect={(value) => {
          form.setFieldValue('shift', value)
        }}
      />
    </>
  )
}
