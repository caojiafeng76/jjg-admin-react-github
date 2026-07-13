import { FC, useEffect, useMemo, useState } from 'react'
import { Upload, Button, message, Table, Alert, Space, Typography } from 'antd'
import { ArrowUpTrayIcon, TableCellsIcon } from '@heroicons/react/16/solid'
import type { UploadFile } from 'antd/es/upload/interface'
import type { ISyneySpec } from '@services/types'
import type { TransformedOrderData } from '@utils/excelUtils'
import { getItemsWithParamSpec } from '@utils/syney'

const { Text } = Typography
const loadExcelUtils = () => import('@utils/excelUtils')

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
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [loading, setLoading] = useState(false)
  const [rawParsedData, setRawParsedData] =
    useState<TransformedOrderData | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)

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
    // 检查文件类型
    const isExcel =
      file.type === 'application/vnd.ms-excel' ||
      file.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    if (!isExcel) {
      message.error('只能上传Excel文件(.xlsx或.xls)')
      return false
    }

    // 检查文件大小 (限制10MB)
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('文件大小不能超过10MB')
      return false
    }

    setLoading(true)

    try {
      const { importExcelOrder } = await loadExcelUtils()
      // 解析Excel文件
      const orderData = await importExcelOrder(file)

      // 保存解析结果
      setRawParsedData(orderData)
      setPreviewVisible(true)

      message.success('Excel文件解析成功')
    } catch (error) {
      message.error(
        `Excel导入失败: ${error instanceof Error ? error.message : '未知错误'}`,
      )
      setRawParsedData(null)
      setPreviewVisible(false)
    } finally {
      setLoading(false)
    }

    // 阻止自动上传
    return false
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
        !specsLoading && record.ParamSpecInferred ? (
          <Text type="warning" strong>
            ⚠️ {text || '未识别'}
          </Text>
        ) : (
          text
        ),
    },
    {
      title: '数量',
      dataIndex: 'Qty',
      key: 'Qty',
      width: 80,
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
        onRemove={handleRemove}
        maxCount={1}
        accept=".xlsx,.xls"
        disabled={disabled}
      >
        <Button
          icon={<ArrowUpTrayIcon className="h-4 w-4" />}
          loading={loading}
          disabled={disabled}
          onMouseEnter={() => void loadExcelUtils()}
          onFocus={() => void loadExcelUtils()}
        >
          {loading ? '解析中...' : '选择Excel文件'}
        </Button>
      </Upload>

      <div style={{ marginTop: 8 }}>
        <Text
          type="secondary"
          style={{ fontSize: 12 }}
          className="flex items-center gap-1"
        >
          <TableCellsIcon className="h-4 w-4" />{' '}
          支持.xlsx和.xls格式，文件大小不超过10MB
        </Text>
      </div>

      {/* 解析结果预览 */}
      {previewVisible && parsedData && (
        <div style={{ marginTop: 16 }}>
          <Alert
            message="Excel文件解析成功"
            description={
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>订单号: </Text>
                  <Text>{parsedData.po.No}</Text>
                </div>
                <div>
                  <Text strong>交货日期: </Text>
                  <Text>{parsedData.po.EndDate}</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Text strong style={{ flexShrink: 0 }}>
                    生产编号:{' '}
                  </Text>
                  <Text style={{ whiteSpace: 'pre-wrap' }}>
                    {parsedData.po.SONo}
                  </Text>
                </div>
                <div>
                  <Text strong>规格: </Text>
                  <Text>{parsedData.po.Spec || '未识别，请手动选择'}</Text>
                  {parsedData.specInferred && (
                    <Alert
                      message={
                        <Text strong style={{ fontSize: 14 }}>
                          ⚠️ 规格已通过后备逻辑推断，请仔细核对！
                        </Text>
                      }
                      description={
                        <Text>
                          系统从所有条目的规格和备注字段中推断出此规格：
                          <Text
                            strong
                            style={{ color: '#ff4d4f', marginLeft: 4 }}
                          >
                            {parsedData.po.Spec}
                          </Text>
                          <br />
                          请确认此规格是否正确，如有误请手动修改！
                        </Text>
                      }
                      type="warning"
                      showIcon
                      style={{
                        marginTop: 8,
                        border: '2px solid #faad14',
                        backgroundColor: '#fffbe6',
                      }}
                      banner
                    />
                  )}
                </div>
                {specsLoading && (
                  <Text type="secondary">
                    正在加载规格库，参数规格预览会在加载完成后自动刷新
                  </Text>
                )}
                {!specsLoading &&
                  parsedData.items.some((item) => item.ParamSpecInferred) && (
                    <Alert
                      message={
                        <Text strong style={{ fontSize: 14 }}>
                          ⚠️ 部分参数规格为系统根据备注推测，请仔细核对
                        </Text>
                      }
                      description={
                        <Text>
                          规格库未匹配到参数规格时，系统会按型号默认宽度
                          (1000型对应1525，800型对应1325，600型对应1125)
                          与备注中的宽度组合生成，例如“1525*备注宽度”。请确认这些推测值是否正确。
                        </Text>
                      }
                      type="warning"
                      showIcon
                      style={{
                        marginTop: 8,
                        border: '2px solid #faad14',
                        backgroundColor: '#fffbe6',
                      }}
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
                    <div style={{ marginTop: 4 }}>
                      {parsedData.po.Technique.split(',').map((item, index) => (
                        <div
                          key={index}
                          style={{
                            marginBottom:
                              index <
                              parsedData.po.Technique!.split(',').length - 1
                                ? 2
                                : 0,
                          }}
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
                    style={{
                      color:
                        parsedData.items.length % 14 === 0
                          ? '#52c41a'
                          : '#ff4d4f',
                      fontWeight: 'bold',
                    }}
                  >
                    {parsedData.items.length} 条
                    {parsedData.items.length % 14 === 0 ? ' ✓' : ' ⚠️'}
                  </Text>
                </div>
              </Space>
            }
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Table
            columns={itemColumns}
            dataSource={parsedData.items.map((item, index) => ({
              ...item,
              key: index,
            }))}
            size="small"
            pagination={false}
            scroll={{ x: 1200, y: 300 }}
            bordered
          />
        </div>
      )}
    </div>
  )
}

export default ExcelUpload
