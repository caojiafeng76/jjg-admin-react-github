import type { WorkshopOrder } from '@/features/workshop/OrderList'

const loadWorkshopExcelDocument = () => import('./workshopExcelDocument')

export function preloadWorkshopExcel(): void {
  void loadWorkshopExcelDocument()
}

export async function downloadWorkshopOrderTemplate(): Promise<void> {
  const document = await loadWorkshopExcelDocument()
  document.downloadWorkshopOrderTemplate()
}

export async function parseWorkshopOrderExcel(
  file: File,
): Promise<WorkshopOrder[]> {
  const document = await loadWorkshopExcelDocument()
  return document.parseWorkshopOrderExcel(file)
}

export type { WorkshopOrderExcelRow } from './workshopExcelDocument'
