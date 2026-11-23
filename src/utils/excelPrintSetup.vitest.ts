import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx-js-style'

import {
  applyExcelPrintSetup,
  injectWorksheetPrintSetupXml,
} from './excelPrintSetup'

describe('injectWorksheetPrintSetupXml', () => {
  it('inserts printOptions, pageMargins, and pageSetup in ECMA-376 order before ignoredErrors', () => {
    const sourceXml
      = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        + '<sheetData><row r="1"><c r="A1" t="str"><v>测试</v></c></row></sheetData>'
        + '<mergeCells count="1"><mergeCell ref="A1:N1"/></mergeCells>'
        + '<ignoredErrors><ignoredError numberStoredAsText="1" sqref="A1"/></ignoredErrors>'
        + '</worksheet>'

    const result = injectWorksheetPrintSetupXml(sourceXml, {
      paperSize: 9,
      orientation: 'landscape',
      scale: 100,
      horizontalCentered: true,
      margins: {
        left: 0.2,
        right: 0.2,
        top: 0.35,
        bottom: 0.35,
        header: 0.15,
        footer: 0.15,
      },
    })

    const mergeIndex = result.indexOf('</mergeCells>')
    const printOptionsIndex = result.indexOf(
      '<printOptions horizontalCentered="1"/>',
    )
    const marginsIndex = result.indexOf(
      '<pageMargins left="0.2" right="0.2" top="0.35" bottom="0.35" header="0.15" footer="0.15"/>',
    )
    const setupIndex = result.indexOf(
      '<pageSetup paperSize="9" scale="100" orientation="landscape"/>',
    )
    const ignoredErrorsIndex = result.indexOf('<ignoredErrors>')

    expect(mergeIndex).toBeGreaterThan(-1)
    expect(printOptionsIndex).toBeGreaterThan(mergeIndex)
    expect(marginsIndex).toBeGreaterThan(printOptionsIndex)
    expect(setupIndex).toBeGreaterThan(marginsIndex)
    expect(ignoredErrorsIndex).toBeGreaterThan(setupIndex)
  })

  it('inserts before drawing and without trailing element when absent', () => {
    const withDrawing
      = '<worksheet><sheetData/><drawing r:id="rId1"/></worksheet>'
    const drawingResult = injectWorksheetPrintSetupXml(withDrawing, {
      paperSize: 9,
      orientation: 'landscape',
    })
    expect(drawingResult).toBe(
      '<worksheet><sheetData/><pageSetup paperSize="9" orientation="landscape"/><drawing r:id="rId1"/></worksheet>',
    )

    const minimal = '<worksheet><sheetData/></worksheet>'
    const minimalResult = injectWorksheetPrintSetupXml(minimal, {
      horizontalCentered: true,
    })
    expect(minimalResult).toBe(
      '<worksheet><sheetData/><printOptions horizontalCentered="1"/></worksheet>',
    )
  })

  it('replaces existing print elements idempotently without duplicates', () => {
    const existingXml
      = '<worksheet>'
        + '<sheetData/>'
        + '<printOptions horizontalCentered="0"></printOptions>'
        + '<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>'
        + '<pageSetup paperSize="1" orientation="portrait"/>'
        + '<ignoredErrors/>'
        + '</worksheet>'

    const options = {
      paperSize: 9,
      orientation: 'landscape' as const,
      scale: 100,
      horizontalCentered: true,
      margins: {
        left: 0.2,
        right: 0.2,
        top: 0.35,
        bottom: 0.35,
        header: 0.15,
        footer: 0.15,
      },
    }

    const once = injectWorksheetPrintSetupXml(existingXml, options)
    const twice = injectWorksheetPrintSetupXml(once, options)

    expect(twice).toBe(once)
    expect(twice.match(/<printOptions\b/g)).toHaveLength(1)
    expect(twice.match(/<pageMargins\b/g)).toHaveLength(1)
    expect(twice.match(/<pageSetup\b/g)).toHaveLength(1)
  })
})

describe('applyExcelPrintSetup', () => {
  it('writes print setup into a real xlsx archive while preserving sheet contents and merges', async () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['优迈成品出库', ''],
      ['物料编码', '数量'],
      ['XTA-01', 10],
    ])
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '优迈成品出库')
    const rawBuffer = XLSX.write(wb, {
      cellStyles: true,
      type: 'array',
      bookType: 'xlsx',
    }) as ArrayBuffer

    const updatedBuffer = await applyExcelPrintSetup(rawBuffer, {
      paperSize: 9,
      orientation: 'landscape',
      scale: 100,
      horizontalCentered: true,
      margins: {
        left: 0.2,
        right: 0.2,
        top: 0.35,
        bottom: 0.35,
        header: 0.15,
        footer: 0.15,
      },
    })

    const zip = await JSZip.loadAsync(updatedBuffer)
    const sheetXml = await zip.file('xl/worksheets/sheet1.xml')?.async('string')
    expect(sheetXml).toContain(
      '<pageSetup paperSize="9" scale="100" orientation="landscape"/>',
    )
    expect(sheetXml).toContain('<printOptions horizontalCentered="1"/>')

    const parsedWorkbook = XLSX.read(updatedBuffer, { type: 'array' })
    const parsedSheet = parsedWorkbook.Sheets['优迈成品出库']
    expect(parsedSheet?.['!merges']).toEqual([
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    ])
    expect(parsedSheet?.A1?.v).toBe('优迈成品出库')
    expect(parsedSheet?.A3?.v).toBe('XTA-01')
    expect(parsedSheet?.B3?.v).toBe(10)
  })
})
