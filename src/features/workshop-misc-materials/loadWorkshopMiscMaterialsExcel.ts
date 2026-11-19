let cachedPromise: Promise<typeof import('@/utils/workshopMiscMaterialsExcel')> | null = null

export type WorkshopMiscMaterialsExcelModule = typeof import('@/utils/workshopMiscMaterialsExcel')

export function loadWorkshopMiscMaterialsExcel() {
  if (!cachedPromise) {
    cachedPromise = import('@/utils/workshopMiscMaterialsExcel').catch((error) => {
      cachedPromise = null
      throw error
    })
  }
  return cachedPromise
}

export function preloadWorkshopMiscMaterialsExcel() {
  void loadWorkshopMiscMaterialsExcel()
}
