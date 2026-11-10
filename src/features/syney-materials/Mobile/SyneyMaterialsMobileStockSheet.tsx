import type { SyneyMaterialsInventoryOption } from '@/services/apiSyneyMaterialsInventory'
import type { SyneyMaterialsStockDirection } from '@/services/apiSyneyMaterialsStock'
import type { MobileBottomSelectOption } from '@/ui/mobile/MobileBottomSelectSheet'
import { ChevronRightIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import { App, Button, Drawer, Input } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import { SYNEY_MATERIALS_STOCK_LABELS } from '@/services/apiSyneyMaterialsStock'
import MobileBottomSelectSheet from '@/ui/mobile/MobileBottomSelectSheet'
import MobileNumberInput from '@/ui/mobile/MobileNumberInput'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { useSyneyMaterialsInventoryOptions } from '../Inventory/useSyneyMaterialsInventory'
import { useCreateSyneyMaterialsStock } from '../Stock/useSyneyMaterialsStock'

export interface SyneyMaterialsMobileStockSheetProps {
  open: boolean
  direction: SyneyMaterialsStockDirection
  /** 从库存页带入时锁定材料，不再弹选择 */
  presetInventory?: SyneyMaterialsInventoryOption | null
  onClose: () => void
}

function materialTitle(option: { material_name: string, specification: string }) {
  return `${option.material_name} / ${option.specification || '无规格'}`
}

/** 手机端新增入库 / 出库：底部弹层，选材料 → 填数量 → 提交 */
export default function SyneyMaterialsMobileStockSheet({
  open,
  direction,
  presetInventory,
  onClose,
}: SyneyMaterialsMobileStockSheetProps) {
  const label = SYNEY_MATERIALS_STOCK_LABELS[direction]
  const { message } = App.useApp()
  const createMutation = useCreateSyneyMaterialsStock(direction)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [picked, setPicked] = useState<SyneyMaterialsInventoryOption | null>(null)
  const [quantity, setQuantity] = useState<number | null>(1)
  const [remarks, setRemarks] = useState('')

  const { data: options = [], isFetching } = useSyneyMaterialsInventoryOptions(keyword)

  // 只在打开时重置；列表刷新导致 presetInventory 换引用时不清空已填内容
  useEffect(() => {
    if (open) {
      setPicked(null)
      setQuantity(1)
      setRemarks('')
      setKeyword('')
    }
  }, [open])

  // 库存可能被别的单据改动，优先用最新查询结果
  const base = presetInventory ?? picked
  const selected = base
    ? (options.find(option => option.id === base.id) ?? base)
    : null

  const selectOptions = useMemo<MobileBottomSelectOption[]>(
    () =>
      options.map(option => ({
        value: option.id,
        label: materialTitle(option),
        description: `库存 ${option.quantity} ${option.unit}`,
        keywords: `${option.material_name} ${option.specification}`,
      })),
    [options],
  )

  const validQuantity = typeof quantity === 'number' && Number.isInteger(quantity) && quantity > 0
  const overStock = direction === 'out' && selected !== null && validQuantity && quantity > selected.quantity
  const canSubmit = Boolean(selected) && validQuantity && !overStock

  const step = (delta: number) => {
    setQuantity(current => Math.max(1, (typeof current === 'number' ? current : 0) + delta))
  }

  const handleSubmit = async () => {
    if (!selected || !canSubmit)
      return
    try {
      await createMutation.mutateAsync({
        inventory_id: selected.id,
        quantity: quantity as number,
        remarks,
      })
      message.success(`${feedbackText.created(`材料${label}`)}，库存已更新`)
      onClose()
    }
    catch (error) {
      message.error(getUserErrorMessage(error, feedbackText.failed('创建', `材料${label}`)))
    }
  }

  return (
    <>
      <Drawer
        open={open}
        title={`新增${label}`}
        placement="bottom"
        size="86vh"
        onClose={onClose}
        destroyOnHidden
        styles={{ body: { padding: 16 } }}
        footer={(
          <div className="pb-[env(safe-area-inset-bottom)]">
            {overStock
              ? (
                  <div className="mb-2 text-center text-sm text-red-500">
                    库存不足，当前库存 {selected.quantity} {selected.unit}
                  </div>
                )
              : null}
            <Button
              type="primary"
              size="large"
              block
              disabled={!canSubmit}
              loading={createMutation.isPending}
              onClick={handleSubmit}
              className="h-12 rounded-2xl text-base"
            >
              确认{label}
            </Button>
          </div>
        )}
      >
        <div className="flex flex-col gap-5">
          <div>
            <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">材料</div>
            <button
              type="button"
              disabled={Boolean(presetInventory)}
              onClick={() => setPickerOpen(true)}
              className="flex min-h-16 w-full items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left active:bg-slate-50 disabled:active:bg-white dark:border-slate-700 dark:bg-slate-800"
            >
              {selected
                ? (
                    <span className="min-w-0">
                      <span className="block truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                        {materialTitle(selected)}
                      </span>
                      <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                        当前库存 {selected.quantity} {selected.unit}
                      </span>
                    </span>
                  )
                : <span className="text-base text-slate-400">点击选择材料</span>}
              {presetInventory ? null : <ChevronRightIcon className="size-5 shrink-0 text-slate-400" />}
            </button>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              {label}数量{selected ? `（${selected.unit}）` : ''}
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="large"
                aria-label="减少数量"
                icon={<MinusIcon className="size-5" />}
                disabled={!validQuantity || quantity <= 1}
                onClick={() => step(-1)}
                className="h-14 w-14 shrink-0 rounded-2xl"
              />
              <MobileNumberInput
                size="large"
                min={1}
                precision={0}
                controls={false}
                value={quantity}
                onChange={value => setQuantity(typeof value === 'number' ? value : null)}
                aria-label={`${label}数量`}
                className="h-14 rounded-2xl text-center text-xl"
              />
              <Button
                size="large"
                aria-label="增加数量"
                icon={<PlusIcon className="size-5" />}
                onClick={() => step(1)}
                className="h-14 w-14 shrink-0 rounded-2xl"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">备注（选填）</div>
            <Input.TextArea
              value={remarks}
              onChange={event => setRemarks(event.target.value)}
              maxLength={500}
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder={direction === 'in' ? '如：供应商、到货单号' : '如：领用人、用途'}
              className="rounded-2xl"
            />
          </div>
        </div>
      </Drawer>

      <MobileBottomSelectSheet
        open={pickerOpen}
        title="选择材料"
        options={selectOptions}
        value={selected?.id}
        searchPlaceholder="搜索品名或规格"
        emptyText={isFetching ? '加载中…' : '没有匹配的材料'}
        onClose={() => setPickerOpen(false)}
        onSearch={setKeyword}
        onSelect={(id) => {
          const option = options.find(item => item.id === id)
          if (option)
            setPicked(option)
        }}
      />
    </>
  )
}
