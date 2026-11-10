import type { FormInstance } from 'antd'
import type { SyneyMaterialsStockFormValues } from '@/services/apiSyneyMaterialsStock'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SyneyMaterialsStockForm from './SyneyMaterialsStockForm'

vi.mock('../Inventory/useSyneyMaterialsInventory', () => ({
  useSyneyMaterialsInventoryOptions: () => ({
    data: [
      {
        id: 'inventory-1',
        material_name: '钢板',
        specification: '2mm',
        unit: '张',
        quantity: 12,
      },
    ],
    isFetching: false,
    error: null,
  }),
}))

function renderForm(
  direction: 'in' | 'out',
  extra: Partial<Parameters<typeof SyneyMaterialsStockForm>[0]> = {},
) {
  let form: FormInstance<SyneyMaterialsStockFormValues> | undefined
  const onFinish = vi.fn()
  render(
    <SyneyMaterialsStockForm
      direction={direction}
      onFinish={onFinish}
      setFormRef={(instance) => {
        form = instance
      }}
      isSubmitting={false}
      {...extra}
    />,
  )
  return { getForm: () => form, onFinish }
}

describe('西尼材料出入库表单', () => {
  afterEach(cleanup)

  it('选中材料后显示单位与当前库存，并提交', async () => {
    const { getForm, onFinish } = renderForm('in')

    act(() =>
      getForm()?.setFieldsValue({ inventory_id: 'inventory-1', quantity: 30, remarks: '到货' }),
    )
    await waitFor(() =>
      expect(screen.getByText(/当前库存：12 张/)).toBeInTheDocument(),
    )

    act(() => getForm()?.submit())
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({
        inventory_id: 'inventory-1',
        quantity: 30,
        remarks: '到货',
      }),
    )
  })

  it.each([0, 1.5, 13])('出库拦截无效或超库存数量 %s', async (quantity) => {
    const { getForm, onFinish } = renderForm('out')

    act(() =>
      getForm()?.setFieldsValue({ inventory_id: 'inventory-1', quantity, remarks: '' }),
    )
    act(() => getForm()?.submit())

    await waitFor(() =>
      expect(getForm()?.getFieldError('quantity').length).toBeGreaterThan(0),
    )
    expect(onFinish).not.toHaveBeenCalled()
  })

  it('快捷建单按锁定库存行校验上限', async () => {
    const { getForm, onFinish } = renderForm('out', {
      quickInventory: { id: 'inventory-9', label: '钢板 / 2mm（张）（库存 3）', quantity: 3 },
    })

    expect(screen.getByDisplayValue('钢板 / 2mm（张）（库存 3）')).toBeInTheDocument()
    act(() => getForm()?.setFieldsValue({ quantity: 4 }))
    act(() => getForm()?.submit())

    await waitFor(() =>
      expect(getForm()?.getFieldError('quantity')).toContain('库存不足，当前库存为 3'),
    )
    expect(onFinish).not.toHaveBeenCalled()
  })

  it('入库不受当前库存限制', async () => {
    const { getForm, onFinish } = renderForm('in', {
      quickInventory: { id: 'inventory-9', label: '钢板', quantity: 0 },
    })

    act(() => getForm()?.setFieldsValue({ quantity: 50 }))
    act(() => getForm()?.submit())

    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({
        inventory_id: 'inventory-9',
        quantity: 50,
        remarks: '',
      }),
    )
  })
})
