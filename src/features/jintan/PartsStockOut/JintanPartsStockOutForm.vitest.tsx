import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import type { FormInstance } from 'antd'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { JintanPartsStockOutFormValues } from '@/services/apiJintanPartsStockOut'
import JintanPartsStockOutForm from './JintanPartsStockOutForm'

vi.mock('../PartsInventory/useJintanPartsInventory', () => ({
  useJintanPartsInventoryOptions: () => ({
    data: [
      {
        id: 'inventory-1',
        part_name: '扶手配件',
        specification: 'A1',
        material: '木材',
        supplier: '厂家甲',
        quantity: 12,
      },
    ],
    isFetching: false,
    error: null,
  }),
}))

describe('金檀木业配件出库表单', () => {
  afterEach(cleanup)

  it('选中配件后显示资料与库存，并提交正整数数量', async () => {
    let form: FormInstance<JintanPartsStockOutFormValues> | undefined
    const onFinish = vi.fn()
    render(
      <JintanPartsStockOutForm
        onFinish={onFinish}
        setFormRef={(instance) => {
          form = instance
        }}
        isSubmitting={false}
      />,
    )

    act(() =>
      form?.setFieldsValue({
        inventory_id: 'inventory-1',
        quantity: 3,
        remarks: '到货',
      }),
    )
    await waitFor(() =>
      expect(screen.getByText(/当前库存：12/)).toBeInTheDocument(),
    )
    expect(screen.getByText(/厂家甲/)).toBeInTheDocument()

    act(() => form?.submit())
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({
        inventory_id: 'inventory-1',
        quantity: 3,
        remarks: '到货',
      }),
    )
  })

  it.each([0, -1, 1.5, 13])('拦截无效或超库存数量 %s', async (quantity) => {
    let form: FormInstance<JintanPartsStockOutFormValues> | undefined
    const onFinish = vi.fn()
    render(
      <JintanPartsStockOutForm
        onFinish={onFinish}
        setFormRef={(instance) => {
          form = instance
        }}
        isSubmitting={false}
      />,
    )

    act(() => {
      form?.setFieldsValue({
        inventory_id: 'inventory-1',
        quantity,
        remarks: '',
      })
      form?.submit()
    })
    await waitFor(() =>
      expect(
        screen.getByText(
          quantity === 13 ? '库存不足，当前库存为 12' : '出库数量必须为正整数',
        ),
      ).toBeInTheDocument(),
    )
    expect(onFinish).not.toHaveBeenCalled()
  })

  it('编辑时锁定配件和数量，低库存不阻止修改历史记录备注', async () => {
    let form: FormInstance<JintanPartsStockOutFormValues> | undefined
    const onFinish = vi.fn()
    render(
      <JintanPartsStockOutForm
        onFinish={onFinish}
        setFormRef={(instance) => {
          form = instance
        }}
        isSubmitting={false}
        editingRecord={{
          id: 'record-1',
          inventory_id: 'inventory-1',
          quantity: 20,
          part_name: '扶手配件',
          specification: 'A1',
          material: '木材',
          supplier: '厂家甲',
          remarks: '',
          created_at: '2026-10-05T00:00:00Z',
          updated_at: '2026-10-05T00:00:00Z',
        }}
      />,
    )
    expect(screen.getByDisplayValue('扶手配件 / A1')).toBeDisabled()
    expect(screen.getByRole('spinbutton')).toBeDisabled()
    act(() => {
      form?.setFieldValue('remarks', '修改备注')
      form?.submit()
    })
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({
        inventory_id: 'inventory-1',
        quantity: 20,
        remarks: '修改备注',
      }),
    )
  })
})
