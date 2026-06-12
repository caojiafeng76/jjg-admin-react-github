import { memo, useMemo } from 'react'
import { Table, type TableColumnsType, type TableProps } from 'antd'

import type { ExtrusionProductionDailyReportRow } from '@/services/apiExtrusionProductionDailyReport'

interface Props {
  loading: boolean
  data: ExtrusionProductionDailyReportRow[]
  page: number
  pageSize: number
  selectedRowKeys: React.Key[]
  onRowSelectionChange: (
    keys: React.Key[],
    rows: ExtrusionProductionDailyReportRow[],
  ) => void
  scrollY?: number
}

function renderNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined) {
    return '-'
  }
  return value.toFixed(digits)
}

function renderPercentage(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return '-'
  }
  return `${(value * 100).toFixed(2)}%`
}

const ExtrusionProductionDailyReportTable = memo(function ExtrusionProductionDailyReportTable({
  loading,
  data,
  page,
  pageSize,
  selectedRowKeys,
  onRowSelectionChange,
  scrollY = 400,
}: Props) {
  const columns: TableColumnsType<ExtrusionProductionDailyReportRow> = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        width: 56,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '日期',
        dataIndex: 'productionDate',
        key: 'productionDate',
        width: 100,
        fixed: 'left',
      },
      {
        title: '班次',
        dataIndex: 'shift',
        key: 'shift',
        width: 70,
      },
      {
        title: '班组长',
        dataIndex: 'shiftLeaderName',
        key: 'shiftLeaderName',
        width: 100,
      },
      {
        title: '设备名称',
        dataIndex: 'machineName',
        key: 'machineName',
        width: 120,
      },
      {
        title: '设备编号',
        dataIndex: 'unifiedDeviceNo',
        key: 'unifiedDeviceNo',
        width: 100,
      },
      {
        title: '项目号',
        dataIndex: 'projectNo',
        key: 'projectNo',
        width: 140,
        fixed: 'left',
      },
      {
        title: '产品型号',
        dataIndex: 'productModel',
        key: 'productModel',
        width: 100,
      },
      {
        title: '客户',
        dataIndex: 'customer',
        key: 'customer',
        width: 120,
      },
      {
        title: '客户型号',
        dataIndex: 'customerModel',
        key: 'customerModel',
        width: 100,
      },
      {
        title: '材料名称',
        dataIndex: 'materialName',
        key: 'materialName',
        width: 100,
      },
      {
        title: '订单长度(mm)',
        dataIndex: 'orderLengthMm',
        key: 'orderLengthMm',
        width: 110,
      },
      {
        title: '理论单重(kg/m)',
        dataIndex: 'theoreticalUnitWeightKgPerMeter',
        key: 'theoreticalUnitWeightKgPerMeter',
        width: 130,
        render: (value: number) => renderNumber(value, 4),
      },
      {
        title: '模具号',
        dataIndex: 'dieNo',
        key: 'dieNo',
        width: 100,
      },
      {
        title: '铸锭数量',
        dataIndex: 'billetQuantity',
        key: 'billetQuantity',
        width: 100,
      },
      {
        title: '铸锭投入重量(kg)',
        dataIndex: 'billetInputWeightKg',
        key: 'billetInputWeightKg',
        width: 140,
        render: (value: number) => renderNumber(value, 2),
      },
      {
        title: '实际产出长度(mm)',
        dataIndex: 'actualOutputLengthMm',
        key: 'actualOutputLengthMm',
        width: 130,
      },
      {
        title: '实际单重(kg/m)',
        dataIndex: 'actualUnitWeightKg',
        key: 'actualUnitWeightKg',
        width: 130,
        render: (value: number) => renderNumber(value, 4),
      },
      {
        title: '实际数量',
        dataIndex: 'actualQuantity',
        key: 'actualQuantity',
        width: 90,
      },
      {
        title: '理论产出数量',
        dataIndex: 'theoreticalOutputCount',
        key: 'theoreticalOutputCount',
        width: 110,
      },
      {
        title: '理论产出重量(kg)',
        dataIndex: 'theoreticalOutputWeightKg',
        key: 'theoreticalOutputWeightKg',
        width: 140,
        render: (value: number) => renderNumber(value, 2),
      },
      {
        title: '实际产出重量(kg)',
        dataIndex: 'actualOutputWeightKg',
        key: 'actualOutputWeightKg',
        width: 140,
        render: (value: number) => renderNumber(value, 2),
      },
      {
        title: '废料重量(kg)',
        dataIndex: 'scrapWeightKg',
        key: 'scrapWeightKg',
        width: 120,
        render: (value: number) => renderNumber(value, 2),
      },
      {
        title: '尾料重量(kg)',
        dataIndex: 'tailingWeightKg',
        key: 'tailingWeightKg',
        width: 120,
        render: (value: number) => renderNumber(value, 2),
      },
      {
        title: '材料利用率(%)',
        dataIndex: 'materialYield',
        key: 'materialYield',
        width: 110,
        render: renderPercentage,
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 150,
        ellipsis: true,
      },
      {
        title: '审核状态',
        dataIndex: 'isAudited',
        key: 'isAudited',
        width: 90,
        render: (value: boolean) => (value ? '已审核' : '待审核'),
        filters: [
          { text: '已审核', value: true },
          { text: '待审核', value: false },
        ],
        onFilter: (value, record) => record.isAudited === (value as boolean),
      },
    ],
    [page, pageSize],
  )

  const rowSelection: TableProps<ExtrusionProductionDailyReportRow>['rowSelection'] =
    {
      selectedRowKeys,
      onChange: (keys, rows) => {
        onRowSelectionChange(keys, rows)
      },
    }

  return (
    <Table<ExtrusionProductionDailyReportRow>
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      rowSelection={rowSelection}
      scroll={{ x: 2400, y: scrollY }}
      pagination={false}
      size="small"
    />
  )
})

export default ExtrusionProductionDailyReportTable
