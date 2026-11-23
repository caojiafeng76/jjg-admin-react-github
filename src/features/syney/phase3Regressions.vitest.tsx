import type { Key, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUpdate as useUpdatePoDetail } from './PoDetail/useUpdate'
import { useSerialNo } from './PoList/useSerialNo'
import { syneyKeys, syneyPoKeys } from './queryKeys'
import { useDeleteDetail as useDeleteReportDetail } from './ReportDetail/useDeleteDetail'
import { useDetail as useReportDetail } from './ReportDetail/useDetail'
import { useUpdateDetail as useUpdateReportDetail } from './ReportDetail/useUpdateDetail'
import { useFetchSelectedReports } from './ReportList/useFetchSelectedReports'
import { useReports } from './ReportList/useReports'
import { useAllSyneySpecs, useSyneySpecsList } from './SpecList/useSyneySpecs'
import TableSelectionProvider from './TableSelectionProvider'
import { useSyneySafePartSettings } from './useSyneySafePartSettings'

const mocks = vi.hoisted(() => ({
  poId: '830',
  reportNo: 'K-2026',
  searchParams: new URLSearchParams('page=3&pageSize=50&PartNo=FILTER&status=confirmed'),
  updatePoItems: vi.fn(),
  updateSyneyStoreReport: vi.fn(),
  deleteSyneyStoreReportItems: vi.fn(),
  getSyneyStoreReports: vi.fn(),
  getSyneyStoreReport: vi.fn(),
  getSyneyStoreReportHeader: vi.fn(),
  getSelectedSyneyStoreReports: vi.fn(),
  getSyneySpecs: vi.fn(),
  getSyneySafePartSettings: vi.fn(),
  getSerialNo: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual
    = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useParams: () => ({ PoId: mocks.poId, reportNo: mocks.reportNo }),
    useSearchParams: () => [mocks.searchParams],
  }
})

vi.mock('@/services/apiSyneyPos', () => ({
  updatePoItems: mocks.updatePoItems,
}))

vi.mock('@/services/apiSyneyStoreReports', () => ({
  updateSyneyStoreReport: mocks.updateSyneyStoreReport,
  deleteSyneyStoreReportItems: mocks.deleteSyneyStoreReportItems,
  getSyneyStoreReports: mocks.getSyneyStoreReports,
  getSyneyStoreReport: mocks.getSyneyStoreReport,
  getSyneyStoreReportHeader: mocks.getSyneyStoreReportHeader,
  getSelectedSyneyStoreReports: mocks.getSelectedSyneyStoreReports,
}))

vi.mock('@/services/apiSyneySpecs', () => ({
  getSyneySpecs: mocks.getSyneySpecs,
}))

vi.mock('@/services/apiSyneySafePartSettings', () => ({
  getSyneySafePartSettings: mocks.getSyneySafePartSettings,
}))

vi.mock('@/services/apiSyneySerialNo', () => ({
  getSerialNo: mocks.getSerialNo,
}))

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createWrapper(queryClient: QueryClient, selectedKeys: Key[] = []) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <TableSelectionProvider initialSelectedKeys={selectedKeys}>
            {children}
          </TableSelectionProvider>
        </QueryClientProvider>
      </AntdApp>
    )
  }
}

