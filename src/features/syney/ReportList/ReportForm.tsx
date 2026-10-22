import type {
  SyneyStoreReportPayload,
} from '@utils/syneyStoreReport'
import type { Ref } from 'react'
import type {
  ISyneyItem,
  ISyneyStoreReport,
  ISyneyStoreReportFormRef,
} from '@/types'

import { useSyneySpecs } from '@syney/SpecList/useSyneySpecs'
import { jsonToArray } from '@utils/syney'
import {
  buildSyneyStoreReportPayload,
} from '@utils/syneyStoreReport'
import { App, Form, Input } from 'antd'
import { useCallback, useEffect, useImperativeHandle } from 'react'

import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { useCreateReport } from './useCreateReport'

interface ReportFormProps {
  ref?: Ref<ISyneyStoreReportFormRef>
  handleCancel: () => void
  onSpecsLoadingChange: (loading: boolean) => void
  onCreatingChange?: (creating: boolean) => void
}

export default function ReportForm({
  ref,
  handleCancel,
  onSpecsLoadingChange,
  onCreatingChange,
}: ReportFormProps) {
  const { message } = App.useApp()

  const { syneySpecs, isLoading: specsLoading } = useSyneySpecs({
    isAll: true,
  })
  const { createReport, isCreating } = useCreateReport()

  const [form] = Form.useForm<ISyneyStoreReport>()

  const onFinish = useCallback(
    (values: ISyneyStoreReport) => {
      const detailData = jsonToArray(values.Detail || '') || []

      if (detailData.length === 0) {
        message.warning('详情数据为空，请粘贴有效的 JSON 数据')
        return
      }

      let payload: SyneyStoreReportPayload

      try {
        payload = buildSyneyStoreReportPayload(
          detailData as ISyneyItem[],
          syneySpecs || [],
        )
      }
      catch (error) {
        message.error(getUserErrorMessage(error, '入库单数据解析失败，请检查粘贴的内容'))
        return
      }

      createReport(payload, {
        onSuccess: () => {
          message.success(feedbackText.created('对账单'))
          handleCancel()
        },
        // 失败时弹窗保持打开，已粘贴的内容不丢失
        onError: (err) => {
          message.error(
            getUserErrorMessage(err, feedbackText.failed('创建', '对账单')),
          )
        },
      })
    },
    [message, syneySpecs, createReport, handleCancel],
  )

  useImperativeHandle(ref, () => {
    return {
      getInstance() {
        return form
      },
    }
  })

  useEffect(() => {
    onCreatingChange?.(isCreating)
  }, [isCreating, onCreatingChange])

  useEffect(() => {
    onSpecsLoadingChange(specsLoading)
  }, [specsLoading, onSpecsLoadingChange])

  return (
    <Form layout="vertical" form={form} name="report-form" onFinish={onFinish}>
      <Form.Item
        name="Detail"
        label="详情"
        rules={[{ required: true, message: '请粘贴入库单详情数据' }]}
      >
        <Input.TextArea rows={20} cols={30} disabled={isCreating} />
      </Form.Item>
    </Form>
  )
}
