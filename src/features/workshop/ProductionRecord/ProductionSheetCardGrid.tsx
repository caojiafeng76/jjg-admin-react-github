import React, { useState } from 'react'
import dayjs from 'dayjs'
import type { ProductionSheetWithRecords } from '@/services/apiProductionSheets'
import type { ProductionRecordWithRelations } from '@/services/apiProductionRecords'

interface Props {
  loading: boolean
  data: ProductionSheetWithRecords[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  onViewDetail?: (sheetId: string) => void
}

export default function ProductionSheetCardGrid({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  onViewDetail,
}: Props) {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-8">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center py-8">
        <div className="text-gray-500">暂无数据</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((sheet) => {
        const isSelected = selectedRowKeys.includes(sheet.id!)
        const isExpanded = expandedCardId === sheet.id
        return (
          <div
            key={sheet.id}
            className={`flex flex-col justify-between rounded-md border bg-white p-4 shadow-sm transition-all duration-200 ${
              isSelected ? 'ring-2 ring-indigo-200' : 'hover:shadow-md'
            }`}
          >
            <div>
              {/* 卡片头：日期 / 记录数 / 工时 */}
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="text-sm">
                  <span className="mr-2 text-gray-500">日期</span>
                  <span className="font-medium text-gray-900">
                    {sheet.production_date
                      ? dayjs(sheet.production_date).format('M月D日')
                      : '-'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="mr-2 text-gray-500">记录数</span>
                  <span className="text-gray-900">
                    {sheet.record_count || 0}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="mr-2 text-gray-500">工时</span>
                  <span className="text-gray-900">
                    {sheet.working_hours ? `${sheet.working_hours}H` : '-'}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <label className="text-xs text-gray-500">选择</label>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelect([...selectedRowKeys, sheet.id!])
                      } else {
                        onSelect(selectedRowKeys.filter((k) => k !== sheet.id!))
                      }
                    }}
                  />
                </div>
              </div>

              {/* 统计信息 */}
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className="rounded bg-green-50 p-2 text-center">
                  <div className="text-xs text-gray-500">合格总数</div>
                  <div className="text-lg font-semibold text-green-600">
                    {sheet.total_qualified_quantity?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="rounded bg-red-50 p-2 text-center">
                  <div className="text-xs text-gray-500">不良总数</div>
                  <div className="text-lg font-semibold text-red-600">
                    {sheet.total_defective_quantity?.toLocaleString() || 0}
                  </div>
                </div>
              </div>

              {/* 操作者信息 */}
              <div className="mb-2">
                <span className="text-xs text-gray-500">操作者：</span>
                <span className="text-sm text-gray-900">
                  {sheet.operators && sheet.operators.length > 0
                    ? sheet.operators.map((o) => o.name).join('、')
                    : '-'}
                </span>
              </div>

              {/* 备注信息 */}
              {sheet.remark && (
                <div className="mb-2">
                  <span className="text-xs text-gray-500">备注：</span>
                  <span className="text-sm text-gray-900">{sheet.remark}</span>
                </div>
              )}

              {/* 记录表格（简化显示前几条） */}
              {!isExpanded && sheet.records && sheet.records.length > 0 && (
                <div className="mt-3 overflow-x-auto rounded border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-600">
                        <th className="px-2 py-1">项目号</th>
                        <th className="px-2 py-1">型号</th>
                        <th className="px-2 py-1">数量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.records
                        .slice(0, 3)
                        .map(
                          (rec: ProductionRecordWithRelations, idx: number) => (
                            <tr key={rec.id || idx} className="border-t">
                              <td className="px-2 py-1">
                                {rec.order?.project_no || rec.order_id || '-'}
                              </td>
                              <td className="px-2 py-1">
                                {rec.order?.product_model || '-'}
                              </td>
                              <td className="px-2 py-1">
                                {rec.qualified_quantity || 0}
                              </td>
                            </tr>
                          ),
                        )}
                      {sheet.records.length > 3 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-2 py-1 text-center text-gray-500"
                          >
                            ...还有{sheet.records.length - 3}条记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 卡片底部：详情切换 & 创建时间 */}
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <button
                    className="text-sm text-indigo-600 hover:underline"
                    onClick={() => {
                      if (expandedCardId === sheet.id) {
                        setExpandedCardId(null)
                      } else {
                        setExpandedCardId(sheet.id || null)
                      }
                    }}
                  >
                    {expandedCardId === sheet.id ? '收起' : '详情'}
                  </button>
                  {onViewDetail && (
                    <>
                      <span className="mx-2 text-gray-300">|</span>
                      <button
                        className="text-sm text-indigo-600 hover:underline"
                        onClick={() => onViewDetail(sheet.id!)}
                      >
                        查看详情
                      </button>
                    </>
                  )}
                </div>

                <div className="text-xs text-gray-400">
                  {sheet.created_at
                    ? dayjs(sheet.created_at).format('MM-DD HH:mm')
                    : ''}
                </div>
              </div>

              {/* 展开详情区域 */}
              {expandedCardId === sheet.id && sheet.records && (
                <div className="mt-3 border-t pt-3">
                  <div className="mb-2 text-sm font-medium">完整记录</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-left text-gray-600">
                          <th className="px-2 py-1">项目号</th>
                          <th className="px-2 py-1">型号</th>
                          <th className="px-2 py-1">客户型号</th>
                          <th className="px-2 py-1">长度</th>
                          <th className="px-2 py-1">工序</th>
                          <th className="px-2 py-1">合格数</th>
                          <th className="px-2 py-1">不良数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sheet.records.map(
                          (rec: ProductionRecordWithRelations, idx: number) => (
                            <tr key={rec.id || idx} className="border-t">
                              <td className="px-2 py-1">
                                {rec.order?.project_no || rec.order_id || '-'}
                              </td>
                              <td className="px-2 py-1">
                                {rec.order?.product_model || '-'}
                              </td>
                              <td className="px-2 py-1">
                                {rec.order?.customer_model || '-'}
                              </td>
                              <td className="px-2 py-1">
                                {rec.order?.length_mm ?? '-'}
                              </td>
                              <td className="px-2 py-1">
                                {rec.process?.process_name ||
                                  rec.process_id ||
                                  '-'}
                              </td>
                              <td className="px-2 py-1">
                                {rec.qualified_quantity ?? 0}
                              </td>
                              <td className="px-2 py-1">
                                {rec.defective_quantity ?? 0}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
