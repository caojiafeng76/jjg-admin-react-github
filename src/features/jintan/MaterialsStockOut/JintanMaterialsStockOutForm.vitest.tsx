import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import type { FormInstance } from 'antd'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { JintanMaterialsStockOutFormValues } from '@/services/apiJintanMaterialsStockOut'
import JintanMaterialsStockOutForm from './JintanMaterialsStockOutForm'

vi.mock('../MaterialsInventory/useJintanMaterialsInventory', () => ({
  useJintanMaterialsInventoryOptions: () => ({
    data: [
      {
        id: 'inventory-1',
        material_model: 'YDJ222-166-1',
        material_name: '120*120立柱',
        specification: '2000',
        material: '6063铝合金',
        quantity: 12,
      },
    ],
    isFetching: false,
    error: null,
  }),
}))

describe('金檀木业素材出库表单', () => {
  afterEach(cleanup)

  it('选中素材后显示资料与库存，并提交正整数数量', async () => {
    let form: FormInstance<JintanMaterialsStockOutFormValues> | undefined
    const onFinish = vi.fn()
    render(
      <JintanMaterialsStockOutForm
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
        remarks: '领料',
      }),
    )
    await waitFor(() =>
      expect(screen.getByText(/当前库存：12/)).toBeInTheDocument(),
    )
    expect(screen.getByText(/6063铝合金/)).toBeInTheDocument()

    act(() => form?.submit())
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({
        inventory_id: 'inventory-1',
        quantity: 3,
        remarks: '领料',
      }),
    )
  })

  it.each([0, -1, 1.5, 13])('拦截无效或超库存数量 %s', async (quantity) => {
    let form: FormInstance<JintanMaterialsStockOutFormValues> | undefined
    const onFinish = vi.fn()
    render(
      <JintanMaterialsStockOutForm
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

  it('编辑时锁定素材和数量，低库存不阻止修改历史记录备注', async () => {
    let form: FormInstance<JintanMaterialsStockOutFormValues> | undefined
    const onFinish = vi.fn()
    render(
      <JintanMaterialsStockOutForm
        onFinish={onFinish}
        setFormRef={(instance) => {
          form = instance
        }}
        isSubmitting={false}
        editingRecord={{
          id: 'record-1',
          inventory_id: 'inventory-1',
          quantity: 20,
          material_model: 'YDJ222-166-1',
          material_name: '120*120立柱',
          specification: '2000',
          material: '6063铝合金',
          remarks: '',
          created_at: '2026-10-05T00:00:00Z',
          updated_at: '2026-10-05T00:00:00Z',
        }}
      />,
    )
    expect(
      screen.getByDisplayValue('YDJ222-166-1 / 120*120立柱 / 2000'),
    ).toBeDisabled()
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
