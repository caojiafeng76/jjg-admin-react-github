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

    await user.click(screen.getByRole('button', { name: /添加明细/i }))

    // 找到明细 Modal 中的 number inputs 并手动填充
    const orderLengthInput = screen.getByRole('spinbutton', { name: /订单长度/ })
    const theoryWeightInput = screen.getByRole('spinbutton', { name: /理论米重/ })
    const actualLengthInput = screen.getByRole('spinbutton', { name: /实际产出长度/ })
    const actualWeightInput = screen.getByRole('spinbutton', { name: /实际支重/ })
    const actualQuantityInput = screen.getByRole('spinbutton', { name: /实际数量/ })
    const billetInputWeightInput = screen.getByRole('spinbutton', { name: /铝棒投入重量/ })

    await user.clear(actualQuantityInput)
    await user.type(orderLengthInput, '6000')
    await user.type(theoryWeightInput, '0.42')
    await user.type(actualLengthInput, '6500')
    await user.type(actualWeightInput, '2.5')
    await user.type(actualQuantityInput, '100')
    await user.type(billetInputWeightInput, '320')

    // 验证预览计算结果
    // 理论支数 = floor(6500/6000 * 100) = floor(1.083... * 100) = 108
    // 理论支重 = 108 * (6000/1000) * 0.42 = 108 * 6 * 0.42 = 272.16
    // 实际产出重量 = 100 * 2.5 = 250.00
    // 成材率 = (250/320) * 100 = 78.125 ≈ 78.13
    await waitFor(() => {
      expect(screen.getByTestId('preview-theoretical-count')).toHaveTextContent('108')
      expect(screen.getByTestId('preview-theoretical-weight')).toHaveTextContent('272.16')
      expect(screen.getByTestId('preview-actual-weight')).toHaveTextContent('250.00')
      expect(screen.getByTestId('preview-yield')).toHaveTextContent('78.13')
    })
  })
})
