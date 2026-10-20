import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { JintanPartsInventory } from '@/services/apiJintanPartsInventory'
import JintanPartsInventoryTable from './JintanPartsInventoryTable'

function createRecord(
  overrides: Partial<JintanPartsInventory>,
): JintanPartsInventory {
  return {
    id: 'inventory-1',
    part_data_id: 'part-1',
    part_name: '压簧',
    specification: '1.6*16*82*14',
    material: 'SUS304',
    supplier: '蓝工',
    quantity: 20,
    remarks: '',
    unit_quantity: 14,
    safety_multiple: 10,
    safety_stock: 140,
    threshold_stock: 70,
    stock_status: 'danger',
    stock_status_rank: 0,
    created_at: '2026-10-20T00:00:00.000Z',
    updated_at: '2026-10-20T00:00:00.000Z',
    ...overrides,
  }
}

afterEach(cleanup)

describe('金檀木业配件库存表格', () => {
  it('库存数量按状态显示彩色标签，未设置时显示普通数字和 "-"', () => {
    render(
      <JintanPartsInventoryTable
        loading={false}
        data={[
          createRecord({}),
          createRecord({
            id: 'inventory-2',
            part_name: '防松螺母',
            quantity: 150,
            unit_quantity: 20,
            safety_stock: 200,
            threshold_stock: 100,
            stock_status: 'warning',
          }),
          createRecord({
            id: 'inventory-3',
            part_name: '十字沉头自攻螺钉',
            quantity: 2041,
            unit_quantity: 220,
            safety_stock: 2200,
            threshold_stock: 1100,
            stock_status: 'warning',
          }),
          createRecord({
            id: 'inventory-4',
            part_name: '膨胀螺栓',
            quantity: 320,
            unit_quantity: 32,
            safety_stock: 320,
            threshold_stock: 160,
            stock_status: 'safe',
          }),
          createRecord({
            id: 'inventory-5',
            part_name: '纸箱',
            quantity: 0,
            unit_quantity: null,
            safety_stock: null,
            threshold_stock: null,
            stock_status: 'unset',
          }),
        ]}
        selectedRowKeys={[]}
        onSelect={() => {}}
        page={1}
        pageSize={10}
      />,
    )

    const tagOf = (partName: string) =>
      (screen.getByText(partName).closest('tr') as HTMLElement).querySelector(
        '.ant-tag',
      )

    expect(tagOf('压簧')).toHaveClass('ant-tag-error')
    expect(tagOf('压簧')).toHaveTextContent('20')
    expect(tagOf('防松螺母')).toHaveClass('ant-tag-warning')
    expect(tagOf('十字沉头自攻螺钉')).toHaveClass('ant-tag-warning')
    expect(tagOf('膨胀螺栓')).toHaveClass('ant-tag-success')
    expect(tagOf('膨胀螺栓')).toHaveTextContent('320')

    const unsetRow = screen.getByText('纸箱').closest('tr') as HTMLElement
    expect(unsetRow.querySelector('.ant-tag')).toBeNull()
    expect(within(unsetRow).getAllByText('-').length).toBeGreaterThanOrEqual(3)
  })
})
