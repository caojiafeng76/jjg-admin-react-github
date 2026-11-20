import type { PublicToolingFixture } from '@/services/apiToolingFixturePublic'
import PublicQrPageShell from '@ui/PublicQrPageShell'
import StatusPill from '@ui/StatusPill'
import { App, Button, Input } from 'antd'
import { useState } from 'react'

import { useParams } from 'react-router-dom'
import {
  usePublicToolingFixture,
  useRecordPublicToolingFixtureAction,
} from './useToolingFixtures'

function displayValue(value: string | null | undefined): string {
  return value?.trim() || '-'
}

function FixtureDetails({ fixture }: { fixture: PublicToolingFixture }) {
  const details = [
    ['工装模具编号', fixture.fixture_no],
    ['类别', fixture.category],
    ['适用产品图号', fixture.applicable_product_drawing_no],
    ['产品名称', fixture.product_name],
    ['适用设备', fixture.applicable_equipment],
    ['存放位置', fixture.storage_location],
    ['制作日期', fixture.manufactured_date],
    ['制作厂商', fixture.manufacturer],
    ['寿命', fixture.lifecycle],
    ['上次保养日期', fixture.last_maintenance_date],
    [
      '保养周期',
      fixture.maintenance_cycle_days
        ? `${fixture.maintenance_cycle_days} 天`
        : null,
    ],
    ['责任人', fixture.responsible_person],
    ['备注', fixture.remarks],
  ]

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {details.map(([label, value]) => (
        <div
          key={label}
          className="rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60"
        >
          <div className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {label}
          </div>
          <div className="mt-1 text-sm font-medium break-words text-slate-800 dark:text-slate-100">
            {displayValue(value)}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ToolingFixturePublicPage() {
  const { message } = App.useApp()
  const { qrToken = '' } = useParams<{ qrToken: string }>()
  const [operatorName, setOperatorName] = useState('')
  const fixtureQuery = usePublicToolingFixture(qrToken)
  const actionMutation = useRecordPublicToolingFixtureAction()

  const handleAction = async (action: '使用' | '归还') => {
    const normalizedOperatorName = operatorName.trim()

    if (!normalizedOperatorName) {
      message.warning('请输入操作者姓名')
      return
    }

    if (!fixtureQuery.data) {
      return
    }

    try {
      await actionMutation.mutateAsync({
        qrToken,
        action,
        operatorName: normalizedOperatorName,
      })
      setOperatorName('')
      message.success(action === '使用' ? '工装已登记使用' : '工装已登记归还')
    }
    catch (error) {
      message.error(error instanceof Error ? error.message : '工装操作失败')
    }
  }

  const fixture = fixtureQuery.data
  const isInUse = fixture?.status === '使用中'
  const errorDescription = fixtureQuery.error instanceof Error
    ? fixtureQuery.error.message
    : '未找到对应的工装资料'

  return (
    <PublicQrPageShell
      title="工装使用登记"
      description="扫码后填写操作者，登记使用或归还。此页面无需登录。"
      loading={fixtureQuery.isLoading}
      loadingText="正在读取工装资料"
      errorTitle={fixtureQuery.isError || !fixture ? '二维码无效' : undefined}
      errorDescription={errorDescription}
      headerExtra={
        fixture
          ? (
              <StatusPill tone={isInUse ? 'warning' : 'success'}>
                {isInUse ? '使用中' : '可使用'}
              </StatusPill>
            )
          : null
      }
    >
      {fixture
        ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800/60">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  当前状态
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {fixture.status}
                </div>
              </div>

              <FixtureDetails fixture={fixture} />

              <div className="mt-5 border-t border-divider pt-5">
                <label
                  className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200"
                  htmlFor="operator-name"
                >
                  操作者姓名
                </label>
                <Input
                  id="operator-name"
                  size="large"
                  maxLength={50}
                  value={operatorName}
                  onChange={event => setOperatorName(event.target.value)}
                  placeholder="请输入姓名后操作"
                />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    type="primary"
                    size="large"
                    block
                    disabled={isInUse}
                    loading={
                      actionMutation.isPending
                      && actionMutation.variables?.action === '使用'
                    }
                    onClick={() => void handleAction('使用')}
                    className="h-11 rounded-xl"
                  >
                    使用
                  </Button>
                  <Button
                    size="large"
                    block
                    disabled={!isInUse}
                    loading={
                      actionMutation.isPending
                      && actionMutation.variables?.action === '归还'
                    }
                    onClick={() => void handleAction('归还')}
                    className="h-11 rounded-xl"
                  >
                    归还
                  </Button>
                </div>
                <div className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                  {isInUse
                    ? '当前工装已在使用中，只能登记归还'
                    : '当前工装未使用，只能登记使用'}
                </div>
              </div>
            </>
          )
        : null}
    </PublicQrPageShell>
  )
}
