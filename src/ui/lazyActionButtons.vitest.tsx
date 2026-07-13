import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ExportButton from './ExportButton'
import ImportButton from './ImportButton'
import DownloadTemplateButton from './DownloadTemplateButton'
import PrintButton from './PrintButton'

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => true,
}))

vi.mock('@/hooks/useViewerOperationGuard', () => ({
  useViewerOperationGuard: () => ({
    viewerDenied: false,
    viewerOperationTip: '',
  }),
}))

describe('lazy action buttons', () => {
  it('preloads the print implementation on hover and keyboard focus', () => {
    const onPreload = vi.fn()
    render(<PrintButton handlePrint={vi.fn()} onPreload={onPreload} />)

    const button = screen.getByRole('button', { name: /打印/ })
    fireEvent.mouseEnter(button)
    fireEvent.focus(button)

    expect(onPreload).toHaveBeenCalledTimes(2)
  })

  it('preloads the Excel implementation on hover and keyboard focus', () => {
    const onPreload = vi.fn()
    render(<ExportButton handleExport={vi.fn()} onPreload={onPreload} />)

    const button = screen.getByRole('button', { name: /导出Excel/ })
    fireEvent.mouseEnter(button)
    fireEvent.focus(button)

    expect(onPreload).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['import', ImportButton, /导入 Excel/],
    ['template download', DownloadTemplateButton, /下载模板/],
  ] as const)(
    'preloads the %s implementation on hover and keyboard focus',
    (_name, ActionButton, accessibleName) => {
      const onPreload = vi.fn()
      render(<ActionButton onClick={vi.fn()} onPreload={onPreload} />)

      const button = screen.getByRole('button', { name: accessibleName })
      fireEvent.mouseEnter(button)
      fireEvent.focus(button)

      expect(onPreload).toHaveBeenCalledTimes(2)
    },
  )
})
