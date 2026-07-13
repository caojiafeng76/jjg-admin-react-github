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

import { youmaiKeys } from '../queryKeys'

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
    queryKey: youmaiKeys.productData.list({
      page,
      pageSize,
      keyword: searchParams.keyword,
    }),
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
    invalidateQueries: [youmaiKeys.productData.all],
  })
}

export function useUpdateYoumaiProductData() {
  return useMutationWithInvalidation({
    mutationFn: updateYoumaiProductData,
    invalidateQueries: [youmaiKeys.productData.all],
  })
}

export function useImportYoumaiProductData() {
  return useMutationWithInvalidation({
    mutationFn: createYoumaiProductDataBatch,
    invalidateQueries: [youmaiKeys.productData.all],
  })
}

export function useDeleteYoumaiProductData() {
  return useMutationWithInvalidation({
    mutationFn: deleteYoumaiProductData,
    invalidateQueries: [youmaiKeys.productData.all],
  })
}
