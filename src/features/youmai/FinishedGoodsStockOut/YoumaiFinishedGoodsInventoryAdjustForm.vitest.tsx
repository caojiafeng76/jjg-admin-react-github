import type { FormInstance } from 'antd'
import type { YoumaiFinishedGoodsInventoryAdjustFormValues } from './YoumaiFinishedGoodsInventoryAdjustForm'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import YoumaiFinishedGoodsInventoryAdjustForm from './YoumaiFinishedGoodsInventoryAdjustForm'

function renderForm(onFinish = vi.fn()) {
  let form: FormInstance<YoumaiFinishedGoodsInventoryAdjustFormValues> | undefined
  render(
    <YoumaiFinishedGoodsInventoryAdjustForm
      currentStock={58}
      initialRemarks="原库存备注"
      onFinish={onFinish}
      setFormRef={(instance) => {
        form = instance
      }}
      isSubmitting={false}
    />,
  )
  return { getForm: () => form, onFinish }
}

describe('优迈成品库存调整表单', () => {
  afterEach(cleanup)

  it('预填当前现有库存与备注，数量未改动时提示未变化', async () => {
    const { getForm } = renderForm()

    expect(screen.getByText('58')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('数量未变化')).toBeInTheDocument(),
    )
    expect(getForm()?.getFieldsValue()).toEqual({
      current_stock: 58,
      remarks: '原库存备注',
    })
  })

  it('实时提示增加和减少的差额', async () => {
    const { getForm } = renderForm()

    act(() => getForm()?.setFieldsValue({ current_stock: 60 }))
    await waitFor(() => expect(screen.getByText('差额 +2')).toBeInTheDocument())

    act(() => getForm()?.setFieldsValue({ current_stock: 55 }))
    await waitFor(() => expect(screen.getByText('差额 -3')).toBeInTheDocument())
  })

  it('清空数量时不能提交，填写后提交调整后的数量', async () => {
    const { getForm, onFinish } = renderForm()

    act(() =>
      getForm()?.setFieldsValue({ current_stock: null as unknown as number }),
    )
    act(() => getForm()?.submit())
    await waitFor(() =>
      expect(screen.getByText('请输入调整后现有库存')).toBeInTheDocument(),
    )
    expect(onFinish).not.toHaveBeenCalled()

    act(() =>
      getForm()?.setFieldsValue({ current_stock: 0, remarks: '月底盘点' }),
    )
    act(() => getForm()?.submit())
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({
        current_stock: 0,
        remarks: '月底盘点',
      }),
    )
  })
})
