import type {
  ScmPoLine,
  ScmSafePartDetail,
  ScmSafePartRow,
} from '../../server/syneyDeliveryOrderLogic'
import type { SyneySafePartSourceRow } from './syneyDeliveryOrderContract'
import { describe, expect, it, vi } from 'vitest'
import {
  buildMakeDeliveryOrderFields,
  buildSafePartDetailFormFields,
  DELIVERY_ORDER_FIELDS,
  fileNameFromPath,
  hasSafePartLines,
  isScmSuccess,
  isScmTrue,
  normalizeScmDateTime,
  parseAjaxMessage,
  parseContentDispositionFileName,
  parseDeliveryOrderRequest,
  parseExportFilePath,
  parseHiddenInputValue,
  parsePartNameOptions,
  pickNewDeliveryOrder,
  pickReusableDeliveryOrder,
  planSafePartDetails,
  PO_LINE_FIELDS,
  SAFE_PART_DETAIL_FIELDS,
  SAFE_PART_ROW_FIELDS,
  selectDeliverableLines,
  validateDeliveryLines,
} from '../../server/syneyDeliveryOrderLogic'

import { bindScmGrid, describeScmResponse, isScmLoginRedirect } from '../../server/syneyScmClient'

function line(overrides: Partial<ScmPoLine> = {}): ScmPoLine {
  return {
    PKID: 1,
    PONo: 'P202610280001',
    EndDate: '2026-10-30T00:00:00',
    SupplierCode: 'S001',
    SupplierName: '供应商',
    NPOType: 0,
    PROType: 0,
    Remarks: null,
    WeightType: 0,
    PartStatus: 0,
    QuoteStatus: 20,
    PartNo: 'XN280801',
    SONo: 'XNJD-FZ26-100-0249',
    ...overrides,
  }
}

function row(overrides: Partial<ScmSafePartRow> = {}): ScmSafePartRow {
  return {
    PKID: 100,
    No: 'D001',
    SONo: 'XNJD-FZ26-100-0249',
    PONo: 'P202610280001',
    PartNo: 'XN280801',
    SupplierCode: 'S001',
    SupplierName: '供应商',
    ...overrides,
  }
}

function part(overrides: Partial<SyneySafePartSourceRow> = {}): SyneySafePartSourceRow {
  return {
    SONo: 'XNJD-FZ26-100-0249',
    PartNo: 'XN280801',
    partCode: 'JJG0001',
    partModel: 'TB-1000',
    partName: '梯级',
    date: '2026-10-30',
    ...overrides,
  }
}

function plan(
  rows: ScmSafePartRow[],
  parts: SyneySafePartSourceRow[],
  {
    existing = new Map<number, ScmSafePartDetail[]>(),
    options = new Map<string, string[]>(),
  } = {},
) {
  return planSafePartDetails({
    rows,
    parts,
    existingDetailsByRowId: existing,
    partNameOptionsBySONo: options,
  })
}

describe('normalizeScmDateTime', () => {
  it.each([
    ['2026-10-30T00:00:00', '2026-10-30T00:00:00'],
    ['2026-10-30 08:05:00', '2026-10-30T08:05:00'],
    ['2026/1/5', '2026-01-05T00:00:00'],
    ['', ''],
    [null, ''],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeScmDateTime(input)).toBe(expected)
  })

  it('converts ASP.NET /Date()/ values', () => {
    const value = new Date(2026, 9, 30, 0, 0, 0).getTime()
    expect(normalizeScmDateTime(`/Date(${value})/`)).toBe('2026-10-30T00:00:00')
  })
})

