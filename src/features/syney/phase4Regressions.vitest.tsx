import type { Key, ReactNode } from 'react'
import type { SelectedSyneyPoWithItems } from '@/services/apiSyneyPos'
import type { SyneySafePartSetting } from '@/services/apiSyneySafePartSettings'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { generateDecompositionPDF } from './PoList/decompositionPdfDocument'
import { generatePoLabelsPDF } from './PoList/poLabelPdfDocument'
import { usePrint } from './PoList/usePrint'
import { usePrintDecomposition } from './PoList/usePrintDecomposition'
import { usePrintEnglish } from './PoList/usePrintEnglish'
import { useGenerateSyneyStoreReportPDF } from './ReportList/useGenerateSyneyStoreReportPDF'
import TableSelectionProvider from './TableSelectionProvider'

const mocks = vi.hoisted(() => {
  class MockJsPDF {
    textCalls: Array<[string, number, number, unknown?]> = []
    lineCalls: Array<[number, number, number, number]> = []
    rectCalls: Array<[number, number, number, number]> = []
    fontSizeCalls: number[] = []
    internal: { pages: unknown[] } = { pages: [{}, {}] }
    addPage = vi.fn(() => {
      this.internal.pages.push({})
    })

    deletePage = vi.fn()
    addFileToVFS = vi.fn()
    addFont = vi.fn()
    setFont = vi.fn()
    setPage = vi.fn()

    setFontSize(size: number) {
      this.fontSizeCalls.push(size)
    }

    rect(x: number, y: number, w: number, h: number) {
      this.rectCalls.push([x, y, w, h])
    }

    line(x1: number, y1: number, x2: number, y2: number) {
      this.lineCalls.push([x1, y1, x2, y2])
    }

    text(txt: string, x: number, y: number, options?: unknown) {
      this.textCalls.push([txt, x, y, options])
    }
  }

  const jsPdfInstances: MockJsPDF[] = []

  class TrackedJsPDF extends MockJsPDF {
    constructor() {
      super()
      jsPdfInstances.push(this)
    }
  }

  return {
    jsPdfInstances,
    JsPdfCtor: TrackedJsPDF,
    openPDFInNewWindow: vi.fn(),
    initializePDF: vi.fn(async () => new TrackedJsPDF()),
    previewPDF: vi.fn(),
    generateFilename: vi.fn(() => 'detail.pdf'),
    addDocumentTitle: vi.fn(),
    addPageNumber: vi.fn(),
    addTableHeader: vi.fn(),
    calculateTotals: vi.fn(() => ['合计', '', '', '', '', '', '']),
    createTableStyles: vi.fn(() => ({})),
    processTableData: vi.fn(() => []),
    processBatchWithProgress: vi.fn(),
    autoTable: vi.fn(),
    loadGoogleFont: vi.fn(async () => 'FONT_BASE64'),
    getSelectedPosWithItems: vi.fn(),
    getSelectedSyneyStoreReports: vi.fn(),
    messageWarning: vi.fn(),
    messageSuccess: vi.fn(),
    messageError: vi.fn(),
    messageLoading: vi.fn(),
  }
})

vi.mock('jspdf', () => ({
  default: mocks.JsPdfCtor,
}))

vi.mock('jspdf-autotable', () => ({
  default: mocks.autoTable,
}))

vi.mock('@/utils/googleFontLoader', () => ({
  GOOGLE_FONT_CONFIG: {
    FONT_NAME: 'NotoSansSC-Regular.ttf',
    FONT_FAMILY: 'NotoSansSC',
    FONT_STYLE: 'normal',
  },
  loadGoogleFont: mocks.loadGoogleFont,
}))

vi.mock('@/utils/pdfUtils', () => ({
  initializePDF: mocks.initializePDF,
  openPDFInNewWindow: mocks.openPDFInNewWindow,
  previewPDF: mocks.previewPDF,
  generateFilename: mocks.generateFilename,
  addDocumentTitle: mocks.addDocumentTitle,
  addPageNumber: mocks.addPageNumber,
  addTableHeader: mocks.addTableHeader,
  calculateTotals: mocks.calculateTotals,
  createTableStyles: mocks.createTableStyles,
  processTableData: mocks.processTableData,
  processBatchWithProgress: mocks.processBatchWithProgress,
}))

vi.mock('@/services/apiSyneyPos', () => ({
  getSelectedPosWithItems: mocks.getSelectedPosWithItems,
}))

vi.mock('@/services/apiSyneyStoreReports', () => ({
  getSelectedSyneyStoreReports: mocks.getSelectedSyneyStoreReports,
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')
  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({
        message: {
          warning: mocks.messageWarning,
          success: mocks.messageSuccess,
          error: mocks.messageError,
          loading: mocks.messageLoading,
        },
      }),
    },
  }
})

