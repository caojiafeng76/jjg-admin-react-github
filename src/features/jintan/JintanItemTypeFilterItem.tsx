import { Form, Select } from 'antd'
import { JINTAN_ITEM_TYPE_OPTIONS } from '@/services/jintanItemType'

/** 搜索栏的类型筛选项，放在字段名为 itemType 的 Form 内使用 */
export default function JintanItemTypeFilterItem() {
  return (
    <Form.Item name="itemType" className="mb-0" style={{ width: 120 }}>
      <Select
        allowClear
        placeholder="全部类型"
        aria-label="类型"
        options={JINTAN_ITEM_TYPE_OPTIONS}
      />
    </Form.Item>
  )
}
