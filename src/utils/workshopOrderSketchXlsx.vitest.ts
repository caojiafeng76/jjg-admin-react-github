// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import * as XLSX from 'xlsx-js-style'

import {
  embedSketchFilesIntoFirstWorksheet,
  extractFirstWorksheetSketchFiles,
} from './workshopOrderSketchXlsx'

function createWorkbookBuffer() {
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['简图', '项目号'],
    ['', '26051509-01'],
  ])
  XLSX.utils.book_append_sheet(workbook, worksheet, '车间订单')

  return XLSX.write(workbook, {
    type: 'array',
    bookType: 'xlsx',
  }) as ArrayBuffer
}

describe('workshop order sketch xlsx helpers', () => {
  it('embeds and extracts an EMF sketch anchored to the expected row', async () => {
    const sketchBytes = new Uint8Array([1, 2, 3, 4]).buffer
    const workbookBuffer = createWorkbookBuffer()
    const outputBuffer = await embedSketchFilesIntoFirstWorksheet(
      workbookBuffer,
      [
        {
          rowNumber: 2,
          columnNumber: 2,
          fileName: 'sketch.emf',
          extension: 'emf',
          mimeType: 'image/x-emf',
          data: sketchBytes,
        },
      ],
    )

    const zip = await JSZip.loadAsync(outputBuffer)
    expect(zip.file('xl/media/workshop-sketch-1.emf')).toBeTruthy()

    const contentTypes = await zip.file('[Content_Types].xml')?.async('string')
    expect(contentTypes).toContain('Extension="emf"')
    expect(contentTypes).toContain(
      'ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"',
    )

    const drawingXml = await zip
      .file('xl/drawings/drawing1.xml')
      ?.async('string')
    expect(drawingXml).toContain('<xdr:row>1</xdr:row>')

    const drawingDoc = new DOMParser().parseFromString(
      drawingXml ?? '',
      'application/xml',
    )
    const from = Array.from(drawingDoc.getElementsByTagName('*')).find(
      (element) => element.localName === 'from',
    )
    const blip = Array.from(drawingDoc.getElementsByTagName('*')).find(
      (element) => element.localName === 'blip',
    )

    expect(
      Array.from(from?.children ?? []).find(
        (element) => element.localName === 'col',
      )?.textContent,
    ).toBe('1')

    if (!blip) {
      throw new Error('Expected drawing blip element')
    }

    expect(
      blip.getAttributeNS(
        'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
        'embed',
      ),
    ).toBe('rId1')

    const extracted = await extractFirstWorksheetSketchFiles(outputBuffer)
    const sketch = extracted.get(2)

    expect(sketch?.fileName).toBe('workshop-sketch-1.emf')
    expect(sketch?.extension).toBe('emf')
    expect(new Uint8Array(sketch?.data ?? new ArrayBuffer(0))).toEqual(
      new Uint8Array([1, 2, 3, 4]),
    )
  })
})
