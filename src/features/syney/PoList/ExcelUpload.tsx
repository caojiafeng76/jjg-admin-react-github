import type { ISyneySpec } from '@services/types'
import type { TransformedOrderData } from '@utils/excelUtils'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import type { FC } from 'react'
import { ArrowUpTrayIcon, TableCellsIcon } from '@heroicons/react/16/solid'
import { getItemsWithParamSpec } from '@utils/syney'
import {
  Alert,
  App,
  Button,
  Space,
  Table,
  Typography,
  Upload,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { TableEmpty } from '@/ui/TableState'
import { zebraRowClassName } from '@/ui/tableStyles'
import { getUserErrorMessage } from '@/utils/errorHandler'

// xlsx-js-style 约 800KB，独立 chunk 挂载即预加载（避免上传时临时拉取失败）
const loadExcelUtils = () => import('@utils/excelUtils')

const { Text } = Typography

type ExcelUploadItemRecord = TransformedOrderData['items'][number] & {
  ParamSpecInferred?: boolean | null
}

interface ExcelUploadProps {
  onDataParsed: (data: TransformedOrderData) => void
  disabled?: boolean
  syneySpecs: ISyneySpec[]
  specsLoading?: boolean
}

function buildPreviewData(
  orderData: TransformedOrderData,
  syneySpecs: ISyneySpec[],
): TransformedOrderData {
  const matchedItems = getItemsWithParamSpec(
    orderData.items as Parameters<typeof getItemsWithParamSpec>[0],
    syneySpecs as Parameters<typeof getItemsWithParamSpec>[1],
  )

  return {
    ...orderData,
    items: matchedItems as TransformedOrderData['items'],
  }
}

const ExcelUpload: FC<ExcelUploadProps> = ({
  onDataParsed,
  disabled,
  syneySpecs,
  specsLoading = false,
}) => {
  const { message: messageApi } = App.useApp()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [loading, setLoading] = useState(false)
  const [rawParsedData, setRawParsedData]
    = useState<TransformedOrderData | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)

  // 挂载即预加载 Excel 解析 chunk，避免用户上传时才发起网络请求
  useEffect(() => {
    void loadExcelUtils()
  }, [])

  const parsedData = useMemo(() => {
    if (!rawParsedData) {
      return null
    }

    return buildPreviewData(rawParsedData, syneySpecs)
  }, [rawParsedData, syneySpecs])

  useEffect(() => {
    if (!previewVisible || !parsedData) {
      return
    }

    onDataParsed(parsedData)
  }, [onDataParsed, parsedData, previewVisible])

  /**
   * 处理文件上传前的验证和解析
   */
  const handleBeforeUpload = async (file: File) => {
    // 检查文件类型（兼容部分系统/浏览器未提供 MIME type 的场景）
    const isExcelMime
      = file.type === 'application/vnd.ms-excel'
        || file.type
        === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    const isExcelExt = /\.(?:xlsx|xls)$/i.test(file.name)

    if (!isExcelMime && !isExcelExt) {
      messageApi.error(
        '文件格式不支持：仅支持 .xlsx 或 .xls 格式的 Excel 文件，请更换文件后重试',
      )
      return Upload.LIST_IGNORE
    }

    // 检查文件大小 (限制10MB)
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      messageApi.error(
        '文件过大：单文件不能超过 10MB，请压缩或拆分后重新上传',
      )
      return Upload.LIST_IGNORE
    }

    setLoading(true)

    try {
      // 解析Excel文件
      const { importExcelOrder } = await loadExcelUtils()
      const orderData = await importExcelOrder(file)

      // 保存解析结果
      setRawParsedData(orderData)
      setPreviewVisible(true)

      messageApi.success(
        `Excel 解析成功：共 ${orderData.items?.length ?? 0} 条明细，请核对预览数据后提交`,
      )
    }
    catch (error) {
      messageApi.error(
        `Excel 解析失败：${getUserErrorMessage(error, '文件内容无法识别')}。请检查文件内容是否符合模板格式后重新上传`,
      )
      setFileList([])
      setRawParsedData(null)
      setPreviewVisible(false)
    }
    finally {
      setLoading(false)
    }

    // 阻止自动上传
    return false
  }

  const handleUploadChange: UploadProps['onChange'] = ({ fileList: nextFileList }) => {
    setFileList(nextFileList.slice(-1))
  }

  /**
   * 处理文件移除
   */
  const handleRemove = () => {
    setFileList([])
    setRawParsedData(null)
    setPreviewVisible(false)
    onDataParsed({ po: {}, items: [] })
  }

  /**
   * 订单明细列定义
   */
  const itemColumns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: '物料件号',
      dataIndex: 'PartNo',
      key: 'PartNo',
      width: 150,
    },
    {
      title: '物料名称',
      dataIndex: 'PartName',
      key: 'PartName',
      width: 120,
    },
    {
      title: '规格',
      dataIndex: 'Spec',
      key: 'Spec',
      width: 150,
    },
    {
      title: '参数规格',
      dataIndex: 'ParamSpec',
      key: 'ParamSpec',
      width: 120,
      render: (text: string, record: ExcelUploadItemRecord) =>
        !specsLoading && record.ParamSpecInferred
          ? (
              <Text type="warning" strong>
                ⚠️ {text || '未识别'}
              </Text>
            )
          : (
              text
            ),
    },
    {
      title: '数量',
      dataIndex: 'Qty',
      key: 'Qty',
      width: 80,
      align: 'right' as const,
      render: (value: number) => <span className="tabular-nums">{value}</span>,
    },
    {
      title: '单位',
      dataIndex: 'Unit',
      key: 'Unit',
      width: 60,
    },
    {
      title: '生产编号',
      dataIndex: 'SONo',
      key: 'SONo',
      width: 150,
    },
    {
      title: '备注',
      dataIndex: 'Remark',
      key: 'Remark',
      ellipsis: true,
    },
  ]

  return (
    <div>
      <Upload
        fileList={fileList}
        beforeUpload={handleBeforeUpload}
        onChange={handleUploadChange}
        onRemove={handleRemove}
        maxCount={1}
        accept=".xlsx,.xls"
        disabled={disabled}
      >
        <Button
          icon={<ArrowUpTrayIcon className="size-4" />}
          loading={loading}
          disabled={disabled}
        >
          {loading ? '解析中...' : '选择Excel文件'}
        </Button>
      </Upload>

      <div className="mt-2">
        <Text
          type="secondary"
          className="flex items-center gap-1 text-xs"
        >
          <TableCellsIcon className="size-4" />
          {' '}
          支持.xlsx和.xls格式，文件大小不超过10MB
        </Text>
      </div>

      {/* 解析结果预览 */}
      {previewVisible && parsedData && (
        <div className="mt-4">
          <Alert
            className="mb-4"
            title="Excel文件解析成功"
            description={(
              <Space orientation="vertical" className="w-full">
                <div>
                  <Text strong>订单号: </Text>
                  <Text>{parsedData.po.No}</Text>
                </div>
                <div>
                  <Text strong>交货日期: </Text>
                  <Text>{parsedData.po.EndDate}</Text>
                </div>
                <div className="flex items-start">
                  <Text strong className="shrink-0">
                    生产编号:
                    {' '}
                  </Text>
                  <Text className="whitespace-pre-wrap">
                    {parsedData.po.SONo}
                  </Text>
                </div>
                <div>
                  <Text strong>规格: </Text>
                  <Text>{parsedData.po.Spec || '未识别，请手动选择'}</Text>
                  {parsedData.specInferred && (
                    <Alert
                      className="mt-2 border border-warning/40 bg-warning/10"
                      title={(
                        <Text strong className="text-sm">
                          ⚠️ 规格已通过后备逻辑推断，请仔细核对！
                        </Text>
                      )}
                      description={(
                        <Text>
                          系统从所有条目的规格和备注字段中推断出此规格：
                          <Text
                            strong
                            className="ml-1 text-error"
                          >
                            {parsedData.po.Spec}
                          </Text>
                          <br />
                          请确认此规格是否正确，如有误请手动修改！
                        </Text>
                      )}
                      type="warning"
                      showIcon
                      banner
                    />
                  )}
                </div>
                {specsLoading && (
                  <Text type="secondary">
                    正在加载规格库，参数规格预览会在加载完成后自动刷新
                  </Text>
                )}
                {!specsLoading
                  && parsedData.items.some(item => item.ParamSpecInferred) && (
                  <Alert
                    className="mt-2 border border-warning/40 bg-warning/10"
                    title={(
                      <Text strong className="text-sm">
                        ⚠️ 部分参数规格为系统根据备注推测，请仔细核对
                      </Text>
                    )}
                    description={(
                      <Text>
                        规格库未匹配到参数规格时，系统会按型号默认宽度
                        (1000型对应1525，800型对应1325，600型对应1125)
                        与备注中的宽度组合生成，例如“1525*备注宽度”。请确认这些推测值是否正确。
                      </Text>
                    )}
                    type="warning"
                    showIcon
                    banner
                  />
                )}
                <div>
                  <Text strong>商标: </Text>
                  <Text>{parsedData.po.Brand || '自动推断'}</Text>
                </div>
                <div>
                  <Text strong>订单备注: </Text>
                  <Text>{parsedData.po.Remark || '无'}</Text>
                </div>
                {parsedData.po.Technique && (
                  <div>
                    <Text strong>工艺要求: </Text>
                    <div className="mt-1 space-y-0.5">
                      {parsedData.po.Technique.split(',').map((item, index) => (
                        <div
                          // eslint-disable-next-line react/no-array-index-key -- 工艺要求按逗号拆分的只读列表，条目可能重复
                          key={index}
                        >
                          <Text>{item.trim()}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <Text strong>明细数量: </Text>
                  <Text
                    className={`font-bold tabular-nums ${
                      parsedData.items.length % 14 === 0
                        ? 'text-success'
                        : 'text-error'
                    }`}
                  >
                    {parsedData.items.length}
                    {' 条'}
                    {parsedData.items.length % 14 === 0 ? ' ✓' : ' ⚠️'}
                  </Text>
                </div>
              </Space>
            )}
            type="success"
            showIcon
          />

          <Table
            columns={itemColumns}
            rowClassName={zebraRowClassName}
            locale={{ emptyText: <TableEmpty title="暂无解析明细" /> }}
            dataSource={parsedData.items.map((item, index) => ({
              ...item,
              key: index,
            }))}
            pagination={false}
            scroll={{ x: 1200, y: 300 }}
          />
        </div>
      )}
    </div>
  )
}

export default ExcelUpload
