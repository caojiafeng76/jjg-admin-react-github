import { useEffect, type ReactNode } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AppLayout from './AppLayout'

const { mockNavigate, routerState } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  routerState: {
    location: {
      pathname: '/',
      search: '',
      hash: '',
    },
    outlet: null as ReactNode,
  },
}))

vi.mock('react-router-dom', () => ({
  useLocation: () => routerState.location,
  useNavigate: () => mockNavigate,
  useOutlet: () => routerState.outlet,
}))

vi.mock('antd', () => {
  const Layout = Object.assign(
    ({ children }: { children: ReactNode }) => <div>{children}</div>,
    {
      Content: ({ children }: { children: ReactNode }) => (
        <main>{children}</main>
      ),
      Sider: ({ children }: { children: ReactNode }) => (
        <aside>{children}</aside>
      ),
    },
  )

  return {
    Layout,
    Skeleton: {
      Button: () => <div />,
    },
    Spin: () => <div>loading...</div>,
    Tabs: () => <div data-testid="page-tabs" />,
    message: {
      useMessage: () => [{ error: vi.fn() }, null],
    },
    theme: {
      useToken: () => ({
        token: {
          borderRadiusLG: 8,
          colorBgContainer: '#fff',
          colorBorderSecondary: '#ddd',
        },
      }),
    },
  }
})

vi.mock('@ui/MainMenu', () => ({
  default: () => <nav>menu</nav>,
}))

vi.mock('@ui/AppHeader', () => ({
  default: () => <header>header</header>,
}))

vi.mock('./AppLogo', () => ({
  default: () => <div>logo</div>,
}))

vi.mock('./EmployeeMobileLayout', () => ({
  default: () => <div>mobile layout</div>,
}))

vi.mock('@/contexts/useAuth', () => ({
  useAuth: () => ({
    clearError: vi.fn(),
    error: null,
    loading: false,
    role: 'admin',
  }),
}))

vi.mock('@/contexts/usePermissionContext', () => ({
  usePermissionContext: () => ({
    isLoading: false,
  }),
}))

vi.mock('@/utils/errorHandler', () => ({
  translateErrorMessage: (message: string) => message,
}))

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routerState.location = {
      pathname: '/',
      search: '',
      hash: '',
    }
    routerState.outlet = null
  })

  it('unmounts the root redirect outlet after navigating to a page', async () => {
    const onRootRedirectUnmount = vi.fn()

    function RootRedirectOutlet() {
      useEffect(() => onRootRedirectUnmount, [])
      return <div>root redirect outlet</div>
    }

    routerState.outlet = <RootRedirectOutlet />
    const { rerender } = render(<AppLayout />)

    expect(screen.getByText('root redirect outlet')).toBeInTheDocument()

    await act(async () => {
      routerState.location = {
        pathname: '/extrusion-production-order',
        search: '',
        hash: '',
      }
      routerState.outlet = <div>extrusion production outlet</div>
      rerender(<AppLayout />)
    })

    expect(screen.getByText('extrusion production outlet')).toBeInTheDocument()
    await waitFor(() => {
      expect(onRootRedirectUnmount).toHaveBeenCalledTimes(1)
    })
  })
})
