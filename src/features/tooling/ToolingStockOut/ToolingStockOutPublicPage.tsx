import { useMemo, useState } from 'react'
import {
  Alert,
  App,
  Button,
  Card,
  type FormInstance,
  Result,
  Spin,
  Typography,
} from 'antd'
import dayjs from 'dayjs'

import type { ToolingStockOutFormValues } from '@/services/apiToolingStockOut'
import ToolingStockOutForm from './ToolingStockOutForm'
import {
  useCreateToolingStockOut,
  useToolingDataOptions,
} from './useToolingStockOut'

const { Paragraph, Title } = Typography

const displayFontStyle = {
  fontFamily: "'STSong', 'SimSun', 'Noto Serif SC', serif",
}

interface SubmissionSnapshot {
  quantity: number
  recipient: string
  toolLabel: string
  purpose: string
}

export default function ToolingStockOutPublicPage() {
  const { message } = App.useApp()
  const [formRef, setFormRef] = useState<FormInstance | null>(null)
  const [submitted, setSubmitted] = useState<SubmissionSnapshot | null>(null)

  const { data: toolingOptions = [], isLoading: isToolingOptionsLoading } =
    useToolingDataOptions()
  const createMutation = useCreateToolingStockOut()

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

      const selectedTooling = toolingOptions.find(
        (item) => item.id === payload.tooling_data_id,
      )

      setSubmitted({
        quantity: Number(payload.stock_out_quantity),
        recipient: payload.recipient.trim(),
        toolLabel: selectedTooling
          ? `${selectedTooling.tool_code} | ${selectedTooling.tool_name}`
          : '未命名刀具',
        purpose: payload.purpose.trim(),
      })
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '登记失败，请稍后重试',
      )
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_28%),linear-gradient(180deg,#f6fbfc_0%,#ffffff_42%,#e9eef1_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pt-5 pb-32 sm:px-6 sm:pt-7">
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 px-5 py-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-6">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute bottom-0 -left-8 h-20 w-20 rounded-full bg-slate-200/50 blur-3xl" />

          <div className="relative">
            <div className="text-[11px] font-semibold tracking-[0.32em] text-slate-400 uppercase">
              Tooling Stock Out
            </div>
            <Title
              level={2}
              style={{ ...displayFontStyle, marginTop: 14, marginBottom: 8 }}
            >
              刀具出库登记
            </Title>
            <Paragraph className="mb-0 text-sm leading-6 text-slate-600">
              扫码后直接登记出库信息。选择刀具，填写领用人、用途和数量，提交后系统会自动记录到刀具出库。
            </Paragraph>
          </div>
        </section>

        {submitted ? (
          <Card className="mt-4 rounded-[28px] border-slate-200/80 bg-white/92 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
            <Result
              status="success"
              title="登记成功"
              subTitle={
                <div className="space-y-1 text-sm text-slate-500">
                  <div>{submitted.recipient} 已完成刀具出库登记</div>
                  <div>
                    {submitted.toolLabel} x {submitted.quantity}，用途：
                    {submitted.purpose}
                  </div>
                </div>
              }
              extra={
                <Button
                  type="primary"
                  size="large"
                  className="h-11 rounded-2xl px-6"
                  onClick={() => {
                    setSubmitted(null)
                  }}
                >
                  继续登记
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            <Card className="mt-4 rounded-[28px] border-slate-200/80 bg-white/92 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
                    Open H5 Form
                  </div>
                  <div className="mt-1 text-base font-semibold text-slate-900">
                    现场扫码后填写
                  </div>
                </div>
                <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                  无需登录
                </div>
              </div>

              {isToolingOptionsLoading ? (
                <div className="flex min-h-80 items-center justify-center">
                  <div className="flex flex-col items-center gap-4 text-sm text-slate-500">
                    <Spin size="large" />
                    <span>正在加载刀具资料</span>
                  </div>
                </div>
              ) : toolingOptions.length === 0 ? (
                <Alert
                  type="warning"
                  showIcon
                  title="暂未配置可出库的刀具资料"
                  description="请联系管理员先在后台维护刀具资料后，再重新扫码登记。"
                />
              ) : (
                <ToolingStockOutForm
                  onFinish={handleFinish}
                  setFormRef={setFormRef}
                  isSubmitting={createMutation.isPending}
                  toolingOptions={toolingOptions}
                  toolingInputMode="bottom-sheet"
                  defaultValues={defaultValues}
                />
              )}
            </Card>

            <div className="mt-4 rounded-[24px] border border-slate-200/80 bg-slate-950/3 px-4 py-4 text-sm leading-6 text-slate-600 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              提交后会立即写入刀具出库，并保持“待审核”状态。请确认刀具、领用人、用途和数量无误，再点击底部“确认登记”。
            </div>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-white/92 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)] backdrop-blur-xl sm:px-6">
              <div className="mx-auto max-w-xl">
                <Button
                  type="primary"
                  size="large"
                  block
                  className="h-12 rounded-2xl"
                  loading={createMutation.isPending}
                  disabled={
                    toolingOptions.length === 0 || isToolingOptionsLoading
                  }
                  onClick={() => formRef?.submit()}
                >
                  确认登记
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
