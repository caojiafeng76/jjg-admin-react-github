import { forwardRef, useEffect, useImperativeHandle } from 'react'
import { Form, Input, App } from 'antd'

import {
  ISyneyItem,
  ISyneyStoreReport,
  ISyneyStoreReportFormRef,
} from '@/types'
import { useSyneySpecs } from '@syney/SpecList/useSyneySpecs'
import { useCreateReport } from './useCreateReport'
import { useAppStore } from '@/store'
import { getItemsWithParamSpec, jsonToArray, distinctItems } from '@utils/syney'

type ReportFormProps = {
  handleCancel: () => void
  onSpecsLoadingChange: (loading: boolean) => void
}

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
}

const ReportForm = forwardRef<ISyneyStoreReportFormRef, ReportFormProps>(
  ({ handleCancel, onSpecsLoadingChange }, ref) => {
    const { message } = App.useApp()
    const { setIsLoading } = useAppStore()

    const { syneySpecs, isLoading: specsLoading } = useSyneySpecs({
      isAll: true,
    })
    const { createReport, isCreating } = useCreateReport()

    const [form] = Form.useForm<ISyneyStoreReport>()

    const onFinish = (values: ISyneyStoreReport) => {
      // 从Detail JSON中提取数据
      const detailData = jsonToArray(values.Detail || '') || []

      // 验证数据有效性
      if (detailData.length === 0) {
        message.error('详情数据为空，请粘贴有效的JSON数据')
        return
      }

      // 从第一条记录获取对账单号
      const No = detailData[0].No

      if (!No) {
        message.error('无法从详情中获取对账单号（No字段）')
        return
      }

      const items = getItemsWithParamSpec(detailData, syneySpecs || [])
      let TotalAmount = items
        .map((item) => item.Qty! * Number(item.TaxUnitPrice?.toFixed(2)))
        .reduce((acc, price) => acc + price!, 0)

      const itemsDistinct = distinctItems(items as ISyneyItem[])

      TotalAmount = Math.round(TotalAmount * 100) / 100

      createReport(
        { No, TotalAmount, items: itemsDistinct },
        {
          onSettled: () => handleCancel(),
          onSuccess: () => message.success('创建对账单成功'),
          onError: (err) => {
            console.error(err)
            message.error('创建对账单失败')
          },
        },
      )
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

    useEffect(() => {
      onSpecsLoadingChange(specsLoading)
    }, [specsLoading, onSpecsLoadingChange])

    return (
      <>
        <Form {...layout} form={form} name="report-form" onFinish={onFinish}>
          <Form.Item name="Detail" label="详情" rules={[{ required: true }]}>
            <Input.TextArea rows={20} cols={30} disabled={isCreating} />
          </Form.Item>
        </Form>
      </>
    )
  },
)

export default ReportForm