const safePartSettingsFixture: SyneySafePartSetting[] = [
  {
    id: 'sp-front',
    part_no: 'XN2808EB',
    name: '梳齿支撑板',
    part_model: 'YD1001XN',
    part_code_prefix: 'ZC00',
    english_name: 'COMB PLATE',
    need_print_label: true,
    is_safe_part: true,
    decomposition_role: 'front_plate',
    remark: null,
    drawing_file_path: null,
    drawing_file_name: null,
    drawing_file_mime_type: null,
    drawing_file_size: null,
    drawing_uploaded_at: null,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
  },
  {
    id: 'sp-side',
    part_no: 'XN3024CF',
    name: '侧围组件',
    part_model: null,
    part_code_prefix: null,
    english_name: null,
    need_print_label: false,
    is_safe_part: false,
    decomposition_role: 'side_frame',
    remark: null,
    drawing_file_path: null,
    drawing_file_name: null,
    drawing_file_mime_type: null,
    drawing_file_size: null,
    drawing_uploaded_at: null,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
  },
]

function createPoFixture(
  overrides: Partial<SelectedSyneyPoWithItems['po']> = {},
): SelectedSyneyPoWithItems {
  return {
    po: {
      id: 1,
      No: 'P2026112301',
      SONo: 'SO-010',
      Spec: '1000型-室外-扶梯',
      EndDate: '2026-12-01T00:00:00Z',
      Status: '已创建',
      Qty: 1,
      Brand: '现代电梯(杭州)有限公司',
      Technique: '前：商标,中：雷达孔',
      SerialNo: 5286,
      Remark: '厚度2~3mm~注意不要出现西尼',
      BorderMaterial: '铝合金',
      created_at: '2026-11-23T00:00:00Z',
      ...overrides,
    },
    items: [
      {
        id: 101,
        No: 'P2026112301',
        PartNo: 'XN2808EB1',
        PartName: '前沿板组件',
        Spec: '1000型',
        ParamSpec: '1060*446',
        Qty: 1,
        Unit: 'EA',
        SONo: 'SO-010',
        Remark: null,
      },
      {
        id: 102,
        No: 'P2026112301',
        PartNo: 'XN3024CF1',
        PartName: '侧框组件',
        Spec: '1000型',
        ParamSpec: 'L=1420',
        Qty: 2,
        Unit: 'EA',
        SONo: 'SO-010',
        Remark: '上头部',
      },
      {
        id: 103,
        No: 'P2026112301',
        PartNo: 'XN3024CF2',
        PartName: '侧框组件',
        Spec: '1000型',
        ParamSpec: 'L=1680',
        Qty: 1,
        Unit: 'EA',
        SONo: 'SO-010',
        Remark: '下头部',
      },
    ],
  }
}

function createWrapper(selectedKeys: Key[] = []) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <TableSelectionProvider initialSelectedKeys={selectedKeys}>
          {children}
        </TableSelectionProvider>
      </QueryClientProvider>
    )
  }
}

