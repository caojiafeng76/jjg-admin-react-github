import type { VillaLiftOrderSearch } from './useVillaLiftOrderSearch'
import type {
  VillaLiftMarkDateField,
  VillaLiftOrderStatus,
} from '@/services/apiVillaLiftOrders'

import {
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  CubeIcon,
  DocumentArrowDownIcon,
  FilmIcon,
  PaintBrushIcon,
  ScissorsIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/16/solid'
import { Button, DatePicker, Input, Popconfirm } from 'antd'
import AddButton from '@/ui/AddButton'

export interface VillaLiftOrderToolbarPermissions {
  canDelete: boolean
  canClose: boolean
  canReopen: boolean
  canMarkMaterial: boolean
  canMarkPainting: boolean
  canMarkFilm: boolean
  canMarkCutting: boolean
  canMarkProcessing: boolean
  canMarkCabinProcessing: boolean
  canMarkMiddleDoorProcessing: boolean
  canMarkFrameProcessing: boolean
}

export interface VillaLiftOrderToolbarProps {
  permissions: VillaLiftOrderToolbarPermissions
  activeStatus: VillaLiftOrderStatus
  viewerDenied: boolean
  selectedCount: number
  isBatchDeleting: boolean
  isBatchUpdatingStatus: boolean
  isBatchMarking: boolean
  isExporting: boolean
  search: VillaLiftOrderSearch
  handleCreate: () => void
  handleBatchDelete: () => void | Promise<void>
  handleBatchClose: () => void | Promise<void>
  handleBatchReopen: () => void | Promise<void>
  handleBatchMarkDate: (
    field: VillaLiftMarkDateField,
    label: string,
  ) => void | Promise<void>
  handleExportExcel: () => void | Promise<void>
  preloadExportAsExcel: () => void
}

export default function VillaLiftOrderToolbar({
  permissions,
  activeStatus,
  viewerDenied,
  selectedCount,
  isBatchDeleting,
  isBatchUpdatingStatus,
  isBatchMarking,
  isExporting,
  search,
  handleCreate,
  handleBatchDelete,
  handleBatchClose,
  handleBatchReopen,
  handleBatchMarkDate,
  handleExportExcel,
  preloadExportAsExcel,
}: VillaLiftOrderToolbarProps) {
  const {
    canDelete,
    canClose,
    canReopen,
    canMarkMaterial,
    canMarkPainting,
    canMarkFilm,
    canMarkCutting,
    canMarkProcessing,
    canMarkCabinProcessing,
    canMarkMiddleDoorProcessing,
    canMarkFrameProcessing,
  } = permissions
  const {
    customerInputRef,
    projectNameInputRef,
    productNameInputRef,
    searchInputKey,
    deliveryDateRange,
    setDeliveryDateRange,
    scheduleDateRange,
    setScheduleDateRange,
    processingRequiredDateRange,
    setProcessingRequiredDateRange,
    handleSearch,
    handleSearchReset,
  } = search

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AddButton
        handleCreate={handleCreate}
        permissionKey="feature:villa-lift-order.create"
      />
      {selectedCount > 0 && (
        <>
          {canDelete && (
            <Popconfirm
              title={`确认删除选中的 ${selectedCount} 条订单？`}
              description="删除后不可恢复，同时删除所有明细。"
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true, disabled: viewerDenied }}
              onConfirm={handleBatchDelete}
            >
              <Button
                type="text"
                danger
                icon={<TrashIcon className="size-4" />}
                loading={isBatchDeleting}
                disabled={viewerDenied}
              >
                批量删除 ({selectedCount})
              </Button>
            </Popconfirm>
          )}
          {canClose && activeStatus === 'open' && (
            <Button
              type="text"
              icon={<CheckCircleIcon className="size-4 text-green-500/80!" />}
              loading={isBatchUpdatingStatus}
              onClick={handleBatchClose}
              disabled={viewerDenied}
            >
              批量结案 ({selectedCount})
            </Button>
          )}
          {canReopen && activeStatus === 'closed' && (
            <Button
              type="text"
              icon={<ArrowUturnLeftIcon className="size-4 text-blue-400/80!" />}
              loading={isBatchUpdatingStatus}
              onClick={handleBatchReopen}
              disabled={viewerDenied}
            >
              批量反结案 ({selectedCount})
            </Button>
          )}
          {canMarkMaterial && (
            <Button
              type="text"
              icon={<CubeIcon className="size-4 text-purple-500/80!" />}
              loading={isBatchMarking}
              disabled={viewerDenied}
              onClick={() =>
                handleBatchMarkDate('material_selection_date', '挑料完成')}
            >
              挑料完成 ({selectedCount})
            </Button>
          )}
          {canMarkPainting && (
            <Button
              type="text"
              icon={<PaintBrushIcon className="size-4 text-blue-500/80!" />}
              loading={isBatchMarking}
              disabled={viewerDenied}
              onClick={() => handleBatchMarkDate('painting_date', '喷涂完成')}
            >
              喷涂完成 ({selectedCount})
            </Button>
          )}
          {canMarkFilm && (
            <Button
              type="text"
              icon={<FilmIcon className="size-4 text-cyan-500/80!" />}
              loading={isBatchMarking}
              disabled={viewerDenied && !canMarkFilm}
              onClick={() => handleBatchMarkDate('film_date', '贴膜完成')}
            >
              贴膜完成 ({selectedCount})
            </Button>
          )}
          {canMarkCutting && (
            <Button
              type="text"
              icon={<ScissorsIcon className="size-4 text-orange-500/80!" />}
              loading={isBatchMarking}
              disabled={viewerDenied}
              onClick={() =>
                handleBatchMarkDate('cutting_actual_date', '切割完成')}
            >
              切割完成 ({selectedCount})
            </Button>
          )}
          {canMarkProcessing && (
            <Button
              type="text"
              icon={
                <WrenchScrewdriverIcon className="size-4 text-amber-600/80!" />
              }
              loading={isBatchMarking}
              disabled={viewerDenied}
              onClick={() =>
                handleBatchMarkDate('processing_actual_date', '加工完成')}
            >
              加工完成 ({selectedCount})
            </Button>
          )}
          {canMarkCabinProcessing && (
            <Button
              type="text"
              icon={
                <WrenchScrewdriverIcon className="size-4 text-rose-500/80!" />
              }
              loading={isBatchMarking}
              disabled={viewerDenied}
              onClick={() =>
                handleBatchMarkDate('cabin_processing_date', '轿箱加工完成')}
            >
              轿箱加工完成 ({selectedCount})
            </Button>
          )}
          {canMarkMiddleDoorProcessing && (
            <Button
              type="text"
              icon={
                <WrenchScrewdriverIcon className="size-4 text-emerald-500/80!" />
              }
              loading={isBatchMarking}
              disabled={viewerDenied}
              onClick={() =>
                handleBatchMarkDate(
                  'middle_door_processing_date',
                  '中分门加工完成',
                )}
            >
              中分门加工完成 ({selectedCount})
            </Button>
          )}
          {canMarkFrameProcessing && (
            <Button
              type="text"
              icon={
                <WrenchScrewdriverIcon className="size-4 text-indigo-500/80!" />
              }
              loading={isBatchMarking}
              disabled={viewerDenied}
              onClick={() =>
                handleBatchMarkDate('frame_processing_date', '井架加工完成')}
            >
              井架加工完成 ({selectedCount})
            </Button>
          )}
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          key={`customer-${searchInputKey}`}
          ref={customerInputRef}
          placeholder="客户"
          onPressEnter={handleSearch}
          allowClear
          style={{ width: 150 }}
        />
        <Input
          key={`projectName-${searchInputKey}`}
          ref={projectNameInputRef}
          placeholder="项目名称"
          onPressEnter={handleSearch}
          allowClear
          style={{ width: 160 }}
        />
        <Input
          key={`productName-${searchInputKey}`}
          ref={productNameInputRef}
          placeholder="产品名称"
          onPressEnter={handleSearch}
          allowClear
          style={{ width: 150 }}
        />
        <DatePicker.RangePicker
          placeholder={['发货日期从', '发货日期至']}
          value={deliveryDateRange}
          onChange={dates =>
            setDeliveryDateRange(
              dates ? [dates[0] ?? null, dates[1] ?? null] : null,
            )}
          style={{ width: 240 }}
          allowClear
        />
        <DatePicker.RangePicker
          placeholder={['排产日期从', '排产日期至']}
          value={scheduleDateRange}
          onChange={dates =>
            setScheduleDateRange(
              dates ? [dates[0] ?? null, dates[1] ?? null] : null,
            )}
          style={{ width: 240 }}
          allowClear
        />
        <DatePicker.RangePicker
          placeholder={['计划加工日期从', '计划加工日期至']}
          value={processingRequiredDateRange}
          onChange={dates =>
            setProcessingRequiredDateRange(
              dates ? [dates[0] ?? null, dates[1] ?? null] : null,
            )}
          style={{ width: 260 }}
          allowClear
        />
        <Button type="primary" onClick={handleSearch}>
          搜索
        </Button>
        <Button onClick={handleSearchReset}>重置</Button>
        <Button
          type="text"
          icon={<DocumentArrowDownIcon className="size-4 text-green-500/80!" />}
          onClick={handleExportExcel}
          onMouseEnter={preloadExportAsExcel}
          onFocus={preloadExportAsExcel}
          loading={isExporting}
        >
          导出Excel
        </Button>
      </div>
    </div>
  )
}
