import { FC, useState } from 'react'
import { Upload, Button, message, Table, Alert, Space, Typography } from 'antd'
import { ArrowUpTrayIcon, TableCellsIcon } from '@heroicons/react/16/solid'
import type { UploadFile } from 'antd/es/upload/interface'
import { importExcelOrder, TransformedOrderData } from '@utils/excelUtils'

const { Text } = Typography

interface ExcelUploadProps {
  onDataParsed: (data: TransformedOrderData) => void
  disabled?: boolean
}

const ExcelUpload: FC<ExcelUploadProps> = ({ onDataParsed, disabled }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [loading, setLoading] = useState(false)
  const [parsedData, setParsedData] = useState<TransformedOrderData | null>(
    null,
  )
  const [previewVisible, setPreviewVisible] = useState(false)

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
      // 解析Excel文件
      const orderData = await importExcelOrder(file)

      // 保存解析结果
      setParsedData(orderData)
      setPreviewVisible(true)

      // 通知父组件数据已解析
      onDataParsed(orderData)

      message.success('Excel文件解析成功')
    } catch (error) {
      message.error(
        `Excel导入失败: ${error instanceof Error ? error.message : '未知错误'}`,
      )
      setParsedData(null)
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
    setParsedData(null)
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
                  <Text>{parsedData.po.Spec || '自动推断'}</Text>
                </div>
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
                        <div key={index} style={{ marginBottom: index < parsedData.po.Technique!.split(',').length - 1 ? 2 : 0 }}>
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
