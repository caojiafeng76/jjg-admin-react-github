import { useCallback, useEffect, useRef, useState } from 'react'
import { FormInstance, message, Modal } from 'antd'
import { format } from 'date-fns'
import dayjs from 'dayjs'

import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import PoTable from './PoTable'
import PoForm from './PoForm'
import { useAppStore } from '@/store'
import { ISyneyItem, ISyneyPo } from '@/types'
import DeleteButton from '@/ui/DeleteButton'
import { useDeletePo } from './useDeletePo'
import { usePos } from './usePos'
import PrintButton from '@/ui/PrintButton'
import { usePrint } from './usePrint'
import ExportInfoButton from './ExportInfoButton'
import { useSyneySpecs } from '../SpecList/useSyneySpecs'
import { useSerialNo } from './useSerialNo'
import { useCreatePo } from './useCreatePo'
import { useUpdateSerialNo } from './useUpdateSerialNo'
import {
  getItemsWithExtraInfo,
  getItemsWithParamSpec,
  jsonToArray,
} from '@/utils/syney'
import PoSelected from './PoSelected'
import EditButton from '@/ui/EditButton'
import { usePo } from './usePo'
import { useUpdatePos } from './useUpdatePos'
import PrintDecompositionButton from './PrintDecompositionButton'
import PoSelectedFilter from './PoSelectedFilter'
import { usePrintEnglish } from './usePrintEnglish'
import PoDateFilter from './PoDateFilter'
import PoSearchInput from './PoSearchInput'

