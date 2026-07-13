import { type ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PageTabs from './PageTabs'

const { mockNavigate, routerState } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  routerState: {
    location: {
      pathname: '/material-transfer',
      search: '',
      hash: '',
    },
  },
}))

interface MockTabItem {
  key: string
  label: ReactNode
  closable?: boolean
}

interface MockTabsProps {
  items?: MockTabItem[]
}

vi.mock('react-router-dom', () => ({
  useLocation: () => routerState.location,
  useNavigate: () => mockNavigate,
}))

vi.mock('antd', () => ({
  Skeleton: {
    Button: () => <div />,
  },
  Tabs: ({ items = [] }: MockTabsProps) => (
    <div>
      {items.map((item) => (
        <div key={item.key} data-testid={`tab-${item.key}`}>
          {item.label}
        </div>
      ))}
    </div>
  ),
  theme: {
    useToken: () => ({
      token: {
        colorBgContainer: '#fff',
        colorBorderSecondary: '#ddd',
      },
    }),
  },
}))

vi.mock('@/config/access', () => ({
  getDefaultHomeByRole: () => '/dashboard',
}))

vi.mock('@/contexts/useAuth', () => ({
  useAuth: () => ({
    loading: false,
    role: 'admin',
  }),
}))

vi.mock('@/routes/routeLabels', () => ({
  getRouteLabel: (key: string) =>
    ({
      '/dashboard': '首页',
      '/material-transfer': '物料转移单',
    })[key] || key,
}))

describe('PageTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routerState.location = {
      pathname: '/material-transfer',
      search: '',
      hash: '',
    }
  })

  it('closes a closable tab with middle click', async () => {
    render(<PageTabs />)

    const materialTransferTab = await screen.findByTitle('物料转移单')

    fireEvent(
      materialTransferTab,
      new MouseEvent('auxclick', { bubbles: true, button: 1 }),
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('keeps at most eight tabs and evicts the least recently visited page', async () => {
    const { container, rerender } = render(<PageTabs />)

    for (let page = 2; page <= 7; page += 1) {
      routerState.location = {
        pathname: `/page-${page}`,
        search: '',
        hash: '',
      }
      rerender(<PageTabs />)
      await screen.findByTestId(`tab-/page-${page}`)
    }

    routerState.location = {
      pathname: '/material-transfer',
      search: '',
      hash: '',
    }
    rerender(<PageTabs />)
    await screen.findByTestId('tab-/material-transfer')

    routerState.location = {
      pathname: '/page-8',
      search: '',
      hash: '',
    }
    rerender(<PageTabs />)

    await waitFor(() => {
      expect(container.querySelectorAll('[data-testid^="tab-"]')).toHaveLength(
        8,
      )
      expect(screen.getByTestId('tab-/material-transfer')).toBeInTheDocument()
      expect(screen.queryByTestId('tab-/page-2')).not.toBeInTheDocument()
      expect(screen.getByTestId('tab-/page-8')).toBeInTheDocument()
    })
  })
})