describe('Phase 4 PDF 懒加载模块与回归验证', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.jsPdfInstances.length = 0
  })

  it('poLabelPdfDocument 支持中英文标签绘制并兼容含 ~ 备注与空字段订单', async () => {
    const order = createPoFixture({ Brand: null, Technique: null })

    await generatePoLabelsPDF([order], safePartSettingsFixture, 'zh')
    await generatePoLabelsPDF([order], safePartSettingsFixture, 'en')

    expect(mocks.loadGoogleFont).toHaveBeenCalledTimes(2)
    expect(mocks.openPDFInNewWindow).toHaveBeenCalledTimes(2)

    const zhDoc = mocks.jsPdfInstances[0]
    const enDoc = mocks.jsPdfInstances[1]
    const zhTexts = zhDoc.textCalls.map(([txt]) => txt)
    const enTexts = enDoc.textCalls.map(([txt]) => txt)

    expect(zhTexts).toContain('产品名称')
    expect(zhTexts).toContain('围框')
    expect(zhTexts).toContain('ZC005286')
    expect(zhTexts).toContain('XN2808EB1')
    expect(zhDoc.addPage).toHaveBeenCalledTimes(1)

    expect(enTexts).toContain('PartName')
    expect(enTexts).toContain('COMB PLATE')
    expect(enTexts).toContain('Frame')
    expect(enTexts).toContain('1000#')
    expect(enDoc.addPage).toHaveBeenCalledTimes(1)
  })

  it('decompositionPdfDocument 按生产编号排序绘制 side_frame 配置与含 ~ 备注订单', async () => {
    const orderB = createPoFixture({
      id: 2,
      No: 'P2',
      SONo: 'SO-002',
      Remark: '厚度2~3mm~注意',
      Technique: null,
    })
    const orderA = createPoFixture({
      id: 1,
      No: 'P1',
      SONo: 'SO-001',
      Remark: '首单',
    })

    await generateDecompositionPDF([orderB, orderA], safePartSettingsFixture)

    expect(mocks.initializePDF).toHaveBeenCalledWith('l')
    expect(mocks.openPDFInNewWindow).toHaveBeenCalledOnce()

    const doc = mocks.jsPdfInstances[0]
    const texts = doc.textCalls.map(([txt]) => txt)

    // 先排 SO-001 再排 SO-002
    expect(texts.indexOf('SO-001')).toBeLessThan(texts.indexOf('SO-002'))
    // side_frame 配置自动剥离 L= 并输出 规格*数量
    expect(texts).toContain('1420*2')
    expect(texts).toContain('1680*1')
    // 保留 ~ 备注原文，且 null 工艺不渲染字面量 null
    expect(texts).toContain('厚度2~3mm~注意')
    expect(texts).not.toContain('null')
  })

  it('usePrint 与 usePrintEnglish 在打印前校验勾选与配置并懒加载执行打印', async () => {
    mocks.getSelectedPosWithItems.mockResolvedValue([createPoFixture()])

    const { result: emptyResult } = renderHook(
      () => usePrint(safePartSettingsFixture, false),
      { wrapper: createWrapper([]) },
    )
    await act(async () => {
      expect(await emptyResult.current.generateLabel()).toBe(false)
    })
    expect(mocks.messageWarning).toHaveBeenCalledOnce()

    const { result: zhHook } = renderHook(
      () => usePrint(safePartSettingsFixture, false),
      { wrapper: createWrapper([1]) },
    )
    await act(async () => {
      expect(await zhHook.current.generateLabel()).toBe(true)
    })

    const { result: enHook } = renderHook(
      () => usePrintEnglish(safePartSettingsFixture, false),
      { wrapper: createWrapper([1]) },
    )
    await act(async () => {
      expect(await enHook.current.generateEnglishLabel()).toBe(true)
    })

    expect(mocks.getSelectedPosWithItems).toHaveBeenCalledTimes(2)
    expect(mocks.openPDFInNewWindow).toHaveBeenCalledTimes(2)
  })

  it('usePrintDecomposition 限制最多 4 条订单并在合法选中时输出分解单', async () => {
    mocks.getSelectedPosWithItems.mockResolvedValue([createPoFixture()])

    const { result: tooMany } = renderHook(
      () => usePrintDecomposition(safePartSettingsFixture, false),
      { wrapper: createWrapper([1, 2, 3, 4, 5]) },
    )
    await act(async () => {
      expect(await tooMany.current.printDecomposition()).toBe(false)
    })
    expect(mocks.messageWarning).toHaveBeenCalledWith('分解单一次最多打印 4 条订单')

    const { result: okHook } = renderHook(
      () => usePrintDecomposition(safePartSettingsFixture, false),
      { wrapper: createWrapper([1]) },
    )
    await act(async () => {
      expect(await okHook.current.printDecomposition()).toBe(true)
    })
    expect(mocks.openPDFInNewWindow).toHaveBeenCalledOnce()
    expect(mocks.messageSuccess).toHaveBeenCalledWith('分解单已生成')
  })

  it('useGenerateSyneyStoreReportPDF 不暴露或触发多余 progress state，仅通过 message 展示进度', async () => {
    const selectedReports = new Map([
      ['R-1', { items: [], totalAmount: 100, createdAt: '2026-11-20' }],
      ['R-2', { items: [], totalAmount: 200, createdAt: '2026-11-21' }],
    ])
    mocks.getSelectedSyneyStoreReports.mockResolvedValue(selectedReports)

    let renderCount = 0
    const { result } = renderHook(
      () => {
        renderCount++
        return useGenerateSyneyStoreReportPDF()
      },
      { wrapper: createWrapper(['R-1', 'R-2']) },
    )

    expect(result.current).not.toHaveProperty('progress')
    const rendersBeforePrint = renderCount

    await act(async () => {
      expect(await result.current.print()).toBe(true)
    })

    // 仅 isLoading true -> false 两次状态变化，不因每份报告进度触发额外重渲染
    expect(renderCount - rendersBeforePrint).toBeLessThanOrEqual(2)
    expect(mocks.messageLoading).toHaveBeenCalledTimes(2)
    expect(mocks.messageSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ content: '对账单 PDF 已生成' }),
    )
    expect(mocks.previewPDF).toHaveBeenCalledOnce()
  })
})