describe('delivery line selection and validation', () => {
  it('keeps only exact PONo lines that are 已创建 or 部分送货', () => {
    const lines = [
      line({ PKID: 1 }),
      line({ PKID: 2, PartStatus: 5 }),
      line({ PKID: 3, PartStatus: 10 }),
      line({ PKID: 4, PONo: 'P2026102800011' }),
      line({ PKID: 5, PartStatus: 200 }),
    ]
    expect(selectDeliverableLines(lines, 'P202610280001').map(l => l.PKID)).toEqual([1, 2])
  })

  it('accepts consistent lines', () => {
    expect(validateDeliveryLines([line(), line({ PKID: 2 })])).toBeNull()
  })

  it.each([
    [[line(), line({ SupplierCode: 'S002' })], '不同供应商'],
    [[line(), line({ EndDate: '2026-10-31T00:00:00' })], '同一交货期'],
    [[line(), line({ NPOType: 3 })], '不同订单类型'],
    [[line(), line({ QuoteStatus: 10, PONo: 'P9' })], '没有有效价格的订单不能生成送货单：P9'],
    [[line(), line({ Remarks: '加急' })], '备注不同'],
    [[line({ PROType: 10 }), line()], '原材料订单'],
    [[line({ PROType: 10 }), line({ PROType: 10, WeightType: 5 })], '称重类型'],
  ])('rejects inconsistent lines (%#)', (lines, reason) => {
    expect(validateDeliveryLines(lines)).toContain(reason)
  })

  it('treats the same delivery day with different times as one delivery date', () => {
    expect(
      validateDeliveryLines([line(), line({ EndDate: '2026-10-30 17:30:00' })]),
    ).toBeNull()
  })

  it('builds MakeDeliveryOrder fields like the SCM page (jQuery 1.6 null → "null")', () => {
    expect(
      buildMakeDeliveryOrderFields([line({ PKID: 11 }), line({ PKID: 12 })]),
    ).toEqual({
      WeightType: '0',
      EndDate: '2026-10-30T00:00:00',
      SupplierCode: 'S001',
      SupplierName: '供应商',
      NPOType: '0',
      Remarks: 'null',
      params: '&QUERY_N_PKID=(11,12)',
    })
  })
})

describe('delivery order lookup', () => {
  const before = [
    { PKID: 1, No: 'D001', PONos: 'P1', DeliveryStatus: 10 },
  ]

  it('picks the newly created unconfirmed order containing the PO', () => {
    const after = [
      ...before,
      { PKID: 3, No: 'D003', PONos: 'P2', DeliveryStatus: 0 },
      { PKID: 2, No: 'D002', PONos: 'P1;', DeliveryStatus: 0 },
    ]
    expect(pickNewDeliveryOrder(before, after, 'P1')?.No).toBe('D002')
  })

  it('returns null when nothing new appeared', () => {
    expect(pickNewDeliveryOrder(before, before, 'P1')).toBeNull()
  })

  it('reuses only unconfirmed orders', () => {
    expect(pickReusableDeliveryOrder(before, 'P1')).toBeNull()
    expect(
      pickReusableDeliveryOrder(
        [...before, { PKID: 5, No: 'D005', PONos: 'P1,P8', DeliveryStatus: 0 }],
        'P1',
      )?.PKID,
    ).toBe(5)
  })
})

