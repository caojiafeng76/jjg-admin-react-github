import { useEffect, useMemo } from 'react'
import { Card, Form, FormInstance, Input, InputNumber, Typography } from 'antd'

import type {
  JobBaseSetting,
  JobBaseSettingFormValues,
} from '@/services/apiJobBaseSettings'

interface Props {
  onFinish: (values: JobBaseSettingFormValues) => void
  setFormRef: (form: FormInstance<JobBaseSettingFormValues>) => void
  isCreating: boolean
  initialValues?: JobBaseSetting | JobBaseSettingFormValues
}

const DEFAULT_VALUES: JobBaseSettingFormValues = {
  job_name: '',
  standard_income: 0,
  daily_work_hours: 11,
  working_days: 28,
}

function formatAmount(value: number, digits = 2) {
  return value.toFixed(digits)
}

export default function JobBaseSettingForm({
  onFinish,
  setFormRef,
  isCreating,
  initialValues,
}: Props) {
  const [form] = Form.useForm<JobBaseSettingFormValues>()
  const watchedValues = Form.useWatch([], form)

  const preview = useMemo(() => {
    const standardIncome = Number(watchedValues?.standard_income || 0)
    const dailyWorkHours = Number(watchedValues?.daily_work_hours || 0)
    const workingDays = Number(watchedValues?.working_days || 0)
    const monthlyStandardHours = dailyWorkHours * workingDays
    const hourlyFee =
      monthlyStandardHours > 0 ? standardIncome / monthlyStandardHours : 0

    return {
      monthlyStandardHours,
      hourlyFee,
    }
  }, [watchedValues])

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        job_name: initialValues.job_name,
        standard_income: Number(initialValues.standard_income || 0),
        daily_work_hours: Number(initialValues.daily_work_hours || 0),
        working_days: Number(initialValues.working_days || 0),
      })
      return
    }

    form.resetFields()
    form.setFieldsValue(DEFAULT_VALUES)
  }, [form, initialValues])

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isCreating}
      validateTrigger={['onChange', 'onBlur']}
    >
      <Form.Item
        name="job_name"
        label="工种"
        hasFeedback
        validateFirst
        rules={[
          { required: true, whitespace: true, message: '请输入工种' },
          { max: 50, message: '工种不能超过 50 个字符' },
        ]}
      >
        <Input
          placeholder="例如：切割、CNC、冲床"
          maxLength={50}
          allowClear
        />
      </Form.Item>

      <Form.Item
        name="standard_income"
        label="标准收入（元）"
        hasFeedback
        validateFirst
        rules={[
          { required: true, message: '请输入标准收入' },
          {
            validator: (_, v) =>
              v == null || Number(v) >= 0
                ? Promise.resolve()
                : Promise.reject(new Error('标准收入不能为负数')),
          },
          {
            validator: (_, v) =>
              v == null || Number(v) <= 9999999
                ? Promise.resolve()
                : Promise.reject(new Error('标准收入超出合理范围')),
          },
        ]}
      >
        <InputNumber
          min={0}
          max={9999999}
          step={100}
          precision={2}
          style={{ width: '100%' }}
          placeholder="请输入标准收入"
          stringMode={false}
        />
      </Form.Item>

      <Form.Item
        name="daily_work_hours"
        label="每日工作时间（小时）"
        hasFeedback
        validateFirst
        rules={[
          { required: true, message: '请输入每日工作时间' },
          {
            validator: (_, v) => {
              if (v == null) return Promise.resolve()
              const n = Number(v)
              if (n < 0.5) return Promise.reject(new Error('每日工时不能小于 0.5 小时'))
              if (n > 24) return Promise.reject(new Error('每日工时不能超过 24 小时'))
              return Promise.resolve()
            },
          },
        ]}
      >
        <InputNumber
          min={0.5}
          max={24}
          step={0.5}
          precision={2}
          style={{ width: '100%' }}
          placeholder="请输入每日工作时间"
        />
      </Form.Item>

      <Form.Item
        name="working_days"
        label="工作天数"
        hasFeedback
        validateFirst
        rules={[
          { required: true, message: '请输入工作天数' },
          {
            validator: (_, v) => {
              if (v == null) return Promise.resolve()
              const n = Number(v)
              if (!Number.isInteger(n))
                return Promise.reject(new Error('工作天数需为整数'))
              if (n < 1) return Promise.reject(new Error('工作天数不能小于 1'))
              if (n > 31) return Promise.reject(new Error('工作天数不能超过 31'))
              return Promise.resolve()
            },
          },
        ]}
      >
        <InputNumber
          min={1}
          max={31}
          step={1}
          precision={0}
          style={{ width: '100%' }}
          placeholder="请输入工作天数"
        />
      </Form.Item>

      <Card size="small" className="border-slate-200 bg-slate-50">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Typography.Text type="secondary">
              月标准工作时间（小时）
            </Typography.Text>
            <div className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
              {formatAmount(preview.monthlyStandardHours)}
            </div>
          </div>
          <div>
            <Typography.Text type="secondary">
              工时费（元/小时）
            </Typography.Text>
            <div className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
              {formatAmount(preview.hourlyFee, 8)}
            </div>
          </div>
        </div>
      </Card>
    </Form>
  )
}
