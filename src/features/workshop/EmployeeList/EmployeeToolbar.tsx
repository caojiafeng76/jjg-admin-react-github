import {
  ArrowPathIcon,
  KeyIcon,
  LinkSlashIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { Button } from 'antd'

import AddButton from '@/ui/AddButton'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import PermissionButton from '@/ui/PermissionButton'
import EmployeeSearch from './EmployeeSearch'

type EmployeeSearchProps = Parameters<typeof EmployeeSearch>[0]

export interface EmployeeToolbarProps {
  selectedCount: number
  isDeleting: boolean
  isBatchCreatingAuth: boolean
  handleCreate: () => void
  handleEdit: () => void
  handleDelete: () => void | Promise<void>
  handleOpenCreateAuthModal: () => void
  handleBatchCreateAuthAccounts: () => void | Promise<void>
  handleOpenResetPasswordModal: () => void
  handleUnbindAuthAccount: () => void
  handleOpenRebindModal: () => void
  handleSearch: EmployeeSearchProps['onSearch']
  handleResetSearch: EmployeeSearchProps['onReset']
}

export default function EmployeeToolbar({
  selectedCount,
  isDeleting,
  isBatchCreatingAuth,
  handleCreate,
  handleEdit,
  handleDelete,
  handleOpenCreateAuthModal,
  handleBatchCreateAuthAccounts,
  handleOpenResetPasswordModal,
  handleUnbindAuthAccount,
  handleOpenRebindModal,
  handleSearch,
  handleResetSearch,
}: EmployeeToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-1">
        <AddButton
          handleCreate={handleCreate}
          permissionKey="feature:employee-list.create"
        />
        <Button
          type="text"
          icon={<KeyIcon className="size-4 text-sky-500" />}
          onClick={handleOpenCreateAuthModal}
        >
          为现有员工开通账号
        </Button>
        <Button
          type="text"
          icon={<KeyIcon className="size-4 text-cyan-600" />}
          onClick={handleBatchCreateAuthAccounts}
          loading={isBatchCreatingAuth}
        >
          批量开通账号
        </Button>
        <PermissionButton
          permissionKey="feature:employee-list.reset-password"
          type="text"
          icon={<ShieldCheckIcon className="size-4 text-amber-500" />}
          onClick={handleOpenResetPasswordModal}
        >
          重置密码
        </PermissionButton>
        <Button
          type="text"
          icon={<LinkSlashIcon className="size-4 text-rose-500" />}
          onClick={handleUnbindAuthAccount}
        >
          解绑账号
        </Button>
        <Button
          type="text"
          icon={<ArrowPathIcon className="size-4 text-violet-500" />}
          onClick={handleOpenRebindModal}
        >
          重新绑定
        </Button>
        <EditButton
          title="编辑"
          handleEdit={handleEdit}
          permissionKey="feature:employee-list.edit"
        />
        <DeleteButton
          onClick={handleDelete}
          isDeleting={isDeleting}
          count={selectedCount}
          title="删除员工"
          itemName="员工"
          permissionKey="feature:employee-list.delete"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs whitespace-nowrap text-slate-500">搜索：</span>
        <EmployeeSearch onSearch={handleSearch} onReset={handleResetSearch} />
      </div>
    </div>
  )
}