describe('planSafePartDetails', () => {
  it('adds every source row as a detail when SCM has a single row for the key', () => {
    const result = plan(
      [row()],
      [part(), part({ partCode: 'JJG0002' })],
    )
    expect(result.problems).toEqual([])
    expect(result.items.map(item => [item.SaftPartID, item.SafePartNo])).toEqual([
      [100, 'JJG0001'],
      [100, 'JJG0002'],
    ])
    expect(result.items[0]).toMatchObject({
      SupplierCode: 'S001',
      SupplierName: '供应商',
      SONo: 'XNJD-FZ26-100-0249',
      SafePartModel: 'TB-1000',
      PartNameType: '梯级',
      SafePartFCDate: '2026-10-30',
    })
  })

  it('pairs rows one-to-one in PKID order when counts match', () => {
    const result = plan(
      [row({ PKID: 102 }), row({ PKID: 101 })],
      [part({ partCode: 'A' }), part({ partCode: 'B' })],
    )
    expect(result.items.map(item => [item.SaftPartID, item.SafePartNo])).toEqual([
      [101, 'A'],
      [102, 'B'],
    ])
  })

  it('matches keys ignoring case and whitespace', () => {
    const result = plan([row({ PartNo: ' xn280801 ' })], [part()])
    expect(result.problems).toEqual([])
    expect(result.items).toHaveLength(1)
  })

  it('reports SCM rows without source data and count mismatches', () => {
    const result = plan(
      [
        row({ PKID: 1, PartNo: 'XN999' }),
        row({ PKID: 2 }),
        row({ PKID: 3 }),
      ],
      [part()],
    )
    expect(result.items).toEqual([])
    expect(result.problems).toEqual([
      expect.stringContaining('件号 XN999：本系统没有对应的安全部件信息'),
      expect.stringContaining('SCM 有 2 行，本系统有 1 条'),
    ])
  })

  it('warns, but does not block, for source rows missing from SCM', () => {
    const result = plan([row()], [part(), part({ PartNo: 'XN000', partCode: 'Z' })])
    expect(result.problems).toEqual([])
    expect(result.warnings).toEqual([expect.stringContaining('件号 XN000')])
  })

  it('blocks empty fields, bad dates, attachment-only names and unknown names', () => {
    expect(plan([row()], [part({ partModel: '' })]).problems[0]).toContain('为空')
    expect(plan([row()], [part({ date: '' })]).problems[0]).toContain('制造日期')
    expect(plan([row()], [part({ partName: '限速器' })]).problems[0]).toContain('附件')
    expect(
      plan([row()], [part()], {
        options: new Map([['XNJD-FZ26-100-0249', ['前沿板', '中板']]]),
      }).problems[0],
    ).toContain('可选：前沿板、中板')
  })

  it('skips numbers already present in SCM and duplicates in the plan', () => {
    const result = plan(
      [row()],
      [part(), part({ partCode: 'JJG0002' }), part({ partCode: 'JJG0002' })],
      { existing: new Map([[100, [{ SafePartNo: 'JJG0001' }]]]) },
    )
    expect(result.skipped).toBe(2)
    expect(result.items.map(item => item.SafePartNo)).toEqual(['JJG0002'])
  })
})

describe('SafePartDetailEdit FormSave payload', () => {
  it('encodes the form like mini.encode([data])', () => {
    const fields = buildSafePartDetailFormFields(
      {
        SaftPartID: 100,
        SupplierCode: 'S001',
        SupplierName: '供应商',
        SONo: 'XNJD-FZ26-100-0249',
        PartNo: 'XN280801',
        SafePartNo: 'JJG0001',
        SafePartModel: 'TB-1000',
        PartNameType: '梯级',
        SafePartFCDate: '2026-10-30',
      },
      { id: '42', name: '张三' },
    )

    expect(fields.PKID).toBe('-1')
    expect(JSON.parse(fields.data)).toMatchInlineSnapshot(`
      [
        {
          "Accessory": "",
          "AttachFileName": "",
          "BOOKERID": "42",
          "BOOKERNAME": "张三",
          "MadeUnit": "",
          "PKID": "-1",
          "PartNameType": "梯级",
          "Remark": "",
          "SONo": "XNJD-FZ26-100-0249",
          "SafePartFCDate": "2026-10-30T00:00:00",
          "SafePartModel": "TB-1000",
          "SafePartNo": "JJG0001",
          "SaftPartID": "100",
          "SupplierCode": "S001",
          "SupplierName": "供应商",
        },
      ]
    `)
  })
})

