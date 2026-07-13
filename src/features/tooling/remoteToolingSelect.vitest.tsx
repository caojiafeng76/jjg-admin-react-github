import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { FormInstance } from 'antd'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ToolingStockIn } from '@/services/apiToolingStockIn'
import ToolingInventoryForm from './ToolingInventory/ToolingInventoryForm'
import ToolingStockInForm from './ToolingStockIn/ToolingStockInForm'
import ToolingStockOutForm from './ToolingStockOut/ToolingStockOutForm'

interface SelectOption {
  label: ReactNode
  value: string
}

interface CapturedSelectProps {
  loading?: boolean
  onChange?: (value: string, option?: SelectOption) => void
  options?: SelectOption[]
  placeholder?: ReactNode
  showSearch?:
    | boolean
    | {
        filterOption?: boolean
        onSearch?: (value: string) => void
      }
}

const selectMock = vi.hoisted(() => ({
  props: [] as CapturedSelectProps[],
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  return {
    ...actual,
    Select: (props: CapturedSelectProps) => {
      selectMock.props.push(props)
      return <div data-testid="select" />
    },
  }
})

const toolA = {
  id: 'tool-1',
  tool_code: 'T001',
  tool_name: '铣刀',
  tool_spec: 'D10',
  material: '合金',
  unit_price: 12.5,
}

const toolB = {
  id: 'tool-2',
  tool_code: 'T002',
  tool_name: '钻头',
  tool_spec: 'D8',
  material: '高速钢',
  unit_price: 8,
}

const freshToolA = {
  ...toolA,
  tool_name: '精铣刀',
  material: '硬质合金',
  unit_price: 18,
}

function latestToolingSelect(): CapturedSelectProps {
  const props = [...selectMock.props]
    .reverse()
    .find((candidate) => String(candidate.placeholder).includes('刀具资料'))

  if (!props) {
    throw new Error('未捕获到刀具资料 Select')
  }

  return props
}

function getRemoteSearchConfig(props: CapturedSelectProps) {
  if (!props.showSearch || typeof props.showSearch === 'boolean') {
    throw new Error('远程搜索配置缺失')
  }

  return props.showSearch
}

describe('tooling remote selects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    selectMock.props.length = 0
  })

  afterEach(() => {
    cleanup()
  })

  it('库存表单远程搜索后保留已选刀具标签', async () => {
    const onToolingSearch = vi.fn()
    let formRef: FormInstance | undefined
    const { rerender } = render(
      <ToolingInventoryForm
        onFinish={vi.fn()}
        setFormRef={(form) => {
          formRef = form
        }}
        isSubmitting={false}
        toolingOptions={[toolA]}
        isToolingOptionsLoading
        onToolingSearch={onToolingSearch}
      />,
    )

    const initialSelect = latestToolingSelect()
    const searchConfig = getRemoteSearchConfig(initialSelect)

    expect(searchConfig.filterOption).toBe(false)
    expect(searchConfig.onSearch).toEqual(expect.any(Function))
    expect(initialSelect.loading).toBe(true)

    act(() => {
      formRef?.setFieldValue('tooling_data_id', toolA.id)
      initialSelect.onChange?.(toolA.id, {
        value: toolA.id,
        label: `${toolA.tool_code} | ${toolA.tool_name} | ${toolA.tool_spec}`,
      })
      searchConfig.onSearch?.('钻头')
    })

    expect(onToolingSearch).toHaveBeenCalledWith('钻头')

    rerender(
      <ToolingInventoryForm
        onFinish={vi.fn()}
        setFormRef={vi.fn()}
        isSubmitting={false}
        toolingOptions={[toolB]}
        isToolingOptionsLoading={false}
        onToolingSearch={onToolingSearch}
      />,
    )

    await waitFor(() => {
      expect(latestToolingSelect().options).toEqual([
        {
          value: toolB.id,
          label: `${toolB.tool_code} | ${toolB.tool_name} | ${toolB.tool_spec}`,
        },
        {
          value: toolA.id,
          label: `${toolA.tool_code} | ${toolA.tool_name} | ${toolA.tool_spec}`,
        },
      ])
    })
    expect(
      latestToolingSelect().options?.filter(({ value }) => value === toolA.id),
    ).toHaveLength(1)
  })

  it('库存表单记住同 ID 的最新远程对象，搜索离开后不回退旧版本', async () => {
    const { rerender } = render(
      <ToolingInventoryForm
        onFinish={vi.fn()}
        setFormRef={vi.fn()}
        isSubmitting={false}
        toolingOptions={[toolA]}
        isToolingOptionsLoading={false}
        onToolingSearch={vi.fn()}
      />,
    )

    act(() => {
      latestToolingSelect().onChange?.(toolA.id)
    })

    rerender(
      <ToolingInventoryForm
        onFinish={vi.fn()}
        setFormRef={vi.fn()}
        isSubmitting={false}
        toolingOptions={[freshToolA]}
        isToolingOptionsLoading={false}
        onToolingSearch={vi.fn()}
      />,
    )
    rerender(
      <ToolingInventoryForm
        onFinish={vi.fn()}
        setFormRef={vi.fn()}
        isSubmitting={false}
        toolingOptions={[toolB]}
        isToolingOptionsLoading={false}
        onToolingSearch={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(latestToolingSelect().options).toEqual([
        {
          value: toolB.id,
          label: `${toolB.tool_code} | ${toolB.tool_name} | ${toolB.tool_spec}`,
        },
        {
          value: freshToolA.id,
          label: `${freshToolA.tool_code} | ${freshToolA.tool_name} | ${freshToolA.tool_spec}`,
        },
      ])
    })
  })

  it('入库编辑态在首页选项不含原刀具时保留完整快照', async () => {
    const initialValues: ToolingStockIn = {
      ...toolA,
      id: 'stock-in-1',
      tooling_data_id: toolA.id,
      status: '待审核',
      stock_in_quantity: 2,
      remarks: '',
      created_at: '2026-07-13T00:00:00Z',
      updated_at: '2026-07-13T00:00:00Z',
    }

    render(
      <ToolingStockInForm
        onFinish={vi.fn()}
        setFormRef={vi.fn()}
        isSubmitting={false}
        toolingOptions={[toolB]}
        initialValues={initialValues}
        isToolingOptionsLoading={false}
        onToolingSearch={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(latestToolingSelect().options).toEqual([
        {
          value: toolB.id,
          label: `${toolB.tool_code} | ${toolB.tool_name} | ${toolB.tool_spec}`,
        },
        {
          value: toolA.id,
          label: `${toolA.tool_code} | ${toolA.tool_name} | ${toolA.tool_spec}`,
        },
      ])
    })
    expect(screen.getByText(toolA.tool_name)).toBeInTheDocument()
    expect(screen.getByText(toolA.material)).toBeInTheDocument()
  })

  it('入库编辑态在远程命中同 ID 后保留刷新后的完整快照', async () => {
    const initialValues: ToolingStockIn = {
      ...toolA,
      id: 'stock-in-1',
      tooling_data_id: toolA.id,
      status: '待审核',
      stock_in_quantity: 2,
      remarks: '',
      created_at: '2026-07-13T00:00:00Z',
      updated_at: '2026-07-13T00:00:00Z',
    }
    const commonProps = {
      onFinish: vi.fn(),
      setFormRef: vi.fn(),
      isSubmitting: false,
      initialValues,
      isToolingOptionsLoading: false,
      onToolingSearch: vi.fn(),
    }
    const { rerender } = render(
      <ToolingStockInForm {...commonProps} toolingOptions={[]} />,
    )

    rerender(
      <ToolingStockInForm
        {...commonProps}
        toolingOptions={[freshToolA]}
      />,
    )
    rerender(
      <ToolingStockInForm {...commonProps} toolingOptions={[toolB]} />,
    )

    await waitFor(() => {
      expect(latestToolingSelect().options).toEqual([
        {
          value: toolB.id,
          label: `${toolB.tool_code} | ${toolB.tool_name} | ${toolB.tool_spec}`,
        },
        {
          value: freshToolA.id,
          label: `${freshToolA.tool_code} | ${freshToolA.tool_name} | ${freshToolA.tool_spec}`,
        },
      ])
    })
    await waitFor(() => {
      expect(screen.getByText(freshToolA.tool_name)).toBeInTheDocument()
      expect(screen.getByText(freshToolA.material)).toBeInTheDocument()
    })
  })

  it('出库表单将远程搜索、加载和完整选中对象透出', async () => {
    const onToolingSearch = vi.fn()
    const onToolingSelect = vi.fn()

    render(
      <ToolingStockOutForm
        onFinish={vi.fn()}
        setFormRef={vi.fn()}
        isSubmitting={false}
        toolingOptions={[toolA]}
        isToolingOptionsLoading
        onToolingSearch={onToolingSearch}
        onToolingSelect={onToolingSelect}
        machineOptions={[]}
        isMachineOptionsLoading={false}
      />,
    )

    const select = latestToolingSelect()
    const searchConfig = getRemoteSearchConfig(select)
    expect(searchConfig.filterOption).toBe(false)
    expect(select.loading).toBe(true)

    act(() => {
      searchConfig.onSearch?.('铣刀')
      select.onChange?.(toolA.id, {
        value: toolA.id,
        label: `${toolA.tool_code} | ${toolA.tool_name} | ${toolA.tool_spec}`,
      })
    })

    expect(onToolingSearch).toHaveBeenCalledWith('铣刀')
    await waitFor(() => {
      expect(onToolingSelect).toHaveBeenCalledWith(toolA)
    })
  })

  it('出库表单将同 ID 的最新远程对象同步给调用方并保留', async () => {
    const onToolingSelect = vi.fn()
    const commonProps = {
      onFinish: vi.fn(),
      setFormRef: vi.fn(),
      isSubmitting: false,
      isToolingOptionsLoading: false,
      onToolingSearch: vi.fn(),
      onToolingSelect,
      machineOptions: [],
      isMachineOptionsLoading: false,
    }
    const { rerender } = render(
      <ToolingStockOutForm {...commonProps} toolingOptions={[toolA]} />,
    )

    act(() => {
      latestToolingSelect().onChange?.(toolA.id)
    })
    rerender(
      <ToolingStockOutForm {...commonProps} toolingOptions={[freshToolA]} />,
    )

    await waitFor(() => {
      expect(onToolingSelect).toHaveBeenLastCalledWith(freshToolA)
    })

    rerender(
      <ToolingStockOutForm {...commonProps} toolingOptions={[toolB]} />,
    )
    await waitFor(() => {
      expect(latestToolingSelect().options).toEqual([
        expect.objectContaining({ value: toolB.id }),
        expect.objectContaining({
          value: freshToolA.id,
          label: `${freshToolA.tool_code} | ${freshToolA.tool_name} | ${freshToolA.tool_spec}`,
        }),
      ])
    })
  })
})
