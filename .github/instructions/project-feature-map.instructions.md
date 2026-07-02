---
applyTo: "src/features/**,src/routes/**,src/ui/MainMenu.tsx,src/config/permissionRegistry.ts,src/config/access.ts,src/services/**"
---

# 项目功能域地图

修改列表、表单、详情、搜索、导入导出、路由、菜单、权限或服务层时，先用下表定位业务域，再检查同一行列出的入口链路是否需要同步。

## 固定入口

- 路由定义：`src/routes/router.tsx`
- 路由中文标签：`src/routes/routeLabels.ts`
- 菜单入口：`src/ui/MainMenu.tsx`
- 权限汇总：`src/config/permissionRegistry.ts`
- 权限判断：`src/config/access.ts`
- 服务层：`src/services/api*.ts`
- feature 权限定义：`src/features/<domain>/permissions.ts`

## 业务域速查

| Feature 目录 | 中文业务域 | 主要路由 | 常见服务层/表核对点 |
| --- | --- | --- | --- |
| `syney` | 西尼 | `syney-po-list`, `syney-store-report-list`, `syney-spec-list`, `syney-safe-part-setting`, `syney-setting` | `apiSyney*.ts`; `syney-pos`, `syney-po-items`, `syney-specs`, `syney-store-reports`, `syney-store-report-items`, `syney_safe_part_settings`, `syney-serial-no` |
| `workshop` | 基础资料 / 车间订单 | `workshop-order-list`, `production-scheduling`, `order-scheduling`, `employee-list`, `standard-time-list`, `job-base-setting`, `machine-equipment-maintenance` | `apiWorkshopOrders.ts`, `apiEmployees.ts`, `apiStandardTimes.ts`, `apiJobBaseSettings.ts`; `sales_orders`, `employees`, `process_standards`, `job_base_settings`, `machine_equipment_maintenances` |
| `production-order` | 生产工单 | `production-order`, `production-order/create`, `production-order/scan`, `production-order/:orderId`, `production-order/:orderId/edit` | `apiProductionOrders.ts`, `apiProductionOrderItems.ts`; `production_orders`, `production_order_items` |
| `material-transfer` | 物料转移单 | `material-transfer`, `material-transfer/scan` | `apiMaterialTransfers.ts`; `material_transfers` |
| `precision-finishing-cutting` | 精加工切割单 | `precision-finishing-cutting`, `precision-finishing-cutting/scan` | `apiPrecisionFinishingCuttings.ts`; 先核对服务层实际表名和关联 `sales_orders` |
| `precision-cutting-transfer` | 精切转移单 | `precision-cutting-transfer` | `apiPrecisionCuttingTransfers.ts`; 先核对服务层实际表名和关联 `sales_orders` |
| `production-report` | 生产日报表 | `production-daily-report` | `apiProductionDailyReport.ts`; `production_order_items`, `sales_orders` |
| `extrusion-production` | 挤压生产单 | `extrusion-production-order` | `apiExtrusionProductions.ts`; `extrusion_productions`, `extrusion_production_items`, `sales_orders` |
| `extrusion-production-daily-report` | 挤压生产日报表 | `extrusion-production-daily-report` | `apiExtrusionProductionDailyReport.ts`; `extrusion_production_items` |
| `quality` | 质量 | `quality-rework-repair`, `quality-issue-record` | `apiQualityReworkRepair.ts`, `apiQualityIssueRecords.ts`; 先核对服务层实际表名和关联 `sales_orders` |
| `machine-runtime` | 设备运行时间 | `machine-runtime` | `apiMachineRuntime.ts`; `v_machine_runtime_items`, `machine_equipment_maintenances` |
| `tooling` | 刀具 | `tooling-data`, `tooling-inventory`, `tooling-stock-in`, `tooling-stock-out` | `apiTooling*.ts`; `tooling_data`, `tooling_inventory`, `tooling_stock_in`, `tooling_stock_out` |
| `labor-protection` | 劳保 | `labor-protection-data`, `labor-protection-requisition`; public QR path 常量在 feature 内 | `apiLaborProtection*.ts`; 先核对服务层实际表名 |
| `youmai` | 优迈 | `youmai-product-data`, `youmai-finished-goods-inventory`, `youmai-finished-goods-stock-in`, `youmai-finished-goods-stock-out`, `youmai-raw-material-inventory`, `youmai-raw-material-stock-in`, `youmai-raw-material-stock-out` | `apiYoumai*.ts`; `youmai_*` 库存/出入库/产品资料表 |
| `attendance` | 考勤 | `attendance-detail`, `attendance-summary` | `apiAttendanceDetails.ts`; `employees`, `production_orders` 等统计关联表 |
| `villa-lift` | 别墅梯 | `villa-lift-order-list`, `villa-lift-cutting-process`, `villa-lift-processing` | `apiVillaLift*.ts`; `villa_lift_orders`, `villa_lift_order_items`, `villa_lift_cutting_records`, `villa_lift_finishing_records` |
| `access-management` | 权限管理 | `access-management` | `apiPermissions.ts`, `apiRoles.ts`; `permissions`, `roles`, `role_permissions` |

## 同步检查规则

- 改路由、菜单、页面标题、权限或角色判断：同步检查 `router.tsx`、`routeLabels.ts`、`MainMenu.tsx`、`permissionRegistry.ts`、`access.ts` 和受影响页面入口。
- 改列表、表单、详情、搜索、表格列、导入导出字段：同步检查 feature 组件、hooks、服务层、类型、查询参数、表格列、表单项、详情展示和导出字段。
- 改 Query / Mutation / queryKey / invalidateQueries：同步检查相关 hook、调用点和失效键，确认“请求成功后界面会刷新”。
- 改状态流转、数量、工时、成本、时长计算：同步检查写入入口、展示入口、汇总入口和测试覆盖，避免同一业务口径分裂。