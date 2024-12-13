import { Key, useEffect, useRef, useState } from 'react'
import { message, Modal } from 'antd'

import { useDetail } from '@syney/ReportDetail/useDetail'

import { ISyneyItem, ISyneyItemFormRef } from '@/types'
import DetailTable from '@syney/ReportDetail/DetailTable'
import EditButton from '@ui/EditButton'
import DetailForm from './DetailForm'
import { useUpdateDetail } from './useUpdateDetail'
import DeleteButton from '@/ui/DeleteButton'
import { useDeleteDetail } from './useDeleteDetail'

export default function ReportDetail() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [idToUpdate, setIdToUpdate] = useState<number | undefined>(undefined)

  const detailFormRef = useRef<ISyneyItemFormRef>(null)

  const { report, reportLoading } = useDetail()
  const { updateItem, isUpdating } = useUpdateDetail()
  const { isDeleting, deleteDetail } = useDeleteDetail()

  const reportItemIds = selectedRowKeys.map(String)
  const reportItem = report?.find(
    (item) => item.id === Number(reportItemIds?.at(0)),
  )

  function onSelect(keys: Key[]) {
    setSelectedRowKeys(keys)
  }
  function showModal() {
    // 条件性地重置表单的字段，如果specFormInstance存在的话
    detailFormRef?.current?.getInstance().resetFields()

    // 设置模态框的显示状态为true，使其可见
    setIsModalOpen(true)
  }
  function handleEdit() {
    // 检查specIds数组的长度是否不等于1，如果不满足条件，则显示警告消息并返回
    if (reportItemIds?.length !== 1) {
      message.warning('只能选择一条数据')
      return
    }

    // 调用显示模态框的函数，用于编辑数据
    showModal()
  }

  function handleOk() {
    // 触发表单实例的提交事件，如果表单验证通过则继续后续操作
    detailFormRef?.current?.getInstance().submit()

    // 清除所有选中的行键，表示用户已经做出确认，不再需要之前的选择状态
    setSelectedRowKeys([])
  }
  function handleCancel() {
    // 重置表单实例的字段
    detailFormRef?.current?.getInstance().resetFields()

    // 设置模态框是否打开的状态为false
    setIsModalOpen(false)
    setSelectedRowKeys([])
  }

  const onFinishFuc = (values: ISyneyItem) => {
    updateItem(
      { item: { ...values, id: idToUpdate! } },
      { onSettled: handleCancel },
    )
  }

  useEffect(() => {
    if (isModalOpen) {
      detailFormRef?.current?.getInstance().setFieldsValue(reportItem || {})
      setIdToUpdate(reportItem?.id)
    }
  }, [isModalOpen, reportItem])

  return (
    <div className="grid grid-rows-[32px_1fr] gap-4">
      <div className="flex h-full items-center gap-2">
        <EditButton title="请选择一条数据" handleEdit={handleEdit} />
        <DeleteButton
          isDeleting={isDeleting}
          open={isConfirmOpen}
          showPopconfirm={() => {
            if (selectedRowKeys.length === 0) {
              message.error('请选择要删除的数据')
              return
            }
            setIsConfirmOpen(true)
          }}
          onConfirm={() => {
            deleteDetail(reportItemIds, {
              onSettled: () => {
                setSelectedRowKeys([])
                setIsConfirmOpen(false)
              },
            })
          }}
          closeConfirm={() => {
            setIsConfirmOpen(false)
          }}
        />
      </div>

      <div className="no-scrollbar overflow-y-scroll">
        <DetailTable
          data={report || []}
          loading={reportLoading || isUpdating || isDeleting}
          selectedRowKeys={selectedRowKeys}
          onSelect={onSelect}
        />

        <Modal
          title={'编辑参数规格'}
          open={isModalOpen}
          confirmLoading={isUpdating}
          onOk={handleOk}
          onCancel={handleCancel}
        >
          <DetailForm ref={detailFormRef} onFinishFunc={onFinishFuc} />
        </Modal>
      </div>
    </div>
  )
}
