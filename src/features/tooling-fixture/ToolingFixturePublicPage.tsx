import { useState } from 'react'
import { App, Button, Card, Input, Result, Spin, Tag, Typography } from 'antd'
import { useParams } from 'react-router-dom'

import type { PublicToolingFixture } from '@/services/apiToolingFixturePublic'
import {
  usePublicToolingFixture,
  useRecordPublicToolingFixtureAction,
} from './useToolingFixtures'

const { Paragraph, Title } = Typography

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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {details.map(([label, value]) => (
        <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="text-xs font-medium text-slate-400">{label}</div>
          <div className="mt-1 text-sm font-medium break-words text-slate-800">
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
    } catch (error) {
      message.error(error instanceof Error ? error.message : '工装操作失败')
    }
  }

  if (fixtureQuery.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100">
        <Spin size="large" description="正在读取工装资料" />
      </div>
    )
  }

  if (fixtureQuery.isError || !fixtureQuery.data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100 px-4">
        <Result
          status="error"
          title="二维码无效"
          subTitle={
            fixtureQuery.error instanceof Error
              ? fixtureQuery.error.message
              : '未找到对应的工装资料'
          }
        />
      </div>
    )
  }

  const fixture = fixtureQuery.data
  const isInUse = fixture.status === '使用中'

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,#eaf5f5_0%,#f8fafc_44%,#eef2f5_100%)] px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-xl space-y-4">
        <Card className="overflow-hidden rounded-[28px] border-slate-200/80 shadow-[0_24px_70px_rgba(15,23,42,0.1)]">
          <div className="-mx-6 -mt-6 mb-6 bg-slate-900 px-6 py-7 text-white sm:-mx-6 sm:-mt-6">
            <div className="text-xs font-semibold tracking-[0.25em] text-cyan-200 uppercase">
              Tooling Fixture
            </div>
            <Title level={2} className="!mt-3 !mb-2 !text-white">
              工装使用登记
            </Title>
            <Paragraph className="!mb-0 !text-slate-300">
              扫码后填写操作者，登记使用或归还。此页面无需登录。
            </Paragraph>
          </div>

          <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <div className="text-xs text-slate-400">当前状态</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {fixture.status}
              </div>
            </div>
            <Tag
              color={isInUse ? 'orange' : 'green'}
              className="rounded-full px-3 py-1"
            >
              {isInUse ? '使用中' : '可使用'}
            </Tag>
          </div>

          <FixtureDetails fixture={fixture} />

          <div className="mt-6 border-t border-slate-100 pt-5">
            <label
              className="mb-2 block text-sm font-semibold text-slate-800"
              htmlFor="operator-name"
            >
              操作者姓名
            </label>
            <Input
              id="operator-name"
              size="large"
              maxLength={50}
              value={operatorName}
              onChange={(event) => setOperatorName(event.target.value)}
              placeholder="请输入姓名后操作"
              className="rounded-xl"
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                type="primary"
                size="large"
                block
                disabled={isInUse}
                loading={
                  actionMutation.isPending &&
                  actionMutation.variables?.action === '使用'
                }
                onClick={() => void handleAction('使用')}
                className="h-12 rounded-xl"
              >
                使用
              </Button>
              <Button
                size="large"
                block
                disabled={!isInUse}
                loading={
                  actionMutation.isPending &&
                  actionMutation.variables?.action === '归还'
                }
                onClick={() => void handleAction('归还')}
                className="h-12 rounded-xl"
              >
                归还
              </Button>
            </div>
            <div className="mt-3 text-center text-xs text-slate-400">
              {isInUse
                ? '当前工装已在使用中，只能登记归还'
                : '当前工装未使用，只能登记使用'}
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
