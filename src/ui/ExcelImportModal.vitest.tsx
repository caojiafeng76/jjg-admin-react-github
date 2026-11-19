import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ExcelImportModal from './ExcelImportModal'

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => true,
}))

vi.mock('@/hooks/useViewerOperationGuard', () => ({
  useViewerOperationGuard: () => ({
    viewerDenied: false,
    viewerOperationTip: '',
  }),
}))

afterEach(cleanup)

interface DemoRow {
  code: string
}

const COLUMNS = [{ title: '编码', dataIndex: 'code' }]

describe('ExcelImportModal', () => {
  it('opens modal, parses an Excel file, previews rows, and submits import', async () => {
    const parseFile = vi.fn().mockResolvedValue({
      rows: [{ code: 'A-001' }, { code: 'A-002' }],
      errors: [],
    })
    const onImport = vi.fn().mockResolvedValue(undefined)
    const onDownloadTemplate = vi.fn()

    render(
      <ExcelImportModal<DemoRow>
        title="批量导入演示"
        tip="请按模板填写"
        columns={COLUMNS}
        parseFile={parseFile}
        onImport={onImport}
        onDownloadTemplate={onDownloadTemplate}
        isImporting={false}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /下载模板/ }))
    expect(onDownloadTemplate).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /导入 Excel/ }))
    expect(await screen.findByText('批量导入演示')).toBeTruthy()
    expect(screen.getByText('请按模板填写')).toBeTruthy()

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['dummy'], 'demo.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(await screen.findByText('预览（共 2 条）')).toBeTruthy()
    expect(screen.getByText('A-001')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /确认导入（2 条）/ }))
    await waitFor(() => {
      expect(onImport).toHaveBeenCalledWith([{ code: 'A-001' }, { code: 'A-002' }])
    })
  })

  it('keeps modal open and shows FormErrorAlert when onImport rejects', async () => {
    const parseFile = vi.fn().mockResolvedValue({
      rows: [{ code: 'B-001' }],
      errors: ['第 3 行编码为空'],
    })
    const onImport = vi.fn().mockRejectedValue(new Error('编码已存在'))

    render(
      <ExcelImportModal<DemoRow>
        title="批量导入失败测试"
        tip="提示信息"
        columns={COLUMNS}
        parseFile={parseFile}
        onImport={onImport}
        isImporting={false}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /导入 Excel/ }))
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['dummy'], 'fail.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(await screen.findByText('解析时发现 1 个问题')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /确认导入（1 条）/ }))

    expect(await screen.findByText('操作失败')).toBeTruthy()
    expect(screen.getByText('批量导入失败测试')).toBeTruthy()
  })
})
