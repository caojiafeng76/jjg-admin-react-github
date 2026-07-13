import type { ComponentType } from 'react'
import { act, createElement } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  inventoryProductOptionsHook,
  stockInProductOptionsHook,
  stockOutProductOptionsHook,
  rawStockInOptionsHook,
  rawStockOutOptionsHook,
  rawInventoryDetailHook,
  selectPropsSpy,
} = vi.hoisted(() => ({
  inventoryProductOptionsHook: vi.fn(),
  stockInProductOptionsHook: vi.fn(),
  stockOutProductOptionsHook: vi.fn(),
  rawStockInOptionsHook: vi.fn(),
  rawStockOutOptionsHook: vi.fn(),
  rawInventoryDetailHook: vi.fn(),
  selectPropsSpy: vi.fn(),
}))

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>()
  const { createElement } = await import('react')

  return {
    ...actual,
    Select: (props: Record<string, unknown>) => {
      selectPropsSpy(props)

      return createElement('input', {
        'aria-label': 'remote-option-select',
      })
    },
  }
})

vi.mock('./FinishedGoodsInventory/useYoumaiFinishedGoodsInventory', () => ({
  useYoumaiProductDataOptions: inventoryProductOptionsHook,
}))

vi.mock('./FinishedGoodsStockIn/useYoumaiFinishedGoodsStockIn', () => ({
  useYoumaiProductDataOptions: stockInProductOptionsHook,
}))

vi.mock('./FinishedGoodsStockOut/useYoumaiFinishedGoodsStockOut', () => ({
  useYoumaiProductDataOptions: stockOutProductOptionsHook,
}))

vi.mock('./RawMaterialStockIn/useYoumaiRawMaterialStockIn', () => ({
  useYoumaiRawMaterialInventoryOptions: rawStockInOptionsHook,
}))

vi.mock('./RawMaterialStockOut/useYoumaiRawMaterialStockOut', () => ({
  useYoumaiRawMaterialInventoryOptionsForStockOut: rawStockOutOptionsHook,
}))

vi.mock('./RawMaterialInventory/useYoumaiRawMaterialInventory', () => ({
  useYoumaiRawMaterialInventoryOption: rawInventoryDetailHook,
}))

import YoumaiFinishedGoodsInventoryForm from './FinishedGoodsInventory/YoumaiFinishedGoodsInventoryForm'
import YoumaiFinishedGoodsStockInForm from './FinishedGoodsStockIn/YoumaiFinishedGoodsStockInForm'
import YoumaiFinishedGoodsStockOutForm from './FinishedGoodsStockOut/YoumaiFinishedGoodsStockOutForm'
import YoumaiRawMaterialStockInForm from './RawMaterialStockIn/YoumaiRawMaterialStockInForm'
import YoumaiRawMaterialStockOutForm from './RawMaterialStockOut/YoumaiRawMaterialStockOutForm'

const productOption = {
  id: 'product-1',
  material_code: 'YM-001',
  material_name: '优迈踏板',
  model: 'M1',
  specification: '1000mm',
  specific_gravity: 1.25,
}

const rawOption = {
  id: 'raw-1',
  model: 'M8',
  specification: '8mm',
  quantity: 120,
}

interface FormCase {
  label: string
  component: ComponentType<any>
  optionsHook: ReturnType<typeof vi.fn>
}

const formCases: FormCase[] = [
  {
    label: '成品库存',
    component: YoumaiFinishedGoodsInventoryForm,
    optionsHook: inventoryProductOptionsHook,
  },
  {
    label: '成品入库',
    component: YoumaiFinishedGoodsStockInForm,
    optionsHook: stockInProductOptionsHook,
  },
  {
    label: '成品出库',
    component: YoumaiFinishedGoodsStockOutForm,
    optionsHook: stockOutProductOptionsHook,
  },
  {
    label: '原料入库',
    component: YoumaiRawMaterialStockInForm,
    optionsHook: rawStockInOptionsHook,
  },
  {
    label: '原料出库',
    component: YoumaiRawMaterialStockOutForm,
    optionsHook: rawStockOutOptionsHook,
  },
]

describe.each(formCases)('$label远程下拉', (formCase) => {
  beforeEach(() => {
    vi.clearAllMocks()
    rawInventoryDetailHook.mockReturnValue({
      data: undefined,
      isFetching: false,
    })
    formCase.optionsHook.mockReturnValue({
      data: formCase.label.startsWith('成品') ? [productOption] : [rawOption],
      isFetching: true,
    })
  })

  it('passes the search keyword to its hook and configures Select for remote filtering', async () => {
    render(
      createElement(formCase.component, {
        onFinish: vi.fn(),
        setFormRef: vi.fn(),
        isSubmitting: false,
      }),
    )

    expect(formCase.optionsHook).toHaveBeenCalledWith('')

    const selectProps = selectPropsSpy.mock.calls.at(-1)?.[0] as {
      loading?: boolean
      showSearch?: {
        filterOption?: boolean
        onSearch?: (keyword: string) => void
      }
    }

    expect(selectProps.showSearch).toEqual(
      expect.objectContaining({ filterOption: false }),
    )
    expect(selectProps.loading).toBe(true)
    expect(selectProps.showSearch?.onSearch).toBeTypeOf('function')

    act(() => selectProps.showSearch?.onSearch?.('  YM  '))

    await waitFor(() =>
      expect(formCase.optionsHook).toHaveBeenLastCalledWith('  YM  '),
    )
  })
})

describe('原料编辑快照', () => {
  const exactRawOption = {
    id: 'raw-over-1000',
    model: 'M1001',
    specification: '12mm',
    quantity: 987,
  }
  const editingRecord = {
    id: 'transaction-1',
    inventory_id: exactRawOption.id,
    model: exactRawOption.model,
    specification: exactRawOption.specification,
    quantity: 3,
    remarks: '',
    created_at: '2026-07-13T00:00:00Z',
    updated_at: '2026-07-13T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    rawStockInOptionsHook.mockReturnValue({
      data: [rawOption],
      isFetching: false,
    })
    rawStockOutOptionsHook.mockReturnValue({
      data: [rawOption],
      isFetching: false,
    })
    rawInventoryDetailHook.mockReturnValue({
      data: exactRawOption,
      isFetching: false,
    })
  })

  it('loads the exact inventory entity for stock-in and stock-out edit forms', async () => {
    const stockIn = render(
      <YoumaiRawMaterialStockInForm
        onFinish={vi.fn()}
        setFormRef={vi.fn()}
        isSubmitting={false}
        isEdit
        editingRecord={editingRecord}
      />,
    )

    expect(rawInventoryDetailHook).toHaveBeenCalledWith(exactRawOption.id)
    stockIn.unmount()

    render(
      <YoumaiRawMaterialStockOutForm
        onFinish={vi.fn()}
        setFormRef={vi.fn()}
        isSubmitting={false}
        isEdit
        editingRecord={editingRecord}
      />,
    )

    expect(rawInventoryDetailHook).toHaveBeenLastCalledWith(exactRawOption.id)
    expect(await screen.findByText('987')).toBeInTheDocument()
    expect(screen.queryByText('当前库存：3')).not.toBeInTheDocument()
  })
})
