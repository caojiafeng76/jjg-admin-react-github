export type SyneyMaterialsExcelModule = typeof import('@/utils/syneyMaterialsExcel')

/** Excel 工具（xlsx-js-style）体积大，按需加载 */
export function loadSyneyMaterialsExcel(): Promise<SyneyMaterialsExcelModule> {
  return import('@/utils/syneyMaterialsExcel')
}

export function preloadSyneyMaterialsExcel() {
  void loadSyneyMaterialsExcel()
}
