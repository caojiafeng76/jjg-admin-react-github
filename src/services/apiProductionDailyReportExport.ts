import supabase from './supabase'
import { AppError } from '@/utils/errorHandler'
import type { ProductionDailyReportFilters } from './apiProductionDailyReport'

export type ProductionDailyReportExportTaskStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'

export interface ProductionDailyReportExportTask {
  id: string
  status: ProductionDailyReportExportTaskStatus
  file_name: string | null
  file_path: string | null
  error_message: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  expires_at: string | null
  downloadUrl?: string
}

async function extractFunctionInvokeErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return null
  }

  const maybeContext = (
    error as {
      context?: {
        json?: () => Promise<unknown>
        status?: number
        statusText?: string
      }
    }
  ).context

  if (maybeContext?.json) {
    try {
      const payload = await maybeContext.json()

      if (
        payload &&
        typeof payload === 'object' &&
        'error' in payload &&
        typeof payload.error === 'string' &&
        payload.error.trim()
      ) {
        return payload.error.trim()
      }
    } catch {
      // ignore
    }
  }

  if (maybeContext?.status) {
    const status = maybeContext.status
    if (status === 401) return '未登录，无法执行此操作'
    if (status === 403) return '权限校验失败，无权执行此操作'
    if (status === 404) return 'Edge Function 不存在或未部署'
  }

  return null
}

async function throwFunctionInvokeError(
  error: unknown,
  fallbackMessage: string,
  code: string,
  functionName: string,
) {
  const detailedMessage = await extractFunctionInvokeErrorMessage(error)

  if (detailedMessage) {
    throw new AppError(detailedMessage, code)
  }

  if (error instanceof Error) {
    throw new AppError(error.message || fallbackMessage, code)
  }

  throw new AppError(
    `${fallbackMessage}（Edge Function: ${functionName}）`,
    code,
  )
}

export async function startProductionDailyReportExportTask(input: {
  selectedIds?: string[]
  filters?: ProductionDailyReportFilters
}) {
  const { data, error } = await supabase.functions.invoke(
    'export-production-daily-report',
    {
      body: {
        action: 'start',
        selectedIds: input.selectedIds,
        filters: input.filters,
      },
    },
  )

  if (error) {
    await throwFunctionInvokeError(
      error,
      '创建生产日报导出任务失败',
      'START_PRODUCTION_DAILY_REPORT_EXPORT_TASK_FAILED',
      'export-production-daily-report',
    )
  }

  if (data?.error) {
    throw new AppError(
      String(data.error),
      'START_PRODUCTION_DAILY_REPORT_EXPORT_TASK_FAILED',
    )
  }

  return data as {
    jobId: string
    status: ProductionDailyReportExportTaskStatus
  }
}

export async function getProductionDailyReportExportTask(jobId: string) {
  const { data, error } = await supabase.functions.invoke(
    'export-production-daily-report',
    {
      body: {
        action: 'status',
        jobId,
      },
    },
  )

  if (error) {
    await throwFunctionInvokeError(
      error,
      '查询生产日报导出任务失败',
      'GET_PRODUCTION_DAILY_REPORT_EXPORT_TASK_FAILED',
      'export-production-daily-report',
    )
  }

  if (data?.error) {
    throw new AppError(
      String(data.error),
      'GET_PRODUCTION_DAILY_REPORT_EXPORT_TASK_FAILED',
    )
  }

  return (data as { job: ProductionDailyReportExportTask }).job
}

export async function waitForProductionDailyReportExportTask(
  jobId: string,
  options?: {
    intervalMs?: number
    maxAttempts?: number
  },
) {
  const intervalMs = options?.intervalMs ?? 1500
  const maxAttempts = options?.maxAttempts ?? 120

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const job = await getProductionDailyReportExportTask(jobId)

    if (job.status === 'completed') {
      if (!job.downloadUrl) {
        throw new AppError('导出文件已生成，但下载链接获取失败')
      }

      return job
    }

    if (job.status === 'failed') {
      throw new AppError(job.error_message || '导出失败，请稍后重试')
    }

    await new Promise((resolve) => window.setTimeout(resolve, intervalMs))
  }

  throw new AppError('导出任务仍在处理中，请稍后再试')
}
