import type { Dayjs } from 'dayjs'
import type { MaterialTransferFilters } from '@/services/apiMaterialTransfers'
import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { Button, DatePicker, Form, Input, Select } from 'antd'
import dayjs from 'dayjs'

import { useEffect, useState } from 'react'
import {
  MATERIAL_TRANSFER_AUDIT_OPTIONS,
  MATERIAL_TRANSFER_WORKSHOPS,

} from '@/services/apiMaterialTransfers'
import { FilterBarActions } from '@/ui/FilterBar'

const { RangePicker } = DatePicker

interface MaterialTransferSearchValues extends MaterialTransferFilters {
  dateRange?: [Dayjs | null, Dayjs | null]
}

interface Props {
  onSearch: (values: MaterialTransferSearchValues) => void
  onReset: () => void
  employees: { id: string, name: string }[]
  lengthOptions: number[]
  initialValues?: MaterialTransferSearchValues
  mobile?: boolean
  showEmployeeFilter?: boolean
}

export default function MaterialTransferSearch({
  onSearch,
  onReset,
  employees,
  lengthOptions,
  initialValues,
  mobile = false,
  showEmployeeFilter = true,
}: Props) {
  const [form] = Form.useForm()
  const [isExpanded, setIsExpanded] = useState(!mobile)
  const [isSearching, setIsSearching] = useState(false)

  const getPopupContainer = () => document.body

  useEffect(() => {
    form.setFieldsValue({
      ...initialValues,
      dateRange:
        initialValues?.startDate && initialValues?.endDate
          ? [dayjs(initialValues.startDate), dayjs(initialValues.endDate)]
          : undefined,
    })
  }, [form, initialValues])

  useEffect(() => {
    setIsExpanded(!mobile)
  }, [mobile])

  function handleFinish(values: MaterialTransferSearchValues) {
    setIsSearching(true)
    onSearch({
      startDate:
        values.dateRange?.[0] && values.dateRange?.[1]
          ? values.dateRange[0].format('YYYY-MM-DD')
          : undefined,
      endDate:
        values.dateRange?.[0] && values.dateRange?.[1]
          ? values.dateRange[1].format('YYYY-MM-DD')
          : undefined,
      projectNo: values.projectNo?.trim() || undefined,
      productModel: values.productModel?.trim() || undefined,
      materialCode: values.materialCode?.trim() || undefined,
      length_mm:
        values.length_mm && values.length_mm.length > 0
          ? values.length_mm
          : undefined,
      employeeId: values.employeeId || undefined,
      targetWorkshop: values.targetWorkshop || undefined,
      isAudited:
        typeof values.isAudited === 'boolean' ? values.isAudited : undefined,
    })
    setTimeout(setIsSearching, 300, false)
  }

  function handleReset() {
    form.resetFields()
    setIsSearching(true)
    onReset()
    if (mobile) {
      setIsExpanded(false)
    }
    setTimeout(setIsSearching, 300, false)
  }

  const formClassName = mobile
    ? 'grid grid-cols-1 gap-3'
    : 'flex flex-1 flex-nowrap items-center gap-3'
  const formItemClassName = mobile ? 'mb-0' : 'mb-0 shrink-0'

  const formContent = (
    <Form
      form={form}
      onFinish={handleFinish}
      layout={mobile ? 'vertical' : 'horizontal'}
      className={formClassName}
    >
      <Form.Item name="dateRange" className={formItemClassName}>
        <RangePicker
          format="YYYY-MM-DD"
          placeholder={['创建开始', '创建结束']}
          allowClear
          inputReadOnly={mobile}
          getPopupContainer={getPopupContainer}
          style={{ width: mobile ? '100%' : 240 }}
          className="rounded-lg"
        />
      </Form.Item>

      <Form.Item name="projectNo" className={formItemClassName}>
        <Input
          placeholder="项目号"
          allowClear
          onPressEnter={() => form.submit()}
          style={{ width: mobile ? '100%' : 140 }}
          className="rounded-lg"
        />
      </Form.Item>

      <Form.Item name="productModel" className={formItemClassName}>
        <Input
          placeholder="型号"
          allowClear
          onPressEnter={() => form.submit()}
          style={{ width: mobile ? '100%' : 140 }}
          className="rounded-lg"
        />
      </Form.Item>

      <Form.Item name="materialCode" className={formItemClassName}>
        <Input
          placeholder="料号"
          allowClear
          onPressEnter={() => form.submit()}
          style={{ width: mobile ? '100%' : 160 }}
          className="rounded-lg"
        />
      </Form.Item>

      <Form.Item name="length_mm" className={formItemClassName}>
        <Select
          mode="multiple"
          placeholder="长度"
          allowClear
          showSearch={{ optionFilterProp: 'label' }}
          getPopupContainer={getPopupContainer}
          style={{ width: mobile ? '100%' : 140 }}
          maxTagCount="responsive"
          options={lengthOptions.map(v => ({ label: `${v}mm`, value: v }))}
          className="rounded-lg"
          styles={{
            popup: {
              root: {
                minWidth: 120,
              },
            },
          }}
        />
      </Form.Item>

      {showEmployeeFilter
        ? (
            <Form.Item name="employeeId" className={formItemClassName}>
              <Select
                placeholder="操作人"
                allowClear
                showSearch={{ optionFilterProp: 'label' }}
                getPopupContainer={getPopupContainer}
                style={{ width: mobile ? '100%' : 140 }}
                options={employees.map(employee => ({
                  label: employee.name,
                  value: employee.id,
                }))}
                className="rounded-lg"
                styles={{
                  popup: {
                    root: {
                      minWidth: 120,
                    },
                  },
                }}
              />
            </Form.Item>
          )
        : null}

      <Form.Item name="targetWorkshop" className={formItemClassName}>
        <Select
          placeholder="接收车间"
          allowClear
          getPopupContainer={getPopupContainer}
          style={{ width: mobile ? '100%' : 140 }}
          options={MATERIAL_TRANSFER_WORKSHOPS.map(workshop => ({
            label: workshop,
            value: workshop,
          }))}
          className="rounded-lg"
          styles={{
            popup: {
              root: {
                minWidth: 100,
              },
            },
          }}
        />
      </Form.Item>

      <Form.Item name="isAudited" className={formItemClassName}>
        <Select
          placeholder="审核状态"
          allowClear
          getPopupContainer={getPopupContainer}
          style={{ width: mobile ? '100%' : 110 }}
          options={[...MATERIAL_TRANSFER_AUDIT_OPTIONS]}
          className="rounded-lg"
          styles={{
            popup: {
              root: {
                minWidth: 90,
              },
            },
          }}
        />
      </Form.Item>

      <Form.Item className={formItemClassName}>
        <FilterBarActions
          onReset={handleReset}
          isLoading={isSearching}
          className={mobile ? 'grid w-full grid-cols-2 gap-2' : 'flex items-center gap-2 whitespace-nowrap'}
        />
      </Form.Item>
    </Form>
  )

  if (mobile) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          block
          type="default"
          onClick={() => setIsExpanded(prev => !prev)}
          className="h-11 rounded-xl border-slate-200 bg-white px-4 text-sm font-medium shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.99] dark:border-slate-700 dark:bg-slate-800"
        >
          <span className="flex w-full items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              筛选条件
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </span>
        </Button>

        {isExpanded
          ? (
              <div className="max-h-[calc(100dvh-340px)] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                {formContent}
              </div>
            )
          : null}
      </div>
    )
  }

  return formContent
}