describe('Phase 3 syney query keys, invalidation scopes, and AbortSignal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.poId = '830'
    mocks.reportNo = 'K-2026'
    mocks.updatePoItems.mockResolvedValue(undefined)
    mocks.updateSyneyStoreReport.mockResolvedValue(undefined)
    mocks.deleteSyneyStoreReportItems.mockResolvedValue(undefined)
    mocks.getSyneyStoreReports.mockResolvedValue({ syneyStoreReports: [], count: 0 })
    mocks.getSyneyStoreReport.mockResolvedValue([])
    mocks.getSyneyStoreReportHeader.mockResolvedValue({ No: 'K-2026' })
    mocks.getSelectedSyneyStoreReports.mockResolvedValue(new Map())
    mocks.getSyneySpecs.mockResolvedValue({ syneySpecs: [], count: 0 })
    mocks.getSyneySafePartSettings.mockResolvedValue([])
    mocks.getSerialNo.mockResolvedValue({ SyneySerialNo: 100 })
  })

  it('unifies syney domain query keys and preserves syneyPoKeys alias', () => {
    expect(syneyPoKeys).toBe(syneyKeys.po)
    expect(
      syneyKeys.report.selected([' B ', 'A', 'A', '']),
    ).toEqual(syneyKeys.report.selected(['A', 'B']))
    expect(syneyKeys.report.list({ page: 1, pageSize: 10 })).toEqual([
      'syney-reports',
      'list',
      { page: 1, pageSize: 10, status: 'all' },
    ])
    expect(syneyKeys.spec.list({ page: 2, pageSize: 20, partNo: ' XN2808 ' })).toEqual([
      'syney-specs',
      'list',
      { page: 2, pageSize: 20, partNo: 'XN2808' },
    ])
    expect(syneyKeys.safePartSettings.all).toEqual(['syney-safe-part-settings'])
  })

  it('ReportDetail/useUpdateDetail invalidates the active report detail and spec cache only', async () => {
    const queryClient = createQueryClient()
    const activeDetailKey = syneyKeys.report.detail('K-2026')
    const otherDetailKey = syneyKeys.report.detail('K-OTHER')
    const specListKey = syneyKeys.spec.list({ page: 1, pageSize: 10, partNo: '' })
    const specAllKey = syneyKeys.spec.listAll()
    const reportListKey = syneyKeys.report.list({ page: 1, pageSize: 10, status: 'all' })

    ;[activeDetailKey, otherDetailKey, specListKey, specAllKey, reportListKey].forEach(
      key => queryClient.setQueryData(key, 'cached'),
    )

    const { result } = renderHook(() => useUpdateReportDetail(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.updateItem({
        item: {
          id: 1,
          No: 'K-2026',
          ParamSpec: '1525*550',
          PartName: '前沿板',
          PartNo: 'XN2808EB',
          Qty: 1,
          Remark: null,
          SONo: null,
          Spec: '1000型',
          Unit: '件',
        },
      })
    })

    expect(queryClient.getQueryState(activeDetailKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(specListKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(specAllKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(otherDetailKey)?.isInvalidated).toBe(false)
    expect(queryClient.getQueryState(reportListKey)?.isInvalidated).toBe(false)
  })

  it('ReportDetail/useDeleteDetail invalidates detail, header, and report list caches', async () => {
    const queryClient = createQueryClient()
    const detailKey = syneyKeys.report.detail('K-2026')
    const headerKey = syneyKeys.report.header('K-2026')
    const otherHeaderKey = syneyKeys.report.header('K-OTHER')
    const listKey = syneyKeys.report.list({ page: 1, pageSize: 10, status: 'all' })

    ;[detailKey, headerKey, otherHeaderKey, listKey].forEach(
      key => queryClient.setQueryData(key, 'cached'),
    )

    const { result } = renderHook(() => useDeleteReportDetail(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.deleteDetail(['11'])
    })

    expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(headerKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(otherHeaderKey)?.isInvalidated).toBe(false)
  })

  it('PoDetail/useUpdate narrows invalidation to active PO detail and selected POs without invalidating PO lists', async () => {
    const queryClient = createQueryClient()
    const activePoKey = syneyKeys.po.detail('830')
    const otherPoKey = syneyKeys.po.detail('999')
    const selectedPoKey = syneyKeys.po.selected([830])
    const listKey = syneyKeys.po.list({ page: 1, pageSize: 10 })

    ;[activePoKey, otherPoKey, selectedPoKey, listKey].forEach(
      key => queryClient.setQueryData(key, 'cached'),
    )

    const { result } = renderHook(() => useUpdatePoDetail(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.updateItems({ ids: [1], values: { ParamSpec: 'L=100' } })
    })

    expect(queryClient.getQueryState(activePoKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(selectedPoKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(otherPoKey)?.isInvalidated).toBe(false)
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(false)
  })

  it('useAllSyneySpecs ignores URL pagination/filter params while useSyneySpecsList uses explicit params', async () => {
    const queryClient = createQueryClient()
    renderHook(() => useAllSyneySpecs({ enabled: true, silentError: true }), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(mocks.getSyneySpecs).toHaveBeenCalledWith(
        expect.objectContaining({
          PartNo: '',
          page: 1,
          pageSize: 10,
          isAll: true,
          signal: expect.any(AbortSignal),
        }),
      )
    })

    vi.clearAllMocks()
    renderHook(
      () => useSyneySpecsList({ partNo: ' XN2808 ', page: 2, pageSize: 20 }),
      { wrapper: createWrapper(createQueryClient()) },
    )

    await waitFor(() => {
      expect(mocks.getSyneySpecs).toHaveBeenCalledWith(
        expect.objectContaining({
          PartNo: 'XN2808',
          page: 2,
          pageSize: 20,
          isAll: false,
          signal: expect.any(AbortSignal),
        }),
      )
    })
  })

  it('forwards AbortSignal across report, safe-part, and serial-number queries', async () => {
    const queryClient = createQueryClient()
    const wrapper = createWrapper(queryClient, ['K-1', 'K-2'])

    renderHook(() => useReports(), { wrapper })
    renderHook(() => useReportDetail(), { wrapper })
    renderHook(() => useSyneySafePartSettings(), { wrapper })
    renderHook(() => useSerialNo(), { wrapper })
    const { result: selectedHook } = renderHook(() => useFetchSelectedReports(), { wrapper })

    await act(async () => {
      await selectedHook.current.fetchSelectedReports(['K-2', 'K-1'])
    })

    await waitFor(() => {
      expect(mocks.getSyneyStoreReports).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'confirmed',
          page: 3,
          pageSize: 50,
          signal: expect.any(AbortSignal),
        }),
      )
      expect(mocks.getSyneyStoreReport).toHaveBeenCalledWith('K-2026', expect.any(AbortSignal))
      expect(mocks.getSyneyStoreReportHeader).toHaveBeenCalledWith('K-2026', expect.any(AbortSignal))
      expect(mocks.getSyneySafePartSettings).toHaveBeenCalledWith(expect.any(AbortSignal))
      expect(mocks.getSerialNo).toHaveBeenCalledWith(expect.any(AbortSignal))
      expect(mocks.getSelectedSyneyStoreReports).toHaveBeenCalledWith(
        ['K-2', 'K-1'],
        expect.any(AbortSignal),
      )
    })
  })
})
