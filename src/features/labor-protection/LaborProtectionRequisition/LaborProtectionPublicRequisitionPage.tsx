import { useState } from 'react'
import {
  Alert,
  App,
  Button,
  Card,
  Result,
  Spin,
  Typography,
  type FormInstance,
} from 'antd'

import type { LaborProtectionRequisitionFormValues } from '@/services/apiLaborProtectionRequisitions'
import { useMachineEquipmentOptions } from '@/features/production-order/useMachineEquipmentOptions'
import { useLaborProtectionDataOptions } from '../LaborProtectionData/useLaborProtectionData'
import LaborProtectionRequisitionForm from './LaborProtectionRequisitionForm'
import { useCreateLaborProtectionRequisition } from './useLaborProtectionRequisition'

const { Paragraph, Title } = Typography

const displayFontStyle = {
  fontFamily: "'STSong', 'SimSun', 'Noto Serif SC', serif",
}

interface SubmissionSnapshot {
  categoryLabel: string
  jobTitle: string
  machineLabel: string
  quantity: number
  recipient: string
}

export default function LaborProtectionPublicRequisitionPage() {
  const { message } = App.useApp()
  const [formRef, setFormRef] =
    useState<FormInstance<LaborProtectionRequisitionFormValues> | null>(null)
  const [submitted, setSubmitted] = useState<SubmissionSnapshot | null>(null)

  const { data: categoryOptions = [], isLoading: isCategoryOptionsLoading } =
    useLaborProtectionDataOptions()
  const { data: machineOptions = [], isLoading: isMachineOptionsLoading } =
    useMachineEquipmentOptions()
  const createMutation = useCreateLaborProtectionRequisition()

  const handleFinish = async (values: LaborProtectionRequisitionFormValues) => {
    try {
      await createMutation.mutateAsync(values)

      const selectedCategory = categoryOptions.find(
        (item) => item.id === values.labor_protection_data_id,
      )
      const selectedMachine = machineOptions.find(
        (item) => item.id === values.machine_equipment_id,
      )

      setSubmitted({
        categoryLabel: selectedCategory?.category || '未命名种类',
        jobTitle: values.job_title.trim(),
        machineLabel: selectedMachine
          ? `${selectedMachine.unified_device_no} | ${selectedMachine.machine_name}`
          : '未命名机器',
        quantity: Number(values.quantity),
        recipient: values.recipient.trim(),
      })
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '登记失败，请稍后重试',
      )
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.16),transparent_28%),linear-gradient(180deg,#fbf7ef_0%,#fffdf8_42%,#f0ebe2_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pt-5 pb-32 sm:px-6 sm:pt-7">
        <section className="relative overflow-hidden rounded-4xl border border-stone-200/80 bg-white/88 px-5 py-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-6">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute bottom-0 -left-8 h-20 w-20 rounded-full bg-stone-200/50 blur-3xl" />

          <div className="relative">
            <div className="text-[11px] font-semibold tracking-[0.34em] text-stone-400 uppercase">
              Labor Protection Entry
            </div>
            <Title
              level={2}
              style={{ ...displayFontStyle, marginTop: 14, marginBottom: 8 }}
            >
              劳保领用登记
            </Title>
            <Paragraph className="mb-0 text-sm leading-6 text-stone-600">
              扫码后直接登记领用信息。填写领取人、岗位、种类和数量，提交后系统会自动记录到劳保领料单。
            </Paragraph>
          </div>
        </section>

        {submitted ? (
          <Card className="mt-4 rounded-4xl border-stone-200/80 bg-white/92 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
            <Result
              status="success"
              title="登记成功"
              subTitle={
                <div className="space-y-1 text-sm text-slate-500">
                  <div>{submitted.recipient} 已完成劳保领用登记</div>
                  <div>
                    {submitted.categoryLabel} x {submitted.quantity}，岗位：
                    {submitted.jobTitle}，机器：{submitted.machineLabel}
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
            <Card className="mt-4 rounded-4xl border-stone-200/80 bg-white/92 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold tracking-[0.24em] text-stone-400 uppercase">
                    Open H5 Form
                  </div>
                  <div className="mt-1 text-base font-semibold text-slate-900">
                    现场扫码后填写
                  </div>
                </div>
                <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  无需登录
                </div>
              </div>

              {isCategoryOptionsLoading || isMachineOptionsLoading ? (
                <div className="flex min-h-80 items-center justify-center">
                  <div className="flex flex-col items-center gap-4 text-sm text-slate-500">
                    <Spin size="large" />
                    <span>正在加载劳保种类和机器编号</span>
                  </div>
                </div>
              ) : categoryOptions.length === 0 ||
                machineOptions.length === 0 ? (
                <Alert
                  type="warning"
                  showIcon
                  title="暂未配置可领取的劳保种类或机器编号"
                  description="请联系管理员先在后台维护劳保资料和机器设备后，再重新扫码登记。"
                />
              ) : (
                <LaborProtectionRequisitionForm
                  onFinish={handleFinish}
                  setFormRef={setFormRef}
                  isSubmitting={createMutation.isPending}
                  categoryOptions={categoryOptions}
                  isCategoryOptionsLoading={isCategoryOptionsLoading}
                  machineOptions={machineOptions}
                  isMachineOptionsLoading={isMachineOptionsLoading}
                  categoryInputMode="bottom-sheet"
                  machineInputMode="bottom-sheet"
                />
              )}
            </Card>

            <div className="mt-4 rounded-[28px] border border-stone-200/80 bg-stone-950/3 px-4 py-4 text-sm leading-6 text-stone-600 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              提交后会立即写入劳保领料单。请确认领取人姓名、岗位、机器编号和数量无误，再点击底部“确认登记”。
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
                    categoryOptions.length === 0 ||
                    isCategoryOptionsLoading ||
                    machineOptions.length === 0 ||
                    isMachineOptionsLoading
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
