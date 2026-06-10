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
    data: [],
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

    // 填充表单字段
    await user.clear(screen.getByTestId('input-order-length'))
    await user.type(screen.getByTestId('input-order-length'), '6000')

    await user.clear(screen.getByTestId('input-theory-weight'))
    await user.type(screen.getByTestId('input-theory-weight'), '0.42')

    await user.clear(screen.getByTestId('input-actual-length'))
    await user.type(screen.getByTestId('input-actual-length'), '6500')

    await user.clear(screen.getByTestId('input-actual-weight'))
    await user.type(screen.getByTestId('input-actual-weight'), '2.5')

    await user.clear(screen.getByTestId('input-actual-quantity'))
    await user.type(screen.getByTestId('input-actual-quantity'), '100')

    await user.clear(screen.getByTestId('input-billet-weight'))
    await user.type(screen.getByTestId('input-billet-weight'), '320')

    // 验证预览计算结果
    // 理论支数 = floor(6500/6000 * 100) = floor(1.083... * 100) = 108
    // 理论支重 = 108 * (6000/1000) * 0.42 = 108 * 6 * 0.42 = 272.16
    // 实际产出重量 = 100 * 2.5 = 250.00
    // 成材率 = (250/320) * 100 = 78.125 ≈ 78.13
    await waitFor(
      () => {
        expect(screen.getByTestId('preview-theoretical-count')).toHaveTextContent('108')
        expect(screen.getByTestId('preview-theoretical-weight')).toHaveTextContent('272.16')
        expect(screen.getByTestId('preview-actual-weight')).toHaveTextContent('250.00')
        expect(screen.getByTestId('preview-yield')).toHaveTextContent('78.13')
      },
      { timeout: 3000 },
    )
  })
})
