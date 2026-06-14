---
name: query-before-page-edit
description: 强制“先查询、后动手”的页面级工作流。当用户要求写新页面、修改现有页面、在页面中新增/删除/重构功能模块，或调整页面相关的路由/菜单/权限时触发。Query first before writing or editing any page.
---

# 写/改页面前先查询

## 触发条件

以下任一情况都必须先查询，再动手：

- 用户要求“写一个 XX 页面”。
- 用户要求“修改/重构 XX 页面”。
- 用户要求“在 XX 页面里加/删/改某个功能模块”。
- 用户调整页面相关的路由、菜单、权限、页面标题。

## 强制规则

**禁止凭记忆直接写或改页面代码。** 在编辑文件前，必须完成以下查询：

1. **现有实现**：用 Serena MCP 或文件搜索定位该页面当前文件，阅读组件结构、Props、状态、hooks、类型定义。
2. **路由/菜单/权限**：检查 `router`、`MainMenu`、access 配置与页面入口，确保联动一致。
3. **字段链路**：列出页面涉及的列表/表单/详情/搜索字段，确认服务层、类型、查询、表格、表单中的字段一致。
4. **Ant Design 组件**：若页面使用 antd 组件，运行：
   ```bash
   bunx antd info <Component> --format json
   ```
   并参考 `ant-design` skill。禁止虚构 props、事件或 DOM 结构。
5. **项目模板**：若是新增页面，参考已有 feature 模块结构（`FeatureName/index.tsx`、`FeatureTable.tsx`、`FeatureForm.tsx`、`FeatureSearch.tsx`、相关 hooks）保持 CRUD 结构一致。

## 查询后的执行

- 用最少必要改动实现目标。
- 新增/修改字段时，同步更新类型、服务层、表格、表单、搜索、详情、导出。
- 调整路由/菜单/权限时，同步更新相关入口与配置。

## 验证

- 改动后运行 `bun lint` 与 `bun run build`。
- 若改动了 antd 组件代码，运行：
  ```bash
  bunx antd lint <changed-path> --format json
  ```
- 若项目有对应测试，运行 `bun run test`。
