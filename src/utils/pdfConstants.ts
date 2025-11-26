/**
 * PDF 生成相关常量定义
 * 用于统一管理打印参数，提升代码可维护性
 */

// PDF 页面配置
export const PDF_CONFIG = {
  // 页面方向
  ORIENTATION: 'l' as const, // 横向

  // 页面尺寸
  PAGE_SIZE: 'a4' as const,

  // 单位
  UNIT: 'mm' as const,
}

// 字体配置
export const FONT_CONFIG = {
  // 字体文件名
  FONT_NAME: 'msyh.ttf',
  FONT_FAMILY: 'myFont',
  FONT_STYLE: 'normal' as const,
}

// 表格配置
export const TABLE_CONFIG = {
  // 表头样式
  HEAD_STYLES: {
    fillColor: [0, 0, 0] as [number, number, number], // 黑色背景
    textColor: [255, 255, 255] as [number, number, number], // 白色文字
    font: FONT_CONFIG.FONT_FAMILY,
  },

  // 表格样式
  STYLES: {
    font: FONT_CONFIG.FONT_FAMILY,
    cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
    halign: 'center' as const,
    valign: 'middle' as const,
  },

  // 表格主题
  THEME: 'grid' as const,

  // 表格边距
  MARGIN: { top: 35 },

  // 分页大小
  ROWS_PER_PAGE: 25,
}

// 布局配置
export const LAYOUT_CONFIG = {
  // 标题
  TITLE: {
    TEXT: '西尼对账单',
    FONT_SIZE: 20,
    X_OFFSET: 120,
    Y_OFFSET: -22,
  },

  // 汇总标题
  SUMMARY_TITLE: {
    PREFIX: '对账单【湖州银都铝业科技有限公司】-- ',
    FONT_SIZE: 20,
    X_OFFSET: 40,
    Y_OFFSET: -22,
  },

  // 页码
  PAGE_NUMBER: {
    X_OFFSET: -150,
    Y_OFFSET: 10,
  },

  // 表头信息
  HEADER_INFO: {
    MARGIN: { top: 22 },
    HEAD: [['入库单号', '对账日期']],
  },
}

// 表格列定义
export const TABLE_COLUMNS = [
  '序号',
  '件号',
  '名称',
  '规格',
  '参数规格',
  '单位',
  '单价',
  '数量',
  '小计',
] as const

// 汇总表格列定义
export const SUMMARY_TABLE_COLUMNS = [
  '序号',
  '入库单号',
  '金额',
] as const

// 缓存配置
export const CACHE_CONFIG = {
  // 格式化数字缓存
  FORMATTED_NUMBERS: new Map<string, string>(),

  // 缓存大小限制
  MAX_CACHE_SIZE: 1000,

  // 清理缓存的阈值
  CACHE_CLEANUP_THRESHOLD: 800,
}

// 报告打印布局配置
export const REPORT_LAYOUT_CONFIG = {
  // 标题偏移量
  TITLE_OFFSET_X: 40,
  TITLE_OFFSET_Y: 22,

  // 对账单标题偏移量
  DETAIL_TITLE_OFFSET_X: 120,
  DETAIL_TITLE_OFFSET_Y: 22,

  // 页码偏移量
  PAGE_NUMBER_X_OFFSET: -150,
  PAGE_NUMBER_Y_OFFSET: 10,
}

// 文件名生成配置
export const FILENAME_CONFIG = {
  // 时间戳格式
  TIMESTAMP_FORMAT: 'yyyy-MM-dd_HH-mm-ss',

  // 文件名前缀
  PREFIX: {
    DETAIL: '西尼对账单',
    SUMMARY: '对账单汇总',
  },

  // 文件名后缀
  SUFFIX: '.pdf',
}