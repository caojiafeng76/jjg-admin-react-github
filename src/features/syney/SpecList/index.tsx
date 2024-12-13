import { Key, useEffect, useRef, useState } from 'react'
import { message, Modal } from 'antd'

import { ISyneySpec, ISyneySpecFormRef } from '@/types'
import SpecTable from '@syney-spec-list/SpecTable'
import { useSyneySpecs } from '@/features/syney/SpecList/useSyneySpecs'
import SpecForm from '@syney-spec-list/SpecForm'
import { useCreateSyneySpec } from '@syney-spec-list/useCreateSpec'
import { useUpdateSyneySpec } from '@syney-spec-list/useUpdateSyneySpec'
import { useDeleteSyneySpecs } from '@syney-spec-list/useDeleteSyneySpecs'
import EditButton from '@ui/EditButton'
import AddButton from '@ui/AddButton'
import DeleteButton from '@ui/DeleteButton'
import PartNoInput from './PartNoInput'
import AppPagination from '@/ui/AppPagination'

export default function SpecList() {
  const specFormRef = useRef<ISyneySpecFormRef>(null)
  const specFormInstance = specFormRef.current?.getInstance()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建规格')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

  const { syneySpecs, isLoading, count } = useSyneySpecs()
  const { isCreating, createSyneySpec } = useCreateSyneySpec()
  const { isUpdating, updateSyneySpec } = useUpdateSyneySpec()
  const { isDeleting, deleteSyneySpecs } = useDeleteSyneySpecs()

  const specIds = selectedRowKeys.map((id) => Number(id))
  const spec = syneySpecs?.find((item) => item.id === specIds?.at(0))

  /**
   * 显示模态框
   * 此函数旨在准备并显示一个模态框，在执行以下操作之前重置表单状态
   * 主要用于用户想要添加新书时，重置表单确保没有之前的残留数据，从而避免混淆
   */
  function showModal() {
    // 条件性地重置表单的字段，如果specFormInstance存在的话
    specFormInstance?.resetFields()

    // 设置模态框的显示状态为true，使其可见
    setIsModalOpen(true)
  }

  /**
   * 处理打开状态变化的函数
   *
   * 该函数根据数据源的长度来决定是否可以改变打开状态
   * 如果数据源为空，则显示警告信息并阻止打开状态的变化
   * 如果数据源不为空，则允许打开状态随用户操作改变
   *
   * @param newOpen 新的打开状态，表示是否打开
   */
  function showPopconfirm() {
    // 检查数据源长度是否为0
    if (specIds?.length === 0) {
      // 如果数据源为空，显示警告信息并设置确认打开状态为false
      message.warning('请选择至少一条数据')
      setIsConfirmOpen(false)
    } else {
      // 如果数据源不为空，设置确认打开状态为新的打开状态
      setIsConfirmOpen(true)
    }
  }

  function onSelect(specIds: Key[]) {
    setSelectedRowKeys(specIds)
  }

  /**
   * 处理完成操作的函数
   * 该函数根据当前是否处于编辑状态来决定是更新还是创建一个ISyneySpec对象
   *
   * @param spec ISyneySpec类型的对象，包含特定的规格信息
   */
  function onFinishFuc(spec: ISyneySpec) {
    // 当处于编辑状态时，调用更新函数
    if (isEditing) {
      updateSyneySpec(spec, { onSettled: handleCancel })
    } else {
      // 当不处于编辑状态时，调用创建函数
      createSyneySpec(spec, { onSettled: handleCancel })
    }
  }

  /**
   * 处理取消操作的函数
   * 该函数重置表单状态，退出编辑模式，关闭模态框
   */
  function handleCancel() {
    // 重置表单实例的字段
    specFormInstance?.resetFields()
    // 设置是否正在编辑的状态为false
    setIsEditing(false)
    // 设置模态框是否打开的状态为false
    setIsModalOpen(false)
  }

  /**
   * 确认按钮点击事件处理函数
   * 此函数在用户点击确认按钮后调用，执行一系列操作以处理用户的选择或输入
   */
  function handleOk() {
    // 触发表单实例的提交事件，如果表单验证通过则继续后续操作
    specFormInstance?.submit()

    // 清除所有选中的行键，表示用户已经做出确认，不再需要之前的选择状态
    setSelectedRowKeys([])
  }

  /**
   * 处理创建规格的操作
   * 此函数重置模态框的标题和编辑状态，并显示模态框，以便用户输入新的规格信息
   */
  function handleCreate() {
    setModalTitle('创建规格') // 设置模态框的标题为“创建规格”
    setIsEditing(false) // 设置当前不处于编辑状态
    showModal() // 显示模态框
  }

  /**
   * 处理编辑操作的函数
   * 此函数检查是否选择了 Exactly one 数据项进行编辑
   * 如果没有选择数据项或选择了多个数据项，则显示警告消息
   * 如果选择了单个数据项，则设置编辑状态并显示模态框
   */
  function handleEdit() {
    // 检查specIds数组的长度是否不等于1，如果不满足条件，则显示警告消息并返回
    if (specIds?.length !== 1) {
      message.warning('请选择一条数据')
      return
    }

    // 设置是否处于编辑状态的布尔值为true，表示开始编辑
    setIsEditing(true)
    // 调用显示模态框的函数，用于编辑数据
    showModal()
  }

  /**
   * 处理删除操作的函数
   * 此函数负责调用deleteSyneySpecs函数以删除规格信息，并关闭确认对话框
   * 它没有参数和返回值
   */
  function handleDelete() {
    // 调用deleteSyneySpecs函数，传入specIds以删除对应的规格信息
    deleteSyneySpecs(specIds, { onSettled: () => setIsConfirmOpen(false) })
  }

  useEffect(() => {
    /**
     * 当spec或isEditing发生变化时，更新表单和模态框标题
     * 如果spec存在且isEditing为true，则将spec的数据设置到表单中，并设置模态框标题为“编辑规格”
     */
    if (spec && isEditing) {
      // 将spec的数据设置到表单中
      specFormInstance?.setFieldsValue({ ...spec })
      // 设置模态框标题为“编辑规格”
      setModalTitle('编辑规格')
    }
  }, [spec, isEditing, specFormInstance])

  return (
    <div className="grid grid-rows-[32px_1fr] gap-4">
      <div className="flex h-full items-center gap-2">
        <AddButton handleCreate={handleCreate} />

        <EditButton title="只能选择一条数据" handleEdit={handleEdit} />

        <DeleteButton
          showPopconfirm={showPopconfirm}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
          open={isConfirmOpen}
          closeConfirm={() => setIsConfirmOpen(false)}
        />
        <PartNoInput />
      </div>

      <div className="no-scrollbar overflow-y-scroll">
        <SpecTable
          data={syneySpecs || []}
          loading={isLoading || isCreating || isUpdating || isDeleting}
          onSelect={onSelect}
          selectedRowKeys={selectedRowKeys}
        />

        <AppPagination total={count || 0} />

        <Modal
          title={modalTitle}
          open={isModalOpen}
          confirmLoading={isCreating || isUpdating}
          onOk={handleOk}
          onCancel={handleCancel}
        >
          <SpecForm
            ref={specFormRef}
            onFinishFunc={onFinishFuc}
            isEditing={isEditing}
          />
        </Modal>
      </div>
    </div>
  )
}
