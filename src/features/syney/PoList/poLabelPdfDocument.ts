import type { SelectedSyneyPoWithItems } from '@services/apiSyneyPos'
import type { SyneySafePartSetting } from '@services/apiSyneySafePartSettings'
import type { ISyneyItem } from '@/types'
import dayjs from 'dayjs'
import jsPDF from 'jspdf'

import { GOOGLE_FONT_CONFIG, loadGoogleFont } from '@/utils/googleFontLoader'
import { openPDFInNewWindow } from '@/utils/pdfUtils'
import {
  getLabelInfoBySettings,
  getLabelInfoFromStoredItem,
} from '@/utils/syneySafePartRules'

export type SyneyLabelLocale = 'zh' | 'en'

interface PrintableLabelInfo {
  partName2: string
  partModel: string
  partCode: string
  englishPartName: string
}

interface LabelLocaleConfig {
  baseFontSize: number
  partNameLabel: string
  partNameLabelX: number
  specLabel: string
  specLabelX: number
  qtyLabel: string
  qtyLabelX: number
  partNoLabel: string
  partNoLabelX: number
  soNoLabel: string
  soNoLabelX: number
  endDateLabel: string
  endDateLabelX: number
  supplierLabel: string
  supplierLabelX: number
  supplierName: string
  supplierNameX: number
  supplierFontSize: number
  partCodeLabel: string
  partCodeLabelX: number
  partModelLabel: string
  partModelLabelX: number
  framePartName: string
}

const LABEL_CONFIG: Record<SyneyLabelLocale, LabelLocaleConfig> = {
  zh: {
    baseFontSize: 8,
    partNameLabel: '产品名称',
    partNameLabelX: 6,
    specLabel: '规格',
    specLabelX: 8,
    qtyLabel: '数量',
    qtyLabelX: 8,
    partNoLabel: '件号',
    partNoLabelX: 40,
    soNoLabel: '合同号',
    soNoLabelX: 39,
    endDateLabel: '制造日期',
    endDateLabelX: 38,
    supplierLabel: '制造单位名称',
    supplierLabelX: 10,
    supplierName: '湖州银都铝业科技有限公司',
    supplierNameX: 45,
    supplierFontSize: 8,
    partCodeLabel: '编号',
    partCodeLabelX: 8,
    partModelLabel: '产品型号',
    partModelLabelX: 38,
    framePartName: '围框',
  },
  en: {
    baseFontSize: 7,
    partNameLabel: 'PartName',
    partNameLabelX: 6,
    specLabel: 'ParamSpec',
    specLabelX: 6,
    qtyLabel: 'Qty',
    qtyLabelX: 8,
    partNoLabel: 'PartNo',
    partNoLabelX: 40,
    soNoLabel: 'SONo',
    soNoLabelX: 39,
    endDateLabel: 'EndDate',
    endDateLabelX: 38,
    supplierLabel: 'SupplierName',
    supplierLabelX: 10,
    supplierName: 'Huzhou Yindu Aluminum Technology Co., Ltd.',
    supplierNameX: 40,
    supplierFontSize: 5,
    partCodeLabel: 'PartCode',
    partCodeLabelX: 6,
    partModelLabel: 'PartModel',
    partModelLabelX: 38,
    framePartName: 'Frame',
  },
}

function drawBoldText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: Record<string, unknown>,
) {
  doc.text(text, x, y, options)
  doc.text(text, x + 0.12, y, options)
}

function getPartNoCoordinateX(partNo: string): number {
  switch (partNo.length) {
    case 9:
      return 58
    case 10:
      return 56
    default:
      return 53
  }
}

function drawLabelFrame(doc: jsPDF, locale: SyneyLabelLocale) {
  const config = LABEL_CONFIG[locale]

  doc.rect(5, 2, 80, 25)
  doc.line(5, 7, 85, 7)
  doc.line(5, 12, 85, 12)
  doc.line(5, 17, 85, 17)
  doc.line(5, 22, 85, 22)

  doc.line(20, 2, 20, 22)
  doc.line(36, 2, 36, 22)
  doc.line(51, 2, 51, 22)
  doc.line(36, 22, 36, 27)

  doc.setFontSize(config.baseFontSize)
  drawBoldText(doc, config.partNameLabel, config.partNameLabelX, 6)
  drawBoldText(doc, config.specLabel, config.specLabelX, 11)
  drawBoldText(doc, config.qtyLabel, config.qtyLabelX, 21)
  drawBoldText(doc, config.partNoLabel, config.partNoLabelX, 6)
  drawBoldText(doc, config.soNoLabel, config.soNoLabelX, 11)
  drawBoldText(doc, config.endDateLabel, config.endDateLabelX, 21)
  drawBoldText(doc, config.supplierLabel, config.supplierLabelX, 26)

  doc.setFontSize(config.supplierFontSize)
  drawBoldText(doc, config.supplierName, config.supplierNameX, 26)
  doc.setFontSize(config.baseFontSize)
}

