import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from 'antd'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SafePartSettingPage from './SafePartSettingPage'

const settings = vi.hoisted(() => [
  {
    id: 'sp-1',
    part_no: 'XN2808EB',
    name: '梳齿支撑板',
    part_model: 'YD1001XN',
    part_code_prefix: 'ZC00',
    english_name: 'COMB PLATE',
    need_print_label: true,
    is_safe_part: false,
    decomposition_role: 'rear_upper',
    remark: null,
    drawing_file_path: null,
    drawing_file_name: null,
    drawing_file_mime_type: null,
  },
])

vi.mock('../useSyneySafePartSettings', () => ({
  SYNEY_SAFE_PART_SETTINGS_KEY: 'syney_safe_part_settings',
  useSyneySafePartSettings: () => ({
    data: settings,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('@services/apiSyneySafePartSettings', () => ({
  SAFE_PART_DRAWING_ACCEPT: '.pdf,.png,.jpg',
  deleteSyneySafePartSettings: vi.fn(),
  getSyneySafePartDrawingDownloadUrl: vi.fn(),
  getSyneySafePartDrawingPreviewUrl: vi.fn(),
  uploadSyneySafePartDrawing: vi.fn(),
  upsertSyneySafePartSetting: vi.fn(),
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <App>
        <SafePartSettingPage />
      </App>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
})

describe('SafePartSettingPage', { timeout: 15_000 }, () => {
  it('渲染件号配置行：是否徽标、分解单列与无图纸时禁用查看下载', () => {
    renderPage()

    const row = screen.getByText('XN2808EB').closest('tr')
    expect(row).toBeTruthy()
    const cells = within(row as HTMLElement)

    expect(cells.getByText('梳齿支撑板')).toBeTruthy()
    expect(cells.getByText('是')).toBeTruthy()
    expect(cells.getByText('否')).toBeTruthy()
    expect(cells.getByText('上后板')).toBeTruthy()
    expect(cells.getByRole('button', { name: /上传/ })).toBeTruthy()
    expect(
      (cells.getByRole('button', { name: /查看/ }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(
      (cells.getByRole('button', { name: /下载/ }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(screen.getByText('共 1 条')).toBeTruthy()
  })

  it('点击编辑打开弹窗并回填件号（编辑时件号不可改）', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /编\s*辑/ }))

    expect(await screen.findByText('编辑件号配置')).toBeTruthy()
    const partNoInput = screen.getByPlaceholderText('如 XN2808EB') as HTMLInputElement
    expect(partNoInput.value).toBe('XN2808EB')
    expect(partNoInput.disabled).toBe(true)
  })

  it('件号筛选为前端过滤', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByPlaceholderText('搜索件号（前端过滤）'), 'ZZZ')

    expect(screen.queryByText('XN2808EB')).toBeNull()
    expect(screen.getByText('共 0 条')).toBeTruthy()
  })
})
