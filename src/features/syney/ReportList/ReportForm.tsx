import { forwardRef, useEffect, useImperativeHandle } from 'react'
import { App, Form, Input } from 'antd'

import {
  ISyneyItem,
  ISyneyStoreReport,
  ISyneyStoreReportFormRef,
} from '@/types'
import { useAppStore } from '@/store'
import { useSyneySpecs } from '@syney/SpecList/useSyneySpecs'
import { jsonToArray } from '@utils/syney'
import {
  buildSyneyStoreReportPayload,
  SyneyStoreReportPayload,
} from '@utils/syneyStoreReport'

import { useCreateReport } from './useCreateReport'

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
      const detailData = jsonToArray(values.Detail || '') || []

      if (detailData.length === 0) {
        message.error('详情数据为空，请粘贴有效的 JSON 数据')
        return
      }

      let payload: SyneyStoreReportPayload

      try {
        payload = buildSyneyStoreReportPayload(
          detailData as ISyneyItem[],
          syneySpecs || [],
        )
      } catch (error) {
        message.error(error instanceof Error ? error.message : '入库单数据解析失败')
        return
      }

      createReport(payload, {
        onSettled: () => handleCancel(),
        onSuccess: () => message.success('创建入库单成功'),
        onError: (err) => {
          console.error(err)
          message.error('创建入库单失败')
        },
      })
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
      <Form {...layout} form={form} name="report-form" onFinish={onFinish}>
        <Form.Item name="Detail" label="详情" rules={[{ required: true }]}>
          <Input.TextArea rows={20} cols={30} disabled={isCreating} />
        </Form.Item>
      </Form>
    )
  },
)

export default ReportForm
