// 订单现状看板的纯计算函数，按职责拆分在 ./orderStatusDashboard/ 下；
// 本文件保留原导入路径并只做转出
export { AUTO_CUT_JOB_NAMES, PACKAGING_JOB_NAME } from './orderStatusDashboard/constants'
export {
  buildJobColumns,
  buildOperationMatchKey,
  buildProcessJobIndex,
  buildProcessJobKey,
  isLastProcessProductionRow,
  resolveLastProcessStatus,
  resolveProductionJobName,
  setLastProcessMapValue,
  setUniqueJobMapValue,
} from './orderStatusDashboard/jobMatching'
export {
  buildPackagingProductionDetailsForDashboard,
  getPackagingDefectiveWeight,
  getPackagingSurfaceTreatment,
  groupPackagingRowsByProjectNo,
} from './orderStatusDashboard/packaging'
export {
  buildProductionDetail,
  buildReworkRepairInfo,
  calculateInventoryQuantity,
  getAutoCutQuantity,
  getDefectQuantity,
} from './orderStatusDashboard/productionDetail'
export {
  addUniqueText,
  getSingleRelation,
  normalizeStringArray,
  normalizeText,
  roundTo,
} from './orderStatusDashboard/textUtils'
