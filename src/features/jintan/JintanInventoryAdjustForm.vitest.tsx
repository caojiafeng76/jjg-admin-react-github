import type { FormInstance } from 'antd'
import type { JintanInventoryAdjustFormValues } from './JintanInventoryAdjustForm'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'

import { afterEach, describe, expect, it, vi } from 'vitest'
import JintanInventoryAdjustForm from './JintanInventoryAdjustForm'

function renderForm(onFinish = vi.fn()) {
  let form: FormInstance<JintanInventoryAdjustFormValues> | undefined
  render(
    <JintanInventoryAdjustForm
      currentQuantity={58}
      initialRemarks="原备注"
      onFinish={onFinish}
      setFormRef={(instance) => {
        form = instance
      }}
      isSubmitting={false}
    />,
  )
  return { getForm: () => form, onFinish }
}

describe('金檀木业库存调整表单', () => {
  afterEach(cleanup)

  it('预填当前库存与备注，数量未改动时提示未变化', async () => {
    const { getForm } = renderForm()

    expect(screen.getByText('58')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('数量未变化')).toBeInTheDocument(),
    )
    expect(getForm()?.getFieldsValue()).toEqual({
      quantity: 58,
      remarks: '原备注',
    })
  })

  it('实时提示增加和减少的差额', async () => {
    const { getForm } = renderForm()

    act(() => getForm()?.setFieldsValue({ quantity: 60 }))
    await waitFor(() => expect(screen.getByText('差额 +2')).toBeInTheDocument())

    act(() => getForm()?.setFieldsValue({ quantity: 55 }))
    await waitFor(() => expect(screen.getByText('差额 -3')).toBeInTheDocument())
  })

  it('清空数量时不能提交，填写后提交调整后的数量', async () => {
    const { getForm, onFinish } = renderForm()

    act(() => getForm()?.setFieldsValue({ quantity: null as unknown as number }))
    act(() => getForm()?.submit())
    await waitFor(() =>
      expect(screen.getByText('请输入调整后数量')).toBeInTheDocument(),
    )
    expect(onFinish).not.toHaveBeenCalled()

    act(() =>
      getForm()?.setFieldsValue({ quantity: 0, remarks: '月底盘点' }),
    )
    act(() => getForm()?.submit())
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({
        quantity: 0,
        remarks: '月底盘点',
      }),
    )
  })
})
