# permission-ui-components Specification

## Purpose
TBD - created by archiving change add-rbac-permission-system. Update Purpose after archive.
## Requirements
### Requirement: PermissionGate 组件根据权限控制子内容显示或禁用

系统 SHALL 提供 `<PermissionGate permission={key} mode?='hide'|'disable'>` 组件。默认 mode 为 `'hide'`：无权限时不渲染子组件；mode 为 `'disable'` 时：无权限时渲染子组件但注入 `disabled={true}`。

#### Scenario: 有权限时正常渲染

- **WHEN** 当前用户拥有 permission prop 对应的权限
- **THEN** 子组件正常渲染，无额外属性注入

#### Scenario: 无权限且 mode=hide 时隐藏

- **WHEN** 当前用户不拥有权限，mode 为默认（hide）
- **THEN** 子组件不渲染（返回 null）

#### Scenario: 无权限且 mode=disable 时禁用

- **WHEN** 当前用户不拥有权限，mode 为 'disable'
- **THEN** 子组件渲染，且注入 disabled=true

### Requirement: PermissionButton 组件封装权限检查的 Ant Design Button

系统 SHALL 提供 `<PermissionButton permission={key} ...ButtonProps>` 组件，等价于 `<PermissionGate mode='disable'><Button ...></PermissionGate>`。无权限时按钮禁用并显示 Tooltip 提示"无操作权限"。

#### Scenario: 无权限时按钮禁用并有提示

- **WHEN** 当前用户不拥有 permission 对应权限，渲染 PermissionButton
- **THEN** Button 的 disabled=true，Tooltip 显示"无操作权限"

#### Scenario: 有权限时按钮正常可点击

- **WHEN** 当前用户拥有权限
- **THEN** Button 正常渲染，无 disabled，点击触发 onClick

### Requirement: PermissionField 组件控制表单字段三态渲染

系统 SHALL 提供 `<PermissionField module={string} field={string}>` 组件，包裹 `<Form.Item>`，根据 `useFieldPermission(module, field)` 返回的三态状态控制字段渲染：

- `'hidden'`：不渲染任何内容
- `'readonly'`：渲染 Form.Item，但给直接子控件注入 `disabled={true}`
- `'editable'`：正常渲染，不注入额外属性

#### Scenario: hidden 态不渲染字段

- **WHEN** useFieldPermission 返回 'hidden'
- **THEN** PermissionField 返回 null，DOM 中无对应表单字段

#### Scenario: readonly 态字段显示但不可编辑

- **WHEN** useFieldPermission 返回 'readonly'
- **THEN** Form.Item 正常渲染，包裹的 Ant Design 控件 disabled=true

#### Scenario: editable 态字段正常可编辑

- **WHEN** useFieldPermission 返回 'editable'
- **THEN** Form.Item 正常渲染，控件无 disabled

#### Scenario: 不支持 disabled 的自定义控件降级提示

- **WHEN** PermissionField 包裹的子组件不接受 disabled 属性
- **THEN** PermissionField 通过 cloneElement 注入时不报错（React 忽略非法属性），调用方可直接使用 useFieldPermission hook 替代

