import { useEffect } from 'react'
import { AutoComplete, DatePicker, Form, FormInstance, TimePicker } from 'antd'
import dayjs from 'dayjs'

import { useAllEmployees } from '@/features/workshop/EmployeeList/useEmployees'
import type {
  AttendanceDetail,
  AttendanceDetailFormValues,
} from '@/services/apiAttendanceDetails'

interface Props {
  onFinish: (values: AttendanceDetailFormValues) => void
  setFormRef: (form: FormInstance<AttendanceDetailFormValues>) => void
  isCreating: boolean
  initialValues?: AttendanceDetail
}

export default function AttendanceDetailForm({
  onFinish,
  setFormRef,
  isCreating,
  initialValues,
}: Props) {
  const [form] = Form.useForm<AttendanceDetailFormValues>()
  const { data: employees = [] } = useAllEmployees()

  const nameOptions = employees.map((e) => ({ value: e.name }))

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        name: initialValues.name,
        date: initialValues.date,
        time: initialValues.time,
      })
    } else {
      form.resetFields()
    }
  }, [form, initialValues])

  const handleFinish = (values: AttendanceDetailFormValues) => {
    onFinish({
      name: values.name.trim(),
      date: values.date,
      time: values.time,
    })
  }

  return (
    <Form<AttendanceDetailFormValues>
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      disabled={isCreating}
    >
      <Form.Item
        name="name"
        label="姓名"
        rules={[
          { required: true, message: '请选择或输入姓名' },
          { max: 50, message: '姓名不能超过 50 个字符' },
        ]}
      >
        <AutoComplete
          options={nameOptions}
          placeholder="请选择或输入姓名"
          filterOption={(input, option) =>
            (option?.value ?? '').includes(input)
          }
          allowClear
        />
      </Form.Item>

      <Form.Item
        name="date"
        label="日期"
        rules={[{ required: true, message: '请选择日期' }]}
        getValueProps={(value) => ({
          value: value ? dayjs(value as string) : null,
        })}
        getValueFromEvent={(date: dayjs.Dayjs | null) =>
          date ? date.format('YYYY-MM-DD') : ''
        }
      >
        <DatePicker className="w-full" placeholder="请选择日期" />
      </Form.Item>

      <Form.Item
        name="time"
        label="时间"
        rules={[{ required: true, message: '请选择时间' }]}
        getValueProps={(value) => ({
          value: value ? dayjs(`2000-01-01 ${value as string}`) : null,
        })}
        getValueFromEvent={(time: dayjs.Dayjs | null) =>
          time ? time.format('HH:mm:ss') : ''
        }
      >
        <TimePicker className="w-full" placeholder="请选择时间" format="HH:mm" />
      </Form.Item>
    </Form>
  )
}
