import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import type { FormInstance } from 'antd'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { JintanProfilesStockInFormValues } from '@/services/apiJintanProfilesStockIn'
import JintanProfilesStockInForm from './JintanProfilesStockInForm'

vi.mock('../ProfilesInventory/useJintanProfilesInventory', () => ({
  useJintanProfilesInventoryOptions: () => ({
    data: [
      {
        id: 'inventory-1',
        profile_model: 'YDJ222-166-1',
        profile_name: '120*120立柱',
        specification: '2000',
        material: '6063铝合金',
        quantity: 12,
      },
    ],
    isFetching: false,
    error: null,
  }),
}))

describe('金檀木业型材入库表单', () => {
  afterEach(cleanup)

  it('选中型材后显示资料与库存，并提交正整数数量', async () => {
    let form: FormInstance<JintanProfilesStockInFormValues> | undefined
    const onFinish = vi.fn()
    render(
      <JintanProfilesStockInForm
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
    expect(screen.getByText(/6063铝合金/)).toBeInTheDocument()

    act(() => form?.submit())
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({
        inventory_id: 'inventory-1',
        quantity: 3,
        remarks: '到货',
      }),
    )
  })

  it.each([0, -1, 1.5])('拦截无效数量 %s', async (quantity) => {
    let form: FormInstance<JintanProfilesStockInFormValues> | undefined
    const onFinish = vi.fn()
    render(
      <JintanProfilesStockInForm
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
      expect(screen.getByText('入库数量必须为正整数')).toBeInTheDocument(),
    )
    expect(onFinish).not.toHaveBeenCalled()
  })
})
