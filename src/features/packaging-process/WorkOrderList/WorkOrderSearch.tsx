import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Button, DatePicker, Form, Input, Select, Space } from 'antd'
import dayjs from 'dayjs'

import {
  mergeEmployeeSelectOptions,
  rememberEmployeeOptions,
  toEmployeeSelectOption,
  type EmployeeSelectOption,
} from './employeeSelectOptions'
import { usePackagingEmployeeOptions } from './useWorkOrders'

const { RangePicker } = DatePicker

export interface WorkOrderSearchValues {
  keyword?: string
  employeeId?: string
  startDate?: string
  endDate?: string
}

interface Props {
  onSearch: (params: WorkOrderSearchValues) => void
  onReset: () => void
  initialValues?: WorkOrderSearchValues
}

interface FormValues {
  keyword?: string
  employeeId?: string
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs] | null
}

export default function WorkOrderSearch({
  onSearch,
  onReset,
  initialValues,
}: Props) {
  const [form] = Form.useForm<FormValues>()
  const selectedEmployeeId = Form.useWatch('employeeId', form)
  const [employeeKeyword, setEmployeeKeyword] = useState('')
  const deferredEmployeeKeyword = useDeferredValue(employeeKeyword)
  const [selectedEmployeeSnapshots, setSelectedEmployeeSnapshots] = useState<
    EmployeeSelectOption[]
  >([])
  const { data: employeeOptions, isFetching: isEmployeeOptionsFetching } =
    usePackagingEmployeeOptions(deferredEmployeeKeyword)

  const employeeSelectOptions = useMemo(
    () =>
      mergeEmployeeSelectOptions(
        employeeOptions?.items ?? [],
        selectedEmployeeSnapshots,
        selectedEmployeeId ? [selectedEmployeeId] : [],
      ),
    [employeeOptions, selectedEmployeeId, selectedEmployeeSnapshots],
  )

  useEffect(() => {
    if (!selectedEmployeeId) return

    const selectedEmployee = employeeOptions?.items.find(
      ({ id }) => id === selectedEmployeeId,
    )
    if (!selectedEmployee) return

    setSelectedEmployeeSnapshots((previous) =>
      rememberEmployeeOptions(previous, [
        toEmployeeSelectOption(selectedEmployee),
      ]),
    )
  }, [employeeOptions, selectedEmployeeId])

  useEffect(() => {
    setEmployeeKeyword('')
    form.setFieldsValue({
      keyword: initialValues?.keyword,
      employeeId: initialValues?.employeeId,
      dateRange:
        initialValues?.startDate && initialValues?.endDate
          ? [dayjs(initialValues.startDate), dayjs(initialValues.endDate)]
          : null,
    })
  }, [form, initialValues])

  const handleSearch = (values: FormValues) => {
    onSearch({
      keyword: values.keyword?.trim() || undefined,
      employeeId: values.employeeId || undefined,
      startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
    })
  }

  const handleReset = () => {
    setEmployeeKeyword('')
    setSelectedEmployeeSnapshots([])
    form.resetFields()
    onReset()
  }

  return (
    <Form
      form={form}
      onFinish={handleSearch}
      className="flex flex-1 flex-wrap gap-2"
    >
      <Form.Item name="keyword" className="mb-0" style={{ width: 240 }}>
        <Input
          placeholder="型号 / 项目号 / 料号"
          allowClear
          onPressEnter={() => form.submit()}
        />
      </Form.Item>
      <Form.Item name="employeeId" className="mb-0" style={{ width: 160 }}>
        <Select
          allowClear
          showSearch={{
            filterOption: false,
            onSearch: setEmployeeKeyword,
          }}
          loading={isEmployeeOptionsFetching}
          onClear={() => setEmployeeKeyword('')}
          onSelect={(_, option) => {
            if (typeof option.label !== 'string') return

            setSelectedEmployeeSnapshots((previous) =>
              rememberEmployeeOptions(previous, [
                { label: option.label, value: String(option.value) },
              ]),
            )
          }}
          placeholder="选择人员"
          options={employeeSelectOptions}
        />
      </Form.Item>
      <Form.Item name="dateRange" className="mb-0">
        <RangePicker />
      </Form.Item>
      <Form.Item className="mb-0">
        <Space>
          <Button type="primary" htmlType="submit">
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
