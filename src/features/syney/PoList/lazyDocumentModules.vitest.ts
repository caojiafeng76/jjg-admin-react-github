import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

function readLocalFile(fileName: string): string {
  return readFileSync(resolve(import.meta.dirname, fileName), 'utf8')
}

describe('Syney PO document modules', () => {
  it.each(['usePrint.ts', 'usePrintEnglish.ts'])(
    'keeps heavy label PDF modules out of %s static imports',
    (fileName) => {
      const source = readLocalFile(fileName)

      expect(source).not.toMatch(/from ['"]jspdf['"]/)
      expect(source).not.toMatch(/from ['"]@\/utils\/pdfUtils['"]/)
      expect(source).not.toMatch(/from ['"]@\/utils\/googleFontLoader['"]/)
      expect(source).not.toMatch(/from ['"]@\/utils\/syneySafePartRules['"]/)
      expect(source).not.toMatch(/from ['"]\.\/poLabelPdfDocument['"]/)
      expect(source).toContain('preloadPDF')
    },
  )

  it('loads poLabelPdfDocument on demand and wires hover/focus preload in PoList', () => {
    const printHook = readLocalFile('usePrint.ts')
    const page = readLocalFile('index.tsx')

    expect(printHook).toContain('import(\'./poLabelPdfDocument\')')
    expect(page).toContain('onPreload={preloadChineseLabelPDF}')
    expect(page).toContain('onPreload={preloadEnglishLabelPDF}')
  })

  it('loads decomposition PDF document and safe-part Excel on demand', () => {
    const decomposition = readLocalFile('usePrintDecomposition.ts')
    const decompositionButton = readLocalFile('PrintDecompositionButton.tsx')
    const excel = readLocalFile('useExportSafePartInfoAsExcel.ts')
    const excelButton = readLocalFile('ExportInfoButton.tsx')

    expect(decomposition).not.toMatch(/from ['"]jspdf['"]/)
    expect(decomposition).not.toMatch(/from ['"]@\/utils\/pdfUtils['"]/)
    expect(decomposition).not.toMatch(/from ['"]@\/utils\/syneyDecomposition['"]/)
    expect(decomposition).not.toMatch(/from ['"]\.\/decompositionPdfDocument['"]/)
    expect(decomposition).toContain('import(\'./decompositionPdfDocument\')')
    expect(decompositionButton).toContain('onMouseEnter={preloadPDF}')
    expect(decompositionButton).toContain('onFocus={preloadPDF}')

    expect(excel).not.toMatch(/from ['"]xlsx-js-style['"]/)
    expect(excel).toContain('import(\'xlsx-js-style\')')
    expect(excelButton).toContain('onMouseEnter={preloadExcel}')
    expect(excelButton).toContain('onFocus={preloadExcel}')
  })

  it('loads the shipping-list Excel document on demand', () => {
    const excel = readLocalFile('useExportShippingListAsExcel.ts')
    const excelButton = readLocalFile('ExportShippingListButton.tsx')

    expect(excel).not.toMatch(/from ['"]xlsx-js-style['"]/)
    expect(excel).toContain(
      'import(\'./shippingListExcelDocument\')',
    )
    expect(excelButton).toContain('onMouseEnter={preloadExcel}')
    expect(excelButton).toContain('onFocus={preloadExcel}')
  })

  it('loads the Excel parser on demand and preloads it with the order page', () => {
    const upload = readLocalFile('ExcelUpload.tsx')
    const form = readLocalFile('PoForm.tsx')
    const page = readLocalFile('index.tsx')

    expect(upload).toContain('import(\'@utils/excelUtils\')')
    expect(upload).not.toMatch(
      /import \{[^}]*importExcelOrder[^}]*\} from ['"]@utils\/excelUtils['"]/,
    )
    expect(upload).toContain('useEffect')
    expect(form).toContain(
      'import type { TransformedOrderData } from \'@utils/excelUtils\'',
    )
    expect(page).toContain(
      'import type { TransformedOrderData } from \'@utils/excelUtils\'',
    )
  })
})
