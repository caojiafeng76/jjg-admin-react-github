import {
  Bars3BottomLeftIcon,
  Bars3BottomRightIcon,
} from '@heroicons/react/16/solid'
import { BellIcon, KeyIcon } from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import {
  App,
  Badge,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Popover,
  Spin,
} from 'antd'
import { Header } from 'antd/es/layout/layout'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  useAdminNotifications,
  useAdminNotificationsRealtime,
  useMarkAdminNotificationAsRead,
  useMarkAllAdminNotificationsAsRead,
  useUnreadAdminNotificationCount,
} from '@hooks/useAdminNotifications'
import DarkModeButton from '@ui/DarkModeButton'
import { getRoleLabel } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import { updateAdminManagementPassword } from '@/services/apiAdminManagementPassword'
import type { AdminNotification } from '@/services/apiNotifications'

// 路由到页面名称的映射
const routeToLabelMap: Record<string, string> = {
  dashboard: '首页',
  'syney-po-list': '订单列表',
  'syney-store-report-list': '入库单列表',
  'syney-spec-list': '踏板规格列表',
  'syney-safe-part-setting': '件号配置',
  'syney-setting': '编号设置',
  'workshop-order-list': '订单管理',
  'workshop-order-list/production': '订单管理 / 生产中',
  'workshop-order-list/closed': '订单管理 / 已结案',
  'production-scheduling': '排产计划',
  'workshop-process-list': '工序管理',
  'workshop-defect-reason-list': '不良原因管理',
  'employee-list': '员工管理',
  'standard-time-list': '成本核算',
  'job-base-setting': '岗位基础数值设定',
  'machine-equipment-maintenance': '机器设备维护',
  'material-transfer': '物料转移单',
  'material-transfer/scan': '扫码物料转移单',
  scan: '扫码导航',
  'production-order': '生产工单',
  'production-order/create': '手动新建工单',
  'production-order/scan': '扫码工单',
  'production-daily-report': '生产日报表',
  'precision-finishing-cutting': '精加工切割单',
  'precision-finishing-cutting/scan': '扫码精加工切割单',
  'precision-cutting-transfer': '精切转移单',
  'tooling-data': '刀具资料',
  'tooling-inventory': '刀具库存',
  'tooling-stock-in': '刀具入库',
  'tooling-stock-out': '刀具出库',
  'youmai-product-data': '优迈 / 货品资料',
  'youmai-finished-goods-inventory': '优迈 / 成品库存',
  'youmai-finished-goods-stock-in': '优迈 / 成品入库',
  'youmai-finished-goods-stock-out': '优迈 / 成品出库',
  'attendance-detail': '考勤明细',
  'attendance-summary': '考勤统计',
  'machine-runtime': '设备运行时间',
}

function getPageName(currentPath: string) {
  if (routeToLabelMap[currentPath]) {
    return routeToLabelMap[currentPath]
  }

  if (currentPath.startsWith('workshop-order-list/qr/')) {
    return '订单扫码详情'
  }

  return ''
}

