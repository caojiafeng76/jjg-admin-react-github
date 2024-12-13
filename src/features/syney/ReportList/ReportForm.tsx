import { forwardRef, useEffect, useImperativeHandle } from 'react'
import { Form, Input } from 'antd'

import { ISyneyItem, ISyneyStoreReport, ISyneyStoreReportFormRef } from '@/types'
import { useSyneySpecs } from '@syney/SpecList/useSyneySpecs'
import { useCreateReport } from './useCreateReport'
import { useStore } from '@/store'
import { getItemsWithParamSpec, jsonToArray, distinctItems } from '@utils/syney'

type ReportFormProps = {
  handleCancel: () => void
}

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
}

const ReportForm = forwardRef<ISyneyStoreReportFormRef, ReportFormProps>(
  ({ handleCancel }, ref) => {
    const { setIsLoading } = useStore()

    const { syneySpecs, isLoading: specsLoading } = useSyneySpecs({
      isAll: true,
    })
    const { createReport, isCreating } = useCreateReport()

    const [form] = Form.useForm<ISyneyStoreReport>()

    const onFinish = (values: ISyneyStoreReport) => {
      if (!specsLoading) {
        const No = values.No

        const items = getItemsWithParamSpec(
          jsonToArray(values.Detail || '') || [],
          syneySpecs || [],
        )
        let TotalAmount = items
          .map((item) => item.Qty! * Number(item.TaxUnitPrice?.toFixed(2)))
          .reduce((acc, price) => acc + price!, 0)

        const itemsDistinct = distinctItems(items as ISyneyItem[])

        TotalAmount = Math.round(TotalAmount * 100) / 100

        createReport(
          { No, TotalAmount, items: itemsDistinct },
          { onSettled: () => handleCancel() },
        )
      }
    }

    useImperativeHandle(ref, () => {
      return {
        getInstance() {
          return form
        },
      }
    })

    useEffect(() => {
      setIsLoading(isCreating)
    }, [isCreating, setIsLoading])

    return (
      <>
        <Form {...layout} form={form} name="report-form" onFinish={onFinish}>
          <Form.Item name="No" label="对账单号" rules={[{ required: true }]}>
            <Input disabled={isCreating} />
          </Form.Item>
          <Form.Item name="Detail" label="详情" rules={[{ required: true }]}>
            <Input.TextArea rows={20} cols={30} disabled={isCreating} />
          </Form.Item>
        </Form>
      </>
    )
  },
)

export default ReportForm