function drawItemLabelPage(
  doc: jsPDF,
  item: ISyneyItem,
  labelInfo: PrintableLabelInfo,
  endDate: string,
  locale: SyneyLabelLocale,
) {
  const config = LABEL_CONFIG[locale]

  drawLabelFrame(doc, locale)

  drawBoldText(doc, config.partCodeLabel, config.partCodeLabelX, 16)
  drawBoldText(doc, config.partModelLabel, config.partModelLabelX, 16)

  if (locale === 'en') {
    doc.setFontSize(6)
    drawBoldText(doc, labelInfo.englishPartName, 21, 6)
    doc.setFontSize(config.baseFontSize)
  }
  else {
    const partNameX = labelInfo.partName2.length === 5 ? 21 : 23
    drawBoldText(doc, labelInfo.partName2, partNameX, 6)
  }

  drawBoldText(doc, `${item.ParamSpec ?? ''}`, 21, 11)
  drawBoldText(doc, labelInfo.partCode, 21, 16)
  drawBoldText(doc, '1', 27, 21)

  const partNo = item.PartNo ?? ''
  drawBoldText(doc, partNo, getPartNoCoordinateX(partNo), 6)
  drawBoldText(doc, `${item.SONo ?? ''}`, 53, 11)
  drawBoldText(doc, labelInfo.partModel, 58, 16)
  drawBoldText(doc, endDate, 58, 21)
}

function drawFrameLabelPage(
  doc: jsPDF,
  spec: string,
  soNo: string,
  endDate: string,
  locale: SyneyLabelLocale,
) {
  const config = LABEL_CONFIG[locale]

  drawLabelFrame(doc, locale)
  drawBoldText(doc, config.framePartName, 24, 6)

  if (locale === 'en') {
    const frameModel = /\d+/.exec(spec.split('-').at(0) || '')?.at(0) ?? ''
    drawBoldText(doc, frameModel ? `${frameModel}#` : '', 24, 11)
  }
  else {
    drawBoldText(doc, `${spec.split('-').at(0) ?? ''}`, 23, 11)
  }

  drawBoldText(doc, '1', 27, 21)
  drawBoldText(doc, soNo, 53, 11)
  drawBoldText(doc, endDate, 58, 21)
}

async function yieldIfNeeded(pageCount: number) {
  if (pageCount % 10 === 0) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

export async function generatePoLabelsPDF(
  selectedPosList: SelectedSyneyPoWithItems[],
  safePartSettings: SyneySafePartSetting[],
  locale: SyneyLabelLocale,
) {
  const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: [90, 30] })
  const fontData = await loadGoogleFont()

  doc.addFileToVFS(GOOGLE_FONT_CONFIG.FONT_NAME, fontData)
  doc.addFont(
    GOOGLE_FONT_CONFIG.FONT_NAME,
    GOOGLE_FONT_CONFIG.FONT_FAMILY,
    GOOGLE_FONT_CONFIG.FONT_STYLE,
  )
  doc.setFont(GOOGLE_FONT_CONFIG.FONT_FAMILY)
  doc.setFontSize(LABEL_CONFIG[locale].baseFontSize)

  let isFirstPage = true
  let pageCount = 0

  for (const { po, items } of selectedPosList) {
    const soNo = po.SONo ?? ''
    const spec = po.Spec ?? ''
    const endDate = po.EndDate ? dayjs(po.EndDate).format('YYYY-MM-DD') : ''
    const serialNo = po.SerialNo ?? ''

    // 1. 打印物料标签
    for (const item of items) {
      const labelInfo
        = getLabelInfoBySettings(item.PartNo, serialNo, safePartSettings)
          ?? getLabelInfoFromStoredItem(item, safePartSettings)

      if (!labelInfo) {
        continue
      }

      for (let i = 0; i < (item.Qty || 1); i++) {
        if (!isFirstPage) {
          doc.addPage()
        }
        isFirstPage = false

        drawItemLabelPage(doc, item, labelInfo, endDate, locale)

        pageCount++
        await yieldIfNeeded(pageCount)
      }
    }

    // 2. 打印围框 / Frame 标签
    if (!isFirstPage) {
      doc.addPage()
    }
    isFirstPage = false

    drawFrameLabelPage(doc, spec, soNo, endDate, locale)

    pageCount++
    await yieldIfNeeded(pageCount)
  }

  openPDFInNewWindow(doc)
}
