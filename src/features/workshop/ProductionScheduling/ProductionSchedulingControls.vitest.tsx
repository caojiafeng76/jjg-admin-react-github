/* eslint-disable react-refresh/only-export-components */
import type {
  SchedulingFormValues,
  SearchFormValues,
} from './productionSchedulingUtils'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App, Form } from 'antd'

import { afterEach, describe, expect, it, vi } from 'vitest'
import ProductionSchedulingEditModal from './ProductionSchedulingEditModal'
import ProductionSchedulingHeader from './ProductionSchedulingHeader'
import ProductionSchedulingSearchBar from './ProductionSchedulingSearchBar'
import ProductionSchedulingSummaryBar from './ProductionSchedulingSummaryBar'

vi.mock('@/hooks/usePermission', () => ({ usePermission: () => true }))
vi.mock('@/hooks/useViewerOperationGuard', () => ({
  useViewerOperationGuard: () => ({
    viewerDenied: false,
    viewerOperationTip: '',
  }),
}))

function SearchBarHarness({
  onSearch,
  onReset,
}: {
  onSearch: (values: SearchFormValues) => void
  onReset: () => void
}) {
  const [form] = Form.useForm<SearchFormValues>()

  return (
    <ProductionSchedulingSearchBar
      form={form}
      lengthOptions={[1200]}
      onSearch={onSearch}
      onReset={onReset}
    />
  )
}

function EditModalHarness({
  onCancel,
  onOk,
}: {
  onCancel: () => void
  onOk: () => void
}) {
  const [form] = Form.useForm<SchedulingFormValues>()

  return (
    <ProductionSchedulingEditModal
      open
      form={form}
      editingOrder={null}
      confirmLoading={false}
      employees={[]}
      machineSelectOptions={[]}
      onCancel={onCancel}
      onOk={onOk}
    />
  )
}

const EMPTY_SUMMARY = {
  delayedOrders: 0,
  finishedOrders: 0,
  inProgressOrders: 0,
  totalOrders: 2,
  totalQuantity: 30,
}

describe('订单排产页面子组件回调', () => {
  afterEach(() => {
    cleanup()
  })

  it('快速筛选标签回调对应进度，"全部"回调 null', async () => {
    const user = userEvent.setup()
    const onProgressStatusChange = vi.fn()

    render(
      <ProductionSchedulingHeader
        progressStatus="进行中"
        onProgressStatusChange={onProgressStatusChange}
      />,
    )

    await user.click(screen.getByText('延期'))
    expect(onProgressStatusChange).toHaveBeenLastCalledWith('延期')

    await user.click(screen.getByText('全部'))
    expect(onProgressStatusChange).toHaveBeenLastCalledWith(null)
  })

  it('搜索栏提交表单值并带默认状态，重置按钮回调 onReset', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    const onReset = vi.fn()

    render(
      <App>
        <SearchBarHarness onSearch={onSearch} onReset={onReset} />
      </App>,
    )

    await user.type(
      screen.getAllByPlaceholderText('多关键词用空格分隔')[0],
      'P001',
    )
    await user.click(screen.getByRole('button', { name: /查询/ }))

    await waitFor(() =>
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({ projectNo: 'P001', status: '生产中' }),
      ),
    )

    await user.click(screen.getByRole('button', { name: /重置/ }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('汇总条显示统计与选中导出文案，导出和刷新触发回调', async () => {
    const user = userEvent.setup()
    const onExport = vi.fn()
    const onRefresh = vi.fn()

    render(
      <App>
        <ProductionSchedulingSummaryBar
          summary={EMPTY_SUMMARY}
          hasSelection
          selectedCount={1}
          isFetching={false}
          onExport={onExport}
          onPreload={vi.fn()}
          onRefresh={onRefresh}
        />
      </App>,
    )

    expect(screen.getByText('已选 1 条')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /导出选中 \(1\)/ }))
    expect(onExport).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: '刷新排产列表' }))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('编辑弹窗的保存与取消分别回调 onOk 和 onCancel', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const onOk = vi.fn()

    render(
      <App>
        <EditModalHarness onCancel={onCancel} onOk={onOk} />
      </App>,
    )

    expect(screen.getByText('编辑订单排产')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /保\s*存/ }))
    expect(onOk).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /取\s*消/ }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
