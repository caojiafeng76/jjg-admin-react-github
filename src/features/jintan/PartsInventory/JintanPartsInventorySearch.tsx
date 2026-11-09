import type { JintanFieldSearchValues } from '../JintanFieldSearch'
import type { JintanPartsStockStatus } from '@/services/apiJintanPartsInventory'
import { Form, Select } from 'antd'
import { JINTAN_PARTS_SEARCH_FIELDS } from '@/services/jintanSearchFields'
import JintanFieldSearch from '../JintanFieldSearch'
import { JINTAN_PARTS_STOCK_STATUS_OPTIONS } from './stockStatus'

export interface JintanPartsInventorySearchValues extends JintanFieldSearchValues {
  status?: JintanPartsStockStatus
}

interface Props {
  onSearch: (values: JintanPartsInventorySearchValues) => void
  onReset: () => void
  values?: JintanPartsInventorySearchValues
}

function StockStatusFilterItem() {
  const form = Form.useFormInstance()
  return (
    <Form.Item name="status" className="mb-0" style={{ width: 160 }}>
      <Select
        placeholder="库存状态"
        aria-label="库存状态"
        allowClear
        options={JINTAN_PARTS_STOCK_STATUS_OPTIONS}
        onChange={() => form.submit()}
      />
    </Form.Item>
  )
}

export default function JintanPartsInventorySearch({
  onSearch,
  ...props
}: Props) {
  return (
    <JintanFieldSearch<JintanPartsInventorySearchValues>
      fields={JINTAN_PARTS_SEARCH_FIELDS}
      onSearch={values =>
        onSearch({ ...values, status: values.status || undefined })}
      {...props}
    >
      <StockStatusFilterItem />
    </JintanFieldSearch>
  )
}
