import { act, render, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PackagingWorkOrderBatch } from '@/services/apiPackagingWorkOrders'
import WorkOrderForm from './WorkOrderForm'
import WorkOrderSearch from './WorkOrderSearch'

interface EmployeeOption {
  id: string
  name: string
  username: string
}

interface SelectOption {
  label: ReactNode
  value: string
}

interface CapturedSelectProps {
  loading?: boolean
  onChange?: (
    value: string | string[],
    option?: SelectOption | SelectOption[],
  ) => void
  onClear?: () => void
  onSelect?: (value: string, option: SelectOption) => void
  options?: SelectOption[]
  placeholder?: string
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

const employeeOptionsMock = vi.hoisted(() => ({
  calls: [] as Array<string | undefined>,
  itemsByKeyword: new Map<string, EmployeeOption[]>(),
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({
        message: {
          error: vi.fn(),
          success: vi.fn(),
          warning: vi.fn(),
        },
      }),
    },
    Select: (props: CapturedSelectProps) => {
      selectMock.props.push(props)
      return <div data-testid={`select-${String(props.placeholder)}`} />
    },
  }
})

vi.mock('./useWorkOrders', () => ({
  usePackagingEmployeeOptions: (keyword?: string) => {
    employeeOptionsMock.calls.push(keyword)
    const normalizedKeyword = keyword?.trim() ?? ''

    return {
      data: {
        items: employeeOptionsMock.itemsByKeyword.get(normalizedKeyword) ?? [],
      },
      isFetching: Boolean(normalizedKeyword),
    }
  },
  usePackagingSalesOrdersProjectNos: () => ({ data: [] }),
}))

function latestSelect(placeholder: string): CapturedSelectProps {
  const props = [...selectMock.props]
    .reverse()
    .find((candidate) => candidate.placeholder === placeholder)

  if (!props) {
    throw new Error(`未捕获到 Select：${placeholder}`)
  }

  return props
}

function getRemoteSearchConfig(props: CapturedSelectProps) {
  if (!props.showSearch || typeof props.showSearch === 'boolean') {
    throw new Error('远程搜索配置缺失')
  }

  return props.showSearch
}

describe('packaging work-order remote employee selects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    selectMock.props.length = 0
    employeeOptionsMock.calls.length = 0
    employeeOptionsMock.itemsByKeyword.clear()
  })

  it('searches employees remotely and retains the selected option across results', async () => {
    employeeOptionsMock.itemsByKeyword.set('', [
      { id: 'employee-1', name: '张三', username: 'zhangsan' },
    ])
    employeeOptionsMock.itemsByKeyword.set('远程关键字', [
      { id: 'employee-2', name: '李四', username: 'lisi' },
    ])

    render(
      <WorkOrderSearch
        onReset={vi.fn()}
        onSearch={vi.fn()}
        initialValues={{}}
      />,
    )

    const initialSelect = latestSelect('选择人员')
    const initialSearch = getRemoteSearchConfig(initialSelect)

    expect(initialSearch.filterOption).toBe(false)
    expect(initialSearch.onSearch).toEqual(expect.any(Function))
    expect(initialSelect.loading).toBe(false)

    act(() => {
      const selected = { label: '张三', value: 'employee-1' }
      initialSelect.onSelect?.('employee-1', selected)
      initialSelect.onChange?.('employee-1', selected)
      initialSearch.onSearch?.('远程关键字')
    })

    await waitFor(() => {
      expect(employeeOptionsMock.calls).toContain('远程关键字')
    })

    const searchedSelect = latestSelect('选择人员')
    expect(searchedSelect.loading).toBe(true)
    expect(searchedSelect.options).toEqual([
      { label: '李四', value: 'employee-2' },
      { label: '张三', value: 'employee-1' },
    ])
    expect(
      searchedSelect.options?.filter(({ value }) => value === 'employee-1'),
    ).toHaveLength(1)

    act(() => {
      searchedSelect.onClear?.()
    })

    await waitFor(() => {
      expect(employeeOptionsMock.calls.at(-1)).toBe('')
    })
    expect(latestSelect('选择人员').loading).toBe(false)
  })

  it('retains edit-time employee names when remote results do not include them', async () => {
    employeeOptionsMock.itemsByKeyword.set('', [
      { id: 'employee-2', name: '李四', username: 'lisi' },
    ])
    employeeOptionsMock.itemsByKeyword.set('王', [
      { id: 'employee-3', name: '王五', username: 'wangwu' },
    ])

    const initialValues = {
      work_date: '2026-07-13',
      employee_id: 'employee-1',
      employee_ids: ['employee-1'],
      employee_names: ['张三'],
      input_batch_id: 'batch-1',
      project_no: null,
      product_model: 'P-100',
      color_name: null,
      process_name: null,
      length_mm: null,
      part_no: null,
      weight_per_meter_kg: 0,
      unit: '支',
      quantity: 1,
      defective_quantity: 0,
      defect_reason: null,
      standard_seconds: 1,
      extra_qualified_hours: 0,
      remark: null,
    } as PackagingWorkOrderBatch

    render(
      <WorkOrderForm
        initialValues={initialValues}
        isSubmitting={false}
        onFinish={vi.fn()}
        setFormRef={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(latestSelect('请选择人员').options).toEqual([
        { label: '李四', value: 'employee-2' },
        { label: '张三', value: 'employee-1' },
      ])
    })

    const initialSelect = latestSelect('请选择人员')
    const initialSearch = getRemoteSearchConfig(initialSelect)
    expect(initialSearch.filterOption).toBe(false)

    act(() => {
      initialSearch.onSearch?.('王')
    })

    await waitFor(() => {
      expect(employeeOptionsMock.calls).toContain('王')
    })
    expect(latestSelect('请选择人员')).toMatchObject({
      loading: true,
      options: [
        { label: '王五', value: 'employee-3' },
        { label: '张三', value: 'employee-1' },
      ],
    })
  })
})
