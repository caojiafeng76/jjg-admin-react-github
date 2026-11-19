import type { TableColumnsType } from 'antd'
import type { SyneyMaterialsExcelModule } from './loadSyneyMaterialsExcel'
import type { ParseExcelResult } from '@/utils/syneyMaterialsExcel'
import ExcelImportModal from '@/ui/ExcelImportModal'
import { loadSyneyMaterialsExcel, preloadSyneyMaterialsExcel } from './loadSyneyMaterialsExcel'

type ExcelModule = SyneyMaterialsExcelModule

export interface SyneyMaterialsExcelImportProps<T extends object> {
  title: string
  tip: string
  columns: TableColumnsType<T & { _idx: number }>
  parse: (excel: ExcelModule, file: File) => Promise<ParseExcelResult<T>>
  downloadTemplate: (excel: ExcelModule) => void
  onImport: (rows: T[]) => Promise<void>
  isImporting: boolean
  permissionKey?: string
}

/** 导入按钮 + 下载模板按钮 + 解析预览弹窗；Excel 模块按需加载 */
export default function SyneyMaterialsExcelImport<T extends object>({
  title,
  tip,
  columns,
  parse,
  downloadTemplate,
  onImport,
  isImporting,
  permissionKey,
}: SyneyMaterialsExcelImportProps<T>) {
  return (
    <ExcelImportModal<T>
      title={title}
      tip={tip}
      columns={columns}
      parseFile={async file => parse(await loadSyneyMaterialsExcel(), file)}
      onDownloadTemplate={async () => downloadTemplate(await loadSyneyMaterialsExcel())}
      onImport={onImport}
      isImporting={isImporting}
      permissionKey={permissionKey}
      onPreload={preloadSyneyMaterialsExcel}
    />
  )
}
