import { describe, expect, it, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ExtrusionProductionForm from './ExtrusionProductionForm'

const EXTRUSION_MACHINE_ID = '550e8400-e29b-41d4-a716-446655440000'

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
        id: EXTRUSION_MACHINE_ID,
        unified_device_no: 'JY-1000T',
        operation: '挤压',
        machine_name: '1000T',
      },
    ],
    isLoading: false,
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

  it('calculates billet weight preview automatically', async () => {
    const user = userEvent.setup()
    renderComponent()

    // 打开明细 Modal
    await user.click(screen.getByTestId('btn-add-item'))

    // 等待 Modal 渲染完成
    await waitFor(() => {
      expect(screen.queryByTestId('input-order-length')).not.toBeNull()
    })

    // 铝棒投入重量字段应该被禁用（自动计算，无需用户输入）
    const billetWeightInput = screen.getByTestId('input-billet-weight')
    expect(billetWeightInput).toBeDisabled()

    // 预览区域应该显示铝棒投入重量
    expect(screen.getByTestId('preview-billet-weight')).toBeInTheDocument()
  })
})
