import React, { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import {
  DocumentChartBarIcon,
  HomeIcon,
  KeyIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/16/solid'

import { usePermissionContext } from '@/contexts'
import { useAuth } from '@/contexts'
import { isViewerRole } from '@/config/access'

// ----------------------------------------------------------------
// 菜单项类型扩展：新增可选 permission 字段
// ----------------------------------------------------------------
type MenuItemBase = Required<MenuProps>['items'][number]

interface MenuItemDef {
  key: string
  label: string
  icon?: React.ReactNode
  /** 对应 nav:* 权限 key；父级分组填写 nav:* 权限，无则根据子项决定是否显示 */
  permission?: string
  /** 查看员专用隐藏项：用于没有独立权限 key 的父级分组 */
  hiddenForViewer?: boolean
  children?: MenuItemDef[]
}

// ----------------------------------------------------------------
// 全量菜单定义（所有角色的可见菜单统一在此声明）
// ----------------------------------------------------------------
const allMenuItems: MenuItemDef[] = [
  {
    key: 'dashboard',
    label: '首页',
    icon: <HomeIcon className="size-4" />,
    permission: 'page:dashboard',
  },
  {
    key: 'syney',
    label: '西尼',
    icon: <Square3Stack3DIcon className="size-4" />,
    permission: 'nav:syney',
    children: [
      {
        key: 'syney-po-list',
        label: '订单列表',
        permission: 'page:syney-po-list',
      },
      {
        key: 'syney-store-report-list',
        label: '入库单列表',
        permission: 'page:syney-store-report-list',
      },
      {
        key: 'syney-safe-part-setting',
        label: '件号配置',
        permission: 'page:syney-safe-part-setting',
      },
      {
        key: 'syney-spec-list',
        label: '踏板规格列表',
        permission: 'page:syney-spec-list',
      },
      {
        key: 'syney-setting',
        label: '编号设置',
        permission: 'page:syney-setting',
      },
    ],
  },
  {
    key: 'workshop-order-list',
    label: '订单管理',
    icon: <Square3Stack3DIcon className="size-4" />,
    permission: 'page:workshop-order-production',
  },
  {
    key: 'production-scheduling',
    label: '订单现状',
    icon: <Square3Stack3DIcon className="size-4" />,
    permission: 'nav:production-scheduling',
  },
  {
    key: 'order-scheduling',
    label: '订单排产',
    icon: <Square3Stack3DIcon className="size-4" />,
    permission: 'nav:order-scheduling',
  },
  {
    key: 'standard-time-list',
    label: '成本核算',
    icon: <Square3Stack3DIcon className="size-4" />,
    permission: 'nav:standard-time-list',
  },
  {
    key: 'workshop',
    label: '基础资料',
    icon: <Square3Stack3DIcon className="size-4" />,
    permission: 'nav:workshop-basic',
    children: [
      {
        key: 'employee-list',
        label: '员工管理',
        permission: 'page:employee-list',
      },
      {
        key: 'job-base-setting',
        label: '岗位基础数值设定',
        permission: 'page:job-base-setting',
      },
      {
        key: 'machine-equipment-maintenance',
        label: '机器设备维护',
        permission: 'page:machine-equipment-maintenance',
      },
      {
        key: 'machine-runtime',
        label: '设备运行时间',
        permission: 'page:machine-runtime',
      },
    ],
  },
  {
    key: 'reports',
    label: '报表',
    icon: <DocumentChartBarIcon className="size-4" />,
    permission: 'nav:reports',
    children: [
      {
        key: 'material-transfer',
        label: '物料转移单',
        permission: 'page:material-transfer',
      },
      {
        key: 'production-order',
        label: '生产工单',
        permission: 'page:production-order',
      },
      {
        key: 'production-daily-report',
        label: '生产日报表',
        permission: 'page:production-daily-report',
      },
    ],
  },
  {
    key: 'quality',
    label: '质量',
    icon: <Square3Stack3DIcon className="size-4" />,
    permission: 'nav:quality',
    children: [
      {
        key: 'quality-rework-repair',
        label: '返工返修',
        permission: 'page:quality-rework-repair',
      },
    ],
  },
  {
    key: 'precision-cutting',
    label: '精切',
    icon: <Square3Stack3DIcon className="size-4" />,
    permission: 'nav:precision-cutting',
    children: [
      {
        key: 'precision-cutting-transfer',
        label: '精切转移单',
        permission: 'page:precision-cutting-transfer',
      },
      {
        key: 'precision-finishing-cutting',
        label: '精加工切割单',
        permission: 'page:precision-finishing-cutting',
      },
    ],
  },
  {
    key: 'consumables',
    label: '刀具',
    icon: <Square3Stack3DIcon className="size-4" />,
    permission: 'nav:consumables',
    children: [
      {
        key: 'tooling-data',
        label: '刀具资料',
        permission: 'page:tooling-data',
      },
      {
        key: 'tooling-inventory',
        label: '刀具库存',
        permission: 'page:tooling-inventory',
      },
      {
        key: 'tooling-stock-in',
        label: '刀具入库',
        permission: 'page:tooling-stock-in',
      },
      {
        key: 'tooling-stock-out',
        label: '刀具出库',
        permission: 'page:tooling-stock-out',
      },
    ],
  },
  {
    key: 'labor-protection',
    label: '劳保',
    icon: <Square3Stack3DIcon className="size-4" />,
    permission: 'nav:labor-protection',
    children: [
      {
        key: 'labor-protection-data',
        label: '劳保资料',
        permission: 'page:labor-protection-data',
      },
      {
        key: 'labor-protection-requisition',
        label: '领料单',
        permission: 'page:labor-protection-requisition',
      },
    ],
  },
  {
    key: 'villa-lift',
    label: '别墅梯',
    icon: <Square3Stack3DIcon className="size-4" />,
    permission: 'nav:villa-lift',
    children: [
      {
        key: 'villa-lift-order-list',
        label: '订单管理',
        permission: 'page:villa-lift-order-list',
      },
      {
        key: 'villa-lift-cutting-process',
        label: '切割工序',
        permission: 'page:villa-lift-cutting-process',
      },
      {
        key: 'villa-lift-processing',
        label: '加工工序',
        permission: 'page:villa-lift-processing',
      },
    ],
  },
  {
    key: 'youmai',
    label: '优迈',
    icon: <Square3Stack3DIcon className="size-4" />,
    permission: 'nav:youmai',
    children: [
      {
        key: 'youmai-product-data',
        label: '货品资料',
        permission: 'page:youmai-product-data',
      },
      {
        key: 'youmai-finished-goods-inventory',
        label: '成品库存',
        permission: 'page:youmai-finished-goods-inventory',
      },
      {
        key: 'youmai-finished-goods-stock-in',
        label: '成品入库',
        permission: 'page:youmai-finished-goods-stock-in',
      },
      {
        key: 'youmai-finished-goods-stock-out',
        label: '成品出库',
        permission: 'page:youmai-finished-goods-stock-out',
      },
      {
        key: 'youmai-raw-material-inventory',
        label: '原料库存',
        permission: 'page:youmai-raw-material-inventory',
      },
      {
        key: 'youmai-raw-material-stock-in',
        label: '原料入库',
        permission: 'page:youmai-raw-material-stock-in',
      },
      {
        key: 'youmai-raw-material-stock-out',
        label: '原料出库',
        permission: 'page:youmai-raw-material-stock-out',
      },
    ],
  },
  {
    key: 'attendance',
    label: '考勤',
    icon: <Square3Stack3DIcon className="size-4" />,
    permission: 'nav:attendance',
    children: [
      {
        key: 'attendance-detail',
        label: '考勤明细',
        permission: 'page:attendance-detail',
      },
      {
        key: 'attendance-summary',
        label: '考勤统计',
        permission: 'page:attendance-summary',
      },
    ],
  },
  {
    key: 'access-management',
    label: '权限管理',
    icon: <KeyIcon className="size-4" />,
    permission: 'nav:access-management',
    hiddenForViewer: true,
  },
  // 员工/组长工作台（无独立 nav 权限，靠子项权限决定显示）
  {
    key: 'employee-workspace',
    label: '员工工作台',
    icon: <Square3Stack3DIcon className="size-4" />,
    hiddenForViewer: true,
    children: [
      {
        key: 'production-order',
        label: '我的工单',
        permission: 'page:production-order',
      },
      {
        key: 'production-daily-report',
        label: '我的日报',
        permission: 'page:production-daily-report',
      },
    ],
  },
]

// ----------------------------------------------------------------
// filterMenuByPermissions：根据 can 函数过滤菜单
// ----------------------------------------------------------------
function filterMenuByPermissions(
  items: MenuItemDef[],
  can: (key: string) => boolean,
  isViewer: boolean,
): MenuItemBase[] {
  const result: MenuItemBase[] = []

  for (const item of items) {
    if (isViewer && item.hiddenForViewer) continue

    // 有子菜单
    if (item.children && item.children.length > 0) {
      const filteredChildren = filterMenuByPermissions(
        item.children,
        can,
        isViewer,
      )
      // 子项全被过滤掉 → 隐藏父分组
      if (filteredChildren.length === 0) continue
      // 父分组有 permission → 需要额外检查（并存期保留：permission 不存在或有权限）
      if (item.permission && !can(item.permission)) continue

      result.push({
        key: item.key,
        label: item.label,
        icon: item.icon,
        children: filteredChildren,
      } as MenuItemBase)
      continue
    }

    // 叶子节点
    if (item.permission && !can(item.permission)) continue
    result.push({
      key: item.key,
      label: item.label,
      icon: item.icon,
    } as MenuItemBase)
  }

  return result
}

// ----------------------------------------------------------------
// findParentMenuKey：找出菜单项的父级 key
// ----------------------------------------------------------------
function findParentMenuKey(
  menuKey: string,
  menuItems: MenuItemBase[],
): string | undefined {
  for (const item of menuItems) {
    if (item && 'children' in item && item.children) {
      const hasChild = item.children.some(
        (child: MenuItemBase) => child?.key === menuKey,
      )
      if (hasChild && item.key) {
        return item.key as string
      }
    }
  }
  return undefined
}

// ----------------------------------------------------------------
// MainMenu 组件
// ----------------------------------------------------------------
const MainMenu: React.FC = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { can, isLoading } = usePermissionContext()
  const { role } = useAuth()
  const isViewer = isViewerRole(role)

  const items = useMemo(() => {
    // 权限加载中时返回空（避免闪烁），PermissionContext 内部有 staleTime 缓存
    if (isLoading) return []
    return filterMenuByPermissions(allMenuItems, can, isViewer)
  }, [can, isLoading, isViewer])

  // 从路径中提取当前选中的菜单项和应该展开的父菜单
  const { selectedKey, openKey } = useMemo(() => {
    const path = pathname.slice(1) || 'dashboard'
    const parentKey = findParentMenuKey(path, items)
    return {
      selectedKey: path,
      openKey: parentKey,
    }
  }, [items, pathname])

  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    const path = pathname.slice(1) || 'dashboard'
    const parentKey = findParentMenuKey(path, items)
    return parentKey ? [parentKey] : []
  })

  useEffect(() => {
    if (openKey) {
      setOpenKeys((prevKeys) => {
        if (!prevKeys.includes(openKey)) {
          return [...prevKeys, openKey]
        }
        return prevKeys
      })
    }
  }, [openKey])

  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (!key) return
    const targetPath = `/${key}`
    if (pathname !== targetPath) {
      navigate(targetPath)
    }
  }

  const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
    setOpenKeys(keys as string[])
  }

  return (
    <Menu
      onClick={onClick}
      selectedKeys={[selectedKey]}
      openKeys={openKeys}
      onOpenChange={onOpenChange}
      theme="dark"
      mode="inline"
      items={items}
    />
  )
}

export default MainMenu
