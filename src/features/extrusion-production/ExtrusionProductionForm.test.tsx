import { describe, expect, it, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ExtrusionProductionForm from './ExtrusionProductionForm'

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({
        message: {
          warning: vi.fn(),
          success: vi.fn(),
          error: vi.fn(),
        },
      }),
    },
  }
})

vi.mock('./useExtrusionProductions', () => ({
  useExtrusionSalesOrdersProjectNos: () => ({
    data: [
      {
        project_no: 'PRJ-001',
        product_model: 'P-100',
        length_mm: 6000,
        material_code: '6063-T5',
        customer: '西尼',
        customer_model: 'XM-01',
        weight_per_meter_kg: 0.42,
        created_at: '2026-01-01T00:00:00Z',
      },
    ],
    isLoading: false,
  }),
}))

vi.mock('@/features/production-order/useMachineEquipmentOptions', () => ({
  useMachineEquipmentOptions: () => ({
    data: [
      {
        unified_device_no: 'M-01',
        machine_name: '挤压机 1',
      },
    ],
  }),
}))

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ExtrusionProductionForm
        open
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        currentUploader="tester@example.com"
      />
    </QueryClientProvider>,
  )
}

describe('ExtrusionProductionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calculates preview values correctly', async () => {
    const user = userEvent.setup()
    renderComponent()

    // 打开明细 Modal
    await user.click(screen.getByTestId('btn-add-item'))

    // 等待 Modal 渲染完成
    await waitFor(() => {
      expect(screen.queryByTestId('input-order-length')).not.toBeNull()
    })

    // AntD Select + disabled InputNumber 的交互较复杂，
    // 通过 openCreateItemModal 后的 resetFields + EMPTY_ITEM_DEFAULTS 确认表单就绪
    // 预览计算依赖 Form.useWatch，验证最终结果
    await user.clear(screen.getByTestId('input-order-length'))
    await user.type(screen.getByTestId('input-order-length'), '6000')

    await user.clear(screen.getByTestId('input-actual-length'))
    await user.type(screen.getByTestId('input-actual-length'), '6500')

    await user.clear(screen.getByTestId('input-actual-weight'))
    await user.type(screen.getByTestId('input-actual-weight'), '2.5')

    await user.clear(screen.getByTestId('input-actual-quantity'))
    await user.type(screen.getByTestId('input-actual-quantity'), '100')

    await user.clear(screen.getByTestId('input-billet-weight'))
    await user.type(screen.getByTestId('input-billet-weight'), '320')

    // 验证预览计算结果（理论米重字段 disabled，
    // 但若表单中有默认值时计算仍应正确）
    // 理论支数 = floor(6500/6000 * 100) = floor(1.083... * 100) = 108
    // 实际产出重量 = 100 * 2.5 = 250.00（不依赖理论米重）
    // 成材率 = (250/320) * 100 = 78.125 ≈ 78.13
    await waitFor(
      () => {
        expect(screen.getByTestId('preview-theoretical-count')).toHaveTextContent('108')
        expect(screen.getByTestId('preview-actual-weight')).toHaveTextContent('250.00')
        expect(screen.getByTestId('preview-yield')).toHaveTextContent('78.13')
      },
      { timeout: 3000 },
    )
  })
})
