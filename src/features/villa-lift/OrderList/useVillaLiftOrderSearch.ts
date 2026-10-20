import type { InputRef } from 'antd'
import type { Dayjs } from 'dayjs'
import type { Dispatch, SetStateAction } from 'react'
import type { SetURLSearchParams } from 'react-router-dom'
import { useRef, useState } from 'react'

interface UseVillaLiftOrderSearchOptions {
  searchParamsURL: URLSearchParams
  setSearchParamsURL: SetURLSearchParams
  setSelectedRowKeys: Dispatch<SetStateAction<string[]>>
}

export function useVillaLiftOrderSearch({
  searchParamsURL,
  setSearchParamsURL,
  setSelectedRowKeys,
}: UseVillaLiftOrderSearchOptions) {
  // 搜索输入框为 uncontrolled（提交时才读取），避免每次击键重渲染整页
  const customerInputRef = useRef<InputRef>(null)
  const projectNameInputRef = useRef<InputRef>(null)
  const productNameInputRef = useRef<InputRef>(null)
  // 重置时递增，使 uncontrolled 输入框重挂载以清空
  const [searchInputKey, setSearchInputKey] = useState(0)
  const [deliveryDateRange, setDeliveryDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null)
  const [scheduleDateRange, setScheduleDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null)
  const [processingRequiredDateRange, setProcessingRequiredDateRange]
    = useState<[Dayjs | null, Dayjs | null] | null>(null)

  // 已提交（触发查询）的筛选值
  const [submittedCustomer, setSubmittedCustomer] = useState<
    string | undefined
  >()
  const [submittedProjectName, setSubmittedProjectName] = useState<
    string | undefined
  >()
  const [submittedProductName, setSubmittedProductName] = useState<
    string | undefined
  >()

  // 发货日期范围（YYYY-MM-DD 字符串，传给服务层）
  const deliveryDateFrom
    = deliveryDateRange?.[0]?.format('YYYY-MM-DD') ?? undefined
  const deliveryDateTo
    = deliveryDateRange?.[1]?.format('YYYY-MM-DD') ?? undefined
  // 排产日期范围
  const scheduleDateFrom
    = scheduleDateRange?.[0]?.format('YYYY-MM-DD') ?? undefined
  const scheduleDateTo
    = scheduleDateRange?.[1]?.format('YYYY-MM-DD') ?? undefined
  // 计划加工日期（加工要求完成日期）范围
  const processingRequiredDateFrom
    = processingRequiredDateRange?.[0]?.format('YYYY-MM-DD') ?? undefined
  const processingRequiredDateTo
    = processingRequiredDateRange?.[1]?.format('YYYY-MM-DD') ?? undefined

  // 切换 Tab（未结案 / 已结案）
  function handleTabChange(key: string) {
    const next = new URLSearchParams(searchParamsURL)
    next.set('status', key)
    next.set('page', '1')
    setSearchParamsURL(next)
    setSearchInputKey(k => k + 1)
    setDeliveryDateRange(null)
    setScheduleDateRange(null)
    setProcessingRequiredDateRange(null)
    setSubmittedCustomer(undefined)
    setSubmittedProjectName(undefined)
    setSubmittedProductName(undefined)
    setSelectedRowKeys([])
  }

  function handleSearch() {
    const next = new URLSearchParams(searchParamsURL)
    next.set('page', '1')
    setSearchParamsURL(next)
    setSubmittedCustomer(
      customerInputRef.current?.input?.value?.trim() || undefined,
    )
    setSubmittedProjectName(
      projectNameInputRef.current?.input?.value?.trim() || undefined,
    )
    setSubmittedProductName(
      productNameInputRef.current?.input?.value?.trim() || undefined,
    )
  }

  function handleSearchReset() {
    setSearchInputKey(k => k + 1)
    setDeliveryDateRange(null)
    setScheduleDateRange(null)
    setProcessingRequiredDateRange(null)
    setSubmittedCustomer(undefined)
    setSubmittedProjectName(undefined)
    setSubmittedProductName(undefined)
    const next = new URLSearchParams(searchParamsURL)
    next.set('page', '1')
    setSearchParamsURL(next)
  }

  return {
    customerInputRef,
    projectNameInputRef,
    productNameInputRef,
    searchInputKey,
    deliveryDateRange,
    setDeliveryDateRange,
    scheduleDateRange,
    setScheduleDateRange,
    processingRequiredDateRange,
    setProcessingRequiredDateRange,
    submittedCustomer,
    submittedProjectName,
    submittedProductName,
    deliveryDateFrom,
    deliveryDateTo,
    scheduleDateFrom,
    scheduleDateTo,
    processingRequiredDateFrom,
    processingRequiredDateTo,
    handleTabChange,
    handleSearch,
    handleSearchReset,
  }
}

export type VillaLiftOrderSearch = ReturnType<typeof useVillaLiftOrderSearch>
