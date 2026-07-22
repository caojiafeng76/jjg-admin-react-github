// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx-js-style'

import type { StandardTime } from '@/services/apiStandardTimes'
import { extractFirstWorksheetSketchFiles } from './workshopOrderSketchXlsx'
import {
  buildPrecisionFinishingProcessExcelBuffer,
  PROCESS_SHEET_HEADERS,
} from './precisionFinishingProcessExcel'

const baseRecord = {
  id: 'row-1',
  customer: '客户A',
  model: 'M-001',
  length: 31.75,
  part_no: 'P-001',
  operation: '自动切割',
  standard_seconds: 10,
  tooling_fixture: '自动切割机',
  clamping_count: 1,
  clamping_quantity: 3,
  operator_count: 1,
  process_image_path: null,
  process_image_name: null,
  process_image_mime_type: null,
  process_image_size: null,
  process_image_uploaded_at: null,
  process_note: '通用',
  remark: '备注',
} as unknown as StandardTime

describe('precision finishing process Excel export', () => {
  it('keeps the supplied 14-column order and preserves nulls as blank cells', async () => {
    const buffer = await buildPrecisionFinishingProcessExcelBuffer([baseRecord])
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets['精加工产品工艺表']

    expect(sheet.A1.v).toBe('精加工产品工艺明细表')
    expect(
      XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })[1],
    ).toEqual(PROCESS_SHEET_HEADERS)
    expect(
      XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })[2],
    ).toEqual([
      1,
      '客户A',
      'M-001',
      31.75,
      'P-001',
      '自动切割',
      10,
      '自动切割机',
      1,
      3,
      1,
      '',
      '通用',
      '备注',
    ])
    expect(sheet['!merges']).toEqual([
      { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
    ])
  })

  it('embeds the row image in the image column when resolver returns one', async () => {
    const imageRecord = {
      ...baseRecord,
      process_image_path: 'row-1/image.png',
      process_image_name: 'image.png',
      process_image_mime_type: 'image/png',
    } as StandardTime

    const buffer = await buildPrecisionFinishingProcessExcelBuffer(
      [imageRecord],
      async () => ({
        rowNumber: 0,
        fileName: 'image.png',
        extension: 'png',
        mimeType: 'image/png',
        data: new Uint8Array([1, 2, 3]).buffer,
      }),
    )

    const embedded = await extractFirstWorksheetSketchFiles(buffer)
    expect(embedded.get(3)?.fileName).toBe('workshop-sketch-1.png')
    expect(new Uint8Array(embedded.get(3)?.data ?? new ArrayBuffer(0))).toEqual(
      new Uint8Array([1, 2, 3]),
    )
  })
})
