import type { ComponentProps } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from 'antd'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ProductionOrderForm from './ProductionOrderForm'

vi.mock('@/contexts/useAuth', () => ({
  useAuth: () => ({ role: 'admin' }),
}))

vi.mock('./useProcessStandards', () => ({
  useOperationsByModel: () => ({ data: undefined }),
  useSalesOrderByProjectNo: () => ({ data: undefined }),
  useSalesOrdersProjectNos: () => ({ data: [], isLoading: false }),
}))

vi.mock('./useMachineEquipmentOptions', () => ({
  useMachineEquipmentOptions: () => ({ data: [] }),
}))

vi.mock('./ProjectNoScanButton', () => ({
  default: () => null,
}))

type FormProps = ComponentProps<typeof ProductionOrderForm>

function renderForm(props: Partial<FormProps> = {}) {
  const onSubmit = vi.fn()

  render(
    <App>
      <ProductionOrderForm
        open
        onCancel={vi.fn()}
        onSubmit={onSubmit}
        employees={[{ id: 'e1', name: '张三' }]}
        fixedEmployee={null}
        {...props}
      />
    </App>,
  )

  return { onSubmit }
}

const existingOrder = {
  id: 'order-1',
  order_date: '2026-10-01',
  employee_id: 'e1',
  shift: '白班',
  work_hours: 11,
  extra_qualified_hours: 0,
  is_audited: false,
  remark: null,
  items: [
    {
      id: 'item-1',
      data_category: 'A',
      project_no: 'P-001',
      product_model: 'M-1',
      length_mm: 1200,
      customer_model: null,
      operation: 'CNC',
      standard_seconds: 10,
      theoretical_seconds: 9,
      incoming_qualified_quantity: 0,
      qualified_quantity: 0,
      defect_reason_1: null,
      defect_quantity_1: 0,
      defect_reason_2: null,
      defect_quantity_2: 0,
      outsource_defect_quantity: 0,
      outsource_defect_reason: null,
      outsource_unit: null,
      setup_defect_quantity: 0,
      setup_responsible: null,
      remark: null,
      machine_equipment_id: null,
    },
  ],
} as unknown as NonNullable<FormProps['initialValues']>

// 覆盖率模式下 antd Modal + userEvent 交互偶发超过默认 5s，单独放宽
describe('ProductionOrderForm 拆分后的组件连接', { timeout: 15_000 }, () => {
  afterEach(() => {
    cleanup()
  })

  it('桌面模式渲染基础字段与工序表格，并可打开添加工序弹窗', async () => {
    const user = userEvent.setup()
    renderForm()

    expect(screen.getByText('操作人')).toBeInTheDocument()
    expect(screen.getByText('工序明细')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /添加工序/ }))

    expect(
      await screen.findByText('添加工序', { selector: '.ant-modal-title' }),
    ).toBeInTheDocument()
  })

  it('桌面模式可编辑已有工序并打开编辑弹窗', async () => {
    const user = userEvent.setup()
    renderForm({ initialValues: existingOrder })

    await user.click(await screen.findByLabelText('编辑工序 CNC'))

    expect(
      await screen.findByText('编辑工序', { selector: '.ant-modal-title' }),
    ).toBeInTheDocument()
  })

  it('桌面模式删除工序后该行从表格中移除', async () => {
    const user = userEvent.setup()
    renderForm({ initialValues: existingOrder })

    await user.click(await screen.findByLabelText('删除工序 CNC'))
    await user.click(await screen.findByRole('button', { name: '确认删除' }))

    await waitFor(() =>
      expect(screen.queryByLabelText('删除工序 CNC')).not.toBeInTheDocument(),
    )
  })

  it('紧凑创建模式通过移动端列表添加工序', async () => {
    const user = userEvent.setup()
    renderForm({ compact: true })

    await user.click(screen.getByRole('button', { name: '添加' }))

    expect(
      await screen.findByText('添加工序', { selector: '.ant-modal-title' }),
    ).toBeInTheDocument()
  })
})
