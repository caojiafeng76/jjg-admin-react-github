import { useEffect, useRef, useState } from 'react'
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
  const [messageApi] = message.useMessage()

  const poFormRef = useRef<FormInstance<ISyneyPo>>(null)

  const { count } = usePos()
  const {
    tableSelectedKeys,
    setTableSelectedKeys,
    isLoading: isCreating,
    setIsLoading: setIsCreating,
  } = useAppStore()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const { isDeleting, deletePo } = useDeletePo()
  const { data: po, isLoading: poLoading } = usePo()
  const { updatePos, isUpdating: isPoUpdating } = useUpdatePos()

  const { syneySpecs, isLoading: specsLoading } = useSyneySpecs({
    isAll: true,
  })
  const { serialNo, isLoading: serialNoLoading } = useSerialNo()

  const { createPo } = useCreatePo()
  const { updateSerialNo, isUpdating } = useUpdateSerialNo()

  function handleDelete() {
    deletePo(tableSelectedKeys.map(String), {
      onSettled: () => {
        setIsConfirmOpen(false)
        setTableSelectedKeys([])
      },
    })
  }

  function showPopconfirm() {
    // 检查数据源长度是否为0
    if (tableSelectedKeys?.length === 0) {
      // 如果数据源为空，显示警告信息并设置确认打开状态为false
      messageApi.warning('请选择至少一条数据')
      setIsConfirmOpen(false)
    } else {
      // 如果数据源不为空，设置确认打开状态为新的打开状态
      setIsConfirmOpen(true)
    }
  }

  async function onFinish(values: ISyneyPo) {
    if (!specsLoading && !serialNoLoading && !isUpdating) {
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
    }
  }

  function handlePrint() {
    generateLabel()
    setTableSelectedKeys([])
  }

  function handlePrintEnglish() {
    generateEnglishLabel()
    setTableSelectedKeys([])
  }

  function handleEdit() {
    setIsEdit(true)
    setIsModalOpen(true)
    if (!poLoading && po) {
      setTimeout(() => {
        poFormRef.current?.setFieldsValue({
          ...po,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          EndDate: dayjs(po.EndDate) as any,
        })
        setModalTitle('编辑订单')
      }, 0)
    }
  }

  useEffect(() => {
    setIsCreating(false)
    setTableSelectedKeys([])

    return () => {
      setIsCreating(false)
      setTableSelectedKeys([])
    }
  }, [setIsCreating, setTableSelectedKeys])

  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-4">
      {labelContextHolder}
      {englishLabelContextHolder}

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
            showPopconfirm={showPopconfirm}
            open={isConfirmOpen}
            closeConfirm={() => setIsConfirmOpen(false)}
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
        <div className="flex justify-center">
          <AppPagination total={count || 0} />
        </div>
      </div>

      <Modal
        title={modalTitle}
        loading={poLoading}
        open={isModalOpen}
        confirmLoading={isCreating || isPoUpdating}
        // destroyOnClose={true}
        onOk={poFormRef.current?.submit}
        onCancel={() => setIsModalOpen(false)}
      >
        <PoForm
          ref={poFormRef}
          onFinish={onFinish}
          isCreating={isCreating || isUpdating}
          isEdit={isEdit}
        />
      </Modal>
    </div>
  )
}
