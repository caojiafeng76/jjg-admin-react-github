import { Badge, Tabs } from 'antd'

export interface WorkshopOrderStatusTabsProps {
  activeTab: 'production' | 'closed'
  productionTotal?: number
  onChange: (key: string) => void
}

export default function WorkshopOrderStatusTabs({
  activeTab,
  productionTotal,
  onChange,
}: WorkshopOrderStatusTabsProps) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-700">
      <Tabs
        activeKey={activeTab}
        onChange={onChange}
        size="large"
        items={[
          {
            key: 'production',
            label: (
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                生产中
                {productionTotal !== undefined && productionTotal > 0 && (
                  <Badge
                    count={productionTotal}
                    size="small"
                    style={{
                      backgroundColor: '#f59e0b',
                      boxShadow: '0 0 6px rgba(245, 158, 11, 0.4)',
                    }}
                  />
                )}
              </span>
            ),
          },
          {
            key: 'closed',
            label: (
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-slate-400" />
                已结案
              </span>
            ),
          },
        ]}
        tabBarStyle={{ marginBottom: 0 }}
      />
    </div>
  )
}
