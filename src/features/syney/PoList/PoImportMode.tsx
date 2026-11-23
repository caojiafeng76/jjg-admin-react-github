import { Radio } from 'antd'

export type PoImportMode = 'scm' | 'manual' | 'excel'

export function PoImportModePicker({
  value,
  onChange,
  disabled,
}: {
  value: PoImportMode
  onChange: (mode: PoImportMode) => void
  disabled?: boolean
}) {
  return (
    <Radio.Group
      aria-label="订单录入方式"
      className="mb-4"
      value={value}
      onChange={event => onChange(event.target.value)}
      disabled={disabled}
      options={[
        { value: 'scm', label: '按单号获取' },
        { value: 'manual', label: '手动输入' },
        { value: 'excel', label: 'Excel 导入' },
      ]}
    />
  )
}
