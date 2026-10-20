import type { FormInstance } from 'antd'
import type { Dispatch, SetStateAction } from 'react'
import type {
  StandardTime,
  StandardTimeFormValues,
} from '@/services/apiStandardTimes'
import { App } from 'antd'
import { useCallback, useRef, useState } from 'react'

import { buildStandardTimeSubmitValues } from './buildStandardTimeSubmitValues'
import {
  useCreateStandardTime,
  useUpdateStandardTime,
  useUploadProcessStandardImage,
} from './useStandardTimes'

export interface UseStandardTimeFormActionsOptions {
  items: StandardTime[] | undefined
  isTeamLeaderMode: boolean
  currentUploader: string | null
  selectedRowKeys: React.Key[]
  setSelectedRowKeys: Dispatch<SetStateAction<React.Key[]>>
}

/** 成本核算新建 / 编辑弹窗的状态与提交，以及表格行内的工艺图示上传 */
export function useStandardTimeFormActions({
  items,
  isTeamLeaderMode,
  currentUploader,
  selectedRowKeys,
  setSelectedRowKeys,
}: UseStandardTimeFormActionsOptions) {
  const { message } = App.useApp()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建成本核算')
  const [isEdit, setIsEdit] = useState(false)
  const [editingRecord, setEditingRecord] = useState<StandardTime | null>(null)
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null)
  const formRef = useRef<FormInstance<StandardTimeFormValues> | null>(null)
  const setFormRef = useCallback(
    (form: FormInstance<StandardTimeFormValues>) => {
      formRef.current = form
    },
    [],
  )

  const createMutation = useCreateStandardTime()
  const updateMutation = useUpdateStandardTime()
  const uploadImageMutation = useUploadProcessStandardImage()

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    setModalTitle(isTeamLeaderMode ? '创建理论工时' : '新建成本核算')
    setIsModalOpen(true)
    formRef.current?.resetFields()
  }, [isTeamLeaderMode, setSelectedRowKeys])

  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    formRef.current?.resetFields()
  }, [setSelectedRowKeys])

  const handleEdit = useCallback(
    (record?: StandardTime) => {
      const targetRecord
        = record || items?.find(item => item.id === selectedRowKeys[0])

      if (!record && selectedRowKeys.length !== 1) {
        message.warning('请选择一条数据进行编辑')
        return
      }

      if (!targetRecord) {
        message.warning('请选择一条数据进行编辑')
        return
      }

      setEditingRecord(targetRecord)
      setSelectedRowKeys(targetRecord.id ? [targetRecord.id] : [])
      setIsEdit(true)
      setModalTitle(isTeamLeaderMode ? '编辑理论工时' : '编辑成本核算')
      setIsModalOpen(true)
    },
    [items, isTeamLeaderMode, message, selectedRowKeys, setSelectedRowKeys],
  )

  const handleUploadProcessImage = useCallback(
    async (record: StandardTime, file: File) => {
      if (!record.id)
        return

      setUploadingImageId(record.id)
      try {
        await uploadImageMutation.mutateAsync({
          standard: {
            id: record.id,
            process_image_path: record.process_image_path,
          },
          file,
        })
        message.success('工艺图示上传成功')
      }
      catch (error) {
        message.error(
          error instanceof Error
            ? error.message
            : '工艺图示上传失败，请稍后重试',
        )
      }
      finally {
        setUploadingImageId(null)
      }
    },
    [message, uploadImageMutation],
  )

  const handleFinish = useCallback(
    async (values: StandardTimeFormValues) => {
      try {
        const nextValues = buildStandardTimeSubmitValues({
          values,
          editingRecord,
          isEdit,
          isTeamLeaderMode,
          currentUploader,
        })

        if (isEdit && selectedRowKeys[0]) {
          const standardSecondsChanged
            = editingRecord?.standard_seconds !== nextValues.standard_seconds
          const operationChanged
            = editingRecord?.operation !== nextValues.operation
          const modelChanged = editingRecord?.model !== nextValues.model
          const relatedOrdersSynced
            = standardSecondsChanged || operationChanged || modelChanged

          await updateMutation.mutateAsync({
            id: selectedRowKeys[0] as string,
            values: nextValues,
          })
          message.success(
            relatedOrdersSynced
              ? '成本核算更新成功，关联工单已同步修正'
              : isTeamLeaderMode
                ? '理论工时更新成功'
                : '成本核算更新成功',
          )
        }
        else {
          await createMutation.mutateAsync(nextValues)
          message.success(
            isTeamLeaderMode ? '理论工时创建成功' : '成本核算创建成功',
          )
        }

        resetFormState()
      }
      catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        }
        else {
          message.error('操作失败，请稍后重试')
        }
      }
    },
    [
      createMutation,
      editingRecord,
      isEdit,
      isTeamLeaderMode,
      message,
      resetFormState,
      selectedRowKeys,
      currentUploader,
      updateMutation,
    ],
  )

  return {
    isModalOpen,
    modalTitle,
    isEdit,
    editingRecord,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    isCreating: createMutation.isPending,
    uploadingImageId,
    formRef,
    setFormRef,
    handleCreate,
    handleEdit,
    handleFinish,
    handleUploadProcessImage,
    resetFormState,
  }
}