export default function PoList() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建订单')
  const [isEdit, setIsEdit] = useState(false)

  const { generateLabel, contextHolder: labelContextHolder } = usePrint()
  const { generateEnglishLabel, contextHolder: englishLabelContextHolder } =
    usePrintEnglish()
  const [messageApi, messageContextHolder] = message.useMessage()

  const poFormRef = useRef<FormInstance<ISyneyPo>>(null)

  const { count } = usePos()
  const {
    tableSelectedKeys,
    setTableSelectedKeys,
    isLoading: isCreating,
    setIsLoading: setIsCreating,
  } = useAppStore()
  const {
    deletePo,
    isDeleting,
    contextHolder: deletePoContextHolder,
  } = useDeletePo()
  const { data: po, isLoading: poLoading } = usePo()
  const {
    updatePos,
    isUpdating: isPoUpdating,
    contextHolder: updatePosContextHolder,
  } = useUpdatePos()

  // 仅在创建模式下加载规格数据,编辑模式不需要
  const { syneySpecs, isLoading: specsLoading } = useSyneySpecs({
    isAll: !isEdit,
  })
  const { serialNo, isLoading: serialNoLoading } = useSerialNo()

  const { createPo, contextHolder: createPoContextHolder } = useCreatePo()
  const { updateSerialNo, isUpdating } = useUpdateSerialNo()

  // 使用 useCallback 优化,避免子组件不必要的重渲染
  const handleDelete = useCallback(() => {
    // 验证选择
    if (tableSelectedKeys.length === 0) {
      messageApi.warning('请选择至少一条数据')
      return
    }

    // 执行删除
    deletePo(tableSelectedKeys.map(String), {
      onSettled: () => {
        setTableSelectedKeys([])
      },
    })
  }, [tableSelectedKeys, messageApi, deletePo, setTableSelectedKeys])

  // 使用 useCallback 优化,避免子组件不必要的重渲染
  const onFinish = useCallback(
    async (values: ISyneyPo) => {
      // 检查数据是否正在加载
      if (specsLoading) {
        messageApi.warning('规格数据加载中,请稍后再试')
        return
      }

      if (serialNoLoading) {
        messageApi.warning('序列号数据加载中,请稍后再试')
        return
      }

      if (isUpdating) {
        messageApi.warning('序列号更新中,请稍后再试')
        return
      }

      try {
        const No = values.No
        values.EndDate = format(values.EndDate?.toString() || '', 'yyyy-MM-dd')

        if (isEdit) {
          updatePos(
            { ids: tableSelectedKeys.map(String), data: values },
            {
              onSettled: () => {
                setIsModalOpen(false)
                setTableSelectedKeys([])
              },
            },
          )
          return
        }

        let items = jsonToArray(values.Detail || '')
        items = items?.map((item) => ({ ...item, No })) as ISyneyItem[]
        items = getItemsWithParamSpec(items, syneySpecs) as ISyneyItem[]
        const { map, tmpSerialNo } = getItemsWithExtraInfo(
          items,
          serialNo?.SyneySerialNo || 0,
        )
        updateSerialNo(tmpSerialNo)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { Detail, ...po } = values

        setIsCreating(true)

        await createPo(
          { po, map },
          {
            onSettled: () => {
              setIsModalOpen(false)
              setTableSelectedKeys([])
              setIsCreating(false)
            },
          },
        )
      } catch (error) {
        console.error('提交失败:', error)
        messageApi.error('提交失败,请重试')
        setIsCreating(false)
      }
    },
    [
      specsLoading,
      serialNoLoading,
      isUpdating,
      messageApi,
      isEdit,
      updatePos,
      tableSelectedKeys,
      setTableSelectedKeys,
      syneySpecs,
      serialNo,
      updateSerialNo,
      setIsCreating,
      createPo,
    ],
  )

  // 使用 useCallback 优化,避免子组件不必要的重渲染
  const handlePrint = useCallback(() => {
    generateLabel()
    setTableSelectedKeys([])
  }, [generateLabel, setTableSelectedKeys])

  // 使用 useCallback 优化,避免子组件不必要的重渲染
  const handlePrintEnglish = useCallback(() => {
    generateEnglishLabel()
    setTableSelectedKeys([])
  }, [generateEnglishLabel, setTableSelectedKeys])

  // 使用 useCallback 优化,避免子组件不必要的重渲染
  const handleEdit = useCallback(() => {
    // 检查是否选择了数据
    if (tableSelectedKeys.length === 0) {
      messageApi.warning('请选择至少一条数据进行编辑')
      return
    }

    setIsEdit(true)
    setModalTitle(
      tableSelectedKeys.length === 1
        ? '编辑订单'
        : `批量编辑 ${tableSelectedKeys.length} 个订单`,
    )
    setIsModalOpen(true)
  }, [tableSelectedKeys, messageApi])

  // 优化清理逻辑:仅在组件卸载时清理,避免不必要的状态更新
  useEffect(() => {
    return () => {
      setIsCreating(false)
      setTableSelectedKeys([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-4">
      {labelContextHolder}
      {englishLabelContextHolder}
      {messageContextHolder}
      {createPoContextHolder}
      {updatePosContextHolder}
      {deletePoContextHolder}

      {/* 工具栏 */}
      <div className="flex flex-col gap-2">
        {/* 第一行：功能按钮 */}
        <div className="flex flex-wrap items-center gap-2">
          <AddButton
            handleCreate={() => {
              setIsEdit(false)
              poFormRef.current?.resetFields()
              setModalTitle('创建订单')
              setIsModalOpen(true)
            }}
          />

          <EditButton title="编辑" handleEdit={handleEdit} />

          <DeleteButton onConfirm={handleDelete} isDeleting={isDeleting} />

          <PrintButton handlePrint={handlePrint} />
          <PrintButton handlePrint={handlePrintEnglish}>
            打印英文标签
          </PrintButton>

          <ExportInfoButton />

          <PrintDecompositionButton />
        </div>

        {/* 第二行：操作、过滤和搜索 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">操作：</span>
            <PoSelected />
          </div>
          <div className="h-6 w-px bg-gray-300" /> {/* 分隔线 */}
          <div className="flex items-center gap-2">
            <span className="text-gray-600">状态：</span>
            <PoSelectedFilter />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">交货日期：</span>
            <PoDateFilter />
          </div>
          <div className="h-6 w-px bg-gray-300" /> {/* 分隔线 */}
          <div className="flex items-center gap-2">
            <span className="text-gray-600">搜索：</span>
            <PoSearchInput />
          </div>
        </div>
      </div>

      {/* 表格和分页区域 */}
      <div className="grid grid-rows-[1fr_auto] gap-4 overflow-hidden">
        {/* 表格区域 */}
        <div className="overflow-hidden">
          <PoTable />
        </div>

        {/* 分页区域 */}
        <div className="flex justify-end">
          <AppPagination total={count || 0} />
        </div>
      </div>

      <Modal
        title={modalTitle}
        loading={poLoading}
        open={isModalOpen}
        confirmLoading={isCreating || isPoUpdating}
        destroyOnClose={true}
        onOk={() => poFormRef.current?.submit()}
        onCancel={() => {
          setIsModalOpen(false)
          setIsEdit(false)
        }}
      >
        <PoForm
          ref={poFormRef}
          onFinish={onFinish}
          isCreating={isCreating || isUpdating}
          isEdit={isEdit}
          initialValues={
            (po && isEdit
              ? { ...po, EndDate: dayjs(po.EndDate) }
              : undefined) as ISyneyPo | undefined
          }
        />
      </Modal>
    </div>
  )
}
