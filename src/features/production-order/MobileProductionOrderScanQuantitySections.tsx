import type { MobileProductionOrderScanForm } from './useMobileProductionOrderScanForm'

import { Input } from 'antd'
import MobileNumberInput from '@/ui/mobile/MobileNumberInput'

export interface MobileProductionOrderScanQuantitySectionsProps {
  form: MobileProductionOrderScanForm
}

export default function MobileProductionOrderScanQuantitySections({
  form,
}: MobileProductionOrderScanQuantitySectionsProps) {
  const {
    incomingQualifiedQuantity,
    setIncomingQualifiedQuantity,
    qualifiedQuantity,
    setQualifiedQuantity,
    defectQuantity1,
    setDefectQuantity1,
    defectQuantity2,
    setDefectQuantity2,
    setupDefectQuantity,
    setSetupDefectQuantity,
    setupResponsible,
    setSetupResponsible,
    outsourceDefectQuantity,
    setOutsourceDefectQuantity,
    outsourceUnit,
    setOutsourceUnit,
    outsourceDefectReason,
    setOutsourceDefectReason,
    remark,
    setRemark,
  } = form

  return (
    <>
      {/* 数量明细 */}
      <div className="space-y-3">
        <div className="border-b border-divider pb-1.5 text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
          数量明细
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            来料接收数
          </div>
          <MobileNumberInput
            min={0}
            value={incomingQualifiedQuantity}
            onChange={value =>
              setIncomingQualifiedQuantity(Number(value || 0))}
            className="h-12 w-full rounded-xl"
          />
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            成品合格数
          </div>
          <MobileNumberInput
            min={0}
            value={qualifiedQuantity}
            onChange={value => setQualifiedQuantity(Number(value || 0))}
            className="h-12 w-full rounded-xl"
          />
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            加工不良数量
          </div>
          <MobileNumberInput
            min={0}
            value={defectQuantity1}
            onChange={value => setDefectQuantity1(Number(value || 0))}
            className="h-12 w-full rounded-xl"
          />
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            原料不良数量
          </div>
          <MobileNumberInput
            min={0}
            value={defectQuantity2}
            onChange={value => setDefectQuantity2(Number(value || 0))}
            className="h-12 w-full rounded-xl"
          />
        </div>
      </div>

      {/* 调机与外协 */}
      <div className="space-y-3">
        <div className="border-b border-divider pb-1.5 text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
          调机与外协
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            调机不良
          </div>
          <MobileNumberInput
            min={0}
            value={setupDefectQuantity}
            onChange={value => setSetupDefectQuantity(Number(value || 0))}
            className="h-12 w-full rounded-xl"
          />
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            调机负责人
          </div>
          <Input
            value={setupResponsible}
            onChange={event => setSetupResponsible(event.target.value)}
            placeholder="请输入调机负责人"
            className="h-12 w-full rounded-xl"
          />
        </div>

        <div className="rounded-xl border border-error/25 bg-error/5 p-4 dark:bg-error/10">
          <div className="mb-3 text-xs font-medium text-error">
            涉及外协工序时填写
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              外协不良数
            </div>
            <MobileNumberInput
              min={0}
              value={outsourceDefectQuantity}
              onChange={value =>
                setOutsourceDefectQuantity(Number(value || 0))}
              className="h-12 w-full rounded-xl"
            />
          </div>

          <div className="mt-3">
            <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              外协单位
            </div>
            <Input
              value={outsourceUnit}
              onChange={event => setOutsourceUnit(event.target.value)}
              placeholder="请输入外协单位"
              className="h-12 w-full rounded-xl"
            />
          </div>

          <div className="mt-3">
            <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              外协不良原因
            </div>
            <Input.TextArea
              rows={2}
              value={outsourceDefectReason}
              onChange={event => setOutsourceDefectReason(event.target.value)}
              placeholder="请输入外协不良原因"
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* 备注 */}
      <div className="space-y-3">
        <div className="border-b border-divider pb-1.5 text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
          备注
        </div>

        <div>
          <Input.TextArea
            rows={3}
            value={remark}
            onChange={event => setRemark(event.target.value)}
            placeholder="如有需要可补充说明"
            className="rounded-xl"
          />
        </div>
      </div>
    </>
  )
}
