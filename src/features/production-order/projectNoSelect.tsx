import type { SelectProps } from 'antd'

interface SalesOrderProjectNoOptionSource {
  project_no: string
  product_model: string | null
  length_mm: number | null
  customer_model: string | null
}

export interface ProjectNoSelectOption {
  label: string
  value: string
  productModel: string
  lengthText: string
  customerModel: string
  searchText: string
}

function formatOptionText(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return String(value)
}

export function buildProjectNoSelectOptions(
  projectNos?: SalesOrderProjectNoOptionSource[],
): ProjectNoSelectOption[] {
  return (projectNos || []).map((item) => {
    const productModel = formatOptionText(item.product_model)
    const lengthText = formatOptionText(item.length_mm)
    const customerModel = formatOptionText(item.customer_model)

    return {
      label: item.project_no,
      value: item.project_no,
      productModel,
      lengthText,
      customerModel,
      searchText: [item.project_no, productModel, lengthText, customerModel]
        .join(' ')
        .toLowerCase(),
    }
  })
}

export const filterProjectNoOption: NonNullable<
  SelectProps<string, ProjectNoSelectOption>['filterOption']
> = (input, option) => {
  if (!option) {
    return false
  }

  return option.searchText.includes(input.trim().toLowerCase())
}

export const renderProjectNoOption: NonNullable<
  SelectProps<string, ProjectNoSelectOption>['optionRender']
> = (option) => {
  const data = option.data

  return (
    <div className="py-1">
      <div className="font-medium text-slate-800">{data.label}</div>
      <div className="mt-1 grid grid-cols-3 gap-3 text-xs text-slate-500">
        <span className="truncate">型号: {data.productModel}</span>
        <span className="truncate">长度: {data.lengthText}</span>
        <span className="truncate">客户型号: {data.customerModel}</span>
      </div>
    </div>
  )
}