export default function AppHeader({
  colorBgContainer,
  collapsed,
  onToggleCollapse,
}: {
  colorBgContainer: string
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const { message, notification } = App.useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, role, employeeProfile, signOut } = useAuth()
  const [isManagementPasswordModalOpen, setIsManagementPasswordModalOpen] =
    useState(false)
  const [isUpdatingManagementPassword, setIsUpdatingManagementPassword] =
    useState(false)
  const [managementPasswordForm] = Form.useForm<{
    currentPassword: string
    nextPassword: string
    confirmPassword: string
  }>()
  const currentPath = location.pathname.slice(1) || 'dashboard'
  const pageName = getPageName(currentPath)
  const displayName = employeeProfile?.name || user?.email || '未登录用户'
  const roleLabel = getRoleLabel(role)
  const isAdmin = role === 'admin'
  const { data: notifications = [], isLoading: isNotificationsLoading } =
    useAdminNotifications(12, isAdmin)
  const { data: unreadCount = 0, isLoading: isUnreadCountLoading } =
    useUnreadAdminNotificationCount(isAdmin)
  const markNotificationReadMutation = useMarkAdminNotificationAsRead()
  const markAllNotificationsReadMutation = useMarkAllAdminNotificationsAsRead()

  useAdminNotificationsRealtime(
    isAdmin,
    (newNotification: AdminNotification) => {
      const entityLabel =
        newNotification.entity_type === 'production_order'
          ? '生产工单'
          : newNotification.entity_type === 'material_transfer'
            ? '物料转移单'
            : '精切转移单'
      const actionLabel =
        newNotification.action_type === 'create' ? '提交了' : '更新了'
      notification.info({
        message: '新通知',
        description: `${newNotification.actor_name} ${actionLabel}${entityLabel}`,
        placement: 'bottomRight',
        duration: 5,
      })
    },
  )

  const handleChangeManagementPassword = async (values: {
    currentPassword: string
    nextPassword: string
    confirmPassword: string
  }) => {
    setIsUpdatingManagementPassword(true)

    try {
      await updateAdminManagementPassword({
        currentPassword: values.currentPassword,
        nextPassword: values.nextPassword,
      })
      managementPasswordForm.resetFields()
      setIsManagementPasswordModalOpen(false)
      message.success('管理密码修改成功')
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('管理密码修改失败')
      }
    } finally {
      setIsUpdatingManagementPassword(false)
    }
  }

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await markNotificationReadMutation.mutateAsync(notificationId)
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('通知已读确认失败')
      }
    }
  }

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      await markAllNotificationsReadMutation.mutateAsync(undefined)
      message.success('已全部标记为已读')
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('全部已读操作失败')
      }
    }
  }

  const notificationContent =
    isNotificationsLoading || isUnreadCountLoading ? (
      <div className="flex w-90 justify-center py-8">
        <Spin size="small" />
      </div>
    ) : (
      <div className="w-90">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">通知</div>
            <div className="text-xs text-slate-500">
              未读 {unreadCount} 条，展示最近 {notifications.length} 条
            </div>
          </div>
          <Button
            type="link"
            size="small"
            disabled={
              unreadCount === 0 || markAllNotificationsReadMutation.isPending
            }
            loading={markAllNotificationsReadMutation.isPending}
            onClick={() => {
              void handleMarkAllNotificationsAsRead()
            }}
          >
            全部已读
          </Button>
        </div>

        {notifications.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无通知" />
        ) : (
          <div className="max-h-105 space-y-2 overflow-y-auto pr-1">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                loading={markNotificationReadMutation.isPending}
                onConfirmRead={handleMarkNotificationAsRead}
              />
            ))}
          </div>
        )}
      </div>
    )

  return (
    <>
      <Header
        className="flex items-center"
        style={{ padding: 0, background: colorBgContainer }}
      >
        <Button
          type="text"
          icon={
            collapsed ? (
              <Bars3BottomRightIcon className="size-4" />
            ) : (
              <Bars3BottomLeftIcon className="size-4" />
            )
          }
          onClick={onToggleCollapse}
          style={{
            fontSize: 16,
            width: 64,
            height: 64,
          }}
        />
        {pageName && (
          <span className="ml-2 text-base font-semibold text-neutral-900 dark:text-neutral-50">
            {pageName}
          </span>
        )}

        <div className="mr-12 flex h-full flex-1 items-center justify-end gap-4">
          {isAdmin ? (
            <Popover
              trigger="click"
              placement="bottomRight"
              content={notificationContent}
            >
              <Badge count={unreadCount} overflowCount={99}>
                <Button
                  type="text"
                  icon={<BellIcon className="size-5" />}
                  aria-label="通知"
                />
              </Badge>
            </Popover>
          ) : null}
          <span className="text-sm text-slate-600 dark:text-slate-300">
            欢迎您：{displayName}
            {roleLabel ? `（${roleLabel}）` : ''}
          </span>
          {role === 'admin' ? (
            <Button
              type="link"
              icon={<KeyIcon className="size-4" />}
              onClick={() => setIsManagementPasswordModalOpen(true)}
            >
              修改管理密码
            </Button>
          ) : null}
          <DarkModeButton />
          <Button
            type="link"
            onClick={async () => {
              try {
                await signOut()
                navigate('/login', { replace: true })
              } catch {
                // 可以在这里接入全局 message 提示
              }
            }}
          >
            退出登录
          </Button>
        </div>
      </Header>

      <Modal
        title="修改我的管理密码"
        open={isManagementPasswordModalOpen}
        destroyOnClose
        confirmLoading={isUpdatingManagementPassword}
        onOk={() => managementPasswordForm.submit()}
        onCancel={() => {
          setIsManagementPasswordModalOpen(false)
          managementPasswordForm.resetFields()
        }}
      >
        <Form
          form={managementPasswordForm}
          layout="vertical"
          onFinish={handleChangeManagementPassword}
        >
          <Form.Item
            name="currentPassword"
            label="当前管理密码"
            rules={[{ required: true, message: '请输入当前管理密码' }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>

          <Form.Item
            name="nextPassword"
            label="新管理密码"
            rules={[
              { required: true, message: '请输入新管理密码' },
              { min: 6, message: '新管理密码至少需要 6 位' },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新管理密码"
            dependencies={['nextPassword']}
            rules={[
              { required: true, message: '请再次输入新管理密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('nextPassword') === value) {
                    return Promise.resolve()
                  }

                  return Promise.reject(new Error('两次输入的新管理密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

function NotificationItem({
  notification,
  loading,
  onConfirmRead,
}: {
  notification: AdminNotification
  loading: boolean
  onConfirmRead: (notificationId: string) => Promise<void>
}) {
  const actionLabel =
    notification.action_type === 'create' ? '新增了' : '编辑了'
  const entityLabel =
    notification.entity_type === 'production_order' ? '工单' : '转移表'

  return (
    <div
      className={
        notification.is_read
          ? 'rounded-xl border border-slate-200 bg-white px-3 py-3'
          : 'rounded-xl border border-sky-200 bg-sky-50/70 px-3 py-3'
      }
    >
      <div className="mb-1 text-xs text-slate-500">
        {dayjs(notification.created_at).format('YYYY-MM-DD HH:mm:ss')}
      </div>
      <div className="text-sm leading-6 break-all text-slate-800">
        {notification.actor_name} {actionLabel}
        {entityLabel} {notification.entity_id}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span
          className={
            notification.is_read
              ? 'text-xs text-slate-400'
              : 'text-xs font-medium text-sky-600'
          }
        >
          {notification.is_read ? '已读' : '未读'}
        </span>
        <Button
          type="link"
          size="small"
          disabled={notification.is_read || loading}
          onClick={() => {
            void onConfirmRead(notification.id)
          }}
        >
          确认已读
        </Button>
      </div>
    </div>
  )
}
