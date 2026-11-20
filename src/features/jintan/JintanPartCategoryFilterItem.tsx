import type { JintanFieldSearchValues } from './JintanFieldSearch'
import type { JintanPartCategory } from '@/services/jintanPartCategory'
import { Form, Select } from 'antd'
import { JINTAN_PART_CATEGORY_OPTIONS } from '@/services/jintanPartCategory'

export interface JintanPartsFieldSearchValues extends JintanFieldSearchValues {
  partCategory?: JintanPartCategory
}

/** 搜索栏的配件类别筛选项，放在字段名为 partCategory 的 Form 内使用 */
export default function JintanPartCategoryFilterItem() {
  return (
    <Form.Item name="partCategory" className="mb-0" style={{ width: 120 }}>
      <Select
        allowClear
        placeholder="全部类别"
        aria-label="类别"
        options={JINTAN_PART_CATEGORY_OPTIONS}
      />
    </Form.Item>
  )
}
