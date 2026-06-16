import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { App, FormInstance, Modal } from 'antd'
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
import { useQuery } from '@tanstack/react-query'
import { getSyneySafePartSettings } from '@services/apiSyneySafePartSettings'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useSearchParams } from 'react-router-dom'

export default function PoList() {
  const { message: messageApi } = App.useApp()
  const [searchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建订单')
  const [isEdit, setIsEdit] = useState(false)
  const [excelData, setExcelData] = useState<TransformedOrderData | null>(null)

  const poFormRef = useRef<FormInstance<ISyneyPo>>(null)

  const { count, pos, isLoading: posLoading } = usePos()
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

  const { syneySpecs, isLoading: specsLoading } = useSyneySpecs({
    isAll: !isEdit,
  })

  const { createPo, contextHolder: createPoContextHolder } =
    useCreatePo(messageApi)

  const { data: safePartSettings, isLoading: isSafePartSettingsLoading } =
    useQuery({
      queryKey: ['syney_safe_part_settings'],
      queryFn: getSyneySafePartSettings,
      staleTime: 5 * 60 * 1000,
    })

  const { generateLabel, contextHolder: labelContextHolder } = usePrint(
    safePartSettings,
    isSafePartSettingsLoading,
    messageApi,
  )
  const { generateEnglishLabel, contextHolder: englishLabelContextHolder } =
    usePrintEnglish(safePartSettings, isSafePartSettingsLoading, messageApi)

  const selectedCount = tableSelectedKeys.length
  const records = useMemo(() => pos || [], [pos])
  const selectedQty = useMemo(() => {
    if (selectedCount === 0) return 0
    const keySet = new Set(tableSelectedKeys.map((key) => String(key)))
    let total = 0
    for (const item of records) {
      if (keySet.has(String(item.id))) {
        total += Number(item.Qty || 0)
      }
    }
    return total
  }, [records, selectedCount, tableSelectedKeys])

  const handleDelete = useCallback(() => {
    if (tableSelectedKeys.length === 0) {
      messageApi.warning('请选择至少一条数据')
      return
    }
    deletePo(tableSelectedKeys.map(String), {
      onSettled: () => {
        setTableSelectedKeys([])
      },
    })
  }, [tableSelectedKeys, messageApi, deletePo, setTableSelectedKeys])

  const handleExcelDataChange = useCallback((data: TransformedOrderData) => {
    setExcelData(data)
  }, [])

  const onFinish = useCallback(
    async (values: ISyneyPo) => {
      if (specsLoading) {
        messageApi.warning('规格数据加载中,请稍后再试')
        return
      }

      if (isSafePartSettingsLoading || !safePartSettings) {
        messageApi.warning('安全部件设置加载中,请稍后再试')
        return
      }

      try {
        const No = values.No
        values.EndDate = dayjs(values.EndDate?.toString() || '').format(
          'YYYY-MM-DD',
        )

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

        let items: ISyneyItem[]

        if (excelData && excelData.items.length > 0) {
          items = excelData.items.map((item) => ({
            ...item,
            No,
          })) as ISyneyItem[]
        } else {
          items = jsonToArray(values.Detail || '')
          items = items?.map((item) => ({ ...item, No })) as ISyneyItem[]
        }
        items = getItemsWithParamSpec(items, syneySpecs) as ISyneyItem[]

        const hasInferredParamSpec = items.some(
          (item) => item.ParamSpecInferred,
        )
        if (hasInferredParamSpec) {
          messageApi.warning('部分参数规格根据备注推测生成，请确认是否准确')
        }

        const uniqueSONos = new Set(items.map((item) => item.SONo))
        const incrementBy = uniqueSONos.size

        const { atomicIncrementSerialNo } =
          await import('@/services/apiSyneySerialNo')
        const finalSerialNo = await atomicIncrementSerialNo(incrementBy)

        const startSerialNo = finalSerialNo - incrementBy

        const { map } = getItemsWithExtraInfo(
          items,
          startSerialNo,
          safePartSettings,
        )

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { Detail, ...po } = values

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
      isSafePartSettingsLoading,
      safePartSettings,
    ],
  )

  const handlePrint = useCallback(() => {
    generateLabel()
    setTableSelectedKeys([])
  }, [generateLabel, setTableSelectedKeys])

  const handlePrintEnglish = useCallback(() => {
    generateEnglishLabel()
    setTableSelectedKeys([])
  }, [generateEnglishLabel, setTableSelectedKeys])

  const handleEdit = useCallback(() => {
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

  useEffect(() => {
    return () => {
      setIsCreating(false)
      setTableSelectedKeys([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 12,
    summaryRowHeight: 39,
  })

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {labelContextHolder}
      {englishLabelContextHolder}
      {createPoContextHolder}
      {updatePosContextHolder}
      {deletePoContextHolder}

      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <AddButton
          handleCreate={() => {
            setIsEdit(false)
            poFormRef.current?.resetFields()
            setModalTitle('创建订单')
            setIsModalOpen(true)
          }}
          permissionKey="feature:syney-po-list.create"
        />

        <EditButton
          title="编辑"
          handleEdit={handleEdit}
          permissionKey="feature:syney-po-list.edit"
        />

        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={isDeleting}
          count={tableSelectedKeys.length}
          permissionKey="feature:syney-po-list.delete"
        />

        <PrintButton handlePrint={handlePrint}>打印中文标签</PrintButton>
        <PrintButton handlePrint={handlePrintEnglish}>
          打印英文标签
        </PrintButton>

        <ExportInfoButton />

        <PrintDecompositionButton />
      </div>

      {/* 选中摘要条 */}
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-blue-50/80 px-5 py-3 shadow-[0_8px_30px_rgba(59,130,246,0.12)] backdrop-blur-sm">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100">
              <svg
                className="h-3.5 w-3.5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            已选
            <span className="mx-1 text-lg font-bold text-blue-600">
              {selectedCount}
            </span>
            条
          </span>
          {selectedQty > 0 ? (
            <span className="flex items-center gap-2 text-sm text-slate-600">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100">
                <svg
                  className="h-3.5 w-3.5 text-rose-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </div>
              选中数量合计：
              <span className="text-xl font-bold text-rose-600 tabular-nums">
                {selectedQty.toLocaleString()}
              </span>
            </span>
          ) : null}
        </div>
      ) : null}

      {/* 搜索 / 过滤栏 */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200/60 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="text-sm font-medium text-slate-600">筛选条件</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">交货日期：</span>
            <PoDateFilter />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-slate-600">状态：</span>
            <PoSelectedFilter />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-slate-600">搜索：</span>
            <PoSearchInput />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-slate-600">操作：</span>
            <PoSelected />
          </div>
        </div>
      </div>

      {/* 表格和分页 */}
      <div className="grid flex-1 grid-rows-[1fr_auto] gap-3 overflow-hidden">
        <div ref={tableContainerRef} className="min-h-0 overflow-hidden">
          <PoTable
            loading={posLoading || isCreating || isPoUpdating}
            data={records}
            page={page}
            pageSize={pageSize}
            scrollY={scrollY}
          />
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={count || 0} />
        </div>
      </div>

      <Modal
        title={modalTitle}
        loading={poLoading}
        open={isModalOpen}
        confirmLoading={isCreating || isPoUpdating}
        destroyOnClose={true}
        width={720}
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
          syneySpecs={syneySpecs}
          specsLoading={specsLoading}
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
