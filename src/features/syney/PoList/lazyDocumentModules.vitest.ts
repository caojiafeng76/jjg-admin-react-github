import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

function readLocalFile(fileName: string): string {
  return readFileSync(resolve(import.meta.dirname, fileName), 'utf8')
}

describe('Syney PO document modules', () => {
  it.each(['usePrint.ts', 'usePrintEnglish.ts'])(
    'loads label PDF dependencies on demand in %s',
    (fileName) => {
      const source = readLocalFile(fileName)

      expect(source).not.toMatch(/import jsPDF from ['"]jspdf['"]/)
      expect(source).not.toMatch(/from ['"]@\/utils\/pdfUtils['"]/)
      expect(source).toContain("import('jspdf')")
      expect(source).toContain("import('@/utils/pdfUtils')")
      expect(source).toContain('preloadPDF')
    },
  )

  it('loads decomposition PDF and safe-part Excel on demand', () => {
    const decomposition = readLocalFile('usePrintDecomposition.ts')
    const decompositionButton = readLocalFile('PrintDecompositionButton.tsx')
    const excel = readLocalFile('useExportSafePartInfoAsExcel.ts')
    const excelButton = readLocalFile('ExportInfoButton.tsx')

    expect(decomposition).not.toMatch(/from ['"]@\/utils\/pdfUtils['"]/)
    expect(decomposition).toContain("import('@/utils/pdfUtils')")
    expect(decompositionButton).toContain('onMouseEnter={preloadPDF}')
    expect(decompositionButton).toContain('onFocus={preloadPDF}')

    expect(excel).not.toMatch(/from ['"]xlsx-js-style['"]/)
    expect(excel).toContain("import('xlsx-js-style')")
    expect(excelButton).toContain('onMouseEnter={preloadExcel}')
    expect(excelButton).toContain('onFocus={preloadExcel}')
  })

  it('loads the Excel parser with the order page to avoid upload-time chunk fetch failures', () => {
    const upload = readLocalFile('ExcelUpload.tsx')
    const form = readLocalFile('PoForm.tsx')
    const page = readLocalFile('index.tsx')

    expect(upload).toMatch(
      /import \{[^}]*importExcelOrder[^}]*\} from ['"]@utils\/excelUtils['"]/,
    )
    expect(upload).not.toContain("import('@utils/excelUtils')")
    expect(form).toContain(
      "import type { TransformedOrderData } from '@utils/excelUtils'",
    )
    expect(page).toContain(
      "import type { TransformedOrderData } from '@utils/excelUtils'",
    )
  })
})
