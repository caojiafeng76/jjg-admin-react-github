import type { FormInstance } from 'antd'
import type { WorkshopMiscMaterialsStockFormValues } from '@/services/apiWorkshopMiscMaterialsStock'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import WorkshopMiscMaterialsStockForm from './WorkshopMiscMaterialsStockForm'

vi.mock('../Inventory/useWorkshopMiscMaterialsInventory', () => ({
  useWorkshopMiscMaterialsInventoryOptions: () => ({
    data: [
      {
        id: 'inventory-1',
        model: '196-A01',
        customer_model: 'C-196',
        specification: '2mm',
        category: '铝材',
        raw_material_quantity: 12,
        semi_finished_quantity: 5,
        finished_quantity: 3,
        total_quantity: 20,
      },
    ],
    isFetching: false,
    error: null,
  }),
}))

function renderForm(
  direction: 'in' | 'out',
  extra: Partial<Parameters<typeof WorkshopMiscMaterialsStockForm>[0]> = {},
) {
  let form: FormInstance<WorkshopMiscMaterialsStockFormValues> | undefined
  const onFinish = vi.fn()
  render(
    <WorkshopMiscMaterialsStockForm
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

describe('车间杂项材料出入库表单', () => {
  afterEach(cleanup)

  it('选中材料后显示三项库存与合计，并支持同时填写三项数量入库', async () => {
    const { getForm, onFinish } = renderForm('in')

    act(() =>
      getForm()?.setFieldsValue({
        inventory_id: 'inventory-1',
        raw_material_quantity: 10,
        semi_finished_quantity: 4,
        finished_quantity: 2,
        remarks: '到货',
      }),
    )
    await waitFor(() => {
      expect(screen.getByText(/原材料库存/)).toBeInTheDocument()
      expect(screen.getByText(/当前合计/)).toBeInTheDocument()
      expect(screen.getByText('16')).toBeInTheDocument()
    })

    act(() => getForm()?.submit())
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({
        inventory_id: 'inventory-1',
        raw_material_quantity: 10,
        semi_finished_quantity: 4,
        finished_quantity: 2,
        remarks: '到货',
      }),
    )
  })

  it('三项全为 0 时阻止提交', async () => {
    const { getForm, onFinish } = renderForm('in')

    act(() =>
      getForm()?.setFieldsValue({
        inventory_id: 'inventory-1',
        raw_material_quantity: 0,
        semi_finished_quantity: 0,
        finished_quantity: 0,
        remarks: '',
      }),
    )
    act(() => getForm()?.submit())

    await waitFor(() =>
      expect(getForm()?.getFieldError('raw_material_quantity')).toContain(
        '请至少填写一项大于 0 的入库数量',
      ),
    )
    expect(onFinish).not.toHaveBeenCalled()
  })

  it('只填写半成品数量时允许提交', async () => {
    const { getForm, onFinish } = renderForm('in')

    act(() =>
      getForm()?.setFieldsValue({
        inventory_id: 'inventory-1',
        raw_material_quantity: 0,
        semi_finished_quantity: 6,
        finished_quantity: 0,
        remarks: '',
      }),
    )
    act(() => getForm()?.submit())

    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({
        inventory_id: 'inventory-1',
        raw_material_quantity: 0,
        semi_finished_quantity: 6,
        finished_quantity: 0,
        remarks: '',
      }),
    )
  })

  it('出库逐项校验原材料、半成品、成品库存上限', async () => {
    const { getForm, onFinish } = renderForm('out', {
      quickInventory: {
        id: 'inventory-9',
        label: '196-A01 / C-196 / 2mm（库存 9）',
        raw_material_quantity: 2,
        semi_finished_quantity: 3,
        finished_quantity: 4,
        total_quantity: 9,
      },
    })

    expect(
      screen.getByDisplayValue('196-A01 / C-196 / 2mm（库存 9）'),
    ).toBeInTheDocument()

    act(() =>
      getForm()?.setFieldsValue({
        raw_material_quantity: 1,
        semi_finished_quantity: 5,
        finished_quantity: 6,
      }),
    )
    act(() => getForm()?.submit())

    await waitFor(() => {
      expect(getForm()?.getFieldError('semi_finished_quantity')).toContain(
        '半成品库存不足，当前库存为 3',
      )
      expect(getForm()?.getFieldError('finished_quantity')).toContain(
        '成品库存不足，当前库存为 4',
      )
    })
    expect(onFinish).not.toHaveBeenCalled()
  })
})
