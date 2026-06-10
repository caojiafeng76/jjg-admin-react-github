import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

import {
  PermissionProtectedRoute,
  RoleHomeRedirect,
} from './RouteGuards'

const mockUseAuth = vi.fn()
const mockUsePermissionContext = vi.fn()
const mockUseLocation = vi.fn()

vi.mock('@/contexts', () => ({
  useAuth: () => mockUseAuth(),
  usePermissionContext: () => mockUsePermissionContext(),
}))

vi.mock('@ui/Loading', () => ({
  default: () => <div>loading...</div>,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )

  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
    useLocation: () => mockUseLocation(),
  }
})

describe('RouteGuards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLocation.mockReturnValue({
      pathname: '/production-order',
      search: '',
      hash: '',
    })
  })

  it('keeps PermissionProtectedRoute in loading state while permissions are loading', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      loading: false,
      role: 'admin',
      employeeProfile: { is_active: true },
    })
    mockUsePermissionContext.mockReturnValue({
      isLoading: true,
      can: vi.fn().mockReturnValue(false),
      permissions: {},
    })

    render(
      <PermissionProtectedRoute
        element={<div>protected content</div>}
        permissionKey="page:production-order:view"
      />,
    )

    expect(screen.getByText('loading...')).toBeInTheDocument()
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('redirects PermissionProtectedRoute to access denied after permissions finish loading without access', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      loading: false,
      role: 'admin',
      employeeProfile: { is_active: true },
    })
    mockUsePermissionContext.mockReturnValue({
      isLoading: false,
      can: vi.fn().mockReturnValue(false),
      permissions: {},
    })

    render(
      <PermissionProtectedRoute
        element={<div>protected content</div>}
        permissionKey="page:production-order:view"
      />,
    )

    expect(screen.getByTestId('navigate')).toHaveTextContent('/access-denied')
  })

  it('lets RoleHomeRedirect resolve even when permissions are empty after loading', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      loading: false,
      role: 'guest',
      employeeProfile: { is_active: true },
    })
    mockUsePermissionContext.mockReturnValue({
      isLoading: false,
      permissions: {},
      can: vi.fn(),
      canAll: vi.fn(),
    })

    render(<RoleHomeRedirect />)

    expect(await screen.findByTestId('navigate')).toHaveTextContent('/access-denied')
  })
})
