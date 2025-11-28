import { useCallback, useEffect, useRef, useState } from 'react'
import { FormInstance, message, Modal } from 'antd'
import { format } from 'date-fns'
import dayjs from 'dayjs'
import { TransformedOrderData } from '@utils/excelUtils'

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
import { useCreatePo } from './useCreatePo'
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
  const [excelData, setExcelData] = useState<TransformedOrderData | null>(null)

  const [messageApi, messageContextHolder] = message.useMessage()

  const { generateLabel, contextHolder: labelContextHolder } = usePrint(messageApi)
  const { generateEnglishLabel, contextHolder: englishLabelContextHolder } =
    usePrintEnglish(messageApi)

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
  } = useDeletePo(messageApi)
  const { data: po, isLoading: poLoading } = usePo()
  const {
    updatePos,
    isUpdating: isPoUpdating,
    contextHolder: updatePosContextHolder,
  } = useUpdatePos(messageApi)

  // 仅在创建模式下加载规格数据,编辑模式不需要
  const { syneySpecs, isLoading: specsLoading } = useSyneySpecs({
    isAll: !isEdit,
  })

  const { createPo, contextHolder: createPoContextHolder } = useCreatePo(messageApi)

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

  // 处理Excel数据解析
  const handleExcelDataChange = useCallback((data: TransformedOrderData) => {
    setExcelData(data)
  }, [])

  // 使用 useCallback 优化,避免子组件不必要的重渲染
  const onFinish = useCallback(
    async (values: ISyneyPo) => {
      // 检查数据是否正在加载
      if (specsLoading) {
        messageApi.warning('规格数据加载中,请稍后再试')
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

        // 判断是Excel导入还是手动输入
        let items: ISyneyItem[]

        if (excelData && excelData.items.length > 0) {
          // Excel导入模式
          items = excelData.items.map((item) => ({
            ...item,
            No,
          })) as ISyneyItem[]
        } else {
          // 手动输入模式
          items = jsonToArray(values.Detail || '')
          items = items?.map((item) => ({ ...item, No })) as ISyneyItem[]
        }
        items = getItemsWithParamSpec(items, syneySpecs) as ISyneyItem[]

        // 🔥 新方案: 使用原子操作预分配序列号范围
        // 1. 计算需要多少个序列号 (按 SONo 分组数量)
        const uniqueSONos = new Set(items.map((item) => item.SONo))
        const incrementBy = uniqueSONos.size

        // 2. 原子性获取并递增序列号 (线程安全,防止竞态条件)
        const { atomicIncrementSerialNo } = await import(
          '@/services/apiSyneySerialNo'
        )
        const finalSerialNo = await atomicIncrementSerialNo(incrementBy)

        // 3. 计算起始序列号 (最终序列号 - 增量 = 起始点)
        const startSerialNo = finalSerialNo - incrementBy

        // 4. 使用预分配的序列号范围生成订单数据
        const { map } = getItemsWithExtraInfo(items, startSerialNo)

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { Detail, ...po } = values

        // 如果是Excel导入模式，确保包含从Excel解析出的工艺要求和备注
        if (excelData) {
          if (excelData.po.Technique) {
            po.Technique = excelData.po.Technique
          }
          if (excelData.po.Remark) {
            po.Remark = excelData.po.Remark
          }
        }

        setIsCreating(true)

        await createPo(
          { po, map },
          {
            onSettled: () => {
              setIsModalOpen(false)
              setTableSelectedKeys([])
              setIsCreating(false)
              // 清空Excel数据
              setExcelData(null)
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
      messageApi,
      isEdit,
      updatePos,
      tableSelectedKeys,
      setTableSelectedKeys,
      syneySpecs,
      setIsCreating,
      createPo,
      excelData,
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

          <DeleteButton
            onConfirm={handleDelete}
            isDeleting={isDeleting}
            count={tableSelectedKeys.length}
          />

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
          onExcelDataChange={handleExcelDataChange}
          onFinish={onFinish}
          isCreating={isCreating}
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
