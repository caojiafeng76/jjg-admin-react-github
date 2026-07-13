import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

function readLocalFile(fileName: string): string {
  return readFileSync(resolve(import.meta.dirname, fileName), 'utf8')
}

describe('Syney report document modules', () => {
  it('loads Excel only when the export action is requested', () => {
    const hook = readLocalFile('useExportReportsAsExcel.ts')
    const button = readLocalFile('ExportAsExcelButton.tsx')

    expect(hook).not.toMatch(/from ['"]xlsx-js-style['"]/)
    expect(hook).toContain("import('xlsx-js-style')")
    expect(button).toContain('onMouseEnter={preloadExcel}')
    expect(button).toContain('onFocus={preloadExcel}')
  })

  it('loads PDF dependencies on demand and preloads from both PDF actions', () => {
    const summaryHook = readLocalFile('useGenerateSummaryPDF.ts')
    const reportHook = readLocalFile('useGenerateSyneyStoreReportPDF.ts')
    const summaryButton = readLocalFile('ExportPDFButton.tsx')
    const page = readLocalFile('index.tsx')

    for (const source of [summaryHook, reportHook]) {
      expect(source).not.toMatch(/from ['"]jspdf-autotable['"]/)
      expect(source).not.toMatch(/from ['"]@\/utils\/pdfUtils['"]/)
      expect(source).toContain("import('jspdf-autotable')")
      expect(source).toContain("import('@/utils/pdfUtils')")
    }

    expect(summaryButton).toContain('onMouseEnter={preloadPDF}')
    expect(summaryButton).toContain('onFocus={preloadPDF}')
    expect(page).toContain('onPreload={preloadPDF}')
  })

  it('loads the store receipt renderer only after the print action', () => {
    const hook = readLocalFile('usePrintSyneyStoreReceipt.ts')
    const page = readLocalFile('index.tsx')

    expect(hook).not.toMatch(
      /import\s+\{[^}]+\}\s+from ['"]@\/utils\/syneyStoreReceiptPdf['"]/,
    )
    expect(hook).toContain("import('@/utils/syneyStoreReceiptPdf')")
    expect(hook).toContain('preloadStoreReceiptPDF')
    expect(page).toContain('onPreload={preloadStoreReceiptPDF}')
  })
})
