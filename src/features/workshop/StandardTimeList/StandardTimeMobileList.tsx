import { Button, Empty, Image } from 'antd'
import { useEffect, useState } from 'react'
import {
  PencilSquareIcon,
  ClockIcon,
  ChartBarIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'

import type { StandardTime } from '@/services/apiStandardTimes'
import { getProcessStandardImagePreviewUrl } from '@/services/apiProcessStandardImages'
import { calculateDailyStandardCapacity } from '@/utils/costAccounting'
import { formatNumber } from '@/utils/format'

interface Props {
  loading: boolean
  data: StandardTime[]
  onEdit: (record: StandardTime) => void
}

function ProcessImagePreview({ record }: { record: StandardTime }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!record.process_image_path) {
      setImageUrl(null)
      return () => {
        cancelled = true
      }
    }

    void getProcessStandardImagePreviewUrl(record.process_image_path)
      .then((url) => {
        if (!cancelled) setImageUrl(url)
      })
      .catch(() => {
        if (!cancelled) setImageUrl(null)
      })

    return () => {
      cancelled = true
    }
  }, [record.process_image_path])

  return imageUrl ? (
    <Image
      alt={record.process_image_name || '工艺图示'}
      height={52}
      width={68}
      src={imageUrl}
      preview={{ src: imageUrl }}
      className="rounded border border-slate-200 object-cover"
    />
  ) : (
    <span className="text-sm text-slate-400">
      {record.process_image_name || '暂无图示'}
    </span>
  )
}

export default function StandardTimeMobileList({
  loading,
  data,
  onEdit,
}: Props) {
  if (!loading && data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span className="text-slate-400">暂无理论工时数据</span>}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 px-4 pb-6">
      {data.map((record) => {
        const isMatched = Boolean(record.job_name)
        const dailyCapacity = calculateDailyStandardCapacity(
          record.standard_seconds,
        )

        return (
          <article
            key={record.id}
            className={`relative overflow-hidden rounded-2xl ${
              isMatched
                ? 'border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.08)]'
                : 'border border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/80 shadow-[0_4px_20px_rgba(245,158,11,0.15)]'
            }`}
          >
            {/* Accent Line */}
            <div
              className={`absolute top-0 left-0 h-full w-1 ${
                isMatched
                  ? 'bg-gradient-to-b from-blue-500 to-indigo-500'
                  : 'bg-gradient-to-b from-amber-400 to-orange-500'
              }`}
            />

            <div className="p-4 pl-5">
              {/* Header */}
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  {/* Update Time */}
                  <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <ClockIcon className="h-3 w-3" />
                    <span>
                      {record.updated_at
                        ? new Date(record.updated_at).toLocaleString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '暂无更新'}
                    </span>
                  </div>

                  {/* Model */}
                  <h3 className="text-lg font-bold tracking-tight text-slate-900">
                    {record.model}
                  </h3>
                </div>

                {/* Tags */}
                <div className="flex flex-col items-end gap-1.5">
                  <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                    理论工时
                  </span>
                  {!isMatched && (
                    <span className="inline-flex items-center rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm">
                      待匹配
                    </span>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="mb-4 grid grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2 rounded-xl bg-slate-50/80 px-3 py-2.5">
                  <WrenchScrewdriverIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                      工序
                    </div>
                    <div className="truncate text-sm font-medium text-slate-700">
                      {record.operation}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-slate-50/80 px-3 py-2.5">
                  <UserCircleIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                      工种
                    </div>
                    <div className="truncate text-sm font-medium text-slate-700">
                      {record.job_name || '未设置'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-slate-50/80 px-3 py-2.5">
                  <BuildingOfficeIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                      客户
                    </div>
                    <div className="truncate text-sm font-medium text-slate-700">
                      {record.customer || '未设置'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-slate-50/80 px-3 py-2.5">
                  <UserCircleIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                      数据上传
                    </div>
                    <div className="truncate text-sm font-medium text-slate-700">
                      {record.uploaded_by_name || '未设置'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="mb-4 grid grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2 rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50/80 to-teal-50/80 px-3 py-2.5">
                  <ClockIcon className="h-4 w-4 flex-shrink-0 text-cyan-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-medium tracking-wider text-cyan-600/70 uppercase">
                      理论工时
                    </div>
                    <div className="text-base font-bold text-cyan-700">
                      {record.theoretical_seconds}
                      <span className="ml-0.5 text-xs font-medium">秒</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-green-50/80 px-3 py-2.5">
                  <ChartBarIcon className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-medium tracking-wider text-emerald-600/70 uppercase">
                      日标准产能
                    </div>
                    <div className="text-base font-bold text-emerald-700">
                      {formatNumber(dailyCapacity, 1)}
                      <span className="ml-0.5 text-xs font-medium">件</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Process Details */}
              <div className="mb-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-slate-50/80 px-3 py-2.5">
                  <div className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                    工装治具
                  </div>
                  <div className="truncate text-sm font-medium text-slate-700">
                    {record.tooling_fixture || '未设置'}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50/80 px-3 py-2.5">
                  <div className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                    装夹次数 / 数量
                  </div>
                  <div className="text-sm font-medium text-slate-700">
                    {formatNumber(record.clamping_count)} /{' '}
                    {formatNumber(record.clamping_quantity)} 支
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50/80 px-3 py-2.5">
                  <div className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                    人数
                  </div>
                  <div className="text-sm font-medium text-slate-700">
                    {formatNumber(record.operator_count)}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50/80 px-3 py-2.5">
                  <div className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                    图示
                  </div>
                  <ProcessImagePreview record={record} />
                </div>
                <div className="col-span-2 rounded-xl bg-slate-50/80 px-3 py-2.5">
                  <div className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                    说明
                  </div>
                  <div className="text-sm font-medium break-words text-slate-700">
                    {record.process_note || '暂无说明'}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                type="primary"
                block
                icon={<PencilSquareIcon className="size-4" />}
                onClick={() => onEdit(record)}
                className="h-10 rounded-xl font-medium shadow-sm"
              >
                编辑理论工时
              </Button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