describe('SCM response parsing', () => {
  it('detects success and first message segment', () => {
    expect(isScmSuccess('保存成功,123')).toBe(true)
    expect(isScmSuccess('保存失败,原因')).toBe(false)
    expect(parseAjaxMessage('供应商确认成功,')).toBe('供应商确认成功')
  })

  it('parses the PrintDeliveryOrder export path', () => {
    expect(parseExportFilePath('导出成功,../Files/送货单,1.xls')).toBe('../Files/送货单,1.xls')
    expect(parseExportFilePath('导出失败,xxx')).toBeNull()
    expect(parseExportFilePath('导出成功,')).toBeNull()
  })

  it('reads hidden inputs from the page HTML', () => {
    const html = '<input type="hidden" name="__CURRENT_USERID__" id="__CURRENT_USERID__" value="42" />'
      + '<input type="hidden" id="__CURRENT_USERNAME__" value="张&amp;三" />'
    expect(parseHiddenInputValue(html, '__CURRENT_USERID__')).toBe('42')
    expect(parseHiddenInputValue(html, '__CURRENT_USERNAME__')).toBe('张&三')
    expect(parseHiddenInputValue(html, 'missing')).toBe('')
  })

  it('parses part name combobox options', () => {
    expect(
      parsePartNameOptions('[{"KeyCnValue":"梯级"},{"KeyCnValue":"梯级"},{"KeyCnValue":"扶手带"}]'),
    ).toEqual(['梯级', '扶手带'])
    expect(parsePartNameOptions('<html>error</html>')).toEqual([])
  })

  it('reads download file names', () => {
    expect(
      parseContentDispositionFileName('attachment; filename=%E9%80%81%E8%B4%A7%E5%8D%95.xls'),
    ).toBe('送货单.xls')
    expect(parseContentDispositionFileName(null)).toBeNull()
    expect(fileNameFromPath('../UploadFiles/Export/D001.xls')).toBe('D001.xls')
  })
})

describe('parseDeliveryOrderRequest', () => {
  it('accepts valid actions', () => {
    expect(parseDeliveryOrderRequest({ action: 'create', payload: { poNo: ' P1 ' } })).toEqual({
      ok: true,
      action: 'create',
      payload: { poNo: 'P1' },
    })
    expect(
      parseDeliveryOrderRequest({
        action: 'print',
        payload: { deliveryOrderIds: [1, 2], deliveryNos: ['D1', 'D2'] },
      }).ok,
    ).toBe(true)
  })

  it('rejects unknown actions and identifiers that could alter SCM search params', () => {
    expect(parseDeliveryOrderRequest({ action: 'delete' })).toEqual({
      ok: false,
      error: '不支持的操作',
    })
    expect(
      parseDeliveryOrderRequest({ action: 'create', payload: { poNo: 'P1&QUERY_S_No=' } }).ok,
    ).toBe(false)
    expect(
      parseDeliveryOrderRequest({ action: 'confirm', payload: { deliveryOrderId: 0, deliveryNo: 'D1' } }).ok,
    ).toBe(false)
    expect(
      parseDeliveryOrderRequest({
        action: 'print',
        payload: { deliveryOrderIds: [1], deliveryNos: ['D1', 'D2'] },
      }).ok,
    ).toBe(false)
  })

  it('validates safe part payloads', () => {
    expect(
      parseDeliveryOrderRequest({
        action: 'planSafeParts',
        payload: { deliveryNo: 'D1', parts: [part()] },
      }).ok,
    ).toBe(true)
    expect(
      parseDeliveryOrderRequest({
        action: 'planSafeParts',
        payload: { deliveryNo: 'D1', parts: [{ SONo: 'x' }] },
      }).ok,
    ).toBe(false)
    expect(
      parseDeliveryOrderRequest({
        action: 'addSafePartDetail',
        payload: { item: { SaftPartID: 1, SafePartFCDate: '2026/10/30' } },
      }).ok,
    ).toBe(false)
  })
})

describe('describeScmResponse', () => {
  it('explains empty, login-redirect and tag-only responses', () => {
    expect(describeScmResponse('  ')).toBe('SCM 返回内容为空')
    expect(
      describeScmResponse(
        '<script language="javascript">window.top.location.href="http://"+top.location.host+"/Business/UserLogin.aspx?tar=UnKnowUser";</script>',
      ),
    ).toBe('SCM 登录状态无效，被跳转到登录页')
    expect(describeScmResponse('<html><title>Runtime Error</title></html>')).toBe('Runtime Error')
    expect(describeScmResponse('<script>alert(1)</script>')).toBe(
      '原始内容：<script>alert(1)</script>',
    )
  })

  it('detects the login redirect script', () => {
    expect(isScmLoginRedirect('…/Business/UserLogin.aspx?tar=UnKnowUser";')).toBe(true)
    expect(isScmLoginRedirect('{"total":0,"data":[]}')).toBe(false)
  })
})

