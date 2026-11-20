import type { FormInstance } from 'antd'
import type { LaborProtectionRequisitionFormValues } from '@/services/apiLaborProtectionRequisitions'
import PublicQrPageShell from '@ui/PublicQrPageShell'
import {
  Alert,
  App,
  Button,
  Result,
  Spin,
} from 'antd'

import { useState } from 'react'
import { useMachineEquipmentOptions } from '@/features/production-order/useMachineEquipmentOptions'
import { useLaborProtectionDataOptions } from '../LaborProtectionData/useLaborProtectionData'
import LaborProtectionRequisitionForm from './LaborProtectionRequisitionForm'
import { useCreateLaborProtectionRequisition } from './useLaborProtectionRequisition'

interface SubmissionSnapshot {
  categoryLabel: string
  jobTitle: string
  machineLabel: string
  quantity: number
  recipient: string
}

export default function LaborProtectionPublicRequisitionPage() {
  const { message } = App.useApp()
  const [formRef, setFormRef]
    = useState<FormInstance<LaborProtectionRequisitionFormValues> | null>(null)
  const [submitted, setSubmitted] = useState<SubmissionSnapshot | null>(null)

  const { data: categoryOptions = [], isLoading: isCategoryOptionsLoading }
    = useLaborProtectionDataOptions()
  const { data: machineOptions = [], isLoading: isMachineOptionsLoading }
    = useMachineEquipmentOptions()
  const createMutation = useCreateLaborProtectionRequisition()

  const handleFinish = async (values: LaborProtectionRequisitionFormValues) => {
    try {
      await createMutation.mutateAsync(values)

      const selectedCategory = categoryOptions.find(
        item => item.id === values.labor_protection_data_id,
      )
      const selectedMachine = machineOptions.find(
        item => item.id === values.machine_equipment_id,
      )

      setSubmitted({
        categoryLabel: selectedCategory?.category || '未命名种类',
        jobTitle: values.job_title.trim(),
        machineLabel: selectedMachine
          ? `${selectedMachine.unified_device_no} | ${selectedMachine.machine_name}`
          : '无',
        quantity: Number(values.quantity),
        recipient: values.recipient.trim(),
      })
    }
    catch (error) {
      message.error(
        error instanceof Error ? error.message : '登记失败，请稍后重试',
      )
    }
  }

  return (
    <PublicQrPageShell
      title="劳保领用登记"
      description="扫码后直接登记领用信息。填写领取人、岗位、种类和数量，提交后系统会自动记录到劳保领料单。"
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
                  categoryOptions.length === 0
                  || isCategoryOptionsLoading
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
                  <div>{submitted.recipient} 已完成劳保领用登记</div>
                  <div>
                    {submitted.categoryLabel} x {submitted.quantity}，岗位：
                    {submitted.jobTitle}，机器：{submitted.machineLabel}
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

              {isCategoryOptionsLoading || isMachineOptionsLoading
                ? (
                    <div className="flex min-h-64 items-center justify-center">
                      <Spin size="large" description="正在加载劳保种类和机器编号" />
                    </div>
                  )
                : categoryOptions.length === 0
                  ? (
                      <Alert
                        type="warning"
                        showIcon
                        title="暂未配置可领取的劳保种类"
                        description="请联系管理员先在后台维护劳保资料后，再重新扫码登记。"
                      />
                    )
                  : (
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

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-xs leading-5 text-slate-600 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-400">
                提交后会立即写入劳保领料单。请确认领取人姓名、岗位、机器编号和数量无误，再点击底部“确认登记”。
              </div>
            </>
          )}
    </PublicQrPageShell>
  )
}
