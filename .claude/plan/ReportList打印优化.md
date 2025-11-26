# ReportList 打印功能优化计划

## 上下文
- **模块**: ReportList（库存报告列表）
- **问题**: 打印速度慢，代码可读性差
- **目标**: 提升打印性能，改进代码可读性
- **约束**: 保持现有PDF格式不变

## 执行计划

### 阶段1: 数据查询优化
- 文件: `src/services/apiSyneyStoreReports.ts`
- 优化: 使用Promise.all并行查询，减少内存过滤

### 阶段2: PDF生成模块化重构
- 文件: `src/features/syney/ReportList/useGenerateSyneyStoreReportPDF.ts`
- 拆分: 将138行的print函数拆分为多个职责单一的小函数

### 阶段3: 创建共享工具模块
- 新文件: `src/utils/pdfConstants.ts`, `src/utils/pdfUtils.ts`
- 目标: 消除重复代码，提取公共逻辑

### 阶段4: 性能优化
- 添加缓存机制
- 优化大数据量处理
- 非阻塞处理

### 阶段5: 用户体验优化
- 添加进度反馈
- 增强错误处理

## 预期成果
- 查询时间减少30-40%
- PDF生成速度提升50%
- 代码可读性和维护性显著提升