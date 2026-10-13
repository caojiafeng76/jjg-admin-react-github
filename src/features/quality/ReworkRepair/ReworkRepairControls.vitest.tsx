/* eslint-disable react-refresh/only-export-components */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App, Form } from 'antd'
import dayjs from 'dayjs'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ReworkRepairFormModal from './ReworkRepairFormModal'
import ReworkRepairToolbar from './ReworkRepairToolbar'
import {
  buildPayload,
  WORKFLOW_STAGE_BY_KEY,
  type QualityReworkRepairFormFields,
  type WorkflowStageKey,
} from './reworkRepairFormUtils'

vi.mock('@/hooks/usePermission', () => ({ usePermission: () => true }))
vi.mock('@/hooks/useViewerOperationGuard', () => ({
  useViewerOperationGuard: () => ({
    viewerDenied: false,
    viewerOperationTip: '',
  }),
}))

function renderToolbar(stageKey: WorkflowStageKey) {
  const handlers = {
    onCreate: vi.fn(),
    onProcess: vi.fn(),
    onDelete: vi.fn(),
  }

  render(
    <App>
      <ReworkRepairToolbar
        activeStage={WORKFLOW_STAGE_BY_KEY[stageKey]}
        viewerDenied={false}
        isDeleting={false}
        selectedCount={1}
        {...handlers}
      />
    </App>,
  )

  return handlers
}

function ModalHarness({ stageKey }: { stageKey: WorkflowStageKey }) {
  const [form] = Form.useForm<QualityReworkRepairFormFields>()

  return (
    <ReworkRepairFormModal
      form={form}
      open
      isEdit
      isSubmitting={false}
      viewerDenied={false}
      processingStage={WORKFLOW_STAGE_BY_KEY[stageKey]}
      processingStageKey={stageKey}
      isFetchingDocumentNo={false}
      isLoadingOrderOptions={false}
      projectNoOptions={[]}
      onProjectNoChange={vi.fn()}
      onFinish={vi.fn()}
      onCancel={vi.fn()}
    />
  )
}

describe('返工返修页面子组件与表单工具', () => {
  afterEach(() => {
    cleanup()
  })

  it('车间发起页签显示新建按钮，新建与处理分别触发回调', async () => {
    const user = userEvent.setup()
    const handlers = renderToolbar('workshop')

    await user.click(screen.getByRole('button', { name: /新建返工返修记录/ }))
    expect(handlers.onCreate).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /提交生产部/ }))
    expect(handlers.onProcess).toHaveBeenCalledTimes(1)
  })

  it('非车间发起页签隐藏新建按钮，处理按钮显示对应阶段文案', () => {
    renderToolbar('technical')

    expect(
      screen.queryByRole('button', { name: /新建返工返修记录/ }),
    ).toBeNull()
    expect(screen.getByRole('button', { name: /技术部确认/ })).toBeTruthy()
  })

  it('弹窗按处理阶段渲染对应字段分组', () => {
    const { unmount } = render(
      <App>
        <ModalHarness stageKey="production" />
      </App>,
    )

    expect(screen.getByText('生产部确认返工返修')).toBeTruthy()
    expect(screen.getByLabelText('审核意见')).toBeTruthy()
    expect(screen.queryByText('基础信息')).toBeNull()
    unmount()

    render(
      <App>
        <ModalHarness stageKey="completed" />
      </App>,
    )

    expect(screen.getByText('基础信息')).toBeTruthy()
    expect(screen.getByText('改进措施', { selector: 'div' })).toBeTruthy()
    expect(screen.getByText('质量部最终确认')).toBeTruthy()
  })

  it('提交数据去除首尾空格并格式化日期', () => {
    const payload = buildPayload(
      {
        project_no: ' P001 ',
        product_name: ' 踏板 ',
        quantity: 3,
        planned_rework_date: dayjs('2026-10-13'),
        actual_rework_date: null,
      },
      'production_pending',
    )

    expect(payload).toMatchObject({
      document_no: undefined,
      project_no: 'P001',
      product_name: '踏板',
      rework_category: '进货检验不合格',
      quantity: 3,
      planned_rework_date: '2026-10-13',
      actual_rework_date: '',
      workflow_status: 'production_pending',
    })
  })
})
