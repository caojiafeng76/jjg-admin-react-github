import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createYoumaiProductData,
  createYoumaiProductDataBatch,
  deleteYoumaiProductData,
  getYoumaiProductDataList,
  updateYoumaiProductData,
} from '@/services/apiYoumaiProductData'

const YOUMAI_PRODUCT_DATA_KEY = 'youmai-product-data' as const

export function useYoumaiProductDataList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    keyword?: string
  }
}) {
  return useQuery({
    queryKey: [YOUMAI_PRODUCT_DATA_KEY, page, pageSize, searchParams],
    queryFn: () =>
      getYoumaiProductDataList({
        page,
        pageSize,
        keyword: searchParams.keyword,
      }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateYoumaiProductData() {
  return useMutationWithInvalidation({
    mutationFn: createYoumaiProductData,
    invalidateQueries: [[YOUMAI_PRODUCT_DATA_KEY]],
  })
}

export function useUpdateYoumaiProductData() {
  return useMutationWithInvalidation({
    mutationFn: updateYoumaiProductData,
    invalidateQueries: [[YOUMAI_PRODUCT_DATA_KEY]],
  })
}

export function useImportYoumaiProductData() {
  return useMutationWithInvalidation({
    mutationFn: createYoumaiProductDataBatch,
    invalidateQueries: [[YOUMAI_PRODUCT_DATA_KEY]],
  })
}

export function useDeleteYoumaiProductData() {
  return useMutationWithInvalidation({
    mutationFn: deleteYoumaiProductData,
    invalidateQueries: [[YOUMAI_PRODUCT_DATA_KEY]],
  })
}
