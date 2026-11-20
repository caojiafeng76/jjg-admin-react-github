import type { FormInstance } from 'antd'
import type { RemoteToolingOption } from '../remoteToolingOptions'
import type { ToolingStockOutFormValues } from '@/services/apiToolingStockOut'
import PublicQrPageShell from '@ui/PublicQrPageShell'
import {
  Alert,
  App,
  Button,
  Result,
  Spin,
} from 'antd'

import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useMachineEquipmentOptions } from '@/features/production-order/useMachineEquipmentOptions'
import ToolingStockOutForm from './ToolingStockOutForm'
import {
  useCreatePublicToolingStockOut,
  usePublicToolingDataOptions,
} from './useToolingStockOut'

interface SubmissionSnapshot {
  quantity: number
  recipient: string
  toolLabel: string
  machineLabel: string
  purpose: string
}

export default function ToolingStockOutPublicPage() {
  const { message } = App.useApp()
  const [formRef, setFormRef] = useState<FormInstance | null>(null)
  const [submitted, setSubmitted] = useState<SubmissionSnapshot | null>(null)
  const [toolingOptionsKeyword, setToolingOptionsKeyword] = useState('')
  const [selectedTooling, setSelectedTooling] = useState<RemoteToolingOption>()

  const {
    data: toolingOptions = [],
    isLoading: isToolingOptionsQueryLoading,
    isFetching: isToolingOptionsLoading,
  } = usePublicToolingDataOptions(toolingOptionsKeyword)
  const { data: machineOptions = [], isLoading: isMachineOptionsLoading }
    = useMachineEquipmentOptions()
  const createMutation = useCreatePublicToolingStockOut()

  const defaultValues = useMemo<Partial<ToolingStockOutFormValues>>(
    () => ({
      stock_out_date: dayjs().format('YYYY-MM-DD'),
      status: '待审核',
      stock_out_quantity: 1,
    }),
    [],
  )

  const handleFinish = async (values: ToolingStockOutFormValues) => {
    try {
      const payload: ToolingStockOutFormValues = {
        ...values,
        status: '待审核',
      }

      await createMutation.mutateAsync(payload)

      const submittedTooling
        = selectedTooling
          ?? toolingOptions.find(item => item.id === payload.tooling_data_id)
      const selectedMachine = machineOptions.find(
        item => item.id === payload.machine_equipment_id,
      )

      setSubmitted({
        quantity: Number(payload.stock_out_quantity),
        recipient: payload.recipient.trim(),
        toolLabel: submittedTooling
          ? `${submittedTooling.tool_code} | ${submittedTooling.tool_name}`
          : '未命名刀具',
        machineLabel: selectedMachine
          ? `${selectedMachine.unified_device_no} | ${selectedMachine.machine_name}`
          : '无',
        purpose: payload.purpose.trim(),
      })
    }
    catch (error) {
      message.error(
        error instanceof Error ? error.message : '登记失败，请稍后重试',
      )
    }
  }

  const hasToolingOptions
    = toolingOptionsKeyword.trim().length > 0
      || toolingOptions.length > 0
      || Boolean(selectedTooling)
  const isToolingOptionsInitialLoading
    = toolingOptionsKeyword.trim().length === 0 && isToolingOptionsQueryLoading

  return (
    <PublicQrPageShell
      title="刀具出库登记"
      description="扫码后直接登记出库信息。选择刀具，填写领用人、用途和数量，提交后系统会自动记录到刀具出库。"
      footer={
        submitted
          ? undefined
          : (
              <Button
                type="primary"
                size="large"
                block
                className="h-11 rounded-xl"
                loading={createMutation.isPending}
                disabled={
                  !hasToolingOptions
                  || isToolingOptionsInitialLoading
                  || isMachineOptionsLoading
                }
                onClick={() => formRef?.submit()}
              >
                确认登记
              </Button>
            )
      }
    >
      {submitted
        ? (
            <Result
              status="success"
              title="登记成功"
              subTitle={(
                <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
                  <div>{submitted.recipient} 已完成刀具出库登记</div>
                  <div>
                    {submitted.toolLabel} x {submitted.quantity}，用途：
                    {submitted.purpose}，机器：{submitted.machineLabel}
                  </div>
                </div>
              )}
              extra={(
                <Button
                  type="primary"
                  size="large"
                  className="h-11 rounded-xl px-6"
                  onClick={() => {
                    setSubmitted(null)
                    setSelectedTooling(undefined)
                    setToolingOptionsKeyword('')
                  }}
                >
                  继续登记
                </Button>
              )}
            />
          )
        : (
            <>
              <div className="mb-4 border-b border-divider pb-3">
                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  现场扫码后填写
                </div>
              </div>

              {isToolingOptionsInitialLoading || isMachineOptionsLoading
                ? (
                    <div className="flex min-h-64 items-center justify-center">
                      <Spin size="large" description="正在加载刀具资料和机器编号" />
                    </div>
                  )
                : !hasToolingOptions
                    ? (
                        <Alert
                          type="warning"
                          showIcon
                          title="暂未配置可出库的刀具资料"
                          description="请联系管理员先在后台维护刀具资料后，再重新扫码登记。"
                        />
                      )
                    : (
                        <ToolingStockOutForm
                          onFinish={handleFinish}
                          setFormRef={setFormRef}
                          isSubmitting={createMutation.isPending}
                          toolingOptions={toolingOptions}
                          isToolingOptionsLoading={isToolingOptionsLoading}
                          onToolingSearch={setToolingOptionsKeyword}
                          onToolingSelect={setSelectedTooling}
                          machineOptions={machineOptions}
                          isMachineOptionsLoading={isMachineOptionsLoading}
                          toolingInputMode="bottom-sheet"
                          defaultValues={defaultValues}
                        />
                      )}

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-xs leading-5 text-slate-600 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-400">
                提交后会立即写入刀具出库，并保持“待审核”状态。请确认刀具、机器编号、领用人、用途和数量无误，再点击底部“确认登记”。
              </div>
            </>
          )}
    </PublicQrPageShell>
  )
}
