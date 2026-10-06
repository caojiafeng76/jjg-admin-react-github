import type { MenuProps } from 'antd'
import { describe, expect, it } from 'vitest'

import {
  allMenuItems,
  filterMenuByPermissions,
  findAncestorMenuKeys,
} from './mainMenuItems'

type AntdMenuItem = Required<MenuProps>['items'][number]

interface MenuNode {
  key?: string
  children?: MenuNode[]
}

const JINTAN_PERMISSION_KEYS = [
  'nav:jintan',
  'page:jintan-parts-data',
  'page:jintan-parts-inventory',
  'page:jintan-parts-stock-in',
  'page:jintan-parts-stock-out',
  'page:jintan-profiles-data',
  'page:jintan-profiles-inventory',
  'page:jintan-profiles-stock-in',
  'page:jintan-profiles-stock-out',
  'page:jintan-materials-data',
  'page:jintan-materials-inventory',
  'page:jintan-materials-stock-in',
  'page:jintan-materials-stock-out',
]

function makeCan(grantedKeys: string[]) {
  const granted = new Set(grantedKeys)
  return (key: string) => granted.has(key)
}

/** 把 antd Menu items 转成只含 key/children 的纯结构，便于断言 */
function toMenuTree(items: AntdMenuItem[]): MenuNode[] {
  return items.map((item) => {
    if (!item || typeof item !== 'object') return {}
    const node = item as {
      key?: string | number
      children?: AntdMenuItem[]
    }
    return {
      key: node.key === undefined ? undefined : String(node.key),
      children: node.children ? toMenuTree(node.children) : undefined,
    }
  })
}

function filterWith(keys: string[]) {
  return toMenuTree(filterMenuByPermissions(allMenuItems, makeCan(keys), false))
}

function findJintan(keys: string[]) {
  return filterWith(keys).find((node) => node.key === 'jintan')
}

describe('金檀木业菜单分组', () => {
  it('全量授权时按 配件/型材/素材 三个分组展示 12 个页面', () => {
    const jintan = findJintan(JINTAN_PERMISSION_KEYS)

    expect(jintan?.children?.map((group) => group.key)).toEqual([
      'jintan-parts',
      'jintan-profiles',
      'jintan-materials',
    ])
    expect(jintan?.children?.map((group) => group.children?.length)).toEqual([
      4, 4, 4,
    ])
  })

  it('仅授予素材页面权限时只显示素材分组', () => {
    const jintan = findJintan(['nav:jintan', 'page:jintan-materials-data'])

    expect(jintan?.children?.map((group) => group.key)).toEqual([
      'jintan-materials',
    ])
    expect(jintan?.children?.[0]?.children?.map((leaf) => leaf.key)).toEqual([
      'jintan-materials-data',
    ])
  })

  it('无金檀木业页面权限时整个分组隐藏', () => {
    expect(findJintan(['page:dashboard'])).toBeUndefined()
  })

  it('缺失 nav:jintan 时整个分组隐藏', () => {
    expect(findJintan(['page:jintan-parts-data'])).toBeUndefined()
  })
})

describe('findAncestorMenuKeys', () => {
  it('三级菜单叶子返回完整祖先链', () => {
    const items = filterMenuByPermissions(
      allMenuItems,
      makeCan(['nav:jintan', 'page:jintan-parts-data']),
      false,
    )

    expect(findAncestorMenuKeys('jintan-parts-data', items)).toEqual([
      'jintan',
      'jintan-parts',
    ])
  })

  it('素材分组叶子返回素材祖先链', () => {
    const items = filterMenuByPermissions(
      allMenuItems,
      makeCan(['nav:jintan', 'page:jintan-materials-stock-out']),
      false,
    )

    expect(findAncestorMenuKeys('jintan-materials-stock-out', items)).toEqual([
      'jintan',
      'jintan-materials',
    ])
  })

  it('顶层叶子与未知 key 返回空数组', () => {
    const items = filterMenuByPermissions(
      allMenuItems,
      makeCan(['page:dashboard', 'nav:jintan', 'page:jintan-parts-data']),
      false,
    )

    expect(findAncestorMenuKeys('dashboard', items)).toEqual([])
    expect(findAncestorMenuKeys('not-exist', items)).toEqual([])
  })
})