describe('SCM grid BindFields', () => {
  it('match the SCM page grid columns and never request server-appended PKID / QuoteStatus', () => {
    for (const fields of [PO_LINE_FIELDS, DELIVERY_ORDER_FIELDS, SAFE_PART_ROW_FIELDS, SAFE_PART_DETAIL_FIELDS]) {
      expect(fields).not.toContain('PKID')
      expect(fields).not.toContain('QuoteStatus')
    }
    expect(PO_LINE_FIELDS).toEqual(expect.arrayContaining([
      'PartStatus',
      'NPOType',
      'PROType',
      'PONo',
      'EndDate',
      'SupplierCode',
      'SupplierName',
      'Remarks',
      'WeightType',
      'SONo',
      'PartNo',
    ]))
  })

  it('does not block on a missing QuoteStatus', () => {
    const { QuoteStatus: _ignored, ...withoutQuote } = line()
    expect(validateDeliveryLines([withoutQuote as ScmPoLine])).toBeNull()
  })
})

describe('bindScmGrid', () => {
  it('treats an empty SCM response as zero rows (SCM returns 0 bytes when nothing matches)', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 200, headers: { 'content-type': 'text/html' } }))
    vi.stubGlobal('fetch', fetchMock)
    try {
      await expect(
        bindScmGrid('cookie', 'Supplier/DeliveryOrderList.aspx', 'method=BindGrid&Type=NPO', DELIVERY_ORDER_FIELDS, '&QUERY_S_PONos=P1'),
      ).resolves.toEqual([])
    }
    finally {
      vi.unstubAllGlobals()
    }
  })

  it('parses the MiniUI `{ data : [...], total : n }` format', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{ data : [{"PKID":1,"No":"S1"}], total : 1}', { status: 200 })))
    try {
      await expect(
        bindScmGrid('cookie', 'Supplier/DeliveryOrderList.aspx', 'method=BindGrid&Type=NPO', DELIVERY_ORDER_FIELDS, ''),
      ).resolves.toEqual([{ PKID: 1, No: 'S1' }])
    }
    finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('IsSafePart', () => {
  it('reads SCM booleans in boolean, string and number form', () => {
    expect([true, 'true', 'True', 1, '1'].map(isScmTrue)).toEqual([true, true, true, true, true])
    expect([false, 'false', 'False', 0, '0', null, undefined, ''].map(isScmTrue)).toEqual(
      Array.from({ length: 8 }, () => false),
    )
  })

  it('needs safe parts only when some line of the PO is marked', () => {
    const lines = [
      line({ PKID: 1, IsSafePart: false }),
      line({ PKID: 2, IsSafePart: false }),
      line({ PKID: 3, PONo: 'OTHER', IsSafePart: true }),
    ]
    expect(hasSafePartLines(lines, 'P202610280001')).toBe(false)
    expect(hasSafePartLines(lines)).toBe(true)
    expect(hasSafePartLines([...lines, line({ PKID: 4, IsSafePart: true })], 'P202610280001')).toBe(true)
  })

  it('parses checkSafeParts requests', () => {
    expect(
      parseDeliveryOrderRequest({ action: 'checkSafeParts', payload: { poNos: [' P1 ', 'P1', 'P2'] } }),
    ).toEqual({ ok: true, action: 'checkSafeParts', payload: { poNos: ['P1', 'P2'] } })
    expect(parseDeliveryOrderRequest({ action: 'checkSafeParts', payload: { poNos: [] } }).ok).toBe(false)
    expect(
      parseDeliveryOrderRequest({ action: 'checkSafeParts', payload: { poNos: ['P1&QUERY_S_x=1'] } }).ok,
    ).toBe(false)
    expect(
      parseDeliveryOrderRequest({
        action: 'checkSafeParts',
        payload: { poNos: Array.from({ length: 51 }, (_, index) => `P${index}`) },
      }).ok,
    ).toBe(false)
  })
})
