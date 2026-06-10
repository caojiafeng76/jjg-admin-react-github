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
        created_at: '2026-06-09T00:00:00.000Z',
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

  it('fills project snapshot and updates derived previews', async () => {
    const user = userEvent.setup()
    renderComponent()

    await user.click(screen.getByRole('button', { name: /添加明细/i }))

    await user.click(screen.getByLabelText('项目号'))
    const options = await screen.findAllByText('PRJ-001')
    await user.click(options[0])

    await waitFor(() => {
      expect(screen.getByDisplayValue('P-100')).toBeInTheDocument()
      expect(screen.getByDisplayValue('西尼')).toBeInTheDocument()
      expect(screen.getByDisplayValue('XM-01')).toBeInTheDocument()
      expect(screen.getByDisplayValue('6063-T5')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('理论米重(kg/m)'), '0.42')
    await user.type(screen.getByLabelText('实际产出长度(mm)'), '6500')
    await user.type(screen.getByLabelText('实际支重(kg)'), '2.5')
    await user.clear(screen.getByLabelText('实际数量'))
    await user.type(screen.getByLabelText('实际数量'), '100')
    await user.type(screen.getByLabelText('铝棒投入重量(kg)'), '320')

    await waitFor(() => {
      expect(screen.getByTestId('preview-theoretical-count')).toHaveTextContent('108')
      expect(screen.getByTestId('preview-theoretical-weight')).toHaveTextContent('272.16')
      expect(screen.getByTestId('preview-actual-weight')).toHaveTextContent('250.00')
      expect(screen.getByTestId('preview-yield')).toHaveTextContent('78.13')
    })
  })
})
